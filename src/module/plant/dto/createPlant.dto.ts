import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

/**
 * DTO dùng để tạo một Plant mới (Thêm cây vào thư viện).
 * Chỉ Admin mới được phép sử dụng.
 */
export class CreatePlantDto {
  
  @ApiProperty({ 
    example: 'Hoa Hồng Đỏ', 
    description: 'Tên độc nhất của cây trồng', 
    maxLength: 100 
  })
  @IsString({ message: 'Tên cây phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên cây không được để trống' })
  @MaxLength(100, { message: 'Tên cây không được vượt quá 100 ký tự' })
  name: string; // Tên cây (Plant.name)

  @ApiProperty({ 
    example: 'Loại cây cảnh, có nhiều màu sắc. Thích hợp trồng nơi có nắng, cần tưới nước thường xuyên.', 
    description: 'Mô tả, công dụng, cách trồng', 
    required: false 
  })
  @IsString({ message: 'Mô tả phải là chuỗi ký tự' })
  @IsOptional()
  description?: string; // Mô tả, công dụng, cách trồng (Plant.description)

}