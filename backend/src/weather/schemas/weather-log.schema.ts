import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class WeatherLog extends Document {
  @Prop({ required: true })
  timestamp: string;

  @Prop({ type: Object, required: true })
  location: {
    latitude: number;
    longitude: number;
  };

  @Prop({ type: Object, required: true })
  current: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    weather_code: number;
  };

  @Prop({ type: Object })
  forecast: {
    temperatures: number[];
    humidity: number[];
    precipitation_probability: number[];
  };
}

export const WeatherLogSchema = SchemaFactory.createForClass(WeatherLog);

