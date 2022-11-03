import { IsString, MaxLength } from "class-validator";

export class UpdateReportDescriptionDto {
    @IsString()
    @MaxLength(2048)
    description: string;
}