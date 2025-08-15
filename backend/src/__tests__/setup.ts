import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { join } from 'path'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing'
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing'
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/fintrack_test'

declare global {
  var __PRISMA__: PrismaClient
}

// Global test database setup
beforeAll(async () => {
  // Set up test database
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required for testing')
  }

  // Create test database schema
  try {
    execSync('npx prisma migrate deploy', {
      cwd: join(__dirname, '../../'),
      stdio: 'inherit',
    })
  } catch (error) {
    console.warn('Migration failed, continuing with tests...', error)
  }

  // Initialize Prisma client
  global.__PRISMA__ = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  })

  await global.__PRISMA__.$connect()
})

// Clean up after all tests
afterAll(async () => {
  if (global.__PRISMA__) {
    await global.__PRISMA__.$disconnect()
  }
})

// Clean up database between tests
beforeEach(async () => {
  if (global.__PRISMA__) {
    // Clean up all tables in reverse order to avoid foreign key constraints
    const tableNames = [
      'notifications',
      'shopping_list_items',
      'shopping_lists',
      'transaction_splits',
      'transactions',
      'budgets',
      'family_members',
      'families',
      'categories',
      'users',
    ]

    for (const tableName of tableNames) {
      await global.__PRISMA__.$executeRawUnsafe(`DELETE FROM "${tableName}";`)
    }

    // Reset auto-incrementing sequences if any
    await global.__PRISMA__.$executeRawUnsafe('SELECT setval(pg_get_serial_sequence(\'users\', \'id\'), 1, false);')
  }
})

// Helper function to create test user
export const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: '$2a$10$test.hashed.password', // Hashed 'password'
    ...overrides,
  }

  return await global.__PRISMA__.user.create({
    data: defaultUser,
  })
}

// Helper function to create test category
export const createTestCategory = async (userId?: string, overrides = {}) => {
  const defaultCategory = {
    name: 'Test Category',
    color: '#FF5733',
    type: 'EXPENSE' as const,
    userId,
    isDefault: false,
    ...overrides,
  }

  return await global.__PRISMA__.category.create({
    data: defaultCategory,
  })
}

// Helper function to create test transaction
export const createTestTransaction = async (userId: string, categoryId: string, overrides = {}) => {
  const defaultTransaction = {
    amount: 100.0,
    description: 'Test Transaction',
    type: 'EXPENSE' as const,
    date: new Date(),
    categoryId,
    userId,
    ...overrides,
  }

  return await global.__PRISMA__.transaction.create({
    data: defaultTransaction,
  })
}

// Helper function to create test budget
export const createTestBudget = async (userId: string, categoryId: string, overrides = {}) => {
  const defaultBudget = {
    amount: 500.0,
    period: 'MONTHLY' as const,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-01-31'),
    categoryId,
    userId,
    ...overrides,
  }

  return await global.__PRISMA__.budget.create({
    data: defaultBudget,
  })
}

// Mock console methods for cleaner test output
global.console = {
  ...console,
  // Uncomment to silence console methods in tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
}