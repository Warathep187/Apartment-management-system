import { RealtimeManagerService } from "./../realtime-manager/realtime-manager.service";
import { RedisManagerService } from "./../redis-manager/redis-manager.service";
import {
    NotificationType,
    Payment,
    PaymentStatus,
    Prisma,
} from "@prisma/client";
import { S3ManagerService } from "./../s3-manager/s3-manager.service";
import { QrcodeManagerService } from "./../qrcode-manager/qrcode-manager.service";
import { ConflictException } from "@nestjs/common/exceptions";
import { PrismaClient } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { NotFoundException } from "@nestjs/common/exceptions";
import { v4 as uuid } from "uuid";

@Injectable()
export class PaymentsService {
    constructor(
        private prismaClient: PrismaClient,
        private qrcodeManagerService: QrcodeManagerService,
        private s3MangerService: S3ManagerService,
        private redisManagerService: RedisManagerService,
        private realtimeManagerService: RealtimeManagerService,
    ) {}

    async isMonthlyRentOwner(
        monthlyRentId: string,
        residentId: string,
    ): Promise<void> {
        const monthlyRent = await this.prismaClient.monthlyRent.findUnique({
            where: {
                id: monthlyRentId,
            },
            select: {
                room: {
                    select: {
                        residents: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });
        if (!monthlyRent) {
            throw new NotFoundException("Monthly rent not found");
        }
        if (
            !monthlyRent.room.residents.find(
                (resident) => resident.id === residentId,
            )
        ) {
            throw new ConflictException();
        }
    }

    async isPaymentOwner(paymentId: string, userId: string): Promise<void> {
        const payment = await this.prismaClient.payment.findUnique({
            where: {
                id: paymentId,
            },
            select: {
                userId: true,
            },
        });
        if (!payment) {
            throw new NotFoundException("Payment not found");
        }
        if (payment.userId !== userId) {
            throw new ConflictException();
        }
    }

    async sendNotificationToResident(
        residentId: string,
        monthlyRentId: string,
        status: PaymentStatus,
    ) {
        const socketIds =
            await this.redisManagerService.getSpecifiedClientSocketIds(
                residentId,
            );
        const notification = await this.prismaClient.notification.create({
            data: {
                id: uuid(),
                type:
                    status === PaymentStatus.ACCEPTED
                        ? NotificationType.PAYMENT_ACCEPTED
                        : NotificationType.PAYMENT_REJECTED,
                toUserId: residentId,
                monthlyRentId: monthlyRentId,
                createdAt: new Date(),
            },
        });
        if (socketIds) {
            this.realtimeManagerService.emitEventToClient(
                "new-notification",
                socketIds,
                notification,
            );
        } else {
            await this.prismaClient.user.update({
                where: {
                    id: residentId,
                },
                data: {
                    unreadNotification: {
                        increment: 1,
                    },
                },
            });
        }
        await this.prismaClient.notification;
    }

    async getMonthlyRentPromptPayQrCode(
        monthlyRentId: string,
        residentId: string,
    ): Promise<string> {
        await this.isMonthlyRentOwner(monthlyRentId, residentId);

        const monthlyRent = await this.prismaClient.monthlyRent.findUnique({
            where: {
                id: monthlyRentId,
            },
            select: {
                id: true,
                result: true,
                createdAt: true,
            },
        });

        const now = new Date();

        const monthlyRentCreatedAt = new Date(monthlyRent.createdAt);
        if (
            monthlyRentCreatedAt.getMonth() !== now.getMonth() ||
            monthlyRentCreatedAt.getFullYear() !== now.getFullYear()
        ) {
            throw new ConflictException("Could not generate a qrCode");
        }
        return this.qrcodeManagerService.getQrCodePayload(monthlyRent.result);
    }

    async createPayment(
        monthlyRentId: string,
        residentId: string,
        image: Express.Multer.File,
    ) {
        await this.isMonthlyRentOwner(monthlyRentId, residentId);

        const uploadedImage = await this.s3MangerService.uploadToS3(
            "slip-images",
            image,
        );

        const paymentData: Prisma.PaymentCreateInput = {
            id: uuid(),
            monthlyRent: {
                connect: {
                    id: monthlyRentId,
                },
            },
            slipImage: {
                create: uploadedImage,
            },
            user: {
                connect: {
                    id: residentId,
                },
            },
            status: PaymentStatus.WAITING,
            createdAt: new Date(),
        };
        const newPayment = await this.prismaClient.payment.create({
            data: paymentData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                    },
                },
            },
        });

        return newPayment;
    }

