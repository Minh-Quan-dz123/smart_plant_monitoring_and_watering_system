// mqtt.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { SensorService } from 'src/sensor/sensor.service';
import { IrrigationService } from 'src/irrigation/irrigation.service';

@Injectable()
export class MqttService implements OnModuleInit {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient;

  constructor(
    private sensorService: SensorService,
    private irrigationService: IrrigationService,
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
      this.client.subscribe('#', (err) => {
        if (err) {
          this.logger.error(` Lỗi subscribe topic: ${err.message}`);
        } else {
          this.logger.log(' Đã subscribe tất cả topics (#) - để test');
        }
      });
      
      // Subscribe các topic từ ESP8266
      // Format: iot/sensor/{gardenId} - ESP8266 sẽ gửi dữ liệu với topic này
      // Ví dụ: iot/sensor/1, iot/sensor/2, etc.
      this.client.subscribe('iot/sensor/+', (err) => {
        if (err) {
          this.logger.error(` Lỗi subscribe topic: ${err.message}`);
        } else {
          this.logger.log(' Đã subscribe topic: iot/sensor/+');
        }
      });

      // Subscribe topic để nhận lệnh điều khiển tưới nước
      this.client.subscribe('iot/control/+', (err) => {
        if (err) {
          this.logger.error(` Lỗi subscribe topic: ${err.message}`);
        } else {
          this.logger.log(' Đã subscribe topic: iot/control/+');
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

        // Xử lý dữ liệu sensor từ ESP8266
        if (topic.startsWith('iot/sensor/')) {
          await this.handleSensorData(topic, messageStr);
        }
        // Xử lý feedback từ ESP8266 về trạng thái điều khiển
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
   * Xử lý dữ liệu sensor từ ESP8266
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
    console.log(`📊 DỮ LIỆU CẢM BIẾN - VƯỜN #${gardenId}`);
    console.log(`⏰ Thời gian: ${timestamp}`);
    console.log(line);
    console.log(`🌡️  Nhiệt độ:        ${sensorData.temperature.toFixed(1)}°C`);
    console.log(`💧 Độ ẩm không khí:  ${sensorData.airHumidity.toFixed(1)}%`);
    console.log(`🌱 Độ ẩm đất:        ${sensorData.soilMoisture.toFixed(1)}%`);
    
    // Hiển thị cảnh báo nếu có
    if (alerts.length > 0) {
      console.log(line);
      console.log('🚨 CẢNH BÁO:');
      alerts.forEach((alert) => {
        console.log(`   ${alert.message}`);
      });
    }
    
    console.log(separator);
    console.log('✅ Đã lưu vào database\n');
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
   * Gửi lệnh điều khiển tưới nước đến ESP8266
   * @param gardenId ID của vườn
   * @param command Lệnh điều khiển: { "action": "start" | "stop", "duration"?: number }
   */
  async sendIrrigationCommand(gardenId: number, command: { action: 'start' | 'stop'; duration?: number }) {
    try {
      const topic = `iot/control/${gardenId}`;
      const payload = JSON.stringify(command);

      this.client.publish(topic, payload, (error) => {
        if (error) {
          this.logger.error(` Lỗi gửi lệnh đến garden ${gardenId}: ${error.message}`);
        } else {
          this.logger.log(` Đã gửi lệnh đến garden ${gardenId}: ${payload}`);
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
   * Kiểm tra trạng thái kết nối MQTT
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }
}
