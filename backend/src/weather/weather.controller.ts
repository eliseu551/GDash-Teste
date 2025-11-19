import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { WeatherService } from './weather.service';
import { CreateWeatherLogDto } from './dto/create-weather-log.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Post('logs')
  async create(@Body() createWeatherLogDto: CreateWeatherLogDto) {
    return this.weatherService.create(createWeatherLogDto);
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    const skipNum = skip ? parseInt(skip, 10) : 0;
    return this.weatherService.findAll(limitNum, skipNum);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats() {
    return this.weatherService.getStats();
  }

  @Get('insights')
  @UseGuards(JwtAuthGuard)
  async getInsights() {
    const insight = await this.weatherService.generateInsights();
    return { insight };
  }

  @Get('export.csv')
  @UseGuards(JwtAuthGuard)
  async exportCSV(@Res() res: Response) {
    const csv = await this.weatherService.exportToCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=weather-data.csv');
    res.send(csv);
  }

  @Get('export.xlsx')
  @UseGuards(JwtAuthGuard)
  async exportXLSX(@Res() res: Response) {
    const buffer = await this.weatherService.exportToXLSX();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=weather-data.xlsx');
    res.send(buffer);
  }
}

