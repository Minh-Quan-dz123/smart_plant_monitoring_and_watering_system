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

  @ApiProperty({ 
    example: 'schedule', 
    description: 'Chế độ tưới: null (OFF), "schedule" (Tưới theo lịch), "auto" (Tưới tự động), "manual" (Tưới thủ công)',
    enum: [null, 'schedule', 'auto', 'manual'],
    required: false,
  })
  irrigationMode: string | null;

}
