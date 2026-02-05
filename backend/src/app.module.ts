import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthenticationModule } from './authentication/authentication.module';

const configurationGuardianSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET_KEY: Joi.string().min(32).required(),
  JWT_EXPIRATION_TIME: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRATION: Joi.string().required(),
  PORT: Joi.number().default(3001),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validationSchema: configurationGuardianSchema,
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    DatabaseModule,
    AuthenticationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
