import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const app = await NestFactory.create(AppModule, { cors: false });
    
    // Security headers
    app.use(helmet());

    const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
    app.enableCors({
      origin: origins.length ? origins : [/^http:\/\/localhost:\d+$/],
      credentials: true
    });
    const port = process.env.PORT ? Number(process.env.PORT) : 4000;
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.listen(port);
    // eslint-disable-next-line no-console
    console.log(`Backend listening on http://localhost:${port}`);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Backend failed to start', e);
  }
}

bootstrap();
