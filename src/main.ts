import 'dotenv/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

// Application
import { AppModule } from './app.module.js';
import { RedisIoAdapter } from './adapters/redis-io.adapter.js';

// Session
import session from 'express-session';
import MongoStore from 'connect-mongo';

// Sentry
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { SentryFilter } from './sentry.filter.js';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Asset Links for CORS origins
// @ts-ignore, required for jest
import assetLinks from '../assetlinks.json' with { type: 'json' };

/**
 * Extract trusted web origins from assetlinks.json for CORS
 */
function getOriginsFromAssetLinks(): string[] {
  const webOrigins = assetLinks
    .filter((entry: any) => entry.target?.namespace === 'web' && entry.target?.site)
    .map((entry: any) => entry.target.site);
  return [...new Set(webOrigins)]; // dedupe
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'debug', 'log', 'verbose'],
  });
  const config = app.get<ConfigService>(ConfigService);

  const isSentryEnabled =
    config.get('sentry') || typeof process.env.SENTRY_DNS !== 'undefined';
  if (isSentryEnabled) {
    Sentry.init({
      dsn: process.env.SENTRY_DNS,
      integrations: [nodeProfilingIntegration()],
      // Performance Monitoring
      tracesSampleRate: 1.0,
      // Set sampling rate for profiling - this is relative to tracesSampleRate
      profilesSampleRate: 1.0,
    });
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new SentryFilter(httpAdapter));
  }
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Liquid Auth API')
    .setDescription('Authentication API')
    .setVersion('1.0')
    .addCookieAuth('connect.sid')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);
  const username = config.get('database.username');
  const host = config.get('database.host');
  const password = config.get('database.password');
  const name = config.get('database.name');
  const isAtlas = config.get('database.atlas');
  const uri = `mongodb${
    isAtlas ? '+srv' : ''
  }://${username}:${password}@${host}/${name}?authSource=admin&retryWrites=true&w=majority`;

  const store = MongoStore.create({
    mongoUrl: uri,
    ttl: 20000,
  });

  const sessionHandler = session({
    secret: config.get('session.secret'),
    // TODO: optimize session
    saveUninitialized: true,
    resave: true,
    cookie: {
      httpOnly: true,
      secure: config.get('session.secure'),
    },
    store,
  });
  app.use(sessionHandler);

  // Get origins from assetlinks.json (trusted web origins)
  const origins = getOriginsFromAssetLinks();

  if (origins.length === 0) {
    origins.push('http://localhost', 'http://localhost:3000');
  }

  console.log('CORS allowed origins:', origins);

  // Enable CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (origins.includes(origin)) {
        // Return the specific origin (required when credentials: true)
        callback(null, origin);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'User-Agent'],
  });
  
  const redisIoAdapter = new RedisIoAdapter(app, sessionHandler);
  await redisIoAdapter.connectToRedis(config);

  app.useWebSocketAdapter(redisIoAdapter as any);

  await app.listen(process.env.PORT || 3000);
}

await bootstrap();
