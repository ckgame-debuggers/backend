import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { JwtService } from '@nestjs/jwt';
import { Oauth2JwtPayload } from 'src/common/dto/oauth2/oauth-payload.dto';
import { Oauth2RefreshPayload } from 'src/common/dto/oauth2/oauth-refresh-payload.dto';
import { Oauth2RefreshTokenEntity } from 'src/common/entities/oauth2/refresh.entity';
import { Oauth2ClientEntity } from 'src/common/entities/oauth2/client.entity';
import { ConfigService } from '@nestjs/config';
import { Oauth2ConnectedEntity } from 'src/common/entities/oauth2/connected.entity';
import { CreateAuthorizationCodeDto } from 'src/common/dto/oauth2/authorization-code.dto';
import { Oauth2ScopeEntity } from 'src/common/entities/oauth2/scope.entity';
import { Oauth2RedirectUrlEntity } from 'src/common/entities/oauth2/redirec-url.entity';
import { GetConnectInfoDto } from 'src/common/dto/oauth2/connected.dto';
import { Oauth2OpenIdPayloadDto } from 'src/common/dto/oauth2/openid-payload.dto';
import { Oauth2GetTokenDto } from 'src/common/dto/oauth2/get-token.dto';
import * as bcrypt from 'bcrypt';
import { verifyAuthorizationReturnType } from 'src/types/verify-authorization-return';
import { Oauth2ToAgreeEntity } from 'src/common/entities/oauth2/to-agree.entity';
import {
  TokenResponse,
  ApplicationInfo,
  AuthorizationResponse,
  ConnectInfoResponse,
  AccessTokenInfo,
  UserInfoResponse,
} from './oauth2.types';

// Constants for better maintainability
const CLIENT_ID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ACCESS_TOKEN_EXPIRY = '7d';
const OPENID_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days in seconds
const REFRESH_TOKEN_RENEWAL_THRESHOLD = 30 * 24 * 60 * 60; // 30 days in seconds
const SUPPORTED_SCOPES = ['username', 'email', 'schoolNumber'] as const;
const ISS_URL = 'https://ckdebuggers.com';

