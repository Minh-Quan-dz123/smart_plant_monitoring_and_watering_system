import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IrrigationService } from './irrigation.service';
import { UpdateIrrigationModesDto } from './dto/updateIrrigationModes.dto';
import { StartIrrigationDto } from './dto/startIrrigation.dto';
import { AuthGuard } from 'src/auth/guard/guard';

@ApiTags('Irrigation')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('irrigation')
export class IrrigationController {
  constructor(private readonly irrigationService: IrrigationService) {}

  /**
   * Bắt đầu tưới nước thủ công (chế độ MANUAL)
   */
  @ApiOperation({ summary: 'Start manual irrigation for a garden' })
  @ApiOkResponse({ description: 'Irrigation started successfully' })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  @Post(':gardenId/start')
  async startIrrigation(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Body() dto: StartIrrigationDto,
    @Req() req,
  ) {
    await this.irrigationService.startIrrigation(gardenId, dto.duration);
    return { message: 'Đã bắt đầu tưới nước', gardenId, duration: dto.duration };
  }

  /**
   * Dừng tưới nước thủ công (chế độ MANUAL)
   */
  @ApiOperation({ summary: 'Stop manual irrigation for a garden' })
  @ApiOkResponse({ description: 'Irrigation stopped successfully' })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  @Post(':gardenId/stop')
  async stopIrrigation(@Param('gardenId', ParseIntPipe) gardenId: number, @Req() req) {
    await this.irrigationService.stopIrrigation(gardenId);
    return { message: 'Đã dừng tưới nước', gardenId };
  }

  /**
   * Cập nhật chế độ tưới cho vườn
   * Có thể bật/tắt từng chế độ độc lập: Auto và Schedule
   * Manual không cần cập nhật vì user tự bật/tắt thủ công
   */
  @ApiOperation({
    summary: 'Update irrigation modes for a garden',
    description: 'Có thể bật/tắt Auto và Schedule độc lập. Có thể bật cả 2 cùng lúc.',
  })
  @ApiOkResponse({ description: 'Irrigation modes updated successfully' })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  @ApiBadRequestResponse({ description: 'Invalid irrigation modes' })
  @Patch(':gardenId/modes')
  async updateIrrigationModes(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Body() dto: UpdateIrrigationModesDto,
    @Req() req,
  ) {
    await this.irrigationService.updateIrrigationModes(
      gardenId,
      {
        autoEnabled: dto.autoEnabled,
        scheduleEnabled: dto.scheduleEnabled,
      },
      req.user.id,
    );
    return {
      message: 'Đã cập nhật chế độ tưới',
      gardenId,
      autoEnabled: dto.autoEnabled,
      scheduleEnabled: dto.scheduleEnabled,
    };
  }

  /**
   * Lấy thông tin chế độ tưới hiện tại của vườn
   */
  @ApiOperation({ summary: 'Get current irrigation modes for a garden' })
  @ApiOkResponse({ description: 'Irrigation modes retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  @Get(':gardenId/modes')
  async getIrrigationModes(@Param('gardenId', ParseIntPipe) gardenId: number, @Req() req) {
    return this.irrigationService.getIrrigationModes(gardenId, req.user.id);
  }
}

