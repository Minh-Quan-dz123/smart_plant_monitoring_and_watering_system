import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GardenService } from './garden.service';
import { CreateGardenDto } from './dto/createGarden.dto';
import { GardenDto } from './dto/garden.dto';
import { AuthGuard } from 'src/auth/guard/guard';

@ApiTags('Garden')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('garden')
export class GardenController {
  constructor(private readonly gardenService: GardenService) {}

  //  Tạo vườn mới (thêm cây từ thư viện vào vườn)
  @ApiOperation({ summary: 'Create new garden' })
  @ApiCreatedResponse({
    description: 'Create garden successfully',
    type: GardenDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid plant or data' })
  @Post()
  async createGarden(@Body() dto: CreateGardenDto, @Req() req): Promise<GardenDto> {
    const userId = req.user.id;
    return this.gardenService.createGarden(dto, userId) as any as GardenDto;
  }

  //  Lấy danh sách vườn của user hiện tại
  @ApiOperation({ summary: 'Get all gardens of current user' })
  @ApiOkResponse({
    description: 'List of gardens retrieved successfully',
    type: [GardenDto],
  })
  @Get()
  async getUserGardens(@Req() req): Promise<GardenDto[]> {
    const userId = req.user.id;
    return this.gardenService.findUserGardens(userId) as any as GardenDto[];
  }

  //  Xóa vườn của user
  @ApiOperation({ summary: 'Delete garden by id' })
  @ApiOkResponse({ description: 'Delete successfully' })
  @ApiNotFoundResponse({ description: 'Garden not found or not owned by user' })
  @Delete(':id')
  async deleteGarden(@Param('id', ParseIntPipe) id: number, @Req() req) {
    const userId = req.user.id;
    const deleted = await this.gardenService.deleteGarden(id, userId);
    if (!deleted) throw new NotFoundException('Garden not found');
    return { message: 'Delete successfully' };
  }
}
