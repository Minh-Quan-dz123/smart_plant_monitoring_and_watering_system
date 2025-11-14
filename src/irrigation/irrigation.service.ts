import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
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
    @Inject(forwardRef(() => MqttService))
    private mqttService: MqttService,
  ) {}

  /**
   * Kiểm tra ngưỡng và tự động tưới nếu cần (chế độ AUTO)
   */
  async checkThresholdAndIrrigate(gardenId: number, sensorData: SensorReading): Promise<ThresholdAlert[]> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      include: { plant: true },
    }) as any;

    if (!garden) {
      throw new NotFoundException(`Vườn với ID ${gardenId} không tồn tại`);
    }

    // Chỉ kiểm tra nếu chế độ AUTO được bật
    if (!garden.autoEnabled) {
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
          message: ` Nhiệt độ quá thấp: ${sensorData.temperature.toFixed(1)}°C (ngưỡng: ${plant.minTemperature}°C)`,
          currentValue: sensorData.temperature,
          threshold: { min: plant.minTemperature ?? undefined, max: plant.maxTemperature ?? undefined },
        });
      }
      if (plant.maxTemperature !== null && sensorData.temperature > plant.maxTemperature) {
        alerts.push({
          type: 'temperature',
          message: ` Nhiệt độ quá cao: ${sensorData.temperature.toFixed(1)}°C (ngưỡng: ${plant.maxTemperature}°C)`,
          currentValue: sensorData.temperature,
          threshold: { min: plant.minTemperature ?? undefined, max: plant.maxTemperature ?? undefined },
        });
      }
    }

    // Kiểm tra độ ẩm không khí
    if (plant.minAirHumidity !== null || plant.maxAirHumidity !== null) {
      if (plant.minAirHumidity !== null && sensorData.airHumidity < plant.minAirHumidity) {
        alerts.push({
          type: 'airHumidity',
          message: ` Độ ẩm không khí quá thấp: ${sensorData.airHumidity.toFixed(1)}% (ngưỡng: ${plant.minAirHumidity}%)`,
          currentValue: sensorData.airHumidity,
          threshold: { min: plant.minAirHumidity ?? undefined, max: plant.maxAirHumidity ?? undefined },
        });
      }
      if (plant.maxAirHumidity !== null && sensorData.airHumidity > plant.maxAirHumidity) {
        alerts.push({
          type: 'airHumidity',
          message: ` Độ ẩm không khí quá cao: ${sensorData.airHumidity.toFixed(1)}% (ngưỡng: ${plant.maxAirHumidity}%)`,
          currentValue: sensorData.airHumidity,
          threshold: { min: plant.minAirHumidity ?? undefined, max: plant.maxAirHumidity ?? undefined },
        });
      }
    }

    // Kiểm tra độ ẩm đất - Nếu thấp hơn ngưỡng tối thiểu thì cần tưới
    if (plant.minSoilMoisture !== null && sensorData.soilMoisture < plant.minSoilMoisture) {
      alerts.push({
        type: 'soilMoisture',
        message: ` Độ ẩm đất quá thấp: ${sensorData.soilMoisture.toFixed(1)}% (ngưỡng: ${plant.minSoilMoisture}%) - Tự động tưới`,
        currentValue: sensorData.soilMoisture,
        threshold: { min: plant.minSoilMoisture ?? undefined, max: plant.maxSoilMoisture ?? undefined },
      });
      shouldIrrigate = true;
    }

    // Nếu độ ẩm đất quá cao (không cần tưới)
    if (plant.maxSoilMoisture !== null && sensorData.soilMoisture > plant.maxSoilMoisture) {
      alerts.push({
        type: 'soilMoisture',
        message: ` Độ ẩm đất quá cao: ${sensorData.soilMoisture.toFixed(1)}% (ngưỡng: ${plant.maxSoilMoisture}%)`,
        currentValue: sensorData.soilMoisture,
        threshold: { min: plant.minSoilMoisture ?? undefined, max: plant.maxSoilMoisture ?? undefined },
      });
    }

    // Gửi cảnh báo nếu có
    if (alerts.length > 0) {
      this.logger.warn(` Cảnh báo cho vườn #${gardenId}:`);
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

    this.logger.log(` Đã bắt đầu tưới vườn #${gardenId} trong ${duration} phút`);
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

    this.logger.log(` Đã dừng tưới vườn #${gardenId}`);
  }

  /**
   * Cập nhật chế độ tưới cho vườn
   */
  async updateIrrigationModes(
    gardenId: number,
    modes: { autoEnabled?: boolean; scheduleEnabled?: boolean },
    userId: number,
  ): Promise<void> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!garden) {
      throw new NotFoundException(`Vườn với ID ${gardenId} không tồn tại`);
    }

    if (garden.userId !== userId) {
      throw new NotFoundException('Bạn không có quyền thay đổi chế độ tưới của vườn này');
    }

    const updateData: { autoEnabled?: boolean; scheduleEnabled?: boolean } = {};
    if (modes.autoEnabled !== undefined) {
      updateData.autoEnabled = modes.autoEnabled;
    }
    if (modes.scheduleEnabled !== undefined) {
      updateData.scheduleEnabled = modes.scheduleEnabled;
    }

    await this.prisma.garden.update({
      where: { id: gardenId },
      data: updateData as any,
    });

    const enabledModes: string[] = [];
    if (updateData.autoEnabled !== undefined) {
      enabledModes.push(`Auto: ${updateData.autoEnabled ? 'ON' : 'OFF'}`);
    }
    if (updateData.scheduleEnabled !== undefined) {
      enabledModes.push(`Schedule: ${updateData.scheduleEnabled ? 'ON' : 'OFF'}`);
    }

    this.logger.log(` Đã cập nhật chế độ tưới vườn #${gardenId}: ${enabledModes.join(', ')}`);
  }

  /**
   * Lấy thông tin chế độ tưới của vườn
   */
  async getIrrigationModes(gardenId: number, userId: number) {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      select: { id: true, name: true, userId: true },
    }) as any;

    if (!garden) {
      throw new NotFoundException(`Vườn với ID ${gardenId} không tồn tại`);
    }

    if (garden.userId !== userId) {
      throw new NotFoundException('Bạn không có quyền xem chế độ tưới của vườn này');
    }

    // Lấy lại với đầy đủ thông tin
    const fullGarden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    }) as any;

    return {
      gardenId: fullGarden.id,
      gardenName: fullGarden.name,
      autoEnabled: fullGarden.autoEnabled || false,
      scheduleEnabled: fullGarden.scheduleEnabled || false,
    };
  }
}

