import { IsNumber, IsString } from "class-validator";

export class CreateRoomDto {
    @IsString()
    number: string;

    @IsNumber()
    floor: number;

    @IsString()
    description?: string;

    @IsNumber()
    price: number;
}