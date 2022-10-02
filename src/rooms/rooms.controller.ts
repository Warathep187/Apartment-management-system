import { UpdateRoomDto } from "./dto/update-room.dto";
import { AddResidentDto, RemoveResidentDto } from "./dto/manage-resident.dto";
import { Room, User } from "@prisma/client";
import { RoomsService } from "./rooms.service";
import { AdminGuard } from "./../common/guards/admin.guard";
import { CreateRoomDto } from "./dto/create-room.dto";
import {
    Controller,
    Post,
    Get,
    Patch,
    Param,
    Delete,
    Query,
    Body,
    UseGuards,
} from "@nestjs/common";

@Controller("rooms")
@UseGuards(AdminGuard)
export class RoomsController {
    constructor(private roomsService: RoomsService) {}

    @Post("create")
    addRoom(@Body() createRoomDto: CreateRoomDto): Promise<Room> {
        return this.roomsService.createRoom(createRoomDto);
    }

    @Get()
    rooms(@Query("floor") floor: string): Promise<Room[]> {
        return this.roomsService.getRoomsByFloor(floor);
    }

    @Get(":number")
    room(@Param("number") number: string) {
        return this.roomsService.getRoomById(number);
    }

    @Patch(":number/update")
    updateRoom(
        @Param("number") roomNumber: string,
        @Body() updateRoomDto: UpdateRoomDto,
    ): Promise<Room> {
        return this.roomsService.updateRoomInformation(
            roomNumber,
            updateRoomDto,
        );
    }

    @Patch(":number/residents/add")
    addResident(
        @Param("number") roomId: string,
        @Body() addResidentDto: AddResidentDto,
    ) {
        return this.roomsService.addResidentToSpecifiedRoom(
            roomId,
            addResidentDto,
        );
    }

    @Patch(":number/residents/remove")
    removeResident(
        @Param("number") roomNumber: string,
        @Body() removeResidentDto: RemoveResidentDto,
    ) {
        return this.roomsService.removeResidentFromSpecifiedRoom(
            roomNumber,
            removeResidentDto,
        );
    }

    @Get("floors/count")
    countFloors() {
        return this.roomsService.getAllFloors();
    }

    @Delete(":number")
    deleteRoom(@Param("number") roomNumber: string): Promise<Room> {
        return this.roomsService.deleteRoom(roomNumber);
    }
}
