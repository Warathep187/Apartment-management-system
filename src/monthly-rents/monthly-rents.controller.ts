import { UpdateMonthlyRentDto } from "./dto/update-monthly-rent.dto";
import { MonthlyRentsService } from "./monthly-rents.service";
import { CreateMonthlyRentDto } from "./dto/create-monthly-rent.dto";
import { AdminGuard } from "./../common/guards/admin.guard";
import { ResidentGuard } from "./../common/guards/resident.guard";
import {
    Controller,
    UseGuards,
    Get,
    Post,
    Patch,
    Body,
    Delete,
    Param,
    Req,
} from "@nestjs/common";
import { Request } from "express";

@Controller("monthly-rents")
export class MonthlyRentsController {
    constructor(private monthlyRentService: MonthlyRentsService) {}

    @Post("create")
    @UseGuards(AdminGuard)
    createMonthlyRent(@Body() createMonthlyRentDto: CreateMonthlyRentDto) {
        return this.monthlyRentService.createNewMonthlyRent(
            createMonthlyRentDto,
        );
    }

    @Get(":id/admin")
    @UseGuards(AdminGuard)
    adminGetMonthlyRent(@Param("id") id: string) {
        return this.monthlyRentService.getMonthlyRent(id);
    }

    @Get("rooms")
    @UseGuards(AdminGuard)
    allRooms() {
        return this.monthlyRentService.getRooms();
    }

    @Get("history")
    @UseGuards(ResidentGuard)
    monthlyRentsHistory(@Req() req: Request) {
        return this.monthlyRentService.getMonthlyRentsHistory(req.user["sub"]);
    }

    @Get(":id")
    @UseGuards(ResidentGuard)
    monthlyRent(@Req() req: Request, @Param("id") id: string) {
        return this.monthlyRentService.getMonthlyRent(
            id,
            true,
            req.user["sub"],
        );
    }

    @Get("rooms/:room_id")
    @UseGuards(AdminGuard)
    roomMonthlyRents(@Param("room_id") roomId: string) {
        return this.monthlyRentService.getRoomMonthlyRents(roomId);
    }

    @Patch(":id/update")
    @UseGuards(AdminGuard)
    updateMonthlyRent(
        @Param("id") id: string,
        @Body() updateMonthlyRentDto: UpdateMonthlyRentDto,
    ) {
        return this.monthlyRentService.updateMonthlyRent(
            id,
            updateMonthlyRentDto,
        );
    }

    @Delete(":id")
    @UseGuards(AdminGuard)
    deleteMonthlyRent(@Param("id") id: string) {
        return this.monthlyRentService.deleteMonthlyRent(id);
    }
}
