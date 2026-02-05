import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthenticationController } from './authentication.controller';
import { CredentialManager } from './credential.manager';
import { DataAccessLayer } from '../database/data-access.layer';
import { RegisterAccountDto, LoginCredentialsDto } from './dto/auth.dto';

describe('AuthenticationController - Comprehensive Suite', () => {
  let testingController: AuthenticationController;
  let mockCredentialManager: jest.Mocked<CredentialManager>;
  let mockDataAccessLayer: jest.Mocked<DataAccessLayer>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  const fabricateMockAccount = () => ({
    id: 'zyx-987-qwerty-unique-id',
    emailAddress: 'phoenix.rising@tikitsystem.io',
    passwordHash: '$2b$12$hashedPasswordMockValue',
    fullName: 'Phoenix RisingStarUser',
    accountRole: 'CLIENT',
    isActive: true,
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z'),
  });

  const fabricateTokenResponseStructure = () => ({
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.unique.signature',
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh.token',
    expiresIn: '1h',
  });

  beforeEach(async () => {
    const mockDataLayerImplementation = {
      account: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
      },
    };

    const mockJwtServiceImplementation = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockConfigServiceImplementation = {
      get: jest.fn((key: string) => {
        const configurationMap = {
          JWT_SECRET_KEY: 'ultra-secret-key-for-testing-purposes-only',
          JWT_EXPIRATION_TIME: '1h',
          JWT_REFRESH_SECRET: 'ultra-secret-refresh-key-for-testing',
          JWT_REFRESH_EXPIRATION: '7d',
        };
        return configurationMap[key];
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        CredentialManager,
        {
          provide: DataAccessLayer,
          useValue: mockDataLayerImplementation,
        },
        {
          provide: JwtService,
          useValue: mockJwtServiceImplementation,
        },
        {
          provide: ConfigService,
          useValue: mockConfigServiceImplementation,
        },
      ],
    }).compile();

    testingController = moduleRef.get<AuthenticationController>(AuthenticationController);
    mockCredentialManager = moduleRef.get(CredentialManager);
    mockDataAccessLayer = moduleRef.get(DataAccessLayer);
    mockJwtService = moduleRef.get(JwtService);
    mockConfigService = moduleRef.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Account Registration Flow', () => {
    it('should successfully register new account with pristine credentials', async () => {
      const registrationPayload: RegisterAccountDto = {
        emailAddress: 'nebula.explorer@tikitsystem.io',
        password: 'SecureP@ssw0rd123!',
        fullName: 'Nebula Explorer',
      };

      const fabricatedAccount = fabricateMockAccount();
      const expectedTokens = fabricateTokenResponseStructure();

      mockDataAccessLayer.account.findUnique.mockResolvedValue(null);
      mockDataAccessLayer.account.create.mockResolvedValue(fabricatedAccount);
      mockJwtService.sign.mockReturnValueOnce(expectedTokens.accessToken)
        .mockReturnValueOnce(expectedTokens.refreshToken);
      mockDataAccessLayer.refreshToken.create.mockResolvedValue({
        id: 'refresh-token-unique-id',
        tokenValue: expectedTokens.refreshToken,
        accountId: fabricatedAccount.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        isRevoked: false,
      });

      const registrationOutcome = await testingController.register(registrationPayload);

      expect(registrationOutcome).toEqual(expectedTokens);
      expect(mockDataAccessLayer.account.findUnique).toHaveBeenCalledWith({
        where: { emailAddress: registrationPayload.emailAddress },
      });
      expect(mockDataAccessLayer.account.create).toHaveBeenCalledWith({
        data: {
          emailAddress: registrationPayload.emailAddress,
          passwordHash: expect.any(String),
          fullName: registrationPayload.fullName,
        },
      });
    });

    it('should reject registration when duplicate email address detected', async () => {
      const duplicateEmailPayload: RegisterAccountDto = {
        emailAddress: 'existing.user@tikitsystem.io',
        password: 'AnotherP@ssw0rd456',
        fullName: 'Duplicate User Attempt',
      };

      const existingAccountRecord = fabricateMockAccount();
      mockDataAccessLayer.account.findUnique.mockResolvedValue(existingAccountRecord);

      await expect(testingController.register(duplicateEmailPayload))
        .rejects
        .toThrow(ConflictException);
      
      await expect(testingController.register(duplicateEmailPayload))
        .rejects
        .toThrow('Account with this email already exists');

      expect(mockDataAccessLayer.account.create).not.toHaveBeenCalled();
      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('Credential Validation and Login Flow', () => {
    it('should authenticate user successfully with correct login credentials', async () => {
      const validLoginCredentials: LoginCredentialsDto = {
        emailAddress: 'quantum.leap@tikitsystem.io',
        password: 'CorrectP@ssword789',
      };

      const accountFromDatabase = {
        ...fabricateMockAccount(),
        emailAddress: validLoginCredentials.emailAddress,
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewKcbqGF4.0lO/gW',
      };

      const expectedAuthTokens = fabricateTokenResponseStructure();

      mockDataAccessLayer.account.findUnique.mockResolvedValue(accountFromDatabase);
      mockJwtService.sign.mockReturnValueOnce(expectedAuthTokens.accessToken)
        .mockReturnValueOnce(expectedAuthTokens.refreshToken);
      mockDataAccessLayer.refreshToken.create.mockResolvedValue({
        id: 'refresh-unique-token-id',
        tokenValue: expectedAuthTokens.refreshToken,
        accountId: accountFromDatabase.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        isRevoked: false,
      });

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const loginOutcome = await testingController.login(validLoginCredentials);

      expect(loginOutcome).toEqual(expectedAuthTokens);
      expect(mockDataAccessLayer.account.findUnique).toHaveBeenCalledWith({
        where: { emailAddress: validLoginCredentials.emailAddress },
      });
    });

    it('should deny access when credentials contain invalid password', async () => {
      const incorrectPasswordCredentials: LoginCredentialsDto = {
        emailAddress: 'stellar.voyager@tikitsystem.io',
        password: 'WrongP@ssword000',
      };

      const accountFromDatabase = {
        ...fabricateMockAccount(),
        emailAddress: incorrectPasswordCredentials.emailAddress,
      };

      mockDataAccessLayer.account.findUnique.mockResolvedValue(accountFromDatabase);

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(testingController.login(incorrectPasswordCredentials))
        .rejects
        .toThrow(UnauthorizedException);

      await expect(testingController.login(incorrectPasswordCredentials))
        .rejects
        .toThrow('Invalid credentials provided');

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });

    it('should deny access when email address not found in system', async () => {
      const nonExistentUserCredentials: LoginCredentialsDto = {
        emailAddress: 'phantom.user@tikitsystem.io',
        password: 'DoesNotMatter123',
      };

      mockDataAccessLayer.account.findUnique.mockResolvedValue(null);

      await expect(testingController.login(nonExistentUserCredentials))
        .rejects
        .toThrow(UnauthorizedException);

      await expect(testingController.login(nonExistentUserCredentials))
        .rejects
        .toThrow('Invalid credentials provided');

      expect(mockJwtService.sign).not.toHaveBeenCalled();
    });
  });

  describe('Profile Retrieval Operations', () => {
    it('should retrieve account profile data with valid authentication token', async () => {
      const authenticatedAccountId = 'authenticated-user-unique-id-xyz';
      const accountProfileData = {
        id: authenticatedAccountId,
        emailAddress: 'cosmic.traveler@tikitsystem.io',
        fullName: 'Cosmic Traveler',
        accountRole: 'INFLUENCER',
        isActive: true,
      };

      mockDataAccessLayer.account.findUnique.mockResolvedValue(accountProfileData);

      const profileFetchResult = await testingController.getProfile(authenticatedAccountId);

      expect(profileFetchResult).toEqual(accountProfileData);
      expect(mockDataAccessLayer.account.findUnique).toHaveBeenCalledWith({
        where: { id: authenticatedAccountId },
        select: {
          id: true,
          emailAddress: true,
          fullName: true,
          accountRole: true,
          isActive: true,
        },
      });
    });

    it('should reject profile access without valid authentication token', async () => {
      const unauthorizedAccountId = 'non-existent-account-id';

      mockDataAccessLayer.account.findUnique.mockResolvedValue(null);

      await expect(testingController.getProfile(unauthorizedAccountId))
        .rejects
        .toThrow(UnauthorizedException);

      await expect(testingController.getProfile(unauthorizedAccountId))
        .rejects
        .toThrow('Account not found');

      expect(mockDataAccessLayer.account.findUnique).toHaveBeenCalledWith({
        where: { id: unauthorizedAccountId },
        select: {
          id: true,
          emailAddress: true,
          fullName: true,
          accountRole: true,
          isActive: true,
        },
      });
    });
  });
});
