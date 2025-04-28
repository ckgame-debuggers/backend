import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import RegisterDto from 'src/common/dto/auth/register.dto';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import LoginDto from 'src/common/dto/auth/login.dto';
import { JwtPayload } from 'src/common/dto/auth/jwt-payload.dto';
import { RefreshEntity } from 'src/common/entities/user/refresh.entity';
import { RefreshDto } from 'src/common/dto/auth/refresh.dto';
import { EmailCertEntity } from 'src/common/entities/user/email-cert.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Registers a new user with the provided registerDto.
   * @param registerDto Contains the user's information.
   * @returns The result of the registration
   */
  async registerUser(
    registerDto: RegisterDto,
  ): Promise<ResultType<UserEntity>> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const certRepository = this.dataSource.getRepository(EmailCertEntity);

    if (!registerDto.email.endsWith('@chungkang.academy')) {
      throw new ConflictException('Email must end with @chungkang.academy.');
    }

    const emailPrefix = registerDto.email.split('@')[0];
    if (!/^[0-9]{9}$/.test(emailPrefix)) {
      throw new ConflictException('School number must be 9 characters.');
    }

    const certInfo = await certRepository.findBy({
      email: registerDto.email,
      value: registerDto.certCode,
    });
    if (!certInfo || certInfo.length === 0) {
      throw new ConflictException('Invalid certification code.');
    }
    const allCertTries = await certRepository.findBy({
      email: registerDto.email,
    });
    await certRepository.remove(allCertTries);
    const oldUser = await userRepository.findOneBy({
      email: registerDto.email,
    });
    if (oldUser) {
      throw new ConflictException('This email is already registered.');
    }

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    const generated = userRepository.create({
      email: registerDto.email,
      username: registerDto.username,
      password: hashedPassword,
      fullname: registerDto.fullname,
      schoolNumber: registerDto.email.split('@')[0],
    });
    await userRepository.save(generated);
    this.logger.log(`Created new user with : ${registerDto.email}`);
    return {
      status: 'success',
      message: `New account created with username : ${generated.username}.`,
      data: generated,
      timestamp: new Date(),
    };
  }

  /**
   * Find user with user's id
   * @param userId id of user to find
   * @returns found user data
   */
  async getUserWithId(userId: number): Promise<ResultType<UserEntity>> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const foundUser = await userRepository.findOneBy({ id: userId });
    if (!foundUser) {
      throw new NotFoundException(`User not found with id : ${userId}`);
    }
    return {
      status: 'success',
      message: `Successfully found user with id : ${userId}`,
      data: foundUser,
      timestamp: new Date(),
    };
  }

  /**
   * Validate the user's login credentials.
   * @param loginDto The login data provided by the user
   * @returns The user if the login data is correct
   */
  async validateUser(loginDto: LoginDto): Promise<ResultType<UserEntity>> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const user = await userRepository.findOneBy({
      email: loginDto.email,
    });
    if (!user) {
      throw new NotFoundException(
        `User not found with email : ${loginDto.email}`,
      );
    }

    const validatePassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!validatePassword) {
      throw new UnauthorizedException('Password not matched');
    }

    return {
      status: 'success',
      message: `successfully validated with user data : ${loginDto.email}`,
      data: user,
      timestamp: new Date(),
    };
  }

  /**
   * Generate a new access token for the user
   * @param user The data of the requesting user
   * @returns A new access token
   */
  async generateAccessToken(user: UserEntity): Promise<ResultType<string>> {
    const payload: JwtPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      schoolNumber: user.schoolNumber,
    };
    const newToken = await this.jwtService.signAsync(payload);
    this.logger.log(`Generated new access token for user : ${user.email}`);
    return {
      status: 'success',
      message: `Successfully generated new access token for user : ${user.email}`,
      data: newToken,
      timestamp: new Date(),
    };
  }

  /**
   * Get user from payload of jwt token.
   * @param paylaod payload of jwt token
   * @returns data of current user.
   */
  async getTokenUser(paylaod: JwtPayload): Promise<ResultType<UserEntity>> {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const user = await userRepository.findOneBy({
      id: paylaod.id,
    });
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }
    return {
      status: 'success',
      message: 'Successfully get user data from payload',
      data: user,
      timestamp: new Date(),
    };
  }

  /**
   * Generate new refresh token for the user
   * @param user The data of the requesting user
   * @param loginDto The data of the current request
   * @returns new refresh token
   */
  async generateRefreshToken(
    user: UserEntity,
    loginDto: LoginDto,
  ): Promise<ResultType<string>> {
    const refreshRepository = this.dataSource.getRepository(RefreshEntity);
    const existingTokens = await refreshRepository.find({
      where: {
        user: { id: user.id },
        deviceName: loginDto.deviceName,
      },
    });

    let similarToken: RefreshEntity | undefined;

    if (loginDto.location === 'undefined') {
      similarToken = existingTokens.find(
        (token) => token.location === 'undefined',
      );
    } else {
      const isLocationSimilar = (loc1: string, loc2: string) => {
        const [lat1, lon1] = loc1.split(' ').map(Number);
        const [lat2, lon2] = loc2.split(' ').map(Number);
        const distance = Math.sqrt(
          Math.pow(lat1 - lat2, 2) + Math.pow(lon1 - lon2, 2),
        );
        return distance < 0.01;
      };

      similarToken = existingTokens.find((token) =>
        isLocationSimilar(token.location, loginDto.location),
      );
    }

    if (similarToken && similarToken.exp && similarToken.exp > new Date()) {
      this.logger.log(`Using existing refresh token for use r : ${user.email}`);
      return {
        status: 'success',
        message: `Using existing refresh token for user : ${user.email}`,
        data: similarToken.value,
        timestamp: new Date(),
      };
    }

    const payload: { id: number } = { id: user.id };
    const expiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION_TIME',
    );
    const newToken = await this.jwtService.signAsync(payload, { expiresIn });
    this.logger.log(`Generated new refresh token for user : ${user.email}`);

    const currentDate = new Date();
    const currentRefreshTokenExp = new Date(
      currentDate.getTime() +
        parseInt(
          this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME') || '',
        ),
    );
    const generated = refreshRepository.create({
      value: newToken,
      deviceName: loginDto.deviceName,
      exp: currentRefreshTokenExp,
      location: loginDto.location,
      user: user,
    });

    await refreshRepository.save(generated);
    this.logger.log(
      `Successfully saved new refresh token for user : ${user.email}`,
    );

    return {
      status: 'success',
      message: `Successfully generated new token for user : ${user.email}`,
      data: newToken,
      timestamp: new Date(),
    };
  }

  /**
   * refresh user login info.
   */
  async refresh(refreshDto: RefreshDto): Promise<
    ResultType<{
      accessToken: string;
    }>
  > {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const refreshRepository = this.dataSource.getRepository(RefreshEntity);

    const token = refreshDto.refreshToken;
    let decoded: { id: number };
    try {
      decoded = this.jwtService.verify(token);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      this.logger.error('Refresh token verification failed: Token expired');
      throw new UnauthorizedException('Refresh token has expired');
    }

    const userId = decoded.id;
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new ConflictException(`User not found with id : ${userId}`);
    }
    const refreshData = await refreshRepository.findOneBy({
      user: user,
      value: token,
    });
    if (!refreshData) {
      throw new UnauthorizedException('Could not found current token data.');
    }

    // Check token expiration
    if (refreshData.exp && refreshData.exp < new Date()) {
      await refreshRepository.remove(refreshData);
      this.logger.error(`Refresh token expired for user: ${user.email}`);
      throw new UnauthorizedException('Refresh token has expired');
    }

    const accessToken = (await this.generateAccessToken(user)).data || '';
    this.logger.log(`Refreshed user's token for user : ${user.email}`);

    return {
      status: 'success',
      message: `Successfully refreshed login data for user : ${user.email}`,
      data: {
        accessToken,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Remove current refresh token.
   * @param refreshId Id of refresh token to remove
   */
  async removeRefreshToken(refreshId: number) {
    const refreshRepository = this.dataSource.getRepository(RefreshEntity);
    const currentRefreshToken = await refreshRepository.findOneBy({
      id: refreshId,
    });
    if (currentRefreshToken) {
      await refreshRepository.remove(currentRefreshToken);
    }
  }

  async getPrivacyInfo(userId: number) {
    const userRepository = this.dataSource.getRepository(UserEntity);
    const found = await userRepository.findOneBy({
      id: userId,
    });
    if (!found) {
      throw new NotFoundException('User not found.');
    }
    return {
      tel: found.tel,
      fullName: found.fullname,
    };
  }
}
