import { UpdateAnnouncementDto } from "./dto/update-announcement.dto";
import { ConflictException } from "@nestjs/common/exceptions";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";
import { RedisManagerService } from "./../redis-manager/redis-manager.service";
import { RealtimeManagerService } from "./../realtime-manager/realtime-manager.service";
import { S3ManagerService } from "./../s3-manager/s3-manager.service";
import { NotificationType, Prisma, PrismaClient, Role } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import {
    NotFoundException,
    InternalServerErrorException,
} from "@nestjs/common";

@Injectable()
export class AnnouncementsService {
    constructor(
        private prismaClient: PrismaClient,
        private s3ManagerService: S3ManagerService,
        private realtimeManagerService: RealtimeManagerService,
        private redisManagerService: RedisManagerService,
    ) {}

    async uploadMultipleImage(
        uploadedImages: { url: string; key: string }[],
        images: Express.Multer.File[],
    ): Promise<{ url: string; key: string }[]> {
        if (images.length === 0) {
            return uploadedImages;
        }
        const uploadedImage = await this.s3ManagerService.uploadToS3(
            "announcement-images",
            images[images.length - 1],
        );
        uploadedImages.push(uploadedImage);
        images.pop();
        return this.uploadMultipleImage(uploadedImages, images);
    }

    async sendNotificationToAllResidents(
        announcementId: string,
        allKeys: string[],
        allSocketIds: string[][],
    ) {
        const allResidentIds = await this.prismaClient.user.findMany({
            where: {
                role: Role.RESIDENT,
            },
            select: {
                id: true,
            },
        });
        const notifications: Prisma.NotificationCreateManyInput[] = [];
        for (const residentId of allResidentIds) {
            notifications.push({
                id: uuid(),
                type: NotificationType.ANNOUNCEMENT_NEW,
                announcementId,
                toUserId: residentId.id,
                createdAt: new Date(),
            });
        }
        const filteredNotifications = notifications.filter((notification) =>
            allKeys.includes(notification.toUserId),
        );
        const filteredKeys = allKeys.filter(
            (key) => key !== process.env.ADMIN_ID!,
        );

        for (const notification of filteredNotifications) {
            const index = filteredKeys.findIndex(
                (key) => key === notification.toUserId,
            );
            this.realtimeManagerService.emitEventToClient(
                "new-notification",
                allSocketIds[index],
                notification,
            );
        }

        await this.prismaClient.notification.createMany({
            data: notifications,
        });
        await this.prismaClient.user.updateMany({
            where: {
                id: {
                    not: process.env.ADMIN_ID,
                },
            },
            data: {
                unreadNotification: {
                    increment: 1,
                },
            },
        });
    }

    async removeMultipleImages(images: { key: string }[]) {
        for (const image of images) {
            await this.s3ManagerService.removeObjectFromS3(image.key);
        }
    }

    isAnnouncementExists(announcementId: string): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            try {
                const announcement =
                    await this.prismaClient.announcement.findUnique({
                        where: {
                            id: announcementId,
                        },
                        select: {
                            id: true,
                        },
                    });
                if (announcement) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    async createNewAnnouncement(
        createAnnouncementDto: CreateAnnouncementDto,
        images: Express.Multer.File[],
    ) {
        const uploadedImages = await this.uploadMultipleImage([], images);
        const mappedImageIds = uploadedImages.map((img) => ({
            id: uuid(),
            key: img.key,
            url: img.url,
        }));
        const newAnnouncement = await this.prismaClient.announcement.create({
            data: {
                id: uuid(),
                title: createAnnouncementDto.title,
                description: createAnnouncementDto.description,
                announcementImages: {
                    create: mappedImageIds,
                },
            },
        });
        const allKeys = await this.redisManagerService.getAllKeys();
        const allSocketIds =
            await this.redisManagerService.getAllClientSocketIds(
                [],
                JSON.parse(JSON.stringify(allKeys)),
            );
        this.sendNotificationToAllResidents(
            newAnnouncement.id,
            allKeys,
            allSocketIds,
        );
        return { ...newAnnouncement, announcementImages: mappedImageIds };
    }

    getAllAnnouncements(skip: number) {
        return this.prismaClient.announcement.findMany({
            select: {
                id: true,
                title: true,
                description: true,
                announcementImages: {
                    select: {
                        url: true,
                    },
                },
                createdAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
            skip,
        });
    }

    async getAnnouncement(announcementId: string, isAdmin = false) {
        const selectImageField: Prisma.AnnouncementImageSelect = isAdmin
            ? {
                  url: true,
                  id: true,
              }
            : {
                  url: true,
              };
        const announcement = await this.prismaClient.announcement.findUnique({
            where: {
                id: announcementId,
            },
            select: {
                id: true,
                title: true,
                description: true,
                announcementImages: {
                    select: selectImageField,
                },
                createdAt: true,
            },
        });
        if (!announcement) {
            throw new NotFoundException("Announcement not found");
        }
        return announcement;
    }

    async updateAnnouncement(
        announcementId: string,
        updateAnnouncementDto: UpdateAnnouncementDto,
    ) {
        const isExists = await this.isAnnouncementExists(announcementId);
        if (!isExists) {
            throw new ConflictException("Announcement not found");
        }
        await this.prismaClient.announcement.update({
            where: {
                id: announcementId,
            },
            data: {
                title: updateAnnouncementDto.title,
                description: updateAnnouncementDto.description,
            },
        });
    }

    async addNewImage(
        announcementId: string,
        image: Express.Multer.File,
    ): Promise<{ id: string; url: string }> {
        const isExists = await this.isAnnouncementExists(announcementId);
        if (!isExists) {
            throw new ConflictException("Announcement not found");
        }
        const imageLength = await this.prismaClient.announcementImage.count({
            where: {
                announcementId,
            },
            take: 4,
        });
        if (imageLength === 4) {
            throw new ConflictException(
                "Announcement image must be less than or equals to 4",
            );
        }
        const uploadedImage = await this.s3ManagerService.uploadToS3(
            "announcement-images",
            image,
        );
        const imageId = uuid();
        await this.prismaClient.announcementImage.create({
            data: {
                id: imageId,
                url: uploadedImage.url,
                key: uploadedImage.key,
                announcementId,
            },
        });
        return {
            url: uploadedImage.url,
            id: imageId,
        };
    }

    async removeImage(announcementId: string, imageId: string) {
        const announcementImage =
            await this.prismaClient.announcementImage.findUnique({
                where: {
                    id: imageId,
                },
                select: {
                    announcementId: true,
                    key: true,
                },
            });
        if (!announcementImage) {
            throw new ConflictException("Invalid image id");
        }
        if (announcementImage.announcementId !== announcementId) {
            throw new ConflictException(
                "Announcement does not have this image",
            );
        }
        await this.s3ManagerService.removeObjectFromS3(announcementImage.key);
        await this.prismaClient.announcementImage.delete({
            where: {
                id: imageId,
            },
        });
    }

    async deleteAnnouncement(announcementId: string) {
        const isExists = await this.isAnnouncementExists(announcementId);
        if (!isExists) {
            throw new ConflictException("Announcement not found");
        }
        const announcementImages =
            await this.prismaClient.announcementImage.findMany({
                where: {
                    announcementId,
                },
                select: {
                    key: true,
                },
            });
        this.removeMultipleImages(announcementImages);
        await this.prismaClient.announcementImage.deleteMany({
            where: {
                announcementId,
            },
        });
        await this.prismaClient.notification.deleteMany({
            where: {
                announcementId,
            },
        });
        await this.prismaClient.announcement.delete({
            where: {
                id: announcementId,
            },
        });
    }
}
