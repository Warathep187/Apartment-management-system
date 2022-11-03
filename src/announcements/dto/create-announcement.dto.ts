import { IsString } from "class-validator";


export class CreateAnnouncementDto {
    @IsString()
    title: string;

    @IsString()
    description: string;
}