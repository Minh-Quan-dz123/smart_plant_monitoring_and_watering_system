import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateGardenDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  plantId: number; // id cây từ thư viện Plant
}