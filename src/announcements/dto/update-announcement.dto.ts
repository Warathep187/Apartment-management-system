import { IsString } from "class-validator";

export class UpdateAnnouncementDto {
    @IsString()
    title: string;

    @IsString()
    description: string;
}