    async adminGetMonthlyPaymentsHistory(period: {
        month: number;
        year: number;
    }) {
        const specifiedMonthlyRent = new Date();
        specifiedMonthlyRent.setMonth(period.month - 1);
        specifiedMonthlyRent.setFullYear(period.year);
        specifiedMonthlyRent.setDate(1);

        return this.prismaClient.payment.findMany({
            where: {
                createdAt: {
                    gte: specifiedMonthlyRent,
                },
            },
            select: {
                id: true,
                monthlyRent: {
                    include: {
                        monthlyRentFile: true,
                    },
                },
                slipImage: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                    },
                },
                status: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    async residentGetPaymentsHistory(roomId: string) {
        return this.prismaClient.payment.findMany({
            where: {
                monthlyRent: {
                    roomId,
                },
            },
            select: {
                id: true,
                monthlyRent: {
                    include: {
                        monthlyRentFile: true,
                    },
                },
                slipImage: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                    },
                },
                status: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    async getRooms() {
        const currentMonthlyDateTime = new Date();
        currentMonthlyDateTime.setDate(1);
        return this.prismaClient.room.findMany({
            include: {
                residents: {
                    select: {
                        id: true,
                        name: true,
                        profileImage: true,
                    },
                },
                monthlyRents: {
                    where: {
                        payment: {
                            createdAt: {
                                gte: currentMonthlyDateTime,
                            },
                        },
                    },
                    select: {
                        id: true,
                        electricityUnit: true,
                        waterUnit: true,
                        result: true,
                        payment: {
                            select: {
                                id: true,
                                status: true,
                                slipImage: true,
                                createdAt: true,
                            },
                        },
                        createdAt: true,
                    },
                },
            },
        });
    }

    async updatePayment(
        residentId: string,
        paymentId: string,
        image: Express.Multer.File,
    ): Promise<string> {
        await this.isPaymentOwner(paymentId, residentId);
        const payment = await this.prismaClient.payment.findUnique({
            where: {
                id: paymentId,
            },
            select: {
                slipImage: true,
            },
        });
        await this.s3MangerService.removeObjectFromS3(payment.slipImage.key);
        const uploadedSlipImage = await this.s3MangerService.uploadToS3(
            "slip-images",
            image,
        );
        await this.prismaClient.payment.update({
            where: {
                id: paymentId,
            },
            data: {
                slipImage: {
                    update: {
                        url: uploadedSlipImage.url,
                        key: uploadedSlipImage.key,
                    },
                },
            },
        });
        return uploadedSlipImage.url;
    }

    async acceptPayment(paymentId: string) {
        const updatedPayment = await this.prismaClient.payment.update({
            where: {
                id: paymentId,
            },
            data: {
                status: PaymentStatus.ACCEPTED,
            },
        });
        this.sendNotificationToResident(
            updatedPayment.userId,
            updatedPayment.monthlyRentId,
            PaymentStatus.ACCEPTED,
        );
    }

    async rejectPayment(paymentId: string) {
        const updatedPayment = await this.prismaClient.payment.update({
            where: {
                id: paymentId,
            },
            data: {
                status: PaymentStatus.REJECTED,
            },
        });
        this.sendNotificationToResident(
            updatedPayment.userId,
            updatedPayment.monthlyRentId,
            PaymentStatus.REJECTED,
        );
    }
}
