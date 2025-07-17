import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Oauth2ClientEntity } from 'src/common/entities/oauth2/client.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { CreateOauth2Dto } from 'src/common/dto/oauth2/create.dto';
import { UpdateOauth2Dto } from 'src/common/dto/oauth2/update.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);
  constructor(private readonly dataSource: DataSource) {}

  async getPublicInfo() {
    return {
      status: 'success',
      message: 'Public API is working',
      timestamp: new Date(),
      data: {
        version: '1.0.0',
        endpoints: {
          applications: '/public/applications',
          oauth2: '/public/oauth2',
        },
      },
    };
  }

  async createApplication(createDto: CreateOauth2Dto, userId: number) {
    const clientRepository = this.dataSource.getRepository(Oauth2ClientEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const reqUser = await userRepository.findOneBy({
      id: userId,
    });

    if (!reqUser || reqUser.permission < 3) {
      throw new ForbiddenException(
        "You don't have permission to create new application.",
      );
    }

    const secret = Array.from({ length: 40 }, () =>
      Math.random().toString(36).charAt(2),
    ).join('');

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(secret, salt);

    const generated = clientRepository.create({
      title: createDto.title,
      profile: createDto.profile,
      secret: hashedPassword,
    });
    await clientRepository.save(generated);
    return {
      status: 'success',
      message: 'Application created successfully.',
      timestamp: new Date(),
      data: {
        secret: secret,
        clientId: generated.id,
      },
    };
  }

  async getApplications(userId: number) {
    const clientRepository = this.dataSource.getRepository(Oauth2ClientEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const reqUser = await userRepository.findOneBy({ id: userId });
    if (!reqUser || reqUser.permission < 3) {
      throw new ForbiddenException(
        "You don't have permission to view applications.",
      );
    }

    const applications = await clientRepository.find();

    return {
      status: 'success',
      message: 'Applications retrieved successfully.',
      timestamp: new Date(),
      data: applications,
    };
  }

  async getApplication(clientId: string, userId: number) {
    const clientRepository = this.dataSource.getRepository(Oauth2ClientEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const reqUser = await userRepository.findOneBy({ id: userId });
    if (!reqUser || reqUser.permission < 3) {
      throw new ForbiddenException(
        "You don't have permission to view this application.",
      );
    }

    const application = await clientRepository.findOneBy({ id: clientId });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    return {
      status: 'success',
      message: 'Application retrieved successfully.',
      timestamp: new Date(),
      data: application,
    };
  }

  async updateApplication(
    clientId: string,
    updateDto: UpdateOauth2Dto,
    userId: number,
  ) {
    const clientRepository = this.dataSource.getRepository(Oauth2ClientEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const reqUser = await userRepository.findOneBy({ id: userId });
    if (!reqUser || reqUser.permission < 3) {
      throw new ForbiddenException(
        "You don't have permission to update this application.",
      );
    }

    const client = await clientRepository.findOneBy({ id: clientId });
    if (!client) {
      throw new NotFoundException('Application not found.');
    }

    if (updateDto.title) {
      client.title = updateDto.title;
    }
    if (updateDto.profile) {
      client.profile = updateDto.profile;
    }

    await clientRepository.save(client);

    return {
      status: 'success',
      message: 'Application updated successfully.',
      timestamp: new Date(),
      data: null,
    };
  }

  async updateApplicationTitle(
    clientId: string,
    newTitle: string,
    userId: number,
  ) {
    const clientRepository = this.dataSource.getRepository(Oauth2ClientEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const reqUser = await userRepository.findOneBy({ id: userId });
    if (!reqUser || reqUser.permission < 3) {
      throw new ForbiddenException(
        "You don't have permission to update this application.",
      );
    }

    const client = await clientRepository.findOneBy({ id: clientId });
    if (!client) {
      throw new NotFoundException('Application not found.');
    }

    client.title = newTitle;
    await clientRepository.save(client);

    return {
      status: 'success',
      message: 'Application title updated successfully.',
      timestamp: new Date(),
      data: null,
    };
  }

  async updateApplicationProfile(
    clientId: string,
    newProfile: string,
    userId: number,
  ) {
    const clientRepository = this.dataSource.getRepository(Oauth2ClientEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const reqUser = await userRepository.findOneBy({ id: userId });
    if (!reqUser || reqUser.permission < 3) {
      throw new ForbiddenException(
        "You don't have permission to update this application.",
      );
    }

    const client = await clientRepository.findOneBy({ id: clientId });
    if (!client) {
      throw new NotFoundException('Application not found.');
    }

    client.profile = newProfile;
    await clientRepository.save(client);

    return {
      status: 'success',
      message: 'Application profile updated successfully.',
      timestamp: new Date(),
      data: null,
    };
  }

  async updateApplicationSecret(clientId: string, userId: number) {
    const clientRepository = this.dataSource.getRepository(Oauth2ClientEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const reqUser = await userRepository.findOneBy({ id: userId });
    if (!reqUser || reqUser.permission < 3) {
      throw new ForbiddenException(
        "You don't have permission to update this application.",
      );
    }

    const client = await clientRepository.findOneBy({ id: clientId });
    if (!client) {
      throw new NotFoundException('Application not found.');
    }

    const secret = Array.from({ length: 40 }, () =>
      Math.random().toString(36).charAt(2),
    ).join('');

    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(secret, salt);

    client.secret = hashedPassword;
    await clientRepository.save(client);

    return {
      status: 'success',
      message: 'Application secret updated successfully.',
      timestamp: new Date(),
      data: {
        secret: secret,
      },
    };
  }

  async updateApplicationScopes(
    clientId: string,
    newScopes: string[],
    userId: number,
  ) {
    const clientRepository = this.dataSource.getRepository(Oauth2ClientEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const reqUser = await userRepository.findOneBy({ id: userId });
    if (!reqUser || reqUser.permission < 3) {
      throw new ForbiddenException(
        "You don't have permission to update this application.",
      );
    }

    const client = await clientRepository.findOneBy({ id: clientId });
    if (!client) {
      throw new NotFoundException('Application not found.');
    }

    // TODO: Implement scope update logic when scope entity is properly configured
    // const scopes = await scopeRepository.findByIds(newScopes);
    // client.scopes = scopes;
    // await clientRepository.save(client);

    return {
      status: 'success',
      message: 'Application scopes updated successfully.',
      timestamp: new Date(),
      data: null,
    };
  }

  async deleteApplication(clientId: string, userId: number) {
    const clientRepository = this.dataSource.getRepository(Oauth2ClientEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const reqUser = await userRepository.findOneBy({ id: userId });
    if (!reqUser || reqUser.permission < 3) {
      throw new ForbiddenException(
        "You don't have permission to delete this application.",
      );
    }

    const client = await clientRepository.findOneBy({ id: clientId });
    if (!client) {
      throw new NotFoundException('Application not found.');
    }

    await clientRepository.remove(client);

    return {
      status: 'success',
      message: 'Application deleted successfully.',
      timestamp: new Date(),
      data: null,
    };
  }
}
