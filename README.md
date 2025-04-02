[Engish](./documents/readme/README-EN.md)

<div align="center">

# 프로젝트 디버거즈

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

3. Rename .env.sample to .env.development.

All values in .env.sample are example values. Please modify them according to your environment.

```env
#JWT
JWT_SECRET=
JWT_ACCESS_EXPIRES_IN=20000
JWT_REFRESH_EXPIRATION_TIME=2592000000
JWT_REFRESH_SECRET=

#Database
DATABASE_URL=
DATABASE_PASSWORD=
DATABASE_NAME=
DATABASE_USER=

#MAIL
MAIL_USER=
MAIL_PASS=

#Portone
PORTONE_API_SECRET=
```

> You can get your portone api info from [here](https://portone.io/)

## Start your own client

Enter the command below to start your client.

```cmd
$ pnpm start
```
