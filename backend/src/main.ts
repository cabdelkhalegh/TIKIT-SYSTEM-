import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function initializeApplicationRuntime() {
  const nestApplication = await NestFactory.create(AppModule);
  const environmentConfigurator = nestApplication.get(ConfigService);
  
  nestApplication.setGlobalPrefix('api');
  
  nestApplication.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  
  nestApplication.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  
  const serverPort = environmentConfigurator.get<number>('PORT') || 3001;
  await nestApplication.listen(serverPort);
  
  console.log(`TIKIT System Backend initiated on port ${serverPort}`);
}

initializeApplicationRuntime();
