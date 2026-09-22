import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const durationMs = Date.now() - start;
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      // nao loga body nem headers (Authorization, x-device-key) - so o essencial pra debug
      this.logger.log(`${method} ${originalUrl} ${statusCode} - ${durationMs}ms - ${ip}`);
    });

    next();
  }
}
