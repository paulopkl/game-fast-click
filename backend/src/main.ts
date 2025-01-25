import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:4200', // Origem permitida (Angular)
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
    credentials: true, // Se você está usando cookies ou autenticação
  });

  await app.listen(process.env.API_PORT ?? 3000);
}

bootstrap();
