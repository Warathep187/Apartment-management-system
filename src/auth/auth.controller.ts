import { ChangePasswordDto } from "./dto/change-password.dto";
import { ResidentGuard } from "./../common/guards/resident.guard";
import { AdminGuard } from "./../common/guards/admin.guard";
import { RegisterDataDto } from "./dto/register-data.dto";
import { LoggedInResponse } from "./types/auth.type";
import { LoginDataDto } from "./dto/login-data.dto";
import { AuthService } from "./auth.service";
import {
    Controller,
    Post,
    Body,
    Get,
    UseGuards,
    Patch,
    HttpCode,
    Req,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";

@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) {}

    @Throttle(40, 10)
    @Post("signin")
    signin(@Body() loginDataDto: LoginDataDto): Promise<LoggedInResponse> {
        return this.authService.signin(loginDataDto);
    }

    @Throttle(30, 10)
    @Post("signup")
    signup(
        @Body() registerDataDto: RegisterDataDto,
    ): Promise<LoggedInResponse> {
        return this.authService.signup(registerDataDto);
    }

    @UseGuards(AdminGuard)
    @Get("gen-token")
    genRegisterToken(): { token: string } {
        return this.authService.genRegisterToken();
    }

    @Throttle(25, 10)
    @UseGuards(ResidentGuard)
    @Patch("password/change")
    @HttpCode(204)
    changePassword(
        @Body() changePasswordDto: ChangePasswordDto,
        @Req() req: Request,
    ) {
        return this.authService.changePassword(req.user["sub"], changePasswordDto);
    }
}
