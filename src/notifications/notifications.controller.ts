import { ResidentGuard } from "./../common/guards/resident.guard";
import { AdminGuard } from "./../common/guards/admin.guard";
import { NotificationsService } from "./notifications.service";
import { Controller, Get, HttpCode, Patch, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";

@Controller("notifications")
export class NotificationsController {
    constructor(private notificationService: NotificationsService) {}

    @UseGuards(AdminGuard)
    @Get("admin")
    adminNotifications(@Req() req: Request) {
        return this.notificationService.adminGetNotifications(req.user["sub"]);
    }

    @UseGuards(ResidentGuard)
    @Get()
    residentNotifications(@Req() req: Request) {
        return this.notificationService.residentGetNotifications(req.user["sub"])
    }

    @UseGuards(AdminGuard) 
    @Patch("admin/read")
    @HttpCode(204)
    adminReadNotification(@Req() req: Request) {
        this.notificationService.readNotifications(req.user["sub"]);
    }

    @Patch("read")
    @UseGuards(ResidentGuard)
    @HttpCode(204)
    residentReadNotification(@Req() req: Request) {
        this.notificationService.readNotifications(req.user["sub"]);
    }

    @Get("total/admin")
    @UseGuards(AdminGuard)
    totalAdminUnreadNotifications(@Req() req: Request): Promise<number> {
        return this.notificationService.getTotalUnreadNotifications(req.user["sub"]);
    }

    @Get("total")
    @UseGuards(ResidentGuard)
    totalUnreadNotifications(@Req() req: Request): Promise<number> {
        return this.notificationService.getTotalUnreadNotifications(req.user["sub"]);
    }
}
