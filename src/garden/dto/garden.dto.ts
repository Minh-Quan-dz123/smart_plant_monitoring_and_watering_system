import { ApiProperty } from '@nestjs/swagger';
import { PlantDto } from 'src/module/plant/dto/plant.dto';

export class GardenDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Vườn rau của tôi' })
  name: string;

  @ApiProperty({ example: 2 })
  plantId: number;

  @ApiProperty({ example: 5 })
  userId: number;

  @ApiProperty({ type: () => PlantDto })
  plant?: PlantDto;

  @ApiProperty({ example: '2025-10-28T10:00:00Z' })
  createdAt: Date;
}
