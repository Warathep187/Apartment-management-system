import { S3ManagerService } from "./../s3-manager/s3-manager.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { PrismaClient } from "@prisma/client";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ProfileService {
    constructor(
        private prismaClient: PrismaClient,
        private s3ManagerService: S3ManagerService,
    ) {}

    async removeOldProfileImage(oldKey: string) {}

    getProfile(userId: string) {
        return this.prismaClient.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                tel: true,
                profileImage: {
                    select: {
                        url: true,
                    },
                },
                stayedAt: {
                    select: {
                        stayedAt: true,
                    },
                },
                room: {
                    select: {
                        number: true,
                        description: true,
                        price: true,
                        floor: true,
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
            },
        });
    }

    async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
        return await this.prismaClient.user.update({
            where: {
                id: userId,
            },
            data: {
                name: updateProfileDto.name,
                tel: updateProfileDto.tel,
            },
            select: {
                id: true,
                tel: true,
                name: true,
            },
        });
    }

    async updateProfileImage(userId: string, image: Express.Multer.File) {
        const user = await this.prismaClient.user.findUnique({
            where: {
                id: userId,
            },
            select: {
                profileImage: {
                    select: {
                        key: true,
                    },
                },
            },
        });
        if (user.profileImage.key) {
            await this.s3ManagerService.removeObjectFromS3(
                user.profileImage.key,
            );
        }
        const uploadedImage = await this.s3ManagerService.uploadToS3(
            "profile-images",
            image,
        );
        await this.prismaClient.user.update({
            where: {
                id: userId,
            },
            data: {
                profileImage: {
                    update: {
                        key: uploadedImage.key,
                        url: uploadedImage.url,
                    },
                },
            },
        });
        return uploadedImage;
    }
}
