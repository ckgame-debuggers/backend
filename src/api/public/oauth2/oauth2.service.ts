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
    this.logger.debug(
      `Verifying authorization - Type: ${type}, Accept: ${accept.join(',')}`,
    );

    if (!type || !value) {
      this.logger.warn(
        'Authorization verification failed: Missing type or value',
      );
      throw new BadRequestException('Authorization header is required');
    }

    if (!accept.includes(type)) {
      this.logger.warn(
        `Authorization verification failed: Unsupported type ${type}`,
      );
      throw new BadRequestException(`Unsupported authorization type: ${type}`);
    }

    if (type === 'Bearer') {
      try {
        const verified = await this.jwtService.verify(value);
        this.logger.debug(
          `Bearer token verified successfully for user ${verified.user_id}`,
        );
        return { type: 'Bearer', bearer: verified };
      } catch (error) {
        this.logger.warn(`Token verification failed: ${error.message}`);
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    this.logger.warn(`Invalid token type: ${type}`);
    throw new BadRequestException('Invalid token type');
  }

  /**
   * Validates client ID format and existence
   */
  private async validateClient(clientId: string): Promise<Oauth2ClientEntity> {
    this.logger.debug(`Validating client ID: ${clientId}`);

    if (!CLIENT_ID_REGEX.test(clientId)) {
      this.logger.warn(`Invalid client ID format: ${clientId}`);
      throw new NotFoundException('Invalid client ID format');
    }

    // Check cache first
    const cached = this.clientCache.get(clientId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      this.logger.debug(`Client found in cache: ${clientId}`);
      return cached.data;
    }

    const client = await this.dataSource
      .getRepository(Oauth2ClientEntity)
      .findOne({
        where: { id: clientId },
        select: ['id', 'title', 'profile', 'useOauth', 'secret'],
      });

    if (!client || !client.useOauth) {
      this.logger.warn(`Client not found or OAuth disabled: ${clientId}`);
      throw new NotFoundException('OAuth2 client not found or disabled');
    }

    this.logger.debug(`Client validated and cached: ${clientId}`);
    // Cache the result
    this.clientCache.set(clientId, { data: client, timestamp: Date.now() });
    return client;
  }

  /**
   * Retrieves OAuth2 application details with caching
   */
  async getApplication(id: string, userId: number): Promise<ApplicationInfo> {
    this.logger.log(
      `Getting application info - Client ID: ${id}, User ID: ${userId}`,
    );

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
      this.logger.warn(`User not found: ${userId}`);
      throw new ForbiddenException('Authentication required');
    }

    if (connected) {
      this.logger.warn(`User ${userId} already connected to client ${id}`);
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

    this.logger.debug(
      `Application info retrieved - Must agree: ${mustAgree.length}, Consent items: ${consentItems.length}`,
    );

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
    this.logger.log(
      `Starting authorization process - User ID: ${userId}, Client ID: ${authorizeData.client_id}`,
    );

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
        this.logger.warn(
          `User or client not found - User: ${userId}, Client: ${authorizeData.client_id}`,
        );
        throw new NotFoundException('User or client not found');
      }

      if (!client.useOauth) {
        this.logger.warn(`OAuth disabled for client: ${client.id}`);
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
        this.logger.warn(`Invalid redirect URL: ${authorizeData.redirect_to}`);
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
        this.logger.warn(
          `User ${userId} already connected to client ${client.id}`,
        );
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

      this.logger.debug(
        `Processing scopes - Required: ${requiredScopes.join(',')}, Agreed: ${agreedIds.join(',')}`,
      );

      const missingRequiredScopes = requiredScopes.filter(
        (id) => !agreedIds.includes(id),
      );

      if (missingRequiredScopes.length > 0) {
        this.logger.warn(
          `Missing required scopes: ${missingRequiredScopes.join(',')}`,
        );
        throw new ForbiddenException('Missing required scopes');
      }

      const finalScopeIds = Array.from(
        new Set([...agreedIds, ...requiredScopes]),
      ).map(Number);

      const agreedScopes = await repositories.scope.find({
        where: { id: In(finalScopeIds) },
      });

      if (agreedScopes.length !== finalScopeIds.length) {
        this.logger.warn('Some scopes do not exist');
        throw new NotFoundException('Some scopes do not exist');
      }

      // Create connection
      const connected = repositories.connected.create({
        user,
        client,
        agreed: agreedScopes,
        connectedAt: new Date().toUTCString(),
      });

      await repositories.connected.save(connected);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Authorization successful - User: ${userId}, Client: ${client.id}, Scopes: ${agreedScopes.map((s) => s.title).join(',')}`,
      );

      return {
        status: 'success',
        message: 'Authorization successful',
      };
    } catch (error) {
      this.logger.error(`Authorization failed: ${error.message}`);
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
    this.logger.log(
      `Getting connection info - User: ${userId}, Client: ${getConnectInfo.clientId}`,
    );

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
      this.logger.warn(
        `User or client not found - User: ${userId}, Client: ${getConnectInfo.clientId}`,
      );
      throw new NotFoundException('User or client not found');
    }

    if (!redirect || !getConnectInfo.redirectTo) {
      this.logger.warn(`Invalid redirect URL: ${getConnectInfo.redirectTo}`);
      throw new BadRequestException('Invalid redirect URL');
    }

    if (!connectInfo) {
      this.logger.warn(
        `Connection not found - User: ${userId}, Client: ${getConnectInfo.clientId}`,
      );
      throw new NotFoundException('Connection not found');
    }

    this.logger.debug(
      `Connection info retrieved successfully - Code: ${connectInfo.id}`,
    );

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
    this.logger.debug(
      `Generating access token - User: ${userId}, Client: ${clientId}`,
    );

    const payload: Oauth2JwtPayload = {
      user_id: userId,
      app_id: clientId,
    };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });

    const decodedToken = this.jwtService.decode(token) as { exp: number };

    this.logger.log(
      `Access token generated - User: ${userId}, Expires: ${new Date(decodedToken.exp * 1000).toISOString()}`,
    );

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
  ): Promise<string> {
    this.logger.debug(
      `Generating OpenID token - User: ${userId}, Client: ${client.id}`,
    );

    const [user, connect] = await Promise.all([
      this.dataSource.getRepository(UserEntity).findOneBy({ id: userId }),
      this.dataSource.getRepository(Oauth2ConnectedEntity).findOne({
        where: { user: { id: userId }, client: { id: client.id } },
        relations: { agreed: true },
      }),
    ]);

    if (!user || !client) {
      this.logger.warn(
        `User or client not found - User: ${userId}, Client: ${client.id}`,
      );
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
    this.logger.log(
      `OpenID token generated - User: ${userId}, Expires: ${new Date(payload.exp * 1000).toISOString()}`,
    );

    return token;
  }

  /**
   * Generates refresh token with secure storage
   */
  async generateRefreshToken(userId: number, client: Oauth2ClientEntity) {
    this.logger.debug(
      `Generating refresh token - User: ${userId}, Client: ${client.id}`,
    );

    const [user, currentRefresh] = await Promise.all([
      this.dataSource.getRepository(UserEntity).findOneBy({ id: userId }),
      this.dataSource.getRepository(Oauth2RefreshTokenEntity).findOneBy({
        user: { id: userId },
        client: { id: client.id },
      }),
    ]);

    if (!user) {
      this.logger.warn(`User not found: ${userId}`);
      throw new ForbiddenException('User not found');
    }

    // Remove existing refresh token
    if (currentRefresh) {
      this.logger.debug(`Removing existing refresh token for user ${userId}`);
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
      `Refresh token generated - User: ${user.email}, Client: ${client.title}, Expires: ${new Date(decodedToken.exp * 1000).toISOString()}`,
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
    this.logger.log(
      `Processing token request - Grant Type: ${tokenData.grant_type}`,
    );

    if (tokenData.grant_type === 'authorization_code') {
      return this.handleAuthorizationCode(tokenData);
    } else if (tokenData.grant_type === 'refresh_token') {
      return this.handleRefreshToken(tokenData);
    } else {
      this.logger.warn(`Unsupported grant type: ${tokenData.grant_type}`);
      throw new BadRequestException('Unsupported grant type');
    }
  }

  /**
   * Handles authorization code grant type
   */
  private async handleAuthorizationCode(
    tokenData: Oauth2GetTokenDto,
  ): Promise<TokenResponse> {
    this.logger.debug(
      `Handling authorization code grant - Code: ${tokenData.code}`,
    );

    if (!tokenData.code) {
      this.logger.warn('Missing authorization code');
      throw new BadRequestException('Authorization code is required');
    }

    const client = await this.validateClient(tokenData.client_id);

    // Verify client secret
    const isValidSecret = await bcrypt.compare(
      tokenData.client_secret,
      client.secret,
    );

    if (!isValidSecret) {
      this.logger.warn(`Invalid client secret for client: ${client.id}`);
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
      this.logger.warn(`Authorization code not found: ${tokenData.code}`);
      throw new NotFoundException('Authorization code not found or expired');
    }

    // Generate tokens
    const [accessToken, refreshToken, idToken] = await Promise.all([
      this.generateAccessToken(authInfo.user.id, client.id),
      this.generateRefreshToken(authInfo.user.id, client),
      this.generateOpenIDToken(authInfo.user.id, client),
    ]);

    const scope = authInfo.agreed.map((agree) => agree.title).join(',');

    this.logger.log(
      `Authorization code exchange successful - User: ${authInfo.user.id}, Client: ${client.id}`,
    );

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
    this.logger.debug('Handling refresh token grant');

    if (!tokenData.refresh_token) {
      this.logger.warn('Missing refresh token');
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
        this.logger.warn(`Client not found: ${payload.client_id}`);
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
        this.logger.debug(`Renewing refresh token - User: ${payload.user_id}`);
        const refreshToken = await this.generateRefreshToken(
          payload.user_id,
          client,
        );
        response.refresh_token = refreshToken.refresh_token;
        response.refresh_token_expires_in =
          refreshToken.refresh_token_expires_in;
      }

      this.logger.log(
        `Refresh token exchange successful - User: ${payload.user_id}, Client: ${client.id}`,
      );

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
    this.logger.debug(`Getting access token info - Type: ${type}`);

    const payload = (await this.verifyAuthorization(type, token)).bearer;

    if (!payload) {
      this.logger.warn('Invalid token payload');
      throw new ConflictException('Invalid token payload');
    }

    const tokenInfo = this.jwtService.decode(token) as { exp: number };

    this.logger.debug(
      `Access token info retrieved - User: ${payload.user_id}, App: ${payload.app_id}`,
    );

    return {
      id: payload.user_id,
      exp: tokenInfo.exp,
      app_id: payload.app_id,
    };
  }

  /**
   * Gets user information with scope validation
   */
  async getUserInfo(type: string, token: string): Promise<UserInfoResponse> {
    this.logger.debug(`Getting user info - Type: ${type}`);

    const authInfo = await this.verifyAuthorization(type, token);

    if (type !== 'Bearer' || !authInfo.bearer) {
      this.logger.warn(`Invalid authorization type: ${type}`);
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
      this.logger.warn(
        `Connection not found - User: ${userId}, Client: ${appId}`,
      );
      throw new ConflictException('Connection not found');
    }

    // Build user info based on agreed scopes
    const agreed: Record<string, string> = {};
    connect.agreed.forEach((item) => {
      agreed[`debuggers_acc.${item.item}`] = connect.user[item.item];
    });

    this.logger.debug(
      `User info retrieved - User: ${userId}, Scopes: ${Object.keys(agreed).join(',')}`,
    );

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
    this.logger.debug('Starting cleanup process');
    // Clear expired cache entries
    const now = Date.now();
    let clearedCount = 0;
    for (const [key, value] of this.clientCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.clientCache.delete(key);
        clearedCount++;
      }
    }
    this.logger.log(`Cleanup completed - Cleared ${clearedCount} cached items`);
  }
}
