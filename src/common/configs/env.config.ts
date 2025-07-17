import { Injectable, Logger } from '@nestjs/common';

/**
 * Environment variables validation configuration
 * Validates all required environment variables on application startup
 */
@Injectable()
export class EnvConfigService {
  private readonly logger = new Logger(EnvConfigService.name);

  /**
   * Required environment variables for the application
   */
  private readonly requiredEnvVars = {
    // JWT Configuration
    JWT_SECRET: 'JWT secret key for token signing',
    JWT_ACCESS_EXPIRES_IN: 'JWT access token expiration time',
    JWT_REFRESH_EXPIRATION_TIME: 'JWT refresh token expiration time',

    // Database Configuration
    DATABASE_URL: 'Database host URL',
    DATABASE_PORT: 'Database port number',
    DATABASE_NAME: 'Database name',
    DATABASE_USER: 'Database username',
    DATABASE_PASSWORD: 'Database password',

    // Mail Configuration
    MAIL_HOST: 'SMTP host server',
    MAIL_PORT: 'SMTP port number',
    MAIL_USER: 'SMTP username',
    MAIL_PASS: 'SMTP password',
    MAIL_FROM: 'SMTP from email address',

    // Application Configuration
    FRONT_URL: 'Frontend URL for CORS and email links',
    PORT: 'Application port number',
  } as const;

  /**
   * Optional environment variables with default values
   */
  private readonly optionalEnvVars = {
    NODE_ENV: 'development',
    PORT: '8080',
  } as const;

  /**
   * Validates all required environment variables
   * @throws Error if any required environment variable is missing
   */
  validateEnvironment(): void {
    this.logger.log('Validating environment variables...');

    const missingVars: string[] = [];

    // Check required environment variables
    for (const [key, description] of Object.entries(this.requiredEnvVars)) {
      const value = process.env[key];
      if (!value || value.trim() === '') {
        missingVars.push(`${key} (${description})`);
      }
    }

    if (missingVars.length > 0) {
      const errorMessage = `Missing required environment variables:\n${missingVars.map((v) => `  - ${v}`).join('\n')}\n\nPlease check your .env file and ensure all required variables are set.`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    // Log successful validation
    this.logger.log(
      '✅ All required environment variables are properly configured',
    );

    // Log environment info
    this.logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    this.logger.log(`Port: ${process.env.PORT || '8080'}`);
    this.logger.log(
      `Database: ${process.env.DATABASE_NAME}@${process.env.DATABASE_URL}:${process.env.DATABASE_PORT}`,
    );
    this.logger.log(`Frontend URL: ${process.env.FRONT_URL}`);
  }

  /**
   * Gets environment variable with validation
   * @param key Environment variable key
   * @param defaultValue Optional default value
   * @returns Environment variable value
   */
  get(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (!value && defaultValue === undefined) {
      throw new Error(`Environment variable ${key} is required but not set`);
    }
    return value || defaultValue!;
  }

  /**
   * Gets environment variable as number
   * @param key Environment variable key
   * @param defaultValue Optional default value
   * @returns Environment variable value as number
   */
  getNumber(key: string, defaultValue?: number): number {
    const value = this.get(key, defaultValue?.toString());
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      throw new Error(
        `Environment variable ${key} must be a valid number, got: ${value}`,
      );
    }
    return num;
  }

  /**
   * Gets environment variable as boolean
   * @param key Environment variable key
   * @param defaultValue Optional default value
   * @returns Environment variable value as boolean
   */
  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = this.get(key, defaultValue?.toString());
    return value.toLowerCase() === 'true';
  }
}
