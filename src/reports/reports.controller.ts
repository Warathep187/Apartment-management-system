import { UpdateReportStatusDto } from './dto/update-report-status.dto';
import { AdminGuard } from './../common/guards/admin.guard';
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
    Query
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { Request } from "express";
import { Get, Patch } from '@nestjs/common/decorators';
import { Throttle } from '@nestjs/throttler';

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
        if(files.images) {
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
        if(!Number.isNaN(+skip)) {
            sk = +skip;
        }
        return this.reportsService.getAllReports(sk);
    }

    @UseGuards(ResidentGuard)
    @Get("my-reports")
    myReports(@Req() req: Request) {
        return this.reportsService.getMyAllReports(req.user["sub"]) ;
    }

    @UseGuards(AdminGuard)
    @Patch(":id/status/update")
    updateStatus(@Param("id") id: string, @Body() updateReportStatusDto: UpdateReportStatusDto) {
        return this.reportsService.updateReportStatus(id, updateReportStatusDto);
    }
}
