import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, Max, Matches } from 'class-validator';

/**
 * DTO dùng để tạo một Schedule mới (lịch tưới cây cho vườn).
 */
export class CreateScheduleDto {
  @ApiProperty({
    example: '06:00',
    description: 'Thời gian tưới theo format HH:MM (24h)',
  })
  @IsString({ message: 'Thời gian phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Thời gian không được để trống' })
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Thời gian phải theo format HH:MM (ví dụ: 06:00, 18:00)',
  })
  time: string; // Thời gian tưới (format HH:MM)

  @ApiProperty({
    example: 3,
    description: 'Thời gian tưới (phút)',
    minimum: 1,
    maximum: 60,
  })
  @IsInt({ message: 'Thời lượng tưới phải là số nguyên' })
  @Min(1, { message: 'Thời lượng tưới tối thiểu là 1 phút' })
  @Max(60, { message: 'Thời lượng tưới tối đa là 60 phút' })
  duration: number; // Thời gian tưới (phút)

  @ApiProperty({
    example: 1,
    description: 'ID của vườn',
  })
  @IsInt({ message: 'ID vườn phải là số nguyên' })
  @IsNotEmpty({ message: 'ID vườn không được để trống' })
  gardenId: number;
}

