import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import * as express from "express";
import helmet from "helmet";

import { AppModule } from "./app.module";
import { PrismaService } from "./database/prisma/prisma.service";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(cookieParser());

  // Stripe needs the exact raw bytes to verify webhook signatures — register
  // this BEFORE the JSON body parser so it only applies to that one path.
  app.use("/v1/billing/webhook", express.raw({ type: "application/json" }));

  app.enableCors({
    origin: configService.get("APP_URL"),
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // Swagger UI — https://swagger.io/tools/swagger-ui/ — served at /docs,
  // disabled in production to avoid exposing the full route surface publicly.
  if (configService.get("NODE_ENV") !== "production") {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("VittamHub API")
        .setDescription("Verified digital identity and discovery platform for startups and investors.")
        .setVersion("1.0")
        .addCookieAuth("vh_session")
        .addTag("auth")
        .addTag("startups")
        .addTag("investors")
        .addTag("connections")
        .addTag("discovery")
        .addTag("notifications")
        .addTag("media")
        .addTag("admin")
        .build(),
    );
    SwaggerModule.setup("docs", app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = configService.get("PORT", 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`VittamHub API listening on :${port} (docs at /docs)`);
}

bootstrap();
