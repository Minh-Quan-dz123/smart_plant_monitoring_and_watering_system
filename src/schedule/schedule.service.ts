import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateScheduleDto } from './dto/createSchedule.dto';
import { UpdateScheduleDto } from './dto/updateSchedule.dto';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  // Tạo schedule mới cho vườn
  async createSchedule(createScheduleDto: CreateScheduleDto, userId: number) {
    const { time, duration, gardenId } = createScheduleDto;

    // Kiểm tra vườn có tồn tại không
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });
    if (!garden) {
      throw new NotFoundException('Vườn không tồn tại');
    }

    // Kiểm tra user có quyền với vườn này không
    if (garden.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền tạo lịch tưới cho vườn này');
    }

    // Tạo schedule
    return this.prisma.schedule.create({
      data: {
        time,
        duration,
        gardenId,
      },
      include: {
        garden: {
          include: {
            plant: true,
          },
        },
      },
    });
  }

  // Lấy tất cả schedule của một vườn
  async getSchedulesByGarden(gardenId: number, userId: number) {
    // Kiểm tra vườn có tồn tại không
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });
    if (!garden) {
      throw new NotFoundException('Vườn không tồn tại');
    }

    // Kiểm tra user có quyền xem vườn này không
    if (garden.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem lịch tưới của vườn này');
    }

    return this.prisma.schedule.findMany({
      where: { gardenId },
      orderBy: { time: 'asc' },
      include: {
        garden: {
          include: {
            plant: true,
          },
        },
      },
    });
  }

  // Lấy tất cả schedule của user (tất cả vườn)
  async getUserSchedules(userId: number) {
    // Lấy tất cả vườn của user
    const gardens = await this.prisma.garden.findMany({
      where: { userId },
      select: { id: true },
    });

    const gardenIds = gardens.map((g) => g.id);

    return this.prisma.schedule.findMany({
      where: {
        gardenId: { in: gardenIds },
      },
      orderBy: [
        { gardenId: 'asc' },
        { time: 'asc' },
      ],
      include: {
        garden: {
          include: {
            plant: true,
          },
        },
      },
    });
  }

  // Lấy schedule theo ID
  async getScheduleById(id: number, userId: number) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        garden: {
          include: {
            plant: true,
          },
        },
      },
    });

    if (!schedule) {
      throw new NotFoundException('Lịch tưới không tồn tại');
    }

    // Kiểm tra user có quyền xem schedule này không
    if (schedule.garden.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem lịch tưới này');
    }

    return schedule;
  }

  // Cập nhật schedule
  async updateSchedule(id: number, updateScheduleDto: UpdateScheduleDto, userId: number) {
    // Kiểm tra schedule có tồn tại không
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        garden: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Lịch tưới không tồn tại');
    }

    // Kiểm tra user có quyền cập nhật schedule này không
    if (schedule.garden.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật lịch tưới này');
    }

    // Cập nhật schedule
    return this.prisma.schedule.update({
      where: { id },
      data: updateScheduleDto,
      include: {
        garden: {
          include: {
            plant: true,
          },
        },
      },
    });
  }

  // Xóa schedule
  async deleteSchedule(id: number, userId: number) {
    // Kiểm tra schedule có tồn tại không
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        garden: true,
      },
    });

    if (!schedule) {
      throw new NotFoundException('Lịch tưới không tồn tại');
    }

    // Kiểm tra user có quyền xóa schedule này không
    if (schedule.garden.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa lịch tưới này');
    }

    return this.prisma.schedule.delete({
      where: { id },
    });
  }
}

