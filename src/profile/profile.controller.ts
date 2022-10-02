import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ResidentGuard } from "./../common/guards/resident.guard";
import { ProfileService } from "./profile.service";
import {
    Controller,
    Get,
    Req,
    UseGuards,
    Patch,
    UseInterceptors,
    UploadedFile,
    Body,
    BadRequestException,
} from "@nestjs/common";
import { Request, Express } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";

@UseGuards(ResidentGuard)
@Controller("profile")
export class ProfileController {
    constructor(private profileService: ProfileService) {}

    @Get()
    profile(@Req() req: Request) {
        return this.profileService.getProfile(req.user["sub"]);
    }

    @Throttle(25, 10)
    @Patch("update")
    updateProfile(
        @Req() req: Request,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return this.profileService.updateProfile(
            req.user["sub"],
            updateProfileDto,
        );
    }

    @Throttle(15, 10)
    @Patch("image/update")
    @UseInterceptors(FileInterceptor("image"))
    updateProfileImage(
        @Req() req: Request,
        @UploadedFile() image: Express.Multer.File,
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
        return this.profileService.updateProfileImage(req.user["sub"], image);
    }
}
