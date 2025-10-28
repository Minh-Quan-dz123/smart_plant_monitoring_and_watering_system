import { Controller, Body, Delete, Get, Param, Post, Put, NotFoundException, UseGuards, Req } from '@nestjs/common';
import { PlantService } from './plant.service';
import { CreatePlantDto } from './dto/createPlant.dto';
import { UpdatePlantDto } from './dto/updatePlant.dto';
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiOperation,
    ApiTags,
    ApiForbiddenResponse, 
    ApiConflictResponse,  
} from '@nestjs/swagger';

import { PlantDto } from './dto/plant.dto';
import { PositiveIntPipe } from 'src/pipes/CheckId.pipe'; 
import { Roles } from 'src/decorator/decorator';
import { Role } from 'src/role/role.enum';
import { RolesAuthGuard } from 'src/auth/guard/role.guard';

@ApiTags('Plant') 
@Controller('plants') 
export class PlantController {
    constructor(private readonly plantService: PlantService) {}
    
    @ApiOperation({ summary: 'Create a new Plant in the library (Admin only)' })
    @ApiCreatedResponse({ description: 'Plant successfully created', type: PlantDto })
    @ApiForbiddenResponse({ description: 'Forbidden access (Requires Admin role)' })
    @ApiConflictResponse({ description: 'Plant name already exists' })
    @Post()
    @Roles(Role.ADMIN) // 🔥 chỉ admin mới tạo được plant
    async createPlant(
    @Body() createPlantDto: CreatePlantDto,
    @Body() 
    @Req() req,
    ): Promise<any> {
    const adminId = req.user.id;
    return this.plantService.create(createPlantDto, adminId); 
      }

    @ApiOperation({ summary: 'List all Plants in the library' })
    @ApiOkResponse({
        description: 'List of Plants retrieved successfully',
        type: [PlantDto],
    })
    @Get()
    async findAllPlants(): Promise<PlantDto[]> {
        return this.plantService.findAll();
    }

    @ApiOperation({ summary: 'Find Plant by ID' })
    @ApiOkResponse({ description: 'Plant found by ID', type: PlantDto })
    @ApiNotFoundResponse({ description: 'Plant not found' })
    @Get('/:id')
    async findPlantById(
        @Param('id', PositiveIntPipe) id: number,
    ): Promise<PlantDto> {
        return this.plantService.findOne(id);
    }

    
    @ApiOperation({ summary: 'Update Plant by ID (Admin only)' })
    @ApiOkResponse({ description: 'Plant successfully updated', type: PlantDto })
    @ApiNotFoundResponse({ description: 'Plant not found' })
    @ApiForbiddenResponse({ description: 'Forbidden access (Requires Admin role)' })
    @Put('/:id')
    @UseGuards(RolesAuthGuard)
    @Roles(Role.ADMIN)
    async updatePlantById(
        @Param('id', PositiveIntPipe) id: number,
        @Body() updatePlantDto: UpdatePlantDto,
    ): Promise<PlantDto> {
        return this.plantService.update(id, updatePlantDto);
    }

    @ApiOperation({ summary: 'Delete Plant by ID (Admin only)' })
    @ApiOkResponse({ description: 'Plant successfully deleted', type: Object })
    @ApiNotFoundResponse({ description: 'Plant not found' })
    @ApiForbiddenResponse({ description: 'Forbidden access (Requires Admin role)' })
    @Delete('/:id')
    @UseGuards(RolesAuthGuard)
    @Roles(Role.ADMIN)  
    async deletePlantById(@Param('id', PositiveIntPipe) id: number): Promise<{ message: string }> {
        const deleted = await this.plantService.deleteUserById(id);
        if (!deleted) {
            throw new NotFoundException('Plant not found');
        }
        return { message: 'Delete successfully' };
    }
}