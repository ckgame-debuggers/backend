export interface JwtPayload {
  id: number;
  username: string;
  email: string;
  schoolNumber: string;
  color: string;
  profile?: string;
}
