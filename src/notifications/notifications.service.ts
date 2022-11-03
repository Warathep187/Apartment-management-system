import { PrismaClient } from '@prisma/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
    constructor(private prismaClient: PrismaClient) {}

    adminGetNotifications(adminId: string) {
        return this.prismaClient.notification.findMany({
            where: {
                toUserId: adminId
            },
            select: {
                id: true,
                type: true,
                report: {
                    select: {
                        id: true,
                        description: true
                    }
                },
                createdAt: true
            }
        })
    }

    residentGetNotifications(userId: string) {
        return this.prismaClient.notification.findMany({
            where: {
                toUserId: userId
            },
            select: {
                id: true,
                type: true,
                report: {
                    select: {
                        id: true,
                        description: true
                    }
                },
                monthlyRent: {
                    select: {
                        id: true,
                        result: true,
                    }
                },
                announcement: {
                    select: {
                        id: true,
                        title: true,
                    }
                },
                createdAt: true
            }
        })
    }

    async readNotifications(userId: string) {
        await this.prismaClient.user.update({
            where: {
                id: userId
            },
            data: {
                unreadNotification: 0
            }
        })
    }

    async getTotalUnreadNotifications(userId: string): Promise<number> {
        const user = await this.prismaClient.user.findUnique({
            where: {
                id: userId
            },
            select: {
                unreadNotification: true
            }
        })
        return user.unreadNotification;
    }
}
