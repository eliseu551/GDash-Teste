import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  app.enableCors({
    origin: ['http://localhost:5173', 'http://frontend:5173'],
    credentials: true,
  });

  const usersService = app.get(UsersService);
  await usersService.createDefaultUser();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API rodando na porta ${port}`);
}

bootstrap();

