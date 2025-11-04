import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, Max, Matches, IsBoolean } from 'class-validator';

/**
 * DTO dùng để cập nhật Schedule.
 */
export class UpdateScheduleDto {
  @ApiProperty({
    example: '06:00',
    description: 'Thời gian tưới theo format HH:MM (24h)',
    required: false,
  })
  @IsString({ message: 'Thời gian phải là chuỗi ký tự' })
  @IsOptional()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Thời gian phải theo format HH:MM (ví dụ: 06:00, 18:00)',
  })
  time?: string;

  @ApiProperty({
    example: 3,
    description: 'Thời gian tưới (phút)',
    minimum: 1,
    maximum: 60,
    required: false,
  })
  @IsInt({ message: 'Thời lượng tưới phải là số nguyên' })
  @IsOptional()
  @Min(1, { message: 'Thời lượng tưới tối thiểu là 1 phút' })
  @Max(60, { message: 'Thời lượng tưới tối đa là 60 phút' })
  duration?: number;

  @ApiProperty({
    example: true,
    description: 'Bật/tắt schedule',
    required: false,
  })
  @IsBoolean({ message: 'Enabled phải là boolean' })
  @IsOptional()
  enabled?: boolean;
}

