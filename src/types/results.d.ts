type ResultType<T = any> = {
  status: 'success' | 'failed' | 'in-progress';
  message: string;
  data?: T;
  error?: string;
  timestamp: Date;
};
