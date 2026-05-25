import { LoggerService, Injectable, LogLevel } from '@nestjs/common';

@Injectable()
export class CustomLogger implements LoggerService {
  private context?: string;

  log(message: any, context?: string) {
    this.printMessage(message, 'LOG', context);
  }

  error(message: any, trace?: string, context?: string) {
    this.printMessage(message, 'ERROR', context);
    if (trace) {
      console.error(trace);
    }
  }

  warn(message: any, context?: string) {
    this.printMessage(message, 'WARN', context);
  }

  debug(message: any, context?: string) {
    this.printMessage(message, 'DEBUG', context);
  }

  verbose(message: any, context?: string) {
    this.printMessage(message, 'VERBOSE', context);
  }

  private printMessage(message: any, level: string, context?: string) {
    const timestamp = new Date().toISOString();
    const ctx = context || this.context || 'Application';
    
    
    console.log(`[${timestamp}] [${level}] [${ctx}] ${message}`);
  }
}