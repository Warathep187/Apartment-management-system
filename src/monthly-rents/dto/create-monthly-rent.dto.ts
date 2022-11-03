import { IsNumber, IsString, Min } from "class-validator";

export class CreateMonthlyRentDto {
    @IsString()
    roomId: string;

    @IsNumber()
    @Min(0)
    electricityUnit: number;

    @IsNumber()
    @Min(0)
    waterUnit: number;
}