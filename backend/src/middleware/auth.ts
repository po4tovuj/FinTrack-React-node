import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { PrismaClient, User } from '@prisma/client';
import { JwtPayload } from '../types/auth';

/**
 * JWT authentication middleware
 * Extracts and verifies JWT token from request headers
 */
export async function authMiddleware(req: Request, prisma: PrismaClient): Promise<any> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new Error('No token provided');
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    console.error('Authentication error:', error);
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: User, expiresIn: string = '7d'): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, jwtSecret, { expiresIn } as any);
}

/**
 * Generate refresh token for user
 */
export function generateRefreshToken(user: User): string {
  const jwtSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };

  return jwt.sign(payload, jwtSecret, { expiresIn: '30d' } as any);
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload {
  const jwtSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is not set');
  }

  return jwt.verify(token, jwtSecret) as JwtPayload;
}

/**
 * Extract user ID from JWT token without verification
 * Used for rate limiting and logging
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded?.userId || null;
  } catch {
    return null;
  }
}