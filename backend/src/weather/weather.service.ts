import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WeatherLog } from './schemas/weather-log.schema';
import { CreateWeatherLogDto } from './dto/create-weather-log.dto';
import * as ExcelJS from 'exceljs';
import OpenAI from 'openai';

@Injectable()
export class WeatherService {
  private openai: OpenAI;

  constructor(
    @InjectModel(WeatherLog.name) private weatherLogModel: Model<WeatherLog>,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  async create(createWeatherLogDto: CreateWeatherLogDto): Promise<WeatherLog> {
    const createdLog = new this.weatherLogModel(createWeatherLogDto);
    return createdLog.save();
  }

  async findAll(limit = 100, skip = 0): Promise<WeatherLog[]> {
    return this.weatherLogModel
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  async findById(id: string): Promise<WeatherLog> {
    return this.weatherLogModel.findById(id).exec();
  }

  async getStats() {
    const logs = await this.weatherLogModel.find().exec();
    
    if (logs.length === 0) {
      return {
        averageTemperature: 0,
        averageHumidity: 0,
        averageWindSpeed: 0,
        totalRecords: 0,
      };
    }

    const temps = logs.map(l => l.current.temperature).filter(t => t != null);
    const humidity = logs.map(l => l.current.humidity).filter(h => h != null);
    const windSpeed = logs.map(l => l.current.wind_speed).filter(w => w != null);

    return {
      averageTemperature: temps.reduce((a, b) => a + b, 0) / temps.length,
      averageHumidity: humidity.reduce((a, b) => a + b, 0) / humidity.length,
      averageWindSpeed: windSpeed.reduce((a, b) => a + b, 0) / windSpeed.length,
      totalRecords: logs.length,
    };
  }

  async generateInsights(): Promise<string> {
    const logs = await this.findAll(50);
    
    if (logs.length === 0) {
      return 'Não há dados suficientes para gerar insights.';
    }

    const stats = await this.getStats();
    const recentLogs = logs.slice(0, 10);
    
    const temperatures = recentLogs.map(l => l.current.temperature);
    const trend = temperatures[0] > temperatures[temperatures.length - 1] ? 'subindo' : 'descendo';
    
    const avgTemp = stats.averageTemperature;
    const avgHumidity = stats.averageHumidity;
    
    let comfortScore = 100;
    if (avgTemp > 30) comfortScore -= 20;
    if (avgTemp < 15) comfortScore -= 20;
    if (avgHumidity > 80) comfortScore -= 15;
    if (avgHumidity < 30) comfortScore -= 15;

    const insights = {
      temperaturaMedia: avgTemp.toFixed(1),
      umidadeMedia: avgHumidity.toFixed(1),
      tendencia: trend,
      pontuacaoConforto: Math.max(0, Math.min(100, comfortScore)),
      totalRegistros: stats.totalRecords,
    };

    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `Com base nos seguintes dados climáticos, gere um insight breve e útil em português brasileiro:
- Temperatura média: ${insights.temperaturaMedia}°C
- Umidade média: ${insights.umidadeMedia}%
- Tendência: ${insights.tendencia}
- Pontuação de conforto: ${insights.pontuacaoConforto}/100
- Total de registros: ${insights.totalRegistros}

Gere um texto curto (2-3 frases) com insights práticos sobre o clima.`;

        const completion = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
        });

        return completion.choices[0].message.content || this.getDefaultInsight(insights);
      } catch (error) {
        console.error('Erro ao gerar insight com IA:', error);
        return this.getDefaultInsight(insights);
      }
    }

    return this.getDefaultInsight(insights);
  }

  private getDefaultInsight(insights: any): string {
    const comfortLevel = insights.pontuacaoConforto >= 70 ? 'agradável' : 
                        insights.pontuacaoConforto >= 50 ? 'moderado' : 'desconfortável';
    
    return `Nos últimos registros, a temperatura média foi de ${insights.temperaturaMedia}°C com umidade de ${insights.umidadeMedia}%. A tendência está ${insights.tendencia}. O clima está ${comfortLevel} (${insights.pontuacaoConforto}/100).`;
  }

  async exportToCSV(): Promise<string> {
    const logs = await this.findAll(1000);
    
    const headers = ['Data/Hora', 'Latitude', 'Longitude', 'Temperatura (°C)', 'Umidade (%)', 'Velocidade do Vento (km/h)', 'Código do Clima'];
    const rows = logs.map(log => [
      log.timestamp,
      log.location.latitude,
      log.location.longitude,
      log.current.temperature,
      log.current.humidity,
      log.current.wind_speed,
      log.current.weather_code,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    return csvContent;
  }

  async exportToXLSX(): Promise<Buffer> {
    const logs = await this.findAll(1000);
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Dados Climáticos');

    worksheet.columns = [
      { header: 'Data/Hora', key: 'timestamp', width: 25 },
      { header: 'Latitude', key: 'latitude', width: 12 },
      { header: 'Longitude', key: 'longitude', width: 12 },
      { header: 'Temperatura (°C)', key: 'temperature', width: 18 },
      { header: 'Umidade (%)', key: 'humidity', width: 15 },
      { header: 'Velocidade do Vento (km/h)', key: 'windSpeed', width: 25 },
      { header: 'Código do Clima', key: 'weatherCode', width: 15 },
    ];

    logs.forEach(log => {
      worksheet.addRow({
        timestamp: log.timestamp,
        latitude: log.location.latitude,
        longitude: log.location.longitude,
        temperature: log.current.temperature,
        humidity: log.current.humidity,
        windSpeed: log.current.wind_speed,
        weatherCode: log.current.weather_code,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

