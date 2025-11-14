import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIrrigationModesDto {
  @ApiPropertyOptional({
    description: 'Bật/tắt chế độ tưới tự động (Auto) - Tưới khi vượt ngưỡng cảm biến',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  autoEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Bật/tắt chế độ tưới theo lịch (Schedule) - Tưới theo lịch trình đã đặt',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  scheduleEnabled?: boolean;
}

