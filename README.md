[Engish](./documents/readme/README-EN.md)

<div align="center">

# 프로젝트 디버거즈

<b>많은 기능들이 아직 개선이 필요합니다. 해당 레포지토리의 내용은 언제든 변경될 수 있습니다.</b>

</div>

# 프로젝트 스택

- Nest.js
- TypeORM
- Postgres

# 로컬 기기에서 실행하기

## 요구 사항

- Node.js ^21.6 (Recommend)
- pnpm

## 설치

1. 프로젝트를 클론합니다.

```cmd
$ git clone https://github.com/odin-store/native.git
```

2. pnpm을 통해 필요 패키지를 설치합니다.

```cmd
$ pnpm install
```

3. `env.sample`를 복사해 `.env`에 필요한 환경 변수들을 모두 설정합니다.

```bash
cp env.sample .env
```

`.env` 파일을 전부 당신의 환경에 맞는 값으로 설정해 주세요. 프로그램 실행 이전 환경 변수를 자동으로 검증할 것입니다.

**필요한 환경 변수 목록:**

- **JWT 설정n**: `JWT_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRATION_TIME`
- **데이터베이스 설정**: `DATABASE_URL`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`
- **메일 설정**: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`
- **애플리케이션 설정**: `FRONT_URL`, `PORT`

**.env 파일 예시:**

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

CLOUDFLARE_ID=your-cloudflare-id
CLOUDFLARE_SECRET=your-cloudflare-secret
```

## 실행하기

당신의 애플리케이션은 아래 명령어로 실행 가능합니다.

```cmd
$ pnpm start
```
