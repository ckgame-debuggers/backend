import { Oauth2JwtPayload } from 'src/common/dto/oauth2/oauth-payload.dto';

type verifyAuthorizationReturnType = {
  type: string;
  bearer?: Oauth2JwtPayload;
  debuggersAK?: {
    app_id: string;
  };
};
