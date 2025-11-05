import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

export interface SensorDataDto {
  temperature: number;
  airHumidity: number;
  soilMoisture: number;
  gardenId: number;
}

@Injectable()
export class SensorService {
  constructor(private prisma: PrismaService) {}

  // Lưu dữ liệu sensor từ ESP8266
  async createSensorReading(data: SensorDataDto) {
    // Kiểm tra vườn có tồn tại không
    const garden = await this.prisma.garden.findUnique({
      where: { id: data.gardenId },
    });

    if (!garden) {
      throw new NotFoundException(`Vườn với ID ${data.gardenId} không tồn tại`);
    }

    // Validate dữ liệu
    if (data.temperature < -50 || data.temperature > 60) {
      throw new BadRequestException('Giá trị nhiệt độ không hợp lệ');
    }
    if (data.airHumidity < 0 || data.airHumidity > 100) {
      throw new BadRequestException('Giá trị độ ẩm không khí không hợp lệ (0-100%)');
    }
    if (data.soilMoisture < 0 || data.soilMoisture > 100) {
      throw new BadRequestException('Giá trị độ ẩm đất không hợp lệ (0-100%)');
    }

    // Lưu dữ liệu sensor
    return this.prisma.sensor.create({
      data: {
        temperature: data.temperature,
        airHumidity: data.airHumidity,
        soilMoisture: data.soilMoisture,
        gardenId: data.gardenId,
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

  // Lấy dữ liệu sensor mới nhất của một vườn
  async getLatestSensorReading(gardenId: number) {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!garden) {
      throw new NotFoundException(`Vườn với ID ${gardenId} không tồn tại`);
    }

    return this.prisma.sensor.findFirst({
      where: { gardenId },
      orderBy: { timestamp: 'desc' },
      include: {
        garden: {
          include: {
            plant: true,
          },
        },
      },
    });
  }

  // Lấy lịch sử dữ liệu sensor của một vườn
  async getSensorHistory(gardenId: number, limit: number = 100) {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!garden) {
      throw new NotFoundException(`Vườn với ID ${gardenId} không tồn tại`);
    }

    return this.prisma.sensor.findMany({
      where: { gardenId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        garden: {
          include: {
            plant: true,
          },
        },
      },
    });
  }

  // Lấy tất cả dữ liệu sensor của user (tất cả vườn)
  async getUserSensorData(userId: number, limit: number = 50) {
    // Lấy tất cả vườn của user
    const gardens = await this.prisma.garden.findMany({
      where: { userId },
      select: { id: true },
    });

    const gardenIds = gardens.map((g) => g.id);

    if (gardenIds.length === 0) {
      return [];
    }

    return this.prisma.sensor.findMany({
      where: {
        gardenId: { in: gardenIds },
      },
      orderBy: [
        { gardenId: 'asc' },
        { timestamp: 'desc' },
      ],
      take: limit,
      include: {
        garden: {
          include: {
            plant: true,
          },
        },
      },
    });
  }
}

