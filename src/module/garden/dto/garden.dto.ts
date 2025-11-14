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

  @ApiProperty({ example: false, description: 'Bật/tắt chế độ tưới tự động (Auto)' })
  autoEnabled: boolean;

  @ApiProperty({ example: false, description: 'Bật/tắt chế độ tưới theo lịch (Schedule)' })
  scheduleEnabled: boolean;

}
