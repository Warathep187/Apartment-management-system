import { IsNumber, IsString } from "class-validator";

export class UpdateRoomDto {
    @IsString()
    number: string;

    @IsNumber()
    floor: number;

    @IsString()
    description: string;

    @IsNumber()
    price: number;
}
