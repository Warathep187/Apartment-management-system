import { UpdateReportDescriptionDto } from "./dto/update-report-desc.dto";
import { UpdateReportStatusDto } from "./dto/update-report-status.dto";
import { AdminGuard } from "./../common/guards/admin.guard";
import { ReportsService } from "./reports.service";
import { CreateReportDto } from "./dto/create-report.dto";
import { ResidentGuard } from "./../common/guards/resident.guard";
import {
    Controller,
    Post,
    Body,
    UseGuards,
    UploadedFiles,
    UseInterceptors,
    BadRequestException,
    Req,
    Param,
    Query,
    HttpCode,
    Delete,
    UploadedFile,
} from "@nestjs/common";
import {
    FileFieldsInterceptor,
    FileInterceptor,
} from "@nestjs/platform-express";
import { Request } from "express";
import { Get, Patch } from "@nestjs/common/decorators";
import { Throttle } from "@nestjs/throttler";

@Controller("reports")
export class ReportsController {
    constructor(private reportsService: ReportsService) {}

    @Throttle(20, 10)
    @UseGuards(ResidentGuard)
    @Post("create")
    @UseInterceptors(
        FileFieldsInterceptor([
            {
                name: "images",
                maxCount: 4,
            },
        ]),
    )
    createReport(
        @Req() req: Request,
        @Body() createReportDto: CreateReportDto,
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
        return this.reportsService.createNewReport(
            req.user["sub"],
            createReportDto,
            files.images || [],
        );
    }

    @UseGuards(AdminGuard)
    @Get()
    reports(@Query("skip") skip: string) {
        let sk = 0;
        if (!Number.isNaN(+skip)) {
            sk = +skip;
        }
        return this.reportsService.getAllReports(sk);
    }

    @UseGuards(ResidentGuard)
    @Get("my-reports")
    myReports(@Req() req: Request) {
        return this.reportsService.getMyAllReports(req.user["sub"]);
    }

    @UseGuards(AdminGuard)
    @Get(":id/admin")
    adminGetReport(@Param("id") id: string) {
        return this.reportsService.adminGetSpecifiedReport(id);
    }

    @UseGuards(ResidentGuard)
    @Get(":id/owner")
    ownerGetReport(@Param("id") id: string, @Req() req: Request) {
        return this.reportsService.ownerGetSpecifiedReport(req.user["sub"], id);
    }

    @UseGuards(AdminGuard)
    @Patch(":id/status/update")
    updateStatus(
        @Param("id") id: string,
        @Body() updateReportStatusDto: UpdateReportStatusDto,
    ) {
        return this.reportsService.updateReportStatus(
            id,
            updateReportStatusDto,
        );
    }

    @Throttle(30, 10)
    @UseGuards(ResidentGuard)
    @Patch(":id/update")
    @HttpCode(204)
    update(
        @Req() req: Request,
        @Param("id") id: string,
        @Body() updateReportDescriptionDto: UpdateReportDescriptionDto,
    ) {
        return this.reportsService.updateReportDescription(
            req.user["sub"],
            id,
            updateReportDescriptionDto,
        );
    }

    @Throttle(25, 10)
    @UseGuards(ResidentGuard)
    @Patch(":id/update/image/add")
    @UseInterceptors(FileInterceptor("image"))
    addImage(
        @Req() req: Request,
        @Param("id") id: string,
        @UploadedFile() image: Express.Multer.File,
    ): Promise<string> {
        if (!image) {
            throw new BadRequestException("Image file is required");
        } else if (
            !["image/jpeg", "image/webp", "image/png"].includes(image.mimetype)
        ) {
            throw new BadRequestException("Image file is invalid");
        } else if (image.size > 1024 * 5 * 1024) {
            throw new BadRequestException("Image file is too large");
        }
        return this.reportsService.addReportImage(req.user["sub"], id, image);
    }

    @Throttle(25, 10)
    @UseGuards(ResidentGuard)
    @Delete(":id/update/image/:image_id/remove")
    @HttpCode(204)
    removeImage(
        @Req() req: Request,
        @Param("id") id: string,
        @Param("image_id") imageId: string,
    ) {
        return this.reportsService.removeReportImage(
            req.user["sub"],
            id,
            imageId,
        );
    }

    @Throttle(20, 10)
    @UseGuards(ResidentGuard)
    @Delete(":id")
    deleteReport(@Req() req: Request, @Param("id") id: string) {
        return this.reportsService.deleteReport(req.user["sub"], id);
    }
}
