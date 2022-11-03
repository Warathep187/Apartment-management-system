import { UpdateMonthlyRentDto } from "./dto/update-monthly-rent.dto";
import { SnsManagerService } from "./../sns-manager/sns-manager.service";
import { MonthlyRentDocumentConfig } from "./types/gen-pdf.type";
import { S3ManagerService } from "./../s3-manager/s3-manager.service";
import { RedisManagerService } from "./../redis-manager/redis-manager.service";
import {
    ConflictException,
    NotFoundException,
} from "@nestjs/common/exceptions";
import { CreateMonthlyRentDto } from "./dto/create-monthly-rent.dto";
import { RealtimeManagerService } from "./../realtime-manager/realtime-manager.service";
import { MonthlyRent, PrismaClient, NotificationType } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { v4 as uuid } from "uuid";
const pdfCreator = require("pdf-creator-node");
const fs = require("fs");

const htmlTemplate = fs.readFileSync(
    __dirname.replace("\\dist\\monthly-rents", "") + "\\html\\template.html",
    "utf-8",
);
const opt = {
    format: "A4",
    orientation: "portrait",
    border: "10mm",
};

@Injectable()
export class MonthlyRentsService {
    constructor(
        private prismaClient: PrismaClient,
        private realtimeManagerService: RealtimeManagerService,
        private redisManagerService: RedisManagerService,
        private s3ManagerService: S3ManagerService,
        private snsManagerService: SnsManagerService,
    ) {}

    async sendNotificationToResidents(
        residents: { id: string }[],
        monthlyRentId: string,
    ): Promise<void> {
        for (const resident of residents) {
            const notification = await this.prismaClient.notification.create({
                data: {
                    id: uuid(),
                    toUserId: resident.id,
                    type: NotificationType.MONTHLY_RENT,
                    monthlyRentId,
                    createdAt: new Date(),
                },
            });
            const socketIds =
                await this.redisManagerService.getSpecifiedClientSocketIds(
                    resident.id,
                );
            this.realtimeManagerService.emitEventToClient(
                "new-notification",
                socketIds,
                notification,
            );
        }
    }

    async uploadFileToS3(fileSrc: string, monthlyRentId: string) {
        const uploadedFile = await this.s3ManagerService.uploadPdfFileToS3(
            fileSrc,
        );
        await this.prismaClient.monthlyRentFile.create({
            data: {
                monthlyRentId,
                url: uploadedFile.url,
                key: uploadedFile.key,
            },
        });
        fs.unlinkSync(fileSrc);
    }

    async uploadUpdatedFileToS3(
        fileSrc: string,
        monthlyRentId: string,
    ): Promise<{ url: string; key: string }> {
        const uploadedFile = await this.s3ManagerService.uploadPdfFileToS3(
            fileSrc,
        );
        fs.unlinkSync(fileSrc);
        return uploadedFile;
    }

    async generateMonthlyRentPdf({
        roomId,
        roomPrice,
        electricityUnit,
        electricityPrice,
        waterUnit,
        waterPrice,
        result,
    }: MonthlyRentDocumentConfig): Promise<{ filename: string }> {
        const document = {
            html: htmlTemplate,
            data: {
                roomId,
                roomPrice,
                electricityUnit,
                electricityPrice,
                waterUnit,
                waterPrice,
                result,
            },
            path: `${__dirname.replace(
                "\\dist\\monthly-rents",
                "",
            )}\\temp\\${uuid()}.pdf`,
            type: "",
        };
        const pdf: { filename: string } = await pdfCreator.create(
            document,
            opt,
        );
        return pdf;
    }

    async createNewMonthlyRent(
        createMonthlyRentDto: CreateMonthlyRentDto,
    ): Promise<MonthlyRent> {
        const electricityPrice =
            +process.env.ELECTRICITY_PRICE_PER_UNIT! *
            createMonthlyRentDto.electricityUnit;
        const waterPrice =
            +process.env.WATER_PRICE_PER_UNIT * createMonthlyRentDto.waterUnit;

        const room = await this.prismaClient.room.findUnique({
            where: {
                number: createMonthlyRentDto.roomId,
            },
            select: {
                price: true,
                residents: {
                    select: {
                        id: true,
                        tel: true,
                    },
                },
            },
        });
        if (!room) {
            throw new ConflictException("Room not found");
        }
        const result = electricityPrice + waterPrice + room.price;

        const pdf = await this.generateMonthlyRentPdf({
            roomId: createMonthlyRentDto.roomId,
            roomPrice: room.price.toLocaleString(),
            electricityUnit:
                createMonthlyRentDto.electricityUnit.toLocaleString(),
            electricityPrice: electricityPrice.toLocaleString(),
            waterUnit: createMonthlyRentDto.waterUnit.toLocaleString(),
            waterPrice: waterPrice.toLocaleString(),
            result: result.toLocaleString(),
        });
        const newMonthlyRent = await this.prismaClient.monthlyRent.create({
            data: {
                id: uuid(),
                roomId: createMonthlyRentDto.roomId,
                electricityUnit: createMonthlyRentDto.electricityUnit,
                waterUnit: createMonthlyRentDto.waterUnit,
                result,
                createdAt: new Date(),
            },
        });
        this.sendNotificationToResidents(room.residents, newMonthlyRent.id);
        this.uploadFileToS3(pdf.filename, newMonthlyRent.id);

        this.snsManagerService.sendSMStoResidents(room.residents);

        return newMonthlyRent;
    }

