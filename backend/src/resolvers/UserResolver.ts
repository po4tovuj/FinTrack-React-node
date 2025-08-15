import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from 'type-graphql';
import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Context } from '../types/context';
import { AuthResponse, LoginInput, RegisterInput } from '../types/auth';
import { generateToken, generateRefreshToken } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

/**
 * GraphQL Input Types
 */
import { InputType, Field } from 'type-graphql';

@InputType()
class LoginInputType implements LoginInput {
  @Field()
  email!: string;

  @Field()
  password!: string;

  @Field({ nullable: true })
  rememberMe?: boolean;
}

@InputType()
class RegisterInputType implements RegisterInput {
  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field()
  password!: string;
}

/**
 * GraphQL Object Types
 */
import { ObjectType } from 'type-graphql';

@ObjectType()
class UserType {
  @Field()
  id!: string;

  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
class AuthResponseType implements AuthResponse {
  @Field(() => UserType)
  user!: User;

  @Field()
  token!: string;

  @Field({ nullable: true })
  refreshToken?: string;
}

/**
 * User resolver for authentication and user management
 */
@Resolver(() => UserType)
export class UserResolver {
  /**
   * Get current authenticated user
   */
  @Authorized()
  @Query(() => UserType, { nullable: true })
  async me(@Ctx() ctx: Context): Promise<User | null> {
    return ctx.user;
  }

  /**
   * Get user by ID
   */
  @Authorized()
  @Query(() => UserType, { nullable: true })
  async user(
    @Arg('id') id: string,
    @Ctx() ctx: Context
  ): Promise<User | null> {
    const user = await ctx.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Register a new user
   */
  @Mutation(() => AuthResponseType)
  async register(
    @Arg('input') input: RegisterInputType,
    @Ctx() ctx: Context
  ): Promise<AuthResponse> {
    // Validate input
    if (!input.email || !input.password || !input.name) {
      throw new AppError('Missing required fields', 400, 'VALIDATION_ERROR');
    }

    if (input.password.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400, 'VALIDATION_ERROR');
    }

    // Check if user already exists
    const existingUser = await ctx.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409, 'USER_EXISTS');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 12);

    // Create user
    const user = await ctx.prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        password: hashedPassword,
      },
    });

    // Generate tokens
    const token = generateToken(user, '7d');
    const refreshToken = generateRefreshToken(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as User,
      token,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  @Mutation(() => AuthResponseType)
  async login(
    @Arg('input') input: LoginInputType,
    @Ctx() ctx: Context
  ): Promise<AuthResponse> {
    // Validate input
    if (!input.email || !input.password) {
      throw new AppError('Email and password are required', 400, 'VALIDATION_ERROR');
    }

    // Find user
    const user = await ctx.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(input.password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const expiresIn = input.rememberMe ? '30d' : '7d';
    const token = generateToken(user, expiresIn);
    const refreshToken = generateRefreshToken(user);

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as User,
      token,
      refreshToken,
    };
  }

  /**
   * Update user profile
   */
  @Authorized()
  @Mutation(() => UserType)
  async updateProfile(
    @Arg('name', { nullable: true }) name: string,
    @Arg('avatar', { nullable: true }) avatar: string,
    @Ctx() ctx: Context
  ): Promise<User> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    const updateData: any = {};
    
    if (name !== undefined) {
      if (name.trim().length < 1) {
        throw new AppError('Name cannot be empty', 400, 'VALIDATION_ERROR');
      }
      updateData.name = name.trim();
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    const updatedUser = await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: updateData,
    });

    return updatedUser;
  }

  /**
   * Change password
   */
  @Authorized()
  @Mutation(() => Boolean)
  async changePassword(
    @Arg('currentPassword') currentPassword: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400, 'VALIDATION_ERROR');
    }

    // Get user with password
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 401, 'INVALID_CREDENTIALS');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await ctx.prisma.user.update({
      where: { id: ctx.user.id },
      data: { password: hashedNewPassword },
    });

    return true;
  }

  /**
   * Delete user account
   */
  @Authorized()
  @Mutation(() => Boolean)
  async deleteAccount(
    @Arg('password') password: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Get user with password
    const user = await ctx.prisma.user.findUnique({
      where: { id: ctx.user.id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Password is incorrect', 401, 'INVALID_CREDENTIALS');
    }

    // Delete user account (this will cascade delete related data)
    await ctx.prisma.user.delete({
      where: { id: ctx.user.id },
    });

    return true;
  }
}