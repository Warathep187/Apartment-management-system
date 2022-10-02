import { Role } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { Injectable } from "@nestjs/common";

@Injectable()
export class ResidentsService {
    constructor(private prismaClient: PrismaClient) {}

    getAllResidents(skip: number, key: string) {
        let keyword = "";
        if (key) {
            keyword = key.trim();
        }

        return this.prismaClient.user.findMany({
            where: {
                role: Role.RESIDENT,
                OR: [
                    {
                        name: {
                            contains: keyword,
                        },
                    },
                    {
                        email: {
                            contains: keyword,
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                tel: true,
                email: true,
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
                roomId: true,
            },
            skip,
            take: 20,
        });
    }
}
