import { ApiProperty } from '@nestjs/swagger';

export class ScheduleDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: '06:00' })
  time: string;

  @ApiProperty({ example: 3 })
  duration: number;

  @ApiProperty({ example: true })
  enabled: boolean;

  @ApiProperty({ example: 1 })
  gardenId: number;

  @ApiProperty({ example: '2025-10-28T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-10-28T10:00:00Z' })
  updatedAt: Date;
}

