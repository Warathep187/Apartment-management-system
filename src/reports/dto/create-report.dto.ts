import { IsNotEmpty, IsString, Length, MaxLength } from "class-validator";

export class CreateReportDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(2048)
    description: string
}
