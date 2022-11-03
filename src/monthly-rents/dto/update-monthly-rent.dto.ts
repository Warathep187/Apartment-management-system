import { IsNumber, Min } from "class-validator";

export class UpdateMonthlyRentDto {
    @IsNumber()
    @Min(0)
    electricityUnit: number;

    @IsNumber()
    @Min(0)
    waterUnit: number
}