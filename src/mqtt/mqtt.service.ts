// mqtt.service.ts
import { Injectable, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { SensorService } from 'src/sensor/sensor.service';
import { IrrigationService } from 'src/irrigation/irrigation.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MqttService implements OnModuleInit {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient;
  // Map để lưu các pending connection checks: espId -> { resolve, reject, timeout }
  private pendingConnectionChecks = new Map<string, { resolve: (status: 'ON' | 'OFF') => void; reject: (error: Error) => void; timeout: NodeJS.Timeout }>();

  constructor(
    private sensorService: SensorService,
    @Inject(forwardRef(() => IrrigationService))
    private irrigationService: IrrigationService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.client = mqtt.connect({
      host: '6dbb453c749b4a2a9f84d544ee9cad40.s1.eu.hivemq.cloud',
      port: 8883,
      protocol: 'mqtts',
      username: 'sang2004',
      password: 'Sang01032004',
      reconnectPeriod: 5000, 
    });

    this.client.on('connect', () => {
      this.logger.log(' Đã kết nối đến HiveMQ!');
      
      // Subscribe tất cả topics để test (có thể bỏ sau khi hoàn thiện)
      this.client.subscribe('#', (err) => {
        if (err) {
          this.logger.error(` Lỗi subscribe topic: ${err.message}`);
        } else {
          this.logger.log(' Đã subscribe tất cả topics (#) - để test');
        }
      });
      
      // 1. conditions/esp_id/{temp, humi, soil} - ESP → Server
      this.client.subscribe('conditions/+/+', (err) => {
        if (err) {
          this.logger.error(` Lỗi subscribe topic conditions: ${err.message}`);
        } else {
          this.logger.log(' Đã subscribe topic: conditions/+/+');
        }
      });

      // 2. logs/esp_id/{year, month, day, hour, minute, second, time tưới} - ESP → Server
      this.client.subscribe('logs/+/+', (err) => {
        if (err) {
          this.logger.error(` Lỗi subscribe topic logs: ${err.message}`);
        } else {
          this.logger.log(' Đã subscribe topic: logs/+/+');
        }
      });

      // 6. selects/esp_id/{status} - ESP → Server
      this.client.subscribe('selects/+/+', (err) => {
        if (err) {
          this.logger.error(` Lỗi subscribe topic selects: ${err.message}`);
        } else {
          this.logger.log(' Đã subscribe topic: selects/+/+');
        }
      });

      // 9. connect/esp_id/cmd/{is_connect} - ESP → Server
      this.client.subscribe('connect/+/cmd/+', (err) => {
        if (err) {
          this.logger.error(` Lỗi subscribe topic connect/cmd: ${err.message}`);
        } else {
          this.logger.log(' Đã subscribe topic: connect/+/cmd/+');
        }
      });

      // 10. connect/esp_id/response/{on} - ESP → Server (phản hồi từ ESP)
      this.client.subscribe('connect/+/response/+', (err) => {
        if (err) {
          this.logger.error(` Lỗi subscribe topic connect/response: ${err.message}`);
        } else {
          this.logger.log(' Đã subscribe topic: connect/+/response/+');
        }
      });

      // Giữ lại các topic cũ để tương thích ngược (có thể bỏ sau)
      this.client.subscribe('iot/sensor/+', (err) => {
        if (err) {
          this.logger.error(` Lỗi subscribe topic: ${err.message}`);
        } else {
          this.logger.log(' Đã subscribe topic: iot/sensor/+ (legacy)');
        }
      });
    });

    this.client.on('error', (error) => {
      this.logger.error(` Lỗi MQTT: ${error.message}`);
    });

    this.client.on('close', () => {
      this.logger.warn(' MQTT connection đã đóng');
    });

    this.client.on('offline', () => {
      this.logger.warn(' MQTT client đang offline');
    });

    this.client.on('message', async (topic, message) => {
      try {
        const messageStr = message.toString();
        
        // Log tất cả messages để dễ test và debug
        this.logger.log(` [MQTT] Nhận message từ topic [${topic}]: ${messageStr}`);

        // 1. conditions/esp_id/{temp, humi, soil} - ESP → Server
        if (topic.startsWith('conditions/')) {
          await this.handleConditionsData(topic, messageStr);
        }
        // 2. logs/esp_id/{year, month, day, hour, minute, second, time tưới} - ESP → Server
        else if (topic.startsWith('logs/')) {
          await this.handleLogsData(topic, messageStr);
        }
        // 6. selects/esp_id/{status} - ESP → Server
        else if (topic.startsWith('selects/')) {
          await this.handleSelectsData(topic, messageStr);
        }
        // 9. connect/esp_id/cmd/{is_connect} - ESP → Server
        else if (topic.startsWith('connect/') && topic.includes('/cmd/')) {
          await this.handleConnectCmd(topic, messageStr);
        }
        // 10. connect/esp_id/response/{on} - ESP → Server
        else if (topic.startsWith('connect/') && topic.includes('/response/')) {
          this.handleConnectionResponse(topic, messageStr);
        }
        // Legacy: iot/sensor/{gardenId} - giữ để tương thích ngược
        else if (topic.startsWith('iot/sensor/')) {
          await this.handleSensorData(topic, messageStr);
        }
        // Legacy: iot/control/{gardenId} - giữ để tương thích ngược
        else if (topic.startsWith('iot/control/')) {
          await this.handleControlFeedback(topic, messageStr);
        }
        // Xử lý các messages khác (để test)
        else {
          this.logger.log(` Đã nhận message test từ topic [${topic}]: ${messageStr}`);
        }
      } catch (error) {
        this.logger.error(` Lỗi xử lý message từ topic [${topic}]: ${error.message}`);
      }
    });
  }

  /**
   * 1. Xử lý dữ liệu cảm biến từ ESP
   * Topic format: conditions/esp_id/{temp, humi, soil}
   * Message format: JSON { "temp": 25.5, "humi": 60.0, "soil": 45.0 }
   */
  private async handleConditionsData(topic: string, message: string) {
    try {
      // Parse topic: conditions/esp_id/{temp, humi, soil}
      const topicParts = topic.split('/');
      const espId = topicParts[1];
      const dataType = topicParts[2]; // temp, humi, hoặc soil

      if (!espId || !dataType) {
        this.logger.warn(` Topic không hợp lệ: ${topic}`);
        return;
      }

      // Lấy gardenId từ espId
      const garden = await this.prisma.garden.findFirst({
        where: { espId },
      });

      if (!garden) {
        this.logger.warn(` Không tìm thấy vườn với espId: ${espId}`);
        return;
      }

      const value = parseFloat(message);
      if (isNaN(value)) {
        this.logger.warn(` Giá trị không hợp lệ từ topic ${topic}: ${message}`);
        return;
      }

      // Cập nhật ESPDevice
      await this.prisma.espDevice.upsert({
        where: { espId },
        update: {
          ...(dataType === 'temp' && { temperature: value }),
          ...(dataType === 'humi' && { airHumidity: value }),
          ...(dataType === 'soil' && { soilMoisture: value }),
          lastUpdated: new Date(),
        },
        create: {
          espId,
          ...(dataType === 'temp' && { temperature: value }),
          ...(dataType === 'humi' && { airHumidity: value }),
          ...(dataType === 'soil' && { soilMoisture: value }),
          lastUpdated: new Date(),
        },
      });

      // Nếu đã có đủ 3 giá trị (temp, humi, soil), lưu vào Sensor table và kiểm tra ngưỡng
      const espDevice = await this.prisma.espDevice.findUnique({
        where: { espId },
      });

      if (espDevice && espDevice.temperature !== null && espDevice.airHumidity !== null && espDevice.soilMoisture !== null) {
        // Lưu vào Sensor table
        await this.sensorService.createSensorReading({
          temperature: espDevice.temperature,
          airHumidity: espDevice.airHumidity,
          soilMoisture: espDevice.soilMoisture,
          gardenId: garden.id,
        });

        // Kiểm tra ngưỡng và tự động tưới nếu cần
        const alerts = await this.irrigationService.checkThresholdAndIrrigate(garden.id, {
          temperature: espDevice.temperature,
          airHumidity: espDevice.airHumidity,
          soilMoisture: espDevice.soilMoisture,
        });

        this.displaySensorData(garden.id, {
          temperature: espDevice.temperature,
          airHumidity: espDevice.airHumidity,
          soilMoisture: espDevice.soilMoisture,
        }, alerts);
      }
    } catch (error) {
      this.logger.error(` Lỗi xử lý dữ liệu conditions: ${error.message}`);
    }
  }

  /**
   * 2. Xử lý log lịch sử tưới từ ESP
   * Topic format: logs/esp_id/{year, month, day, hour, minute, second, time tưới}
   * Message format: JSON hoặc string với các giá trị
   */
  private async handleLogsData(topic: string, message: string) {
    try {
      const topicParts = topic.split('/');
      const espId = topicParts[1];
      const logType = topicParts[2]; // year, month, day, hour, minute, second, hoặc time tưới

      if (!espId || !logType) {
        this.logger.warn(` Topic log không hợp lệ: ${topic}`);
        return;
      }

      // Lấy gardenId từ espId
      const garden = await this.prisma.garden.findFirst({
        where: { espId },
      });

      if (!garden) {
        this.logger.warn(` Không tìm thấy vườn với espId: ${espId}`);
        return;
      }

      // Parse message (có thể là JSON hoặc số)
      let logData: any;
      try {
        logData = JSON.parse(message);
      } catch {
        logData = { value: message };
      }

      this.logger.log(` [LOG] ESP ${espId} - Garden ${garden.id} - ${logType}: ${JSON.stringify(logData)}`);
      
      // Có thể lưu vào database nếu cần
      // TODO: Tạo bảng Log nếu cần lưu lịch sử chi tiết
    } catch (error) {
      this.logger.error(` Lỗi xử lý log: ${error.message}`);
    }
  }

  /**
   * 6. Xử lý trạng thái kết nối/hoạt động từ ESP
   * Topic format: selects/esp_id/{status}
   * Message format: string hoặc JSON với trạng thái
   */
  private async handleSelectsData(topic: string, message: string) {
    try {
      const topicParts = topic.split('/');
      const espId = topicParts[1];
      const statusType = topicParts[2];

      if (!espId) {
        this.logger.warn(` Topic selects không hợp lệ: ${topic}`);
        return;
      }

      // Cập nhật trạng thái ESPDevice
      const status = message.trim().toLowerCase();
      const isConnected = status === 'on' || status === '1' || status === 'true' || status === 'connected';

      await this.prisma.espDevice.upsert({
        where: { espId },
        update: {
          isConnected,
          lastUpdated: new Date(),
        },
        create: {
          espId,
          isConnected,
          lastUpdated: new Date(),
        },
      });

      this.logger.log(` [SELECTS] ESP ${espId} - Status: ${status} (isConnected: ${isConnected})`);
    } catch (error) {
      this.logger.error(` Lỗi xử lý selects: ${error.message}`);
    }
  }

  /**
   * 9. Xử lý yêu cầu kết nối từ ESP
   * Topic format: connect/esp_id/cmd/{is_connect}
   * Message format: JSON { "is_connect": 1 } hoặc số
   */
  private async handleConnectCmd(topic: string, message: string) {
    try {
      const topicParts = topic.split('/');
      const espId = topicParts[1];
      const isConnect = topicParts[3]; // is_connect value

      if (!espId) {
        this.logger.warn(` Topic connect/cmd không hợp lệ: ${topic}`);
        return;
      }

      // Parse message
      let connectData: any;
      try {
        connectData = JSON.parse(message);
      } catch {
        connectData = { is_connect: parseInt(message) || parseInt(isConnect) || 1 };
      }

      const isConnected = connectData.is_connect === 1 || connectData.is_connect === true;

      // Cập nhật trạng thái ESPDevice
      await this.prisma.espDevice.upsert({
        where: { espId },
        update: {
          isConnected,
          lastUpdated: new Date(),
        },
        create: {
          espId,
          isConnected,
          lastUpdated: new Date(),
        },
      });

      // Gửi phản hồi xác nhận kết nối
      await this.sendConnectResponse(espId, true);

      this.logger.log(` [CONNECT/CMD] ESP ${espId} - is_connect: ${isConnected}`);
    } catch (error) {
      this.logger.error(` Lỗi xử lý connect/cmd: ${error.message}`);
    }
  }

  /**
   * Xử lý dữ liệu sensor từ ESP8266 (Legacy - giữ để tương thích ngược)
   * Topic format: iot/sensor/{gardenId}
   * Message format: JSON { "temperature": 25.5, "airHumidity": 60.0, "soilMoisture": 45.0 }
   */
  private async handleSensorData(topic: string, message: string) {
    try {
      // Lấy gardenId từ topic (ví dụ: iot/sensor/1 -> gardenId = 1)
      const topicParts = topic.split('/');
      const gardenId = parseInt(topicParts[topicParts.length - 1]);

      if (isNaN(gardenId)) {
        this.logger.warn(` Không thể parse gardenId từ topic: ${topic}`);
        return;
      }

      // Parse JSON message
      const sensorData = JSON.parse(message);

      // Validate dữ liệu
      if (
        typeof sensorData.temperature !== 'number' ||
        typeof sensorData.airHumidity !== 'number' ||
        typeof sensorData.soilMoisture !== 'number'
      ) {
        this.logger.warn(` Dữ liệu sensor không hợp lệ từ garden ${gardenId}`);
        return;
      }

      // Lưu vào database
      await this.sensorService.createSensorReading({
        temperature: sensorData.temperature,
        airHumidity: sensorData.airHumidity,
        soilMoisture: sensorData.soilMoisture,
        gardenId: gardenId,
      });

      // Kiểm tra ngưỡng và tự động tưới nếu cần (chế độ AUTO)
      const alerts = await this.irrigationService.checkThresholdAndIrrigate(gardenId, {
        temperature: sensorData.temperature,
        airHumidity: sensorData.airHumidity,
        soilMoisture: sensorData.soilMoisture,
      });

      // Hiển thị dữ liệu sensor trên console với format đẹp
      this.displaySensorData(gardenId, sensorData, alerts);
    } catch (error) {
      this.logger.error(` Lỗi xử lý dữ liệu sensor: ${error.message}`);
    }
  }

  /**
   * Hiển thị dữ liệu sensor trên console với format đẹp
   */
  private displaySensorData(
    gardenId: number,
    sensorData: { temperature: number; airHumidity: number; soilMoisture: number },
    alerts: any[] = [],
  ) {
    const timestamp = new Date().toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    // Tạo format bảng đẹp
    const separator = '═'.repeat(60);
    const line = '─'.repeat(60);

    console.log('\n' + separator);
    console.log(` DỮ LIỆU CẢM BIẾN - VƯỜN #${gardenId}`);
    console.log(` Thời gian: ${timestamp}`);
    console.log(line);
    console.log(`  Nhiệt độ:        ${sensorData.temperature.toFixed(1)}°C`);
    console.log(` Độ ẩm không khí:  ${sensorData.airHumidity.toFixed(1)}%`);
    console.log(` Độ ẩm đất:        ${sensorData.soilMoisture.toFixed(1)}%`);
    
    // Hiển thị cảnh báo nếu có
    if (alerts.length > 0) {
      console.log(line);
      console.log(' CẢNH BÁO:');
      alerts.forEach((alert) => {
        console.log(`   ${alert.message}`);
      });
    }
    
    console.log(separator);
    console.log(' Đã lưu vào database\n');
  }

  /**
   * Xử lý feedback từ ESP8266 về trạng thái điều khiển
   */
  private async handleControlFeedback(topic: string, message: string) {
    try {
      const topicParts = topic.split('/');
      const gardenId = parseInt(topicParts[topicParts.length - 1]);
      const feedback = JSON.parse(message);

      this.logger.log(` Feedback từ garden ${gardenId}: ${JSON.stringify(feedback)}`);
      // Có thể thêm logic xử lý feedback ở đây nếu cần
    } catch (error) {
      this.logger.error(` Lỗi xử lý feedback: ${error.message}`);
    }
  }

  /**
   * 3. Gửi lệnh bật/tắt tưới thủ công (Server → ESP)
   * Topic format: gardens/esp_id/{on/off}
   * @param espId ID của ESP device
   * @param action "on" hoặc "off"
   */
  async sendGardenCommand(espId: string, action: 'on' | 'off'): Promise<void> {
    try {
      const topic = `gardens/${espId}/${action}`;
      const payload = action;

      this.client.publish(topic, payload, (error) => {
        if (error) {
          this.logger.error(` Lỗi gửi lệnh gardens đến ESP ${espId}: ${error.message}`);
        } else {
          this.logger.log(` Đã gửi lệnh gardens đến ESP ${espId}: ${action}`);
        }
      });
    } catch (error) {
      this.logger.error(` Lỗi gửi lệnh gardens: ${error.message}`);
    }
  }

  /**
   * 4. Gửi lệnh bật bơm trong thời gian xác định (Server → ESP)
   * Topic format: pump/esp_id/{time tưới}
   * @param espId ID của ESP device
   * @param duration Thời lượng tưới (giây)
   */
  async sendPumpCommand(espId: string, duration: number): Promise<void> {
    try {
      const topic = `pump/${espId}/${duration}`;
      const payload = duration.toString();

      this.client.publish(topic, payload, (error) => {
        if (error) {
          this.logger.error(` Lỗi gửi lệnh pump đến ESP ${espId}: ${error.message}`);
        } else {
          this.logger.log(` Đã gửi lệnh pump đến ESP ${espId}: ${duration} giây`);
        }
      });
    } catch (error) {
      this.logger.error(` Lỗi gửi lệnh pump: ${error.message}`);
    }
  }

  /**
   * 5. Gửi chu kỳ sinh trưởng (Server → ESP)
   * Topic format: bioCycle/esp_id/{bioCycle, time}
   * @param espId ID của ESP device
   * @param bioCycle Chu kỳ sinh trưởng (ví dụ: "seedling", "vegetative", "flowering", "fruiting")
   * @param time Thời gian (có thể là timestamp hoặc duration)
   */
  async sendBioCycle(espId: string, bioCycle: string, time?: number): Promise<void> {
    try {
      const topic = `bioCycle/${espId}/${bioCycle}`;
      const payload = JSON.stringify({
        bioCycle,
        time: time || Date.now(),
      });

      this.client.publish(topic, payload, (error) => {
        if (error) {
          this.logger.error(` Lỗi gửi bioCycle đến ESP ${espId}: ${error.message}`);
        } else {
          this.logger.log(` Đã gửi bioCycle đến ESP ${espId}: ${bioCycle}`);
        }
      });
    } catch (error) {
      this.logger.error(` Lỗi gửi bioCycle: ${error.message}`);
    }
  }

  /**
   * 7. Thêm lịch tưới vào ESP (Server → ESP)
   * Topic format: schedules/esp_id/add/{vị trí, year, month, day, hour, minute, second, time}
   * @param espId ID của ESP device
   * @param scheduleData Dữ liệu lịch tưới
   */
  async sendScheduleAdd(espId: string, scheduleData: {
    position: number;
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    second: number;
    duration: number; // time tưới (giây)
  }): Promise<void> {
    try {
      const { position, year, month, day, hour, minute, second, duration } = scheduleData;
      const topic = `schedules/${espId}/add/${position}`;
      const payload = JSON.stringify({
        year,
        month,
        day,
        hour,
        minute,
        second,
        time: duration,
      });

      this.client.publish(topic, payload, (error) => {
        if (error) {
          this.logger.error(` Lỗi gửi schedule/add đến ESP ${espId}: ${error.message}`);
        } else {
          this.logger.log(` Đã gửi schedule/add đến ESP ${espId}: position ${position}`);
        }
      });
    } catch (error) {
      this.logger.error(` Lỗi gửi schedule/add: ${error.message}`);
    }
  }

  /**
   * 8. Xóa lịch tưới trên ESP (Server → ESP)
   * Topic format: schedules/esp_id/delete/{vị trí}
   * @param espId ID của ESP device
   * @param position Vị trí lịch cần xóa
   */
  async sendScheduleDelete(espId: string, position: number): Promise<void> {
    try {
      const topic = `schedules/${espId}/delete/${position}`;
      const payload = position.toString();

      this.client.publish(topic, payload, (error) => {
        if (error) {
          this.logger.error(` Lỗi gửi schedule/delete đến ESP ${espId}: ${error.message}`);
        } else {
          this.logger.log(` Đã gửi schedule/delete đến ESP ${espId}: position ${position}`);
        }
      });
    } catch (error) {
      this.logger.error(` Lỗi gửi schedule/delete: ${error.message}`);
    }
  }

  /**
   * 10. Gửi phản hồi xác nhận kết nối (Server → ESP)
   * Topic format: connect/esp_id/response/{on}
   * @param espId ID của ESP device
   * @param connected true nếu kết nối thành công
   */
  async sendConnectResponse(espId: string, connected: boolean): Promise<void> {
    try {
      const status = connected ? 'on' : 'off';
      const topic = `connect/${espId}/response/${status}`;
      const payload = status;

      this.client.publish(topic, payload, (error) => {
        if (error) {
          this.logger.error(` Lỗi gửi connect/response đến ESP ${espId}: ${error.message}`);
        } else {
          this.logger.log(` Đã gửi connect/response đến ESP ${espId}: ${status}`);
        }
      });
    } catch (error) {
      this.logger.error(` Lỗi gửi connect/response: ${error.message}`);
    }
  }

  /**
   * 11. Đồng bộ thời gian thực cho ESP (Server → ESP)
   * Topic format: setRealTime/esp_id/{year, month, day, hour, minute, second}
   * @param espId ID của ESP device
   */
  async sendRealTime(espId: string): Promise<void> {
    try {
      const now = new Date();
      const topic = `setRealTime/${espId}`;
      const payload = JSON.stringify({
        year: now.getFullYear(),
        month: now.getMonth() + 1, // 1-12
        day: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds(),
      });

      this.client.publish(topic, payload, (error) => {
        if (error) {
          this.logger.error(` Lỗi gửi setRealTime đến ESP ${espId}: ${error.message}`);
        } else {
          this.logger.log(` Đã gửi setRealTime đến ESP ${espId}`);
        }
      });
    } catch (error) {
      this.logger.error(` Lỗi gửi setRealTime: ${error.message}`);
    }
  }

  /**
   * Gửi lệnh điều khiển tưới nước đến ESP8266 (Legacy - giữ để tương thích ngược)
   * @param gardenId ID của vườn
   * @param command Lệnh điều khiển: { "action": "start" | "stop", "duration"?: number }
   */
  async sendIrrigationCommand(gardenId: number, command: { action: 'start' | 'stop'; duration?: number }) {
    try {
      // Lấy espId từ gardenId
      const garden = await this.prisma.garden.findUnique({
        where: { id: gardenId },
      });

      if (!garden || !garden.espId || garden.espId === '-1') {
        this.logger.warn(` Vườn ${gardenId} chưa được kết nối với ESP device`);
        return;
      }

      // Sử dụng topic mới
      if (command.action === 'start') {
        if (command.duration) {
          await this.sendPumpCommand(garden.espId, command.duration);
        } else {
          await this.sendGardenCommand(garden.espId, 'on');
        }
      } else {
        await this.sendGardenCommand(garden.espId, 'off');
      }

      // Giữ lại topic cũ để tương thích ngược
      const legacyTopic = `iot/control/${gardenId}`;
      const payload = JSON.stringify(command);

      this.client.publish(legacyTopic, payload, (error) => {
        if (error) {
          this.logger.error(` Lỗi gửi lệnh đến garden ${gardenId}: ${error.message}`);
        } else {
          this.logger.log(` Đã gửi lệnh (legacy) đến garden ${gardenId}: ${payload}`);
        }
      });
    } catch (error) {
      this.logger.error(` Lỗi gửi lệnh điều khiển: ${error.message}`);
    }
  }

  /**
   * Publish message đến topic bất kỳ
   */
  publish(topic: string, payload: string): void {
    this.client.publish(topic, payload, (error) => {
      if (error) {
        this.logger.error(` Lỗi publish đến topic ${topic}: ${error.message}`);
      } else {
        this.logger.debug(` Đã publish đến topic ${topic}: ${payload}`);
      }
    });
  }

  /**
   * 10. Xử lý phản hồi kết nối từ ESP
   * Topic format: connect/esp_id/response/{on}
   */
  private handleConnectionResponse(topic: string, message: string) {
    try {
      const topicParts = topic.split('/');
      const espId = topicParts[1]; // connect/{espId}/response/{on}
      const responseValue = topicParts[3] || message; // on hoặc giá trị từ message

      const pendingCheck = this.pendingConnectionChecks.get(espId);
      if (pendingCheck) {
        // Clear timeout
        clearTimeout(pendingCheck.timeout);
        // Remove from map
        this.pendingConnectionChecks.delete(espId);
        // Resolve với status ON
        pendingCheck.resolve('ON');
        this.logger.log(` ESP ${espId} đã phản hồi - Status: ON`);
      } else {
        // Cập nhật trạng thái ESPDevice nếu không có pending check
        const isConnected = responseValue === 'on' || responseValue === '1' || responseValue === 'true';
        this.prisma.espDevice.upsert({
          where: { espId },
          update: {
            isConnected,
            lastUpdated: new Date(),
          },
          create: {
            espId,
            isConnected,
            lastUpdated: new Date(),
          },
        }).catch(err => {
          this.logger.error(` Lỗi cập nhật ESPDevice: ${err.message}`);
        });
      }
    } catch (error) {
      this.logger.error(` Lỗi xử lý phản hồi kết nối: ${error.message}`);
    }
  }

  /**
   * Kiểm tra kết nối ESP device
   * @param espId ID của ESP device
   * @returns Promise<'ON' | 'OFF'> - 'ON' nếu ESP phản hồi trong 3s, 'OFF' nếu không
   */
  async checkEspConnection(espId: string): Promise<'ON' | 'OFF'> {
    return new Promise((resolve, reject) => {
      // Kiểm tra nếu đã có pending check cho espId này
      const existingCheck = this.pendingConnectionChecks.get(espId);
      if (existingCheck) {
        clearTimeout(existingCheck.timeout);
        existingCheck.reject(new Error('Connection check cancelled - new check initiated'));
      }

      // Tạo timeout 3 giây
      const timeout = setTimeout(() => {
        this.pendingConnectionChecks.delete(espId);
        this.logger.warn(` ESP ${espId} không phản hồi sau 3s - Status: OFF`);
        resolve('OFF');
      }, 3000);

      // Lưu pending check
      this.pendingConnectionChecks.set(espId, {
        resolve: (status) => {
          clearTimeout(timeout);
          resolve(status);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timeout,
      });

      // Publish message để yêu cầu ESP kiểm tra kết nối
      // Format: connect/{espId}/cmd/{is_connect}
      const topic = `connect/${espId}/cmd/1`;
      const payload = JSON.stringify({ is_connect: 1 });
      
      this.client.publish(topic, payload, (error) => {
        if (error) {
          clearTimeout(timeout);
          this.pendingConnectionChecks.delete(espId);
          this.logger.error(` Lỗi gửi yêu cầu kiểm tra kết nối đến ESP ${espId}: ${error.message}`);
          reject(error);
        } else {
          this.logger.log(` Đã gửi yêu cầu kiểm tra kết nối đến ESP ${espId}`);
        }
      });
    });
  }

  /**
   * Kiểm tra trạng thái kết nối MQTT
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }
}
