import { ApiProperty } from '@nestjs/swagger';

// Giả sử bạn có một interface hoặc type cho Plant từ Prisma
// import { Plant } from '@prisma/client';

export class PlantDto {
  
  @ApiProperty({ example: 1, description: 'ID của cây trồng trong thư viện' })
  id: number;
  
  @ApiProperty({ example: 'Hoa Hồng Đỏ', description: 'Tên cây trồng' })
  name: string;
  
  @ApiProperty({ example: 'Cây cảnh đẹp.', description: 'Mô tả', nullable: true })
  description: string | null;
  
  @ApiProperty({ example: 5, description: 'ID của Admin đã tạo cây này' })
  createdById: number;
  
  @ApiProperty({ example: new Date().toISOString(), description: 'Thời điểm tạo' })
  createdAt: Date;
  
  @ApiProperty({ example: new Date().toISOString(), description: 'Thời điểm cập nhật cuối cùng' })
  updatedAt: Date;

  constructor(plant: any) {
    this.id = plant.id;
    this.name = plant.name;
    this.description = plant.description;
    this.createdById = plant.createdById;
    this.createdAt = plant.createdAt;
    this.updatedAt = plant.updatedAt;
  }
}