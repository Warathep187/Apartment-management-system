import { UpdateAnnouncementDto } from "./dto/update-announcement.dto";
import { AnnouncementsService } from "./announcements.service";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";
import { ResidentGuard } from "./../common/guards/resident.guard";
import {
    FileFieldsInterceptor,
    FileInterceptor,
} from "@nestjs/platform-express";
import { AdminGuard } from "./../common/guards/admin.guard";
import {
    Controller,
    Post,
    Get,
    UploadedFiles,
    UseGuards,
    UseInterceptors,
    Req,
    Patch,
    Delete,
    Body,
} from "@nestjs/common";
import { Express } from "express";
import { BadRequestException } from "@nestjs/common/exceptions";
import { Param, Query, UploadedFile } from "@nestjs/common/decorators";
import { HttpCode } from "@nestjs/common/decorators/http/http-code.decorator";

@Controller("announcements")
export class AnnouncementsController {
    constructor(private announcementsService: AnnouncementsService) {}

    @Post("create")
    @UseGuards(AdminGuard)
    @UseInterceptors(
        FileFieldsInterceptor([
            {
                name: "images",
                maxCount: 4,
            },
        ]),
    )
    createAnnouncement(
        @Body() createAnnouncementDto: CreateAnnouncementDto,
        @UploadedFiles() files: { images: Express.Multer.File[] },
    ) {
        if (files.images) {
            for (const image of files.images) {
                if (image.size > 1024 * 5 * 1024) {
                    throw new BadRequestException("Image file too large");
                } else if (
                    !["image/jpeg", "image/webp", "image/png"].includes(
                        image.mimetype,
                    )
                ) {
                    throw new BadRequestException("Image file is invalid");
                }
            }
        }
        return this.announcementsService.createNewAnnouncement(
            createAnnouncementDto,
            files.images || [],
        );
    }

    @Get()
    @UseGuards(AdminGuard)
    announcements(@Query("skip") skip: string) {
        let sk = 0;
        if (!Number.isNaN(+skip)) {
            sk = +skip;
        }
        return this.announcementsService.getAllAnnouncements(sk);
    }

    @Get(":id/admin")
    @UseGuards(AdminGuard)
    adminGetAnnouncement(@Param("id") id: string) {
        return this.announcementsService.getAnnouncement(id, true);
    }

    @Get(":id")
    @UseGuards(ResidentGuard)
    announcement(@Param("id") id: string) {
        return this.announcementsService.getAnnouncement(id);
    }

    @Patch(":id/update")
    @UseGuards(AdminGuard)
    @HttpCode(204)
    updateAnnouncement(
        @Param("id") id: string,
        @Body() updateAnnouncementDto: UpdateAnnouncementDto,
    ) {
        return this.announcementsService.updateAnnouncement(
            id,
            updateAnnouncementDto,
        );
    }

    @Patch(":id/update/image/add")
    @UseGuards(AdminGuard)
    @UseInterceptors(FileInterceptor("image"))
    addAnnouncementImage(
        @Param("id") id: string,
        @UploadedFile() image: Express.Multer.File,
    ) {
        if (!image) {
            throw new BadRequestException("Image file must be provided");
        } else if (image.size > 1024 * 5 * 1024) {
            throw new BadRequestException("Image file too large");
        } else if (
            !["image/jpeg", "image/webp", "image/png"].includes(image.mimetype)
        ) {
            throw new BadRequestException("Image file is invalid");
        }
        return this.announcementsService.addNewImage(id, image);
    }

    @Delete(":id/update/image/:image_id/remove")
    @UseGuards(AdminGuard)
    @HttpCode(204)
    removeAnnouncementImage(
        @Param("id") id: string,
        @Param("image_id") imageId: string,
    ) {
        return this.announcementsService.removeImage(id, imageId);
    }

    @Delete(":id")
    @UseGuards(AdminGuard)
    @HttpCode(204)
    deleteAnnouncement(@Param("id") id: string) {
        return this.announcementsService.deleteAnnouncement(id);
    }
}
