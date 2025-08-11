import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule, {
    logger: process.env.NODE_ENV === 'production' 
      ? ['error', 'warn', 'log'] 
      : ['error', 'warn', 'log', 'debug', 'verbose']
  });

  // Enhanced security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  
  // Compression for better performance
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024, // Only compress responses above 1KB
  }));

  // Enhanced CORS configuration for production
  app.enableCors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, postman, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS?.split(',') || ['https://battlebucks.com'])
        : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:5500'];
      
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24 hours
  });

  // Enhanced global validation pipe with detailed error handling
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: process.env.NODE_ENV === 'production',
      validationError: {
        target: false,
        value: false,
      },
      exceptionFactory: (errors) => {
        logger.warn(`Validation failed: ${JSON.stringify(errors.map(e => ({ field: e.property, errors: Object.values(e.constraints || {}) })))}`);
        return errors;
      }
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('BattleBucks API')
    .setDescription('Gaming Platform Store and Inventory System API')
    .setVersion('1.0.0')
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management operations')
    .addTag('Store', 'Store items and inventory management')
    .addTag('Purchases', 'Purchase management and order history')
    .addTag('Inventory', 'User inventory management and item usage')
    .addTag('Character Profiles', 'Character profiles and equipment management')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addServer('http://localhost:3000', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      tryItOutEnabled: true,
      requestInterceptor: (req) => {
        req.credentials = 'include';
        return req;
      },
    },
    customSiteTitle: 'BattleBucks API Documentation',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 BattleBucks API is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
}

bootstrap();