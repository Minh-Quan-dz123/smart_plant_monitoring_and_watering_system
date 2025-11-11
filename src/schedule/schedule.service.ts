import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateScheduleDto } from './dto/createSchedule.dto';
import { UpdateScheduleDto } from './dto/updateSchedule.dto';
import { MqttService } from 'src/mqtt/mqtt.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService, private mqttService: MqttService) {}

  private async publishGardenSchedules(gardenId: number) {
    const schedules = await this.prisma.schedule.findMany({
      where: { gardenId, enabled: true },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });

    const payload = JSON.stringify({
      schedules: schedules.map((s) => ({
        id: s.id,
        date: s.date ? s.date.toISOString().slice(0, 10) : null,
        time: s.time,
        duration: s.durationSeconds,
        repeat: s.repeat ?? null,
      })),
    });

    const topic = `iot/schedule/${gardenId}`;
    this.mqttService.publish(topic, payload);
  }

  // Tạo schedule mới cho vườn
  async createSchedule(createScheduleDto: CreateScheduleDto, userId: number) {
    const { date, time, durationSeconds, repeat, gardenId } = createScheduleDto;

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

    // Validate logic: nếu repeat không có -> phải có date (lịch 1 lần)
    if ((!repeat || repeat === 'once') && !date) {
      throw new BadRequestException('Lịch 1 lần cần có date');
    }

    // Tạo schedule
    const created = await this.prisma.schedule.create({
      data: {
        date: date ? new Date(date) : null,
        time,
        durationSeconds,
        repeat: repeat ?? (date ? 'once' : null),
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

    // Publish toàn bộ schedules của vườn sang ESP
    await this.publishGardenSchedules(gardenId);

    return created;
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

    // Chuẩn hóa dữ liệu update
    const data: any = { ...updateScheduleDto };
    if (data.date) data.date = new Date(data.date);

    // Cập nhật schedule
    const updated = await this.prisma.schedule.update({
      where: { id },
      data,
      include: {
        garden: {
          include: {
            plant: true,
          },
        },
      },
    });

    // Publish toàn bộ schedules của vườn sang ESP
    await this.publishGardenSchedules(schedule.gardenId);

    return updated;
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

    const deleted = await this.prisma.schedule.delete({
      where: { id },
    });

    // Publish toàn bộ schedules của vườn sang ESP
    await this.publishGardenSchedules(schedule.gardenId);

    return deleted;
  }
}

