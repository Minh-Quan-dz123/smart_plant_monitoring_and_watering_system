import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MqttService } from 'src/mqtt/mqtt.service';
import { IrrigationMode } from './irrigation-mode.enum';

export interface SensorReading {
  temperature: number;
  airHumidity: number;
  soilMoisture: number;
}

export interface ThresholdAlert {
  type: 'temperature' | 'airHumidity' | 'soilMoisture';
  message: string;
  currentValue: number;
  threshold: { min?: number; max?: number };
}

@Injectable()
export class IrrigationService {
  private readonly logger = new Logger(IrrigationService.name);

  constructor(
    private prisma: PrismaService,
    private mqttService: MqttService,
  ) {}

  /**
   * Kiểm tra ngưỡng và tự động tưới nếu cần (chế độ AUTO)
   */
  async checkThresholdAndIrrigate(gardenId: number, sensorData: SensorReading): Promise<ThresholdAlert[]> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      include: { plant: true },
    });

    if (!garden) {
      throw new NotFoundException(`Vườn với ID ${gardenId} không tồn tại`);
    }

    // Chỉ kiểm tra nếu chế độ là AUTO
    if (garden.irrigationMode !== IrrigationMode.AUTO) {
      return [];
    }

    const plant = garden.plant;
    const alerts: ThresholdAlert[] = [];
    let shouldIrrigate = false;

    // Kiểm tra nhiệt độ
    if (plant.minTemperature !== null || plant.maxTemperature !== null) {
      if (plant.minTemperature !== null && sensorData.temperature < plant.minTemperature) {
        alerts.push({
          type: 'temperature',
          message: `⚠️ Nhiệt độ quá thấp: ${sensorData.temperature.toFixed(1)}°C (ngưỡng: ${plant.minTemperature}°C)`,
          currentValue: sensorData.temperature,
          threshold: { min: plant.minTemperature, max: plant.maxTemperature },
        });
      }
      if (plant.maxTemperature !== null && sensorData.temperature > plant.maxTemperature) {
        alerts.push({
          type: 'temperature',
          message: `⚠️ Nhiệt độ quá cao: ${sensorData.temperature.toFixed(1)}°C (ngưỡng: ${plant.maxTemperature}°C)`,
          currentValue: sensorData.temperature,
          threshold: { min: plant.minTemperature, max: plant.maxTemperature },
        });
      }
    }

    // Kiểm tra độ ẩm không khí
    if (plant.minAirHumidity !== null || plant.maxAirHumidity !== null) {
      if (plant.minAirHumidity !== null && sensorData.airHumidity < plant.minAirHumidity) {
        alerts.push({
          type: 'airHumidity',
          message: `⚠️ Độ ẩm không khí quá thấp: ${sensorData.airHumidity.toFixed(1)}% (ngưỡng: ${plant.minAirHumidity}%)`,
          currentValue: sensorData.airHumidity,
          threshold: { min: plant.minAirHumidity, max: plant.maxAirHumidity },
        });
      }
      if (plant.maxAirHumidity !== null && sensorData.airHumidity > plant.maxAirHumidity) {
        alerts.push({
          type: 'airHumidity',
          message: `⚠️ Độ ẩm không khí quá cao: ${sensorData.airHumidity.toFixed(1)}% (ngưỡng: ${plant.maxAirHumidity}%)`,
          currentValue: sensorData.airHumidity,
          threshold: { min: plant.minAirHumidity, max: plant.maxAirHumidity },
        });
      }
    }

    // Kiểm tra độ ẩm đất - Nếu thấp hơn ngưỡng tối thiểu thì cần tưới
    if (plant.minSoilMoisture !== null && sensorData.soilMoisture < plant.minSoilMoisture) {
      alerts.push({
        type: 'soilMoisture',
        message: `🌱 Độ ẩm đất quá thấp: ${sensorData.soilMoisture.toFixed(1)}% (ngưỡng: ${plant.minSoilMoisture}%) - Tự động tưới`,
        currentValue: sensorData.soilMoisture,
        threshold: { min: plant.minSoilMoisture, max: plant.maxSoilMoisture },
      });
      shouldIrrigate = true;
    }

    // Nếu độ ẩm đất quá cao (không cần tưới)
    if (plant.maxSoilMoisture !== null && sensorData.soilMoisture > plant.maxSoilMoisture) {
      alerts.push({
        type: 'soilMoisture',
        message: `💧 Độ ẩm đất quá cao: ${sensorData.soilMoisture.toFixed(1)}% (ngưỡng: ${plant.maxSoilMoisture}%)`,
        currentValue: sensorData.soilMoisture,
        threshold: { min: plant.minSoilMoisture, max: plant.maxSoilMoisture },
      });
    }

    // Gửi cảnh báo nếu có
    if (alerts.length > 0) {
      this.logger.warn(`🚨 Cảnh báo cho vườn #${gardenId}:`);
      alerts.forEach((alert) => {
        this.logger.warn(`   ${alert.message}`);
      });
    }

    // Tự động tưới nếu độ ẩm đất thấp
    if (shouldIrrigate) {
      await this.startIrrigation(gardenId, 3); // Tưới 3 phút
    }

    return alerts;
  }

  /**
   * Bắt đầu tưới nước (chế độ MANUAL)
   */
  async startIrrigation(gardenId: number, duration: number = 3): Promise<void> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!garden) {
      throw new NotFoundException(`Vườn với ID ${gardenId} không tồn tại`);
    }

    // Gửi lệnh tưới qua MQTT
    await this.mqttService.sendIrrigationCommand(gardenId, {
      action: 'start',
      duration: duration,
    });

    // Lưu vào database
    await this.prisma.irrigation.create({
      data: {
        gardenId: gardenId,
        status: true,
      },
    });

    this.logger.log(`💧 Đã bắt đầu tưới vườn #${gardenId} trong ${duration} phút`);
  }

  /**
   * Dừng tưới nước (chế độ MANUAL)
   */
  async stopIrrigation(gardenId: number): Promise<void> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!garden) {
      throw new NotFoundException(`Vườn với ID ${gardenId} không tồn tại`);
    }

    // Gửi lệnh dừng qua MQTT
    await this.mqttService.sendIrrigationCommand(gardenId, {
      action: 'stop',
    });

    // Lưu vào database
    await this.prisma.irrigation.create({
      data: {
        gardenId: gardenId,
        status: false,
      },
    });

    this.logger.log(`🛑 Đã dừng tưới vườn #${gardenId}`);
  }

  /**
   * Cập nhật chế độ tưới cho vườn
   */
  async updateIrrigationMode(gardenId: number, mode: IrrigationMode, userId: number): Promise<void> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!garden) {
      throw new NotFoundException(`Vườn với ID ${gardenId} không tồn tại`);
    }

    if (garden.userId !== userId) {
      throw new NotFoundException('Bạn không có quyền thay đổi chế độ tưới của vườn này');
    }

    await this.prisma.garden.update({
      where: { id: gardenId },
      data: { irrigationMode: mode },
    });

    this.logger.log(`✅ Đã cập nhật chế độ tưới vườn #${gardenId} thành: ${mode}`);
  }

  /**
   * Lấy thông tin chế độ tưới của vườn
   */
  async getIrrigationMode(gardenId: number, userId: number) {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      select: { id: true, irrigationMode: true, name: true, userId: true },
    });

    if (!garden) {
      throw new NotFoundException(`Vườn với ID ${gardenId} không tồn tại`);
    }

    if (garden.userId !== userId) {
      throw new NotFoundException('Bạn không có quyền xem chế độ tưới của vườn này');
    }

    return {
      gardenId: garden.id,
      gardenName: garden.name,
      irrigationMode: garden.irrigationMode,
    };
  }
}

