import { Module } from '@nestjs/common';
import { SensorService } from './sensor.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SensorService],
  exports: [SensorService],
})
export class SensorModule {}
