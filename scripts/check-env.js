#!/usr/bin/env node

/**
 * Environment variables validation script
 * Run this script before building to ensure all required environment variables are set
 */

// Required environment variables
const requiredEnvVars = {
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
};

// Validate environment variables
function validateEnvironment() {
  console.log('🔍 Validating environment variables...');

  const missingVars = [];

  for (const [key, description] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    if (!value || value.trim() === '') {
      missingVars.push(`${key} (${description})`);
    }
  }

  if (missingVars.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missingVars.forEach((v) => console.error(`  - ${v}`));
    console.error(
      '\nPlease ensure all required environment variables are set.',
    );
    process.exit(1);
  }

  console.log('✅ All required environment variables are properly configured');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Port: ${process.env.PORT || '8080'}`);
  console.log(
    `Database: ${process.env.DATABASE_NAME}@${process.env.DATABASE_URL}:${process.env.DATABASE_PORT}`,
  );
  console.log(`Frontend URL: ${process.env.FRONT_URL}`);
}

// Main execution
try {
  validateEnvironment();
} catch (error) {
  console.error('Error during environment validation:', error.message);
  process.exit(1);
}
