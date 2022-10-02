import { AuthService } from './../auth/auth.service';
import { ChangePasswordDto } from "./../auth/dto/change-password.dto";
import { AdminGuard } from "./../common/guards/admin.guard";
import { ResidentsService } from "./residents.service";
import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Query,
    Param,
    UseGuards,
    Body,
} from "@nestjs/common";

@Controller("residents")
@UseGuards(AdminGuard)
export class ResidentsController {
    constructor(private residentsService: ResidentsService, private authService: AuthService) {}

    @Get()
    residents(@Query("skip") skip: string, @Query("key") key: string) {
        return this.residentsService.getAllResidents(
            Number.isNaN(+skip) ? 0 : +skip,
            key,
        );
    }

    @Patch(":id/password/change")
    changePassword(
        @Param("id") userId: string,
        @Body() changePasswordDto: ChangePasswordDto,
    ) {
        return this.authService.changePassword(userId, changePasswordDto);
    }
}
