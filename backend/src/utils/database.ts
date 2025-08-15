import { PrismaClient } from '@prisma/client';

/**
 * Database utility functions for FinTrack application
 */

// Global Prisma client instance
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Create or reuse Prisma client instance
 * In development, reuse the same client to avoid connection exhaustion
 */
export const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

/**
 * Connect to database with retry logic
 */
export async function connectDatabase(retries: number = 5): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('✅ Connected to PostgreSQL database');
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) {
        throw new Error(`Failed to connect to database after ${retries} attempts`);
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s, 8s, 16s
      console.log(`⏳ Retrying database connection in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Disconnect from database gracefully
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('✅ Disconnected from database');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Run database migrations programmatically
 */
export async function runMigrations(): Promise<void> {
  try {
    // This would typically be done via CLI: npx prisma migrate deploy
    // For programmatic usage, you might want to use a different approach
    console.log('⚠️  Run migrations manually: npx prisma migrate deploy');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

/**
 * Clean up database (for testing)
 */
export async function cleanDatabase(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot clean database in production environment');
  }

  try {
    // Delete in reverse dependency order
    await prisma.notification.deleteMany();
    await prisma.shoppingListItem.deleteMany();
    await prisma.shoppingList.deleteMany();
    await prisma.transactionSplit.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.familyMember.deleteMany();
    await prisma.family.deleteMany();
    await prisma.category.deleteMany({
      where: { isDefault: false }, // Keep default categories
    });
    await prisma.user.deleteMany();

    console.log('✅ Database cleaned successfully');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  users: number;
  transactions: number;
  budgets: number;
  families: number;
  shoppingLists: number;
}> {
  try {
    const [users, transactions, budgets, families, shoppingLists] = await Promise.all([
      prisma.user.count(),
      prisma.transaction.count(),
      prisma.budget.count(),
      prisma.family.count(),
      prisma.shoppingList.count(),
    ]);

    return {
      users,
      transactions,
      budgets,
      families,
      shoppingLists,
    };
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    throw error;
  }
}