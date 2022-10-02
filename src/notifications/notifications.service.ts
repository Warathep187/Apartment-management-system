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
                createdAt: true
            }
        })
    }
}