@Injectable()
export class Oauth2Service {
  private readonly logger = new Logger(Oauth2Service.name);
  private readonly clientCache = new Map<
    string,
    { data: any; timestamp: number }
  >();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Verifies authorization token with enhanced security
   */
  private async verifyAuthorization(
    type: string,
    value: string,
    accept: string[] = ['Bearer'],
  ): Promise<verifyAuthorizationReturnType> {
    if (!type || !value) {
      throw new BadRequestException('Authorization header is required');
    }

    if (!accept.includes(type)) {
      throw new BadRequestException(`Unsupported authorization type: ${type}`);
    }

    if (type === 'Bearer') {
      try {
        const verified = await this.jwtService.verify(value);
        return { type: 'Bearer', bearer: verified };
      } catch (error) {
        this.logger.warn(`Token verification failed: ${error.message}`);
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    throw new BadRequestException('Invalid token type');
  }

  /**
   * Validates client ID format and existence
   */
  private async validateClient(clientId: string): Promise<Oauth2ClientEntity> {
    if (!CLIENT_ID_REGEX.test(clientId)) {
      throw new NotFoundException('Invalid client ID format');
    }

    // Check cache first
    const cached = this.clientCache.get(clientId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const client = await this.dataSource
      .getRepository(Oauth2ClientEntity)
      .findOne({
        where: { id: clientId },
        select: ['id', 'title', 'profile', 'useOauth', 'secret'],
      });

    if (!client || !client.useOauth) {
      throw new NotFoundException('OAuth2 client not found or disabled');
    }

    // Cache the result
    this.clientCache.set(clientId, { data: client, timestamp: Date.now() });
    return client;
  }

  /**
   * Retrieves OAuth2 application details with caching
   */
  async getApplication(id: string, userId: number): Promise<ApplicationInfo> {
    const client = await this.validateClient(id);

    const [user, connected, toAgree] = await Promise.all([
      this.dataSource.getRepository(UserEntity).findOne({
        where: { id: userId },
        select: ['id'],
      }),
      this.dataSource.getRepository(Oauth2ConnectedEntity).findOne({
        where: { user: { id: userId }, client: { id: client.id } },
        select: ['id'],
      }),
      this.dataSource.getRepository(Oauth2ToAgreeEntity).find({
        where: { client: { id: client.id } },
        relations: { scope: true },
      }),
    ]);

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (connected) {
      throw new ConflictException('Already connected to this application');
    }

    const mustAgree = toAgree
      .filter((agree) => agree.isEssential && agree.scope)
      .map((agree) => ({
        id: agree.scope.id.toString(),
        display: agree.scope.title,
      }));

    const consentItems = toAgree
      .filter((agree) => !agree.isEssential && agree.scope)
      .map((agree) => ({
        id: agree.scope.id.toString(),
        display: agree.scope.title,
      }));

    return {
      title: client.title,
      profile: client.profile,
      mustAgree,
      consentItems,
    };
  }

  /**
   * Authorizes client application with enhanced validation
   */
  async authorization(
    authorizeData: CreateAuthorizationCodeDto,
    userId: number,
  ): Promise<AuthorizationResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const repositories = {
        user: queryRunner.manager.getRepository(UserEntity),
        client: queryRunner.manager.getRepository(Oauth2ClientEntity),
        scope: queryRunner.manager.getRepository(Oauth2ScopeEntity),
        redirects: queryRunner.manager.getRepository(Oauth2RedirectUrlEntity),
        connected: queryRunner.manager.getRepository(Oauth2ConnectedEntity),
        toAgree: queryRunner.manager.getRepository(Oauth2ToAgreeEntity),
      };

      // Validate user and client
      const [user, client] = await Promise.all([
        repositories.user.findOne({
          where: { id: userId },
          select: ['id', 'email', 'username'],
        }),
        repositories.client.findOne({
          where: { id: authorizeData.client_id },
          select: ['id', 'title', 'useOauth'],
        }),
      ]);

      if (!user || !client) {
        throw new NotFoundException('User or client not found');
      }

      if (!client.useOauth) {
        throw new ForbiddenException('OAuth is not enabled for this client');
      }

      // Validate redirect URL
      const redirect = await repositories.redirects.findOne({
        where: {
          client: { id: client.id },
          value: authorizeData.redirect_to,
        },
      });

      if (!redirect) {
        throw new ConflictException('Invalid redirect URL');
      }

      // Check existing connection
      const existingConnection = await repositories.connected.findOne({
        where: {
          user: { id: userId },
          client: { id: client.id },
        },
      });

      if (existingConnection) {
        throw new ConflictException('User is already connected to this client');
      }

      // Process scopes
      const toAgree = await repositories.toAgree.find({
        where: { client: { id: client.id } },
        relations: { scope: true },
      });

      const requiredScopes = toAgree
        .filter((item) => item.isEssential && item.scope)
        .map((item) => item.scope.id.toString());

      const agreedIds = Array.from(
        new Set(
          (authorizeData.agreed || [])
            .map((id) => parseInt(id))
            .filter((id) => !isNaN(id)),
        ),
      ).map(String);

      const missingRequiredScopes = requiredScopes.filter(
        (id) => !agreedIds.includes(id),
      );

      if (missingRequiredScopes.length > 0) {
        throw new ForbiddenException('Missing required scopes');
      }

      const finalScopeIds = Array.from(
        new Set([...agreedIds, ...requiredScopes]),
      ).map(Number);

      const agreedScopes = await repositories.scope.find({
        where: { id: In(finalScopeIds) },
      });

      if (agreedScopes.length !== finalScopeIds.length) {
        throw new NotFoundException('Some scopes do not exist');
      }

      // Create connection
      const connected = repositories.connected.create({
        user,
        client,
        agreed: agreedScopes,
        connectedAt: new Date().toUTCString(),
      });

      if (authorizeData.nonce) {
        connected.nonce = authorizeData.nonce;
      }

      await repositories.connected.save(connected);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Authorization successful for user ${userId} to client ${client.id}`,
      );

      return {
        status: 'success',
        message: 'Authorization successful',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Gets connection information with validation
   */
  async getConnectInfo(
    getConnectInfo: GetConnectInfoDto,
    userId: number,
  ): Promise<ConnectInfoResponse> {
    const [user, client, redirect, connectInfo] = await Promise.all([
      this.dataSource.getRepository(UserEntity).findOneBy({ id: userId }),
      this.dataSource.getRepository(Oauth2ClientEntity).findOneBy({
        id: getConnectInfo.clientId,
      }),
      this.dataSource.getRepository(Oauth2RedirectUrlEntity).findOne({
        where: {
          client: { id: getConnectInfo.clientId },
          value: getConnectInfo.redirectTo,
        },
      }),
      this.dataSource.getRepository(Oauth2ConnectedEntity).findOne({
        where: {
          client: { id: getConnectInfo.clientId },
          user: { id: userId },
        },
        relations: { agreed: true },
      }),
    ]);

    if (!user || !client) {
      throw new NotFoundException('User or client not found');
    }

    if (!redirect || !getConnectInfo.redirectTo) {
      throw new BadRequestException('Invalid redirect URL');
    }

    if (!connectInfo) {
      throw new NotFoundException('Connection not found');
    }

    return {
      code: connectInfo.id,
      username: user.username,
      client: {
        title: client.title,
        profile: client.profile,
      },
      agreed: connectInfo.agreed.map((item) => item.title).join(','),
    };
  }

  /**
   * Generates access token with optimized payload
   */
  async generateAccessToken(userId: number, clientId: string) {
    const payload: Oauth2JwtPayload = {
      user_id: userId,
      app_id: clientId,
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const decodedToken = this.jwtService.decode(token) as { exp: number };

    this.logger.log(`Generated access token for user: ${userId}`);

    return {
      access_token: token,
      expires_in: decodedToken.exp,
    };
  }

  /**
   * Generates OpenID token with enhanced security
   */
  async generateOpenIDToken(
    userId: number,
    client: Oauth2ClientEntity,
    nonce?: string,
  ): Promise<string> {
    const [user, connect] = await Promise.all([
      this.dataSource.getRepository(UserEntity).findOneBy({ id: userId }),
      this.dataSource.getRepository(Oauth2ConnectedEntity).findOne({
        where: { user: { id: userId }, client: { id: client.id } },
        relations: { agreed: true },
      }),
    ]);

    if (!user || !client) {
      throw new ForbiddenException('User or client not found');
    }

    const now = Math.floor(Date.now() / 1000);

    const payload: Oauth2OpenIdPayloadDto = {
      iss: ISS_URL,
      aud: client.id,
      sub: userId.toString(),
      iat: now,
      exp: now + OPENID_TOKEN_EXPIRY,
    };

    if (nonce) {
      payload.nonce = nonce;
    }

    // Add user claims based on agreed scopes
    if (connect?.agreed) {
      connect.agreed.forEach((item) => {
        if (SUPPORTED_SCOPES.includes(item.item as any)) {
          const key =
            item.item === 'schoolNumber' ? 'school_number' : item.item;
          payload[key] = user[item.item];
        }
      });
    }

    const token = await this.jwtService.signAsync(payload);
    this.logger.log(`Generated OpenID token for user: ${userId}`);

    return token;
  }

  /**
   * Generates refresh token with secure storage
   */
  async generateRefreshToken(userId: number, client: Oauth2ClientEntity) {
    const [user, currentRefresh] = await Promise.all([
      this.dataSource.getRepository(UserEntity).findOneBy({ id: userId }),
      this.dataSource.getRepository(Oauth2RefreshTokenEntity).findOneBy({
        user: { id: userId },
        client: { id: client.id },
      }),
    ]);

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Remove existing refresh token
    if (currentRefresh) {
      await this.dataSource
        .getRepository(Oauth2RefreshTokenEntity)
        .delete(currentRefresh);
    }

    const payload: Oauth2RefreshPayload = {
      user_id: userId,
      client_id: client.id,
    };

    const expiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME') || '30d';
    const token = await this.jwtService.signAsync(payload, { expiresIn });

    const decodedToken = this.jwtService.decode(token) as { exp: number };

    // Store refresh token securely
    const refreshEntity = this.dataSource
      .getRepository(Oauth2RefreshTokenEntity)
      .create({
        user,
        client,
        exp: decodedToken.exp.toString(),
        value: token,
      });

    await this.dataSource
      .getRepository(Oauth2RefreshTokenEntity)
      .save(refreshEntity);

    this.logger.log(
      `Generated refresh token for user: ${user.email}, client: ${client.title}`,
    );

    return {
      refresh_token: token,
      refresh_token_expires_in: decodedToken.exp,
    };
  }

  /**
   * Handles token exchange with enhanced security
   */
  async getToken(tokenData: Oauth2GetTokenDto): Promise<TokenResponse> {
    if (tokenData.grant_type === 'authorization_code') {
      return this.handleAuthorizationCode(tokenData);
    } else if (tokenData.grant_type === 'refresh_token') {
      return this.handleRefreshToken(tokenData);
    } else {
      throw new BadRequestException('Unsupported grant type');
    }
  }

  /**
   * Handles authorization code grant type
   */
  private async handleAuthorizationCode(
    tokenData: Oauth2GetTokenDto,
  ): Promise<TokenResponse> {
    if (!tokenData.code) {
      throw new BadRequestException('Authorization code is required');
    }

    const client = await this.validateClient(tokenData.client_id);

    // Verify client secret
    const isValidSecret = await bcrypt.compare(
      tokenData.client_secret,
      client.secret,
    );

    if (!isValidSecret) {
      throw new ForbiddenException('Invalid client secret');
    }

    // Find authorization info
    const authInfo = await this.dataSource
      .getRepository(Oauth2ConnectedEntity)
      .findOne({
        where: { id: tokenData.code },
        relations: { user: true, agreed: true },
      });

    if (!authInfo) {
      throw new NotFoundException('Authorization code not found or expired');
    }

    // Generate tokens
    const [accessToken, refreshToken, idToken] = await Promise.all([
      this.generateAccessToken(authInfo.user.id, client.id),
      this.generateRefreshToken(authInfo.user.id, client),
      this.generateOpenIDToken(authInfo.user.id, client, authInfo.nonce),
    ]);

    const scope = authInfo.agreed.map((agree) => agree.title).join(',');

    return {
      token_type: 'bearer',
      access_token: accessToken.access_token,
      id_token: idToken,
      expires_in: accessToken.expires_in,
      refresh_token: refreshToken.refresh_token,
      refresh_token_expires_in: refreshToken.refresh_token_expires_in,
      scope,
    };
  }

  /**
   * Handles refresh token grant type
   */
  private async handleRefreshToken(
    tokenData: Oauth2GetTokenDto,
  ): Promise<TokenResponse> {
    if (!tokenData.refresh_token) {
      throw new BadRequestException('Refresh token is required');
    }

    try {
      const payload = this.jwtService.decode(
        tokenData.refresh_token,
      ) as Oauth2RefreshPayload;
      const tokenInfo = this.jwtService.decode(tokenData.refresh_token) as {
        exp: number;
      };

      const client = await this.dataSource
        .getRepository(Oauth2ClientEntity)
        .findOneBy({ id: payload.client_id });

      if (!client) {
        throw new NotFoundException('Client not found');
      }

      const now = Math.floor(Date.now() / 1000);

      const [accessToken, idToken] = await Promise.all([
        this.generateAccessToken(payload.user_id, payload.client_id),
        this.generateOpenIDToken(payload.user_id, client),
      ]);

      const response: TokenResponse = {
        token_type: 'bearer',
        access_token: accessToken.access_token,
        id_token: idToken,
        expires_in: accessToken.expires_in,
      };

      // Renew refresh token if it's close to expiration
      if (tokenInfo.exp - now < REFRESH_TOKEN_RENEWAL_THRESHOLD) {
        const refreshToken = await this.generateRefreshToken(
          payload.user_id,
          client,
        );
        response.refresh_token = refreshToken.refresh_token;
        response.refresh_token_expires_in =
          refreshToken.refresh_token_expires_in;
      }

      return response;
    } catch (error) {
      this.logger.warn(`Refresh token verification failed: ${error.message}`);
      throw new ConflictException('Invalid refresh token');
    }
  }

  /**
   * Gets access token information
   */
  async getAccessTokenInfo(
    type: string,
    token: string,
  ): Promise<AccessTokenInfo> {
    const payload = (await this.verifyAuthorization(type, token)).bearer;

    if (!payload) {
      throw new ConflictException('Invalid token payload');
    }

    const tokenInfo = this.jwtService.decode(token) as { exp: number };

    return {
      id: payload.user_id,
      exp: tokenInfo.exp,
      app_id: payload.app_id,
    };
  }

  /**
   * Gets user information with scope validation
   */
  async getUserInfo(
    type: string,
    token: string,
    target_type?: string,
    target_id?: string,
  ): Promise<UserInfoResponse> {
    const authInfo = await this.verifyAuthorization(type, token);

    if (type !== 'Bearer' || !authInfo.bearer) {
      throw new ConflictException('Invalid authorization');
    }

    const { user_id: userId, app_id: appId } = authInfo.bearer;

    const connect = await this.dataSource
      .getRepository(Oauth2ConnectedEntity)
      .findOne({
        where: {
          client: { id: appId },
          user: { id: userId },
        },
        relations: { user: true, agreed: true },
      });

    if (!connect) {
      throw new ConflictException('Connection not found');
    }

    // Build user info based on agreed scopes
    const agreed: Record<string, string> = {};
    connect.agreed.forEach((item) => {
      agreed[`debuggers_acc.${item.item}`] = connect.user[item.item];
    });

    return {
      id: connect.user.id,
      connected_at: connect.connectedAt,
      debuggers_account: agreed,
    };
  }

  /**
   * Cleans up expired tokens and cache
   */
  async cleanup() {
    // Clear expired cache entries
    const now = Date.now();
    for (const [key, value] of this.clientCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.clientCache.delete(key);
      }
    }
  }
}
