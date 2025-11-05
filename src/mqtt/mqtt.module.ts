import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { SensorModule } from 'src/sensor/sensor.module';

@Module({
  imports: [SensorModule],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}

