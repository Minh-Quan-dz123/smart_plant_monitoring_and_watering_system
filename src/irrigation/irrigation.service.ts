import { Injectable, Logger, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
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

    // Chỉ kiểm tra nếu chế độ AUTO được chọn
    if (garden.irrigationMode !== 'auto') {
      return [];
    }

    const plant = garden.plant;
    const alerts: ThresholdAlert[] = [];
    let shouldIrrigate = false;

    // Kiểm tra nhiệt độ - CHỈ CẢNH BÁO, KHÔNG TƯỚI
    if (plant.minTemperature !== null || plant.maxTemperature !== null) {
      if (plant.minTemperature !== null && sensorData.temperature < plant.minTemperature) {
        alerts.push({
          type: 'temperature',
          message: ` ⚠️ Nhiệt độ quá thấp: ${sensorData.temperature.toFixed(1)}°C (ngưỡng: ${plant.minTemperature}°C)`,
          currentValue: sensorData.temperature,
          threshold: { min: plant.minTemperature ?? undefined, max: plant.maxTemperature ?? undefined },
        });
      }
      if (plant.maxTemperature !== null && sensorData.temperature > plant.maxTemperature) {
        alerts.push({
          type: 'temperature',
          message: ` ⚠️ Nhiệt độ quá cao: ${sensorData.temperature.toFixed(1)}°C (ngưỡng: ${plant.maxTemperature}°C)`,
          currentValue: sensorData.temperature,
          threshold: { min: plant.minTemperature ?? undefined, max: plant.maxTemperature ?? undefined },
        });
      }
    }

    // Kiểm tra độ ẩm không khí - CHỈ CẢNH BÁO, KHÔNG TƯỚI
    if (plant.minAirHumidity !== null || plant.maxAirHumidity !== null) {
      if (plant.minAirHumidity !== null && sensorData.airHumidity < plant.minAirHumidity) {
        alerts.push({
          type: 'airHumidity',
          message: ` ⚠️ Độ ẩm không khí quá thấp: ${sensorData.airHumidity.toFixed(1)}% (ngưỡng: ${plant.minAirHumidity}%)`,
          currentValue: sensorData.airHumidity,
          threshold: { min: plant.minAirHumidity ?? undefined, max: plant.maxAirHumidity ?? undefined },
        });
      }
      if (plant.maxAirHumidity !== null && sensorData.airHumidity > plant.maxAirHumidity) {
        alerts.push({
          type: 'airHumidity',
          message: ` ⚠️ Độ ẩm không khí quá cao: ${sensorData.airHumidity.toFixed(1)}% (ngưỡng: ${plant.maxAirHumidity}%)`,
          currentValue: sensorData.airHumidity,
          threshold: { min: plant.minAirHumidity ?? undefined, max: plant.maxAirHumidity ?? undefined },
        });
      }
    }

    // Kiểm tra độ ẩm đất - NẾU THẤP HƠN NGƯỠNG TỐI THIỂU THÌ TỰ ĐỘNG TƯỚI
    if (plant.minSoilMoisture !== null && sensorData.soilMoisture < plant.minSoilMoisture) {
      alerts.push({
        type: 'soilMoisture',
        message: ` 💧 Độ ẩm đất quá thấp: ${sensorData.soilMoisture.toFixed(1)}% (ngưỡng: ${plant.minSoilMoisture}%) - Tự động tưới`,
        currentValue: sensorData.soilMoisture,
        threshold: { min: plant.minSoilMoisture ?? undefined, max: plant.maxSoilMoisture ?? undefined },
      });
      shouldIrrigate = true;
    }

    // Nếu độ ẩm đất quá cao (không cần tưới) - CHỈ CẢNH BÁO
    if (plant.maxSoilMoisture !== null && sensorData.soilMoisture > plant.maxSoilMoisture) {
      alerts.push({
        type: 'soilMoisture',
        message: ` ⚠️ Độ ẩm đất quá cao: ${sensorData.soilMoisture.toFixed(1)}% (ngưỡng: ${plant.maxSoilMoisture}%)`,
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

    // Tự động tưới nếu độ ẩm đất thấp - Gửi lệnh qua MQTT
    if (shouldIrrigate) {
      // Lấy espId từ garden
      if (garden.espId && garden.espId !== '-1') {
        // Gửi status = 2 (Auto)
        await this.mqttService.sendIrrigationStatus(garden.espId as any, 2);
        // Gửi lệnh tưới với thời lượng 3 phút (180 giây)
        await this.mqttService.sendPumpCommand(garden.espId as any, 180);
        this.logger.log(` Đã gửi lệnh tưới tự động (Auto) cho vườn #${gardenId} - ESP ${garden.espId}`);
      } else {
        this.logger.warn(` Vườn ${gardenId} chưa được kết nối với ESP device - Không thể tưới tự động`);
      }
    }

    return alerts;
  }

  /**
   * Bắt đầu tưới nước (chế độ MANUAL)
   */
  async startIrrigation(gardenId: number, duration: number = 3): Promise<void> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    }) as any;

    if (!garden) {
      throw new NotFoundException(`Vườn với ID ${gardenId} không tồn tại`);
    }

    if (!garden.espId || garden.espId === '-1') {
      throw new NotFoundException(`Vườn ${gardenId} chưa được kết nối với ESP device`);
    }

    // Set chế độ Manual trước khi gửi lệnh
    await this.prisma.garden.update({
      where: { id: gardenId },
      data: { irrigationMode: 'manual' } as any,
    });

    // Gửi status = 3 (Manual) đến ESP
    await this.mqttService.sendIrrigationStatus(garden.espId, 3);

    // Gửi lệnh tưới qua MQTT (duration tính bằng giây)
    const durationSeconds = duration * 60; // Chuyển phút sang giây
    await this.mqttService.sendPumpCommand(garden.espId, durationSeconds);

    // Lưu vào database
    await this.prisma.irrigation.create({
      data: {
        gardenId: gardenId,
        status: true,
      },
    });

    this.logger.log(` Đã bắt đầu tưới thủ công vườn #${gardenId} trong ${duration} phút (${durationSeconds} giây)`);
    
    // Sau khi tưới xong, ESP sẽ tự động gửi thông báo về
    // Server sẽ xử lý trong handleSelectsData để chuyển về OFF (irrigationMode = null)
  }

  /**
   * Dừng tưới nước (chế độ MANUAL)
   */
  async stopIrrigation(gardenId: number): Promise<void> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    }) as any;

    if (!garden) {
      throw new NotFoundException(`Vườn với ID ${gardenId} không tồn tại`);
    }

    if (!garden.espId || garden.espId === '-1') {
      throw new NotFoundException(`Vườn ${gardenId} chưa được kết nối với ESP device`);
    }

    // Gửi lệnh dừng qua MQTT
    await this.mqttService.sendGardenCommand(garden.espId, 'off');

    // Chuyển về OFF (không có chế độ nào)
    await this.prisma.garden.update({
      where: { id: gardenId },
      data: { irrigationMode: null } as any,
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
   * Cập nhật chế độ tưới cho vườn (chỉ chọn 1 trong 3 chế độ)
   */
  async updateIrrigationMode(
    gardenId: number,
    mode: string | null,
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

    // Validate mode
    if (mode !== null && !['schedule', 'auto', 'manual'].includes(mode)) {
      throw new BadRequestException('Chế độ tưới không hợp lệ. Phải là: null, "schedule", "auto", hoặc "manual"');
    }

    const updatedGarden = await this.prisma.garden.update({
      where: { id: gardenId },
      data: { irrigationMode: mode } as any,
    }) as any;

    const modeNames: { [key: string]: string } = {
      null: 'OFF',
      schedule: 'Schedule',
      auto: 'Auto',
      manual: 'Manual',
    };

    this.logger.log(` Đã cập nhật chế độ tưới vườn #${gardenId}: ${modeNames[mode || 'null']}`);

    // Gửi status đến ESP dựa trên chế độ được chọn
    if (updatedGarden.espId && updatedGarden.espId !== '-1') {
      if (mode === 'schedule') {
        await this.mqttService.sendIrrigationStatus(updatedGarden.espId, 1);
      } else if (mode === 'auto') {
        await this.mqttService.sendIrrigationStatus(updatedGarden.espId, 2);
      } else if (mode === 'manual') {
        await this.mqttService.sendIrrigationStatus(updatedGarden.espId, 3);
      }
      // Không gửi status khi mode = null (OFF)
    }
  }

  /**
   * Lấy thông tin chế độ tưới của vườn
   */
  async getIrrigationMode(gardenId: number, userId: number) {
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
      irrigationMode: fullGarden.irrigationMode || null,
    };
  }
}

