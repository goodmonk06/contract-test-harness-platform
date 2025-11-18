import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessLogicException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        error: 'Business Logic Error',
        details,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ResourceNotFoundException extends HttpException {
  constructor(resource: string, identifier: string) {
    super(
      {
        message: `${resource} with identifier '${identifier}' not found`,
        error: 'Not Found',
        resource,
        identifier,
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ValidationException extends HttpException {
  constructor(errors: Record<string, string[]>) {
    super(
      {
        message: 'Validation failed',
        error: 'Validation Error',
        details: errors,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ConflictException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        message,
        error: 'Conflict',
        details,
      },
      HttpStatus.CONFLICT,
    );
  }
}
