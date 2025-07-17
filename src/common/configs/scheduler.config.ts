export const SCHEDULER_CONFIG = {
  // 리프레시 토큰 정리 스케줄 설정
  REFRESH_TOKEN_CLEANUP: {
    // 30분마다 실행 (CronExpression.EVERY_30_MINUTES)
    cron: '0 */30 * * * *',
    // 또는 매시간 실행하려면: '0 0 * * * *'
    // 또는 매일 자정에 실행하려면: '0 0 0 * * *'
  },

  // 로그 레벨 설정
  LOG_LEVEL: {
    CLEANUP: 'info', // cleanup 작업 로그 레벨
    ERROR: 'error', // 에러 로그 레벨
  },

  // 배치 크기 설정 (대량의 토큰이 있을 때를 대비)
  BATCH_SIZE: 1000,
} as const;
