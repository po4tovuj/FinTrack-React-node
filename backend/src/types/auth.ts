import { User } from '@prisma/client';

/**
 * JWT payload interface
 */
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

/**
 * Login input
 */
export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Register input
 */
export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password reset input
 */
export interface PasswordResetInput {
  token: string;
  newPassword: string;
}

/**
 * OAuth provider types
 */
export type OAuthProvider = 'google' | 'github' | 'facebook';

/**
 * OAuth user info
 */
export interface OAuthUserInfo {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider: OAuthProvider;
}