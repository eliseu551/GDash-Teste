import { IsNotEmpty, IsObject, IsNumber, IsArray, IsString } from 'class-validator';

export class CreateWeatherLogDto {
  @IsNotEmpty()
  @IsString()
  timestamp: string;

  @IsNotEmpty()
  @IsObject()
  location: {
    latitude: number;
    longitude: number;
  };

  @IsNotEmpty()
  @IsObject()
  current: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    weather_code: number;
  };

  @IsObject()
  forecast?: {
    temperatures: number[];
    humidity: number[];
    precipitation_probability: number[];
  };
}

