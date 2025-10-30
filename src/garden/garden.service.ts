import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateGardenDto } from 'src/garden/dto/createGarden.dto';

@Injectable()
export class GardenService {
  constructor(private prisma: PrismaService) {}

  //tạo vườn mới cho user
  async createGarden(createGardenDto: CreateGardenDto, userId: number) {
    const { name, plantId } = createGardenDto;

    //  Kiểm tra cây có tồn tại không
    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
    });
    if (!plant) throw new BadRequestException('Cây không tồn tại trong thư viện.');
    return this.prisma.garden.create({ //tạo vườn
      data: {
        name,
        userId,
        plantId,
      },
      include: { plant: true },
    });
  }

  //lấy danh sách vườn của user
  async findUserGardens(userId: number) {
    return this.prisma.garden.findMany({
      where: { userId },
      include: { plant: true },
    });
  }

    // Xóa vườn (chỉ chủ vườn được xóa)
  async deleteGarden(id: number, userId: number) {
    const garden = await this.prisma.garden.findUnique({ where: { id } });
    if (!garden) throw new BadRequestException('Vườn không tồn tại');
    if (garden.userId !== userId) throw new BadRequestException('Không có quyền xóa vườn này');

    return this.prisma.garden.delete({ where: { id } });
  }
}
