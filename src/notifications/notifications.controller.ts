import { ResidentGuard } from "./../common/guards/resident.guard";
import { AdminGuard } from "./../common/guards/admin.guard";
import { NotificationsService } from "./notifications.service";
import { Controller, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";

@Controller("notifications")
export class NotificationsController {
    constructor(private notificationService: NotificationsService) {}

    @UseGuards(AdminGuard)
    adminNotifications(@Req() req: Request) {
        this.notificationService.adminGetNotifications(req.user["sub"]);
    }

    @UseGuards(ResidentGuard)
    residentNotifications(@Req() req: Request) {
        this.notificationService.residentGetNotifications(req.user["sub"])
    }

    @UseGuards(AdminGuard) 
    adminReadNotification() {
        
    }

    @UseGuards(ResidentGuard)
    residentReadNotification() {

    }
}