    async getRooms() {
        return this.prismaClient.room.findMany({
            select: {
                number: true,
                floor: true,
                description: true,
                price: true,
                residents: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: {
                            select: {
                                url: true,
                            },
                        },
                    },
                },
                monthlyRents: {
                    select: {
                        id: true,
                        electricityUnit: true,
                        waterUnit: true,
                        result: true,
                        monthlyRentFile: true,
                        payment: {
                            include: {
                                slipImage: {
                                    select: {
                                        url: true,
                                    },
                                },
                            },
                        },
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
            orderBy: {
                number: "asc",
            },
        });
    }

    async getMonthlyRent(
        monthlyRentId: string,
        isResident = false,
        userId = null,
    ) {
        const monthlyRent = await this.prismaClient.monthlyRent.findUnique({
            where: {
                id: monthlyRentId,
            },
            select: {
                id: true,
                electricityUnit: true,
                waterUnit: true,
                result: true,
                room: {
                    select: {
                        number: true,
                        price: true,
                        residents: {
                            select: {
                                id: true,
                                name: true,
                                profileImage: {
                                    select: {
                                        url: true,
                                    },
                                },
                            },
                        },
                    },
                },
                monthlyRentFile: {
                    select: {
                        url: true,
                    },
                },
            },
        });
        if (!monthlyRent) {
            throw new NotFoundException("Monthly rent not found");
        }
        if (
            isResident &&
            userId &&
            !monthlyRent.room.residents.find(
                (resident) => resident.id === userId,
            )
        ) {
            throw new ConflictException("Access denied");
        }
        if (!monthlyRent) {
            throw new NotFoundException("Monthly rent not round");
        }

        return monthlyRent;
    }

    async getRoomMonthlyRents(roomId: string) {
        const room = await this.prismaClient.room.findUnique({
            where: {
                number: roomId,
            },
            select: {
                number: true,
                floor: true,
                description: true,
                price: true,
                residents: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: {
                            select: {
                                url: true,
                            },
                        },
                    },
                },
                monthlyRents: {
                    select: {
                        id: true,
                        electricityUnit: true,
                        waterUnit: true,
                        result: true,
                        monthlyRentFile: {
                            select: {
                                url: true,
                            },
                        },
                        payment: {
                            include: {
                                slipImage: {
                                    select: {
                                        url: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });
        if (!room) {
            throw new NotFoundException("Room not found");
        }
        return room;
    }

    async getMonthlyRentsHistory(userId: string) {
        const user = await this.prismaClient.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                roomId: true,
            },
        });
        return this.prismaClient.monthlyRent.findMany({
            where: {
                roomId: user.roomId,
            },
            include: {
                payment: {
                    select: {
                        id: true,
                        slipImage: {
                            select: {
                                url: true,
                            },
                        },
                        status: true,
                    },
                },
                monthlyRentFile: {
                    select: {
                        url: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    async updateMonthlyRent(
        monthlyRentId: string,
        updateMonthlyRentDto: UpdateMonthlyRentDto,
    ) {
        const monthlyRent = await this.prismaClient.monthlyRent.findUnique({
            where: {
                id: monthlyRentId,
            },
            select: {
                monthlyRentFile: true,
                room: {
                    select: {
                        number: true,
                        price: true,
                    },
                },
            },
        });
        if (!monthlyRent) {
            throw new ConflictException("Monthly rent not found");
        }
        const electricityPrice =
            +process.env.ELECTRICITY_PRICE_PER_UNIT! *
            updateMonthlyRentDto.electricityUnit;
        const waterPrice =
            +process.env.WATER_PRICE_PER_UNIT * updateMonthlyRentDto.waterUnit;
        const result = electricityPrice + waterPrice + monthlyRent.room.price;

        const newPdf = await this.generateMonthlyRentPdf({
            roomId: monthlyRent.room.number,
            roomPrice: monthlyRent.room.price.toLocaleString(),
            electricityUnit:
                updateMonthlyRentDto.electricityUnit.toLocaleString(),
            electricityPrice: electricityPrice.toLocaleString(),
            waterUnit: updateMonthlyRentDto.waterUnit.toLocaleString(),
            waterPrice: waterPrice.toLocaleString(),
            result: result.toLocaleString(),
        });

        const uploadedFile = await this.uploadUpdatedFileToS3(
            newPdf.filename,
            monthlyRentId,
        );

        await this.prismaClient.monthlyRent.update({
            where: {
                id: monthlyRentId,
            },
            data: {
                electricityUnit: updateMonthlyRentDto.electricityUnit,
                waterUnit: updateMonthlyRentDto.waterUnit,
                monthlyRentFile: {
                    update: {
                        url: uploadedFile.url,
                        key: uploadedFile.key,
                    },
                },
            },
        });

        await this.s3ManagerService.removeObjectFromS3(
            monthlyRent.monthlyRentFile.key,
        );
    }

    async deleteMonthlyRent(monthlyRentId: string) {
        const monthlyRent = await this.prismaClient.monthlyRent.findUnique({
            where: {
                id: monthlyRentId,
            },
            select: {
                monthlyRentFile: true,
            },
        });
        if (!monthlyRent) {
            throw new ConflictException("Monthly rent not found");
        }

        await this.prismaClient.$transaction([
            this.prismaClient.notification.deleteMany({
                where: {
                    monthlyRentId,
                },
            }),
            this.prismaClient.monthlyRentFile.delete({
                where: {
                    monthlyRentId,
                },
            }),
            this.prismaClient.monthlyRent.delete({
                where: {
                    id: monthlyRentId,
                },
            }),
        ]);

        this.s3ManagerService.removeObjectFromS3(
            monthlyRent.monthlyRentFile.key,
        );
    }
}
