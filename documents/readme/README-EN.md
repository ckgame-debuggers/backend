[Engish](./documents/readme/README-EN.md)

<div align="center">

# Project Debuggers

<b>Many things still need to be implemented, and many things will change.<b/>

</div>

# Project Stack

- Nest.js
- TypeORM
- Postgres

# Running on your machine

## Requirements

- Node.js ^21.6 (Recommend)
- pnpm

## Installation

1. Clone the project

```cmd
$ git clone https://github.com/odin-store/native.git
```

2. Install packages via pnpm

```cmd
$ pnpm install
```

3. Copy `env.sample` to `.env` and configure your environment variables.

```bash
cp env.sample .env
```

Then edit `.env` file with your actual values. All required environment variables are validated on application startup.

**Required Environment Variables:**

- **JWT Configuration**: `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRATION_TIME`
- **Database Configuration**: `DATABASE_URL`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`
- **Mail Configuration**: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`
- **Application Configuration**: `FRONT_URL`, `PORT`

**Example .env file:**

```env
NODE_ENV=development
PORT=8080
FRONT_URL=http://localhost:3000

JWT_SECRET=your-super-secret-jwt-key-here
JWT_ACCESS_EXPIRES_IN=7d
JWT_REFRESH_EXPIRATION_TIME=30d

DATABASE_URL=localhost
DATABASE_PORT=5432
DATABASE_NAME=debuggers_db
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASS=your-app-password
MAIL_FROM=your-email@gmail.com
```

## Start your own client

Enter the command below to start your client.

```cmd
$ pnpm start
```
