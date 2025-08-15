import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed script for FinTrack database
 * Creates default categories and demo data for development
 */
async function main() {
  console.log('🌱 Starting database seed...');

  // Create default expense categories
  const defaultExpenseCategories = [
    { name: 'Housing', color: '#8B5CF6', icon: '🏠', type: 'EXPENSE' },
    { name: 'Food', color: '#F59E0B', icon: '🍕', type: 'EXPENSE' },
    { name: 'Transportation', color: '#06B6D4', icon: '🚗', type: 'EXPENSE' },
    { name: 'Entertainment', color: '#EC4899', icon: '🎬', type: 'EXPENSE' },
    { name: 'Healthcare', color: '#EF4444', icon: '⚕️', type: 'EXPENSE' },
    { name: 'Shopping', color: '#10B981', icon: '🛒', type: 'EXPENSE' },
    { name: 'Utilities', color: '#6B7280', icon: '⚡', type: 'EXPENSE' },
    { name: 'Insurance', color: '#7C3AED', icon: '🛡️', type: 'EXPENSE' },
    { name: 'Education', color: '#059669', icon: '📚', type: 'EXPENSE' },
    { name: 'Travel', color: '#DC2626', icon: '✈️', type: 'EXPENSE' },
    { name: 'Fitness', color: '#0891B2', icon: '💪', type: 'EXPENSE' },
    { name: 'Personal Care', color: '#BE185D', icon: '💄', type: 'EXPENSE' },
    { name: 'Gifts', color: '#9333EA', icon: '🎁', type: 'EXPENSE' },
    { name: 'Other', color: '#64748B', icon: '📄', type: 'EXPENSE' },
  ];

  // Create default income categories
  const defaultIncomeCategories = [
    { name: 'Salary', color: '#10B981', icon: '💼', type: 'INCOME' },
    { name: 'Freelance', color: '#059669', icon: '💻', type: 'INCOME' },
    { name: 'Investment', color: '#0D9488', icon: '📈', type: 'INCOME' },
    { name: 'Rental Income', color: '#0F766E', icon: '🏘️', type: 'INCOME' },
    { name: 'Business', color: '#047857', icon: '🏪', type: 'INCOME' },
    { name: 'Bonus', color: '#065F46', icon: '🎯', type: 'INCOME' },
    { name: 'Gift', color: '#34D399', icon: '🎁', type: 'INCOME' },
    { name: 'Other', color: '#6EE7B7', icon: '💰', type: 'INCOME' },
  ];

  // Create default categories
  console.log('Creating default categories...');
  
  for (const category of [...defaultExpenseCategories, ...defaultIncomeCategories]) {
    // Check if category already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: category.name,
        userId: null,
        type: category.type as any,
        isDefault: true,
      },
    });

    if (!existingCategory) {
      await prisma.category.create({
        data: {
          name: category.name,
          color: category.color,
          icon: category.icon,
          type: category.type as any,
          userId: null,
          isDefault: true,
        },
      });
    }
  }

  console.log(`✅ Created ${defaultExpenseCategories.length + defaultIncomeCategories.length} default categories`);

  // Create demo user for development
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating demo user...');

    const demoPassword = await bcrypt.hash('demo123456', 12);
    
    const demoUser = await prisma.user.upsert({
      where: { email: 'demo@fintrack.app' },
      update: {},
      create: {
        name: 'Demo User',
        email: 'demo@fintrack.app',
        password: demoPassword,
        avatar: null,
      },
    });

    console.log('✅ Created demo user: demo@fintrack.app / demo123456');

    // Create demo transactions
    console.log('Creating demo transactions...');
    
    const categories = await prisma.category.findMany({
      where: { isDefault: true },
    });

    const salaryCategory = categories.find(c => c.name === 'Salary');
    const foodCategory = categories.find(c => c.name === 'Food');
    const housingCategory = categories.find(c => c.name === 'Housing');
    const transportCategory = categories.find(c => c.name === 'Transportation');

    const demoTransactions = [
      // Income
      {
        amount: 5000,
        description: 'Monthly Salary',
        type: 'INCOME',
        date: new Date('2024-08-01'),
        categoryId: salaryCategory?.id,
        userId: demoUser.id,
      },
      // Expenses
      {
        amount: 1200,
        description: 'Rent Payment',
        type: 'EXPENSE',
        date: new Date('2024-08-01'),
        categoryId: housingCategory?.id,
        userId: demoUser.id,
      },
      {
        amount: 89.50,
        description: 'Grocery Shopping',
        type: 'EXPENSE',
        date: new Date('2024-08-02'),
        categoryId: foodCategory?.id,
        userId: demoUser.id,
      },
      {
        amount: 45.00,
        description: 'Gas Station',
        type: 'EXPENSE',
        date: new Date('2024-08-03'),
        categoryId: transportCategory?.id,
        userId: demoUser.id,
      },
      {
        amount: 25.99,
        description: 'Netflix Subscription',
        type: 'EXPENSE',
        date: new Date('2024-08-05'),
        categoryId: categories.find(c => c.name === 'Entertainment')?.id,
        userId: demoUser.id,
      },
    ];

    for (const transaction of demoTransactions) {
      if (transaction.categoryId) {
        await prisma.transaction.create({
          data: transaction as any,
        });
      }
    }

    console.log(`✅ Created ${demoTransactions.length} demo transactions`);

    // Create demo budgets
    console.log('Creating demo budgets...');

    const demoBudgets = [
      {
        categoryId: foodCategory?.id,
        amount: 400,
        period: 'MONTHLY',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-31'),
        userId: demoUser.id,
      },
      {
        categoryId: transportCategory?.id,
        amount: 200,
        period: 'MONTHLY',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-31'),
        userId: demoUser.id,
      },
      {
        categoryId: categories.find(c => c.name === 'Entertainment')?.id,
        amount: 100,
        period: 'MONTHLY',
        startDate: new Date('2024-08-01'),
        endDate: new Date('2024-08-31'),
        userId: demoUser.id,
      },
    ];

    for (const budget of demoBudgets) {
      if (budget.categoryId) {
        await prisma.budget.create({
          data: budget as any,
        });
      }
    }

    console.log(`✅ Created ${demoBudgets.length} demo budgets`);

    // Create demo shopping list
    console.log('Creating demo shopping list...');

    const demoShoppingList = await prisma.shoppingList.create({
      data: {
        name: 'Weekly Groceries',
        description: 'Items needed for the week',
        userId: demoUser.id,
        shared: false,
        sharedWith: [],
      },
    });

    const shoppingItems = [
      {
        name: 'Milk',
        estimatedPrice: 4.50,
        categoryId: foodCategory?.id,
        priority: 'MUST_HAVE',
        listId: demoShoppingList.id,
      },
      {
        name: 'Bread',
        estimatedPrice: 3.25,
        categoryId: foodCategory?.id,
        priority: 'MUST_HAVE',
        listId: demoShoppingList.id,
      },
      {
        name: 'Coffee',
        estimatedPrice: 12.99,
        categoryId: foodCategory?.id,
        priority: 'NICE_TO_HAVE',
        listId: demoShoppingList.id,
      },
      {
        name: 'Chocolate',
        estimatedPrice: 5.99,
        categoryId: foodCategory?.id,
        priority: 'OPTIONAL',
        listId: demoShoppingList.id,
      },
    ];

    for (const item of shoppingItems) {
      await prisma.shoppingListItem.create({
        data: item as any,
      });
    }

    console.log(`✅ Created demo shopping list with ${shoppingItems.length} items`);

    console.log('\n🎉 Demo data created successfully!');
    console.log('👤 Demo user: demo@fintrack.app / demo123456');
    console.log('📊 Visit http://localhost:3000 to see the app with demo data');
  }

  console.log('🌱 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });