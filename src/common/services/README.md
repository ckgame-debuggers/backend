# Refresh Token Cleanup Scheduler

이 서비스는 30분마다 만료된 리프레시 토큰을 자동으로 삭제하는 스케줄러입니다.

## 기능

- **자동 정리**: 30분마다 만료된 리프레시 토큰을 자동으로 삭제
- **배치 처리**: 대량의 토큰을 효율적으로 처리하기 위한 배치 처리
- **로깅**: 정리 작업 결과를 로그로 기록
- **수동 정리**: API를 통한 수동 정리 기능
- **모니터링**: 만료된 토큰 개수 확인 기능

## 설정

### 스케줄 설정

`src/common/configs/scheduler.config.ts`에서 스케줄을 조정할 수 있습니다:

```typescript
export const SCHEDULER_CONFIG = {
  REFRESH_TOKEN_CLEANUP: {
    // 30분마다 실행
    cron: '0 */30 * * * *',
    // 매시간 실행: '0 0 * * * *'
    // 매일 자정 실행: '0 0 0 * * *'
  },
  BATCH_SIZE: 1000, // 배치 크기
} as const;
```

### Cron 표현식

- `0 */30 * * * *`: 30분마다
- `0 0 * * * *`: 매시간
- `0 0 0 * * *`: 매일 자정
- `0 0 */6 * * *`: 6시간마다

## API 엔드포인트

### 수동 정리

```http
POST /scheduler/cleanup-refresh-tokens
```

### 만료된 토큰 개수 확인

```http
GET /scheduler/expired-tokens-count
```

## 로그

스케줄러는 다음과 같은 로그를 출력합니다:

- **정상 정리**: `Cleaned up X expired refresh tokens at YYYY-MM-DDTHH:mm:ss.sssZ`
- **정리할 토큰 없음**: `No expired refresh tokens found to clean up`
- **에러**: `Failed to cleanup expired refresh tokens`

## 성능 최적화

1. **배치 처리**: 대량의 토큰을 1000개씩 나누어 처리
2. **배치 간 대기**: 데이터베이스 부하 방지를 위해 100ms 대기
3. **조건부 실행**: 만료된 토큰이 없으면 즉시 종료

## 모니터링

애플리케이션 로그에서 다음을 확인할 수 있습니다:

- 정리 작업 실행 시간
- 삭제된 토큰 개수
- 에러 발생 여부

## 문제 해결

### 스케줄러가 실행되지 않는 경우

1. `@nestjs/schedule` 패키지가 설치되어 있는지 확인
2. `SchedulerModule`이 `AppModule`에 import되어 있는지 확인
3. 애플리케이션 로그에서 에러 메시지 확인

### 데이터베이스 성능 문제

1. `BATCH_SIZE`를 줄여서 배치 크기 조정
2. 배치 간 대기 시간을 늘려서 데이터베이스 부하 감소
3. 인덱스 확인: `exp` 컬럼에 인덱스가 있는지 확인
