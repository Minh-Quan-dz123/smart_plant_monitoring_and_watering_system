import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateGardenDto } from './dto/createGarden.dto';
import { MqttService } from '../../mqtt/mqtt.service';

@Injectable()
export class GardenService {
  private readonly logger = new Logger(GardenService.name);

  constructor(
    private prisma: PrismaService,
    private mqttService: MqttService,
  ) {}

  //tạo vườn mới cho user
  async createGarden(createGardenDto: CreateGardenDto, userId: number) {
    const { name, plantId } = createGardenDto;

    //  Kiểm tra cây có tồn tại không
    const plant = await this.prisma.plant.findUnique({
      where: { id: plantId },
    });
    if (!plant) throw new BadRequestException('Cây không tồn tại trong thư viện.');

    // Đảm bảo ESPDevice placeholder với espId = "-1" tồn tại
    const placeholderEsp = await this.prisma.espDevice.findUnique({
      where: { espId: "-1" },
    });

    if (!placeholderEsp) {
      // Tạo ESPDevice placeholder nếu chưa có
      await this.prisma.espDevice.create({
        data: {
          espId: "-1",
          temperature: null,
          airHumidity: null,
          soilMoisture: null,
        },
      });
    }

    // Tạo vườn với espId mặc định là "-1" (chưa kết nối ESP device)
    return this.prisma.garden.create({ //tạo vườn
      data: {
        name,
        userId,
        plantId,
        espId: "-1", // Mặc định chưa kết nối ESP device
      },
      include: { 
        plant: true,
        espDevice: true,
      },
    });
  }

  // Cập nhật ESP device cho vườn
  async updateEspDevice(gardenId: number, espId: string, userId: number) {
    // Không cho phép cập nhật về "-1" (chỉ dùng khi tạo mới)
    if (espId === "-1") {
      throw new BadRequestException('Không thể cập nhật espId về "-1". Đây là giá trị mặc định cho vườn chưa kết nối.');
    }

    // Kiểm tra vườn có tồn tại và thuộc về user không
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!garden) {
      throw new BadRequestException('Vườn không tồn tại');
    }

    if (garden.userId !== userId) {
      throw new BadRequestException('Không có quyền cập nhật vườn này');
    }

    // Kiểm tra ESP device có tồn tại không
    const espDevice = await this.prisma.espDevice.findUnique({
      where: { espId },
      include: { gardens: true },
    });

    if (!espDevice) {
      throw new BadRequestException(`ESP device với ID ${espId} không tồn tại. Vui lòng tạo ESP device trước.`);
    }

    // Kiểm tra ESP device đã được gán cho vườn khác chưa (chỉ áp dụng cho ESPDevice thực tế, không phải "-1")
    if (espId !== "-1") {
      const existingGarden = await this.prisma.garden.findFirst({
        where: { 
          espId: espId,
          id: { not: gardenId }, // Loại trừ vườn hiện tại
        },
      });

      if (existingGarden) {
        throw new BadRequestException(`ESP device ${espId} đã được gán cho vườn khác.`);
      }
    }

    // Kiểm tra kết nối ESP trước khi cập nhật
    let connectionStatus: 'ON' | 'OFF' = 'OFF';
    try {
      connectionStatus = await this.mqttService.checkEspConnection(espId);
    } catch (error) {
      this.logger.warn(` Lỗi kiểm tra kết nối ESP ${espId}: ${error.message}`);
      connectionStatus = 'OFF';
    }

    // Cập nhật trạng thái kết nối vào ESPDevice
    const isConnected = connectionStatus === 'ON';
    await this.prisma.espDevice.update({
      where: { espId },
      data: { isConnected },
    });

    // Cập nhật espId cho vườn
    const updatedGarden = await this.prisma.garden.update({
      where: { id: gardenId },
      data: { espId },
      include: {
        plant: true,
        espDevice: true,
      },
    });

    // Trả về kết quả kèm connection status
    return {
      ...updatedGarden,
      connectionStatus,
    } as any;
  }

  //lấy danh sách vườn của user
  async findUserGardens(userId: number) {
    return this.prisma.garden.findMany({
      where: { userId },
      include: { plant: true },
    });
  }

    // Xóa vườn (chỉ chủ vườn được xóa)
  async deleteGarden(id: number, userId: number) {
    const garden = await this.prisma.garden.findUnique({ where: { id } });
    if (!garden) throw new BadRequestException('Vườn không tồn tại');
    if (garden.userId !== userId) throw new BadRequestException('Không có quyền xóa vườn này');

    return this.prisma.garden.delete({ where: { id } });
  }
}
