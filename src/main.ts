import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerConfig } from './swagger.config';
import { CustomValidationPipe } from '@utils/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new CustomValidationPipe());

  SwaggerConfig.setup(app);

  await app.listen(3000);
}

bootstrap();
