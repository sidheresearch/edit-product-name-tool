import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const { method, url, ip } = req;
  
  // Log request
  console.log(`🔵 ${method} ${url} - ${ip} - ${new Date().toISOString()}`);

  // Override res.end to log response
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Color based on status code
    const statusColor = statusCode >= 400 ? '🔴' : statusCode >= 300 ? '🟡' : '🟢';
    
    console.log(`${statusColor} ${method} ${url} - ${statusCode} - ${duration}ms`);
    
    return originalEnd(chunk, encoding, cb);
  };

  next();
};
