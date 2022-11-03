import { BadRequestException } from "@nestjs/common/exceptions";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { AdminGuard } from "./../common/guards/admin.guard";
import { FileInterceptor } from "@nestjs/platform-express";
import { ResidentGuard } from "./../common/guards/resident.guard";
import { PaymentsService } from "./payments.service";
import {
    Controller,
    Get,
    Param,
    Patch,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
    Body,
    HttpCode,
} from "@nestjs/common";
import { Request } from "express";
import { Query } from "@nestjs/common/decorators/http/route-params.decorator";

@Controller("payments")
export class PaymentsController {
    constructor(private paymentService: PaymentsService) {}

    @UseGuards(ResidentGuard)
    @Get("monthly-rents/:monthly_rent_id/qrcode")
    monthlyRentQrCode(
        @Param("monthly_rent_id") monthlyRentId: string,
        @Req() req: Request,
    ) {
        return this.paymentService.getMonthlyRentPromptPayQrCode(
            monthlyRentId,
            req.user["sub"],
        );
    }

    @UseGuards(ResidentGuard)
    @Post("create")
    @UseInterceptors(FileInterceptor("image"))
    createPayment(
        @Req() req: Request,
        @UploadedFile() image: Express.Multer.File,
        @Body() createPaymentDto: CreatePaymentDto,
    ) {
        if (!image) {
            throw new BadRequestException("Image file is required");
        } else if (
            !["image/jpeg", "image/webp", "image/png"].includes(image.mimetype)
        ) {
            throw new BadRequestException("Image file is invalid");
        } else if (image.size > 1024 * 5 * 1024) {
            throw new BadRequestException("Image file is too large");
        }
        return this.paymentService.createPayment(
            createPaymentDto.monthlyRentId,
            req.user["sub"],
            image,
        );
    }

    @UseGuards(AdminGuard)
    @Get()
    latestPayment(@Query("month") month: string, @Query("year") year: string) {
        return this.paymentService.adminGetMonthlyPaymentsHistory({
            month: +month,
            year: +year,
        });
    }

    @UseGuards(ResidentGuard)
    @Get("rooms/:id/history")
    history(@Param("id") roomId: string) {
        return this.paymentService.residentGetPaymentsHistory(roomId);
    }

    @UseGuards(AdminGuard)
    @Get("rooms")
    rooms() {
        return this.paymentService.getRooms();
    }

    @UseGuards(ResidentGuard)
    @Patch(":id")
    @UseInterceptors(FileInterceptor("image"))
    updatePayment(@Param("id") id: string, @Req() req: Request, @UploadedFile() image: Express.Multer.File | undefined) {
        if (!image) {
            throw new BadRequestException("Image file is required");
        } else if (
            !["image/jpeg", "image/webp", "image/png"].includes(image.mimetype)
        ) {
            throw new BadRequestException("Image file is invalid");
        } else if (image.size > 1024 * 5 * 1024) {
            throw new BadRequestException("Image file is too large");
        }
        return this.paymentService.updatePayment(req.user["sub"], id, image)
    }

    @UseGuards(AdminGuard)
    @HttpCode(204)
    @Patch(":id/accept")
    acceptPayment(@Param("id") id: string) {
        return this.paymentService.acceptPayment(id);
    }

    @UseGuards(AdminGuard)
    @HttpCode(204)
    @Patch(":id/reject")
    rejectPayment(@Param("id") id: string) {
        return this.paymentService.rejectPayment(id);
    }
}
