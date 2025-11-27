import {
  Controller,
  Get,
  Param,
  Req,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LogService } from './log.service';
import { AuthGuard } from 'src/auth/guard/guard';
import { PrismaService } from 'src/prisma/prisma.service';

@ApiTags('Log')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('log')
export class LogController {
  constructor(
    private readonly logService: LogService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Lấy tất cả logs của một vườn
   */
  @ApiOperation({ summary: 'Get all irrigation logs for a garden' })
  @ApiOkResponse({ description: 'Logs retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng log tối đa (mặc định: 50)' })
  @Get('garden/:gardenId')
  async getLogsByGarden(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Query('limit') limit?: number,
    @Req() req? : any,
  ) {
    // Kiểm tra user có quyền xem vườn này không
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!garden) {
      throw new NotFoundException('Vườn không tồn tại');
    }

    if (garden.userId !== req.user.id) {
      throw new ForbiddenException('Bạn không có quyền xem logs của vườn này');
    }

    return this.logService.getLogsByGarden(gardenId, limit ? parseInt(limit.toString()) : 50);
  }

  /**
   * Lấy tất cả logs của user (tất cả vườn)
   */
  @ApiOperation({ summary: 'Get all irrigation logs for current user' })
  @ApiOkResponse({ description: 'Logs retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng log tối đa (mặc định: 100)' })
  @Get('user/all')
  async getUserLogs(
    @Query('limit') limit?: number,
    @Req() req?: any,
  ) {
    return this.logService.getUserLogs(req.user.id, limit ? parseInt(limit.toString()) : 100);
  }

  /**
   * Lấy log theo ID
   */
  @ApiOperation({ summary: 'Get irrigation log by id' })
  @ApiOkResponse({ description: 'Log retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Log not found' })
  @Get(':id')
  async getLogById(
    @Param('id', ParseIntPipe) id: number,
    @Req() req?: any,
  ) {
    const log = await this.logService.getLogById(id);
    
    // Kiểm tra user có quyền xem log này không
    if (log.garden.userId !== req.user.id) {
      throw new ForbiddenException('Bạn không có quyền xem log này');
    }

    return log;
  }

  /**
   * Xóa log
   */
  @ApiOperation({ summary: 'Delete irrigation log by id' })
  @ApiOkResponse({ description: 'Log deleted successfully' })
  @ApiNotFoundResponse({ description: 'Log not found' })
  @Delete(':id')
  async deleteLog(
    @Param('id', ParseIntPipe) id: number,
    @Req() req?: any,
  ) {
    const log = await this.logService.getLogById(id);
    
    // Kiểm tra user có quyền xóa log này không
    if (log.garden.userId !== req.user.id) {
      throw new ForbiddenException('Bạn không có quyền xóa log này');
    }

    return this.logService.deleteLog(id);
  }
}

