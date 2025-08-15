import { PrismaClient, User } from '@prisma/client';
import { Redis } from 'redis';
import { Request } from 'express';

/**
 * GraphQL context interface
 * Contains shared resources available to all resolvers
 */
export interface Context {
  // Database client
  prisma: PrismaClient;
  
  // Redis client for caching and sessions
  redis: Redis;
  
  // Authenticated user (null if not authenticated)
  user: User | null;
  
  // Express request object
  req?: Request;
  
  // Additional context data
  dataSources?: any;
}