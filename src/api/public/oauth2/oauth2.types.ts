export interface TokenResponse {
  token_type: string;
  access_token: string;
  id_token?: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  scope?: string;
}

export interface ApplicationInfo {
  title: string;
  profile: string;
  mustAgree: Array<{ id: string; display: string }>;
  consentItems: Array<{ id: string; display: string }>;
}

export interface AuthorizationResponse {
  status: string;
  message: string;
}

export interface ConnectInfoResponse {
  code: string;
  username: string;
  client: {
    title: string;
    profile: string;
  };
  agreed: string;
}

export interface AccessTokenInfo {
  id: number;
  exp: number;
  app_id: string;
}

export interface UserInfoResponse {
  id: number;
  connected_at: string;
  debuggers_account: Record<string, string>;
}
