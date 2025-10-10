// mqtt.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttService implements OnModuleInit {
  private client: mqtt.MqttClient;

  onModuleInit() {
    this.client = mqtt.connect({
      host: '6dbb453c749b4a2a9f84d544ee9cad40.s1.eu.hivemq.cloud',
      port: 8883,
      protocol: 'mqtts',
      username: 'sang2004',
      password: 'Sang01032004',
    });

    this.client.on('connect', () => {
      console.log('✅ Connected to HiveMQ!');
      this.client.subscribe('iot/sensor/temperature');
    });

    this.client.on('message', (topic, message) => {
      console.log(`📩 [${topic}]: ${message.toString()}`);
    });
  }

  publish(topic: string, payload: string) {
    this.client.publish(topic, payload);
  }
}
