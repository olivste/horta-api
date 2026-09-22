import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Horta API')
    .setDescription(
      'API da horta automatizada: login do usuario unico, cadastro de devices (ESP32) e ingestao/consulta de telemetria.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(undefined, 'jwt') // usado nas rotas do dashboard
    .addApiKey({ type: 'apiKey', name: 'x-device-key', in: 'header' }, 'device-key') // usado pelo ESP
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Horta API rodando em http://localhost:${port}/api`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs em http://localhost:${port}/api/docs`);
}
bootstrap();
