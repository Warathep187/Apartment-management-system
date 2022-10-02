import { UpdateRoomDto } from './dto/update-room.dto';
import { AddResidentDto, RemoveResidentDto } from "./dto/manage-resident.dto";
import {
    ConflictException,
    NotFoundException,
} from "@nestjs/common/exceptions";
import { PrismaClient, Room, User } from "@prisma/client";
import { CreateRoomDto } from "./dto/create-room.dto";
import { Injectable } from "@nestjs/common";

@Injectable()
export class RoomsService {
    constructor(private primaClient: PrismaClient) {}

    async createRoom(createRoomDto: CreateRoomDto): Promise<Room> {
        const { number, floor, description, price } = createRoomDto;

        const room = await this.primaClient.room.findUnique({
            where: {
                number,
            },
            select: {
                number: true,
            },
        });
        if (room) {
            throw new ConflictException("Room number is duplicated");
        }

        return this.primaClient.room.create({
            data: {
                number: number.trim(),
                floor,
                description,
                price,
            },
        });
    }

    async getRoomsByFloor(floor: string): Promise<Room[]> {
        if (floor === "all") {
            return this.primaClient.room.findMany({
                include: {
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
            });
        } else if (!Number.isNaN(+floor)) {
            return this.primaClient.room.findMany({
                where: {
                    floor: +floor,
                },
                include: {
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
            });
        } else {
            return this.primaClient.room.findMany({
                include: {
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
            });
        }
    }

    async getRoomById(number: string): Promise<Room> {
        const room = await this.primaClient.room.findUnique({
            where: {
                number,
            },
            include: {
                residents: {
                    select: {
                        id: true,
                        name: true,
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
                    },
                },
            },
        });

        if (!room) {
            throw new NotFoundException("Room not found");
        }
        return room;
    }

    async updateRoomInformation(roomNumber: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
        const room = await this.primaClient.room.findUnique({
            where: {
                number: roomNumber
            },
            select: {
                number: true
            }
        })
        if(!room) {
            throw new ConflictException("Room not found")
        }

        const {number, floor, description, price} = updateRoomDto;

        if(roomNumber === updateRoomDto.number) {
            return this.primaClient.room.update({
                where: {
                    number: roomNumber
                },
                data: {
                    floor,
                    description,
                    price
                }
            })
        } else {
            const isRoomExists = await this.primaClient.room.findUnique({
                where: {
                    number: updateRoomDto.number
                },
                select: {
                    number: true
                }
            })
            if(isRoomExists) {
                throw new ConflictException("New number is exists")
            }
            return this.primaClient.room.update({
                where: {
                    number: roomNumber
                },
                data: {
                    number,
                    floor,
                    description,
                    price
                }
            })
        }
    }

    async addResidentToSpecifiedRoom(
        roomNumber: string,
        addResidentDto: AddResidentDto,
    ) {
        const room = await this.primaClient.room.findUnique({
            where: {
                number: roomNumber,
            },
            include: {
                residents: true,
            },
        });
        if (!room) {
            throw new ConflictException("Room not found");
        }

        const user = await this.primaClient.user.findUnique({
            where: {
                id: addResidentDto.userId,
            },
            include: {
                stayedAt: true,
            },
        });
        if (!user) {
            throw new ConflictException("User not found");
        }
        delete user.password;

        await this.primaClient.user.update({
            where: {
                id: addResidentDto.userId,
            },
            data: {
                roomId: roomNumber,
            },
        });

        if (!user.stayedAt) {
            await this.primaClient.user.update({
                where: {
                    id: addResidentDto.userId,
                },
                data: {
                    stayedAt: {
                        create: {
                            stayedAt: new Date(),
                        },
                    },
                },
            });
        }
    }

    async removeResidentFromSpecifiedRoom(
        roomNumber: string,
        removeResidentDto: RemoveResidentDto,
    ) {
        const room = await this.primaClient.room.findUnique({
            where: {
                number: roomNumber,
            },
            select: {
                number: true,
                residents: true,
            },
        });
        if (!room) {
            throw new ConflictException("Room not found");
        }

        const user = await this.primaClient.user.findUnique({
            where: {
                id: removeResidentDto.userId,
            },
            select: {
                id: true,
            },
        });
        if (!room.residents.find((resident) => resident.id === user.id)) {
            throw new ConflictException("Resident does not in this room");
        }
        if (!user) {
            throw new ConflictException("User not found");
        }

        await this.primaClient.user.update({
            where: {
                id: removeResidentDto.userId,
            },
            data: {
                roomId: null,
            },
        });
    }

    async getAllFloors() {
        return this.primaClient.room.groupBy({
            by: ["floor"],
        });
    }

    async deleteRoom(roomNumber: string): Promise<Room> {
        const room = await this.primaClient.room.findUnique({
            where: {
                number: roomNumber,
            },
            select: {
                number: true,
            },
        });
        if (!room) {
            throw new ConflictException("Room not found");
        }

        return this.primaClient.room.delete({
            where: {
                number: roomNumber,
            },
        });
    }
}
