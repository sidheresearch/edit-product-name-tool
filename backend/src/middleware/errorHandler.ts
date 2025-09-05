import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);

  // Default error
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = error.message;
  } else if (error.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Development environment - send stack trace
  const response: any = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
    response.error = error.message;
  }

  res.status(statusCode).json(response);
};
