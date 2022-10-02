import { UpdateReportStatusDto } from "./dto/update-report-status.dto";
import { RealtimeManagerService } from "./../realtime-manager/realtime-manager.service";
import { RedisManagerService } from "./../redis-manager/redis-manager.service";
import { S3ManagerService } from "./../s3-manager/s3-manager.service";
import { CreateReportDto } from "./dto/create-report.dto";
import {
    NotificationType,
    PrismaClient,
    ReportStatus,
    Notification,
} from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { v4 as uuid } from "uuid";

@Injectable()
export class ReportsService {
    constructor(
        private prismaClient: PrismaClient,
        private s3ManagerService: S3ManagerService,
        private redisManagerService: RedisManagerService,
        private realtimeManagerService: RealtimeManagerService,
    ) {}

    async sendNotificationToReportOwner(
        userId: string,
        notification: Notification,
    ) {
        const socketIds =
            await this.redisManagerService.getSpecifiedClientSocketIds(userId);
        this.realtimeManagerService.emitEventToClient(
            "new-notification",
            socketIds,
            notification,
        );
        await this.prismaClient.user.update({
            where: {
                id: userId,
            },
            data: {
                unreadNotification: {
                    increment: 1,
                },
            },
        });
    }

    async uploadMultipleImage(
        uploadedImages: { url: string; key: string }[],
        images: Express.Multer.File[],
    ): Promise<{ url: string; key: string }[]> {
        if (images.length === 0) {
            return uploadedImages;
        }
        const uploadedImage = await this.s3ManagerService.uploadToS3(
            "report-images",
            images[images.length - 1],
        );
        uploadedImages.push(uploadedImage);
        images.pop();
        return this.uploadMultipleImage(uploadedImages, images);
    }

    async sendNotificationToAdmin(notification: Notification) {
        const socketIds =
            await this.redisManagerService.getSpecifiedClientSocketIds(
                process.env.ADMIN,
            );

        this.realtimeManagerService.emitEventToClient(
            "new-notification",
            socketIds,
            notification,
        );
        await this.prismaClient.user.update({
            where: {
                id: process.env.ADMIN_ID,
            },
            data: {
                unreadNotification: {
                    increment: 1,
                },
            },
        });
    }

    async createNewReport(
        userId: string,
        createReportDto: CreateReportDto,
        images: Express.Multer.File[],
    ) {
        const uploadedImages = this.uploadMultipleImage([], images);
        const mappedUploadedImages = (await uploadedImages).map((image) => ({
            id: uuid(),
            key: image.key,
            url: image.url,
        }));
        const newReport = await this.prismaClient.report.create({
            data: {
                id: uuid(),
                description: createReportDto.description,
                userId,
                status: ReportStatus.WAITING,
                createdAt: new Date(),
                reportImages: {
                    create: mappedUploadedImages,
                },
            },
            select: {
                id: true,
                description: true,
                user: {
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
                reportImages: {
                    select: {
                        url: true,
                    },
                },
                status: true,
                createdAt: true,
            },
        });
        const notification = await this.prismaClient.notification.create({
            data: {
                id: uuid(),
                type: NotificationType.REPORT_NEW,
                toUserId: process.env.ADMIN_ID,
                reportId: newReport.id,
                createdAt: new Date(),
            },
        });
        this.sendNotificationToAdmin(notification);
        return newReport;
    }

    getAllReports(skip: number) {
        return this.prismaClient.report.findMany({
            select: {
                id: true,
                description: true,
                reportImages: {
                    select: {
                        url: true,
                    },
                },
                user: {
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
                status: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            skip,
        });
    }

    getMyAllReports(userId: string) {
        return this.prismaClient.report.findMany({
            where: {
                userId,
            },
            select: {
                id: true,
                description: true,
                reportImages: {
                    select: {
                        url: true,
                    },
                },
                user: {
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
                status: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
    }

    async updateReportStatus(
        reportId: string,
        updateReportStatusDto: UpdateReportStatusDto,
    ) {
        const updatedReport = await this.prismaClient.report.update({
            where: {
                id: reportId,
            },
            data: {
                status: updateReportStatusDto.status,
            },
            select: {
                id: true,
                description: true,
                reportImages: {
                    select: {
                        url: true,
                    },
                },
                user: {
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
                status: true,
                createdAt: true,
            },
        });
        if (
            updateReportStatusDto.status === ReportStatus.ACCEPTED ||
            updateReportStatusDto.status === ReportStatus.COMPLETED
        ) {
            const notificationType =
                updateReportStatusDto.status === ReportStatus.ACCEPTED
                    ? NotificationType.REPORT_ACCEPTED
                    : NotificationType.REPORT_COMPLETED;
            const notification = await this.prismaClient.notification.create({
                data: {
                    id: uuid(),
                    type: notificationType,
                    toUserId: process.env.ADMIN_ID,
                    reportId: updatedReport.id,
                    createdAt: new Date(),
                },
            });
            this.sendNotificationToReportOwner(
                updatedReport.user.id,
                notification,
            );
        }
        return updatedReport;
    }
}
