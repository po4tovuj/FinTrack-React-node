import { Resolver, Query, Mutation, Arg, Ctx, Authorized, Int } from 'type-graphql';
import { Context } from '../types/context';
import { AppError } from '../middleware/errorHandler';
import { ObjectType, InputType, Field, Float, registerEnumType } from 'type-graphql';
import { TransactionType as PrismaTransactionType } from '@prisma/client';

// Register enum for GraphQL
registerEnumType(PrismaTransactionType, {
  name: 'TransactionTypeEnum',
  description: 'Type of transaction: income or expense',
});

/**
 * GraphQL Object Types
 */
@ObjectType()
class TransactionType {
  @Field()
  id!: string;

  @Field(() => Float)
  amount!: number;

  @Field()
  description!: string;

  @Field(() => PrismaTransactionType)
  type!: PrismaTransactionType;

  @Field()
  date!: Date;

  @Field()
  categoryId!: string;

  @Field()
  userId!: string;

  @Field({ nullable: true })
  familyId?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
class TransactionConnection {
  @Field(() => [TransactionType])
  transactions!: TransactionType[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field()
  hasNext!: boolean;

  @Field()
  hasPrev!: boolean;
}

/**
 * GraphQL Input Types
 */
@InputType()
class CreateTransactionInput {
  @Field(() => Float)
  amount!: number;

  @Field()
  description!: string;

  @Field(() => PrismaTransactionType)
  type!: PrismaTransactionType;

  @Field()
  date!: Date;

  @Field()
  categoryId!: string;

  @Field({ nullable: true })
  familyId?: string;
}

@InputType()
class UpdateTransactionInput {
  @Field(() => Float, { nullable: true })
  amount?: number;

  @Field({ nullable: true })
  description?: string;

  @Field(() => PrismaTransactionType, { nullable: true })
  type?: PrismaTransactionType;

  @Field({ nullable: true })
  date?: Date;

  @Field({ nullable: true })
  categoryId?: string;
}

@InputType()
class TransactionFiltersInput {
  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field(() => [String], { nullable: true })
  categoryIds?: string[];

  @Field(() => PrismaTransactionType, { nullable: true })
  type?: PrismaTransactionType;

  @Field(() => Float, { nullable: true })
  minAmount?: number;

  @Field(() => Float, { nullable: true })
  maxAmount?: number;

  @Field({ nullable: true })
  search?: string;

  @Field({ nullable: true })
  familyId?: string;
}

/**
 * Transaction resolver for managing financial transactions
 */
@Resolver(() => TransactionType)
export class TransactionResolver {
  /**
   * Get all transactions for authenticated user with pagination and filters
   */
  @Authorized()
  @Query(() => TransactionConnection)
  async transactions(
    @Arg('page', () => Int, { defaultValue: 1 }) page: number,
    @Arg('limit', () => Int, { defaultValue: 50 }) limit: number,
    @Arg('filters', { nullable: true }) filters: TransactionFiltersInput,
    @Ctx() ctx: Context
  ): Promise<TransactionConnection> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Build where clause
    const where: any = {
      userId: ctx.user.id,
    };

    if (filters) {
      if (filters.startDate && filters.endDate) {
        where.date = {
          gte: filters.startDate,
          lte: filters.endDate,
        };
      } else if (filters.startDate) {
        where.date = { gte: filters.startDate };
      } else if (filters.endDate) {
        where.date = { lte: filters.endDate };
      }

      if (filters.categoryIds && filters.categoryIds.length > 0) {
        where.categoryId = { in: filters.categoryIds };
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
        where.amount = {};
        if (filters.minAmount !== undefined) {
          where.amount.gte = filters.minAmount;
        }
        if (filters.maxAmount !== undefined) {
          where.amount.lte = filters.maxAmount;
        }
      }

      if (filters.search) {
        where.description = {
          contains: filters.search,
          mode: 'insensitive',
        };
      }

      if (filters.familyId) {
        where.familyId = filters.familyId;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get transactions with count
    const [transactions, total] = await Promise.all([
      ctx.prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          category: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      ctx.prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions as any[],
      total,
      page,
      limit,
      hasNext: skip + limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * Get single transaction by ID
   */
  @Authorized()
  @Query(() => TransactionType, { nullable: true })
  async transaction(
    @Arg('id') id: string,
    @Ctx() ctx: Context
  ): Promise<TransactionType | null> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    const transaction = await ctx.prisma.transaction.findFirst({
      where: {
        id,
        userId: ctx.user.id,
      },
      include: {
        category: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return transaction as any;
  }

  /**
   * Create a new transaction
   */
  @Authorized()
  @Mutation(() => TransactionType)
  async createTransaction(
    @Arg('input') input: CreateTransactionInput,
    @Ctx() ctx: Context
  ): Promise<TransactionType> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Validate input
    if (input.amount <= 0) {
      throw new AppError('Amount must be greater than 0', 400, 'VALIDATION_ERROR');
    }

    if (!input.description.trim()) {
      throw new AppError('Description is required', 400, 'VALIDATION_ERROR');
    }

    // Verify category exists and belongs to user
    const category = await ctx.prisma.category.findFirst({
      where: {
        id: input.categoryId,
        OR: [
          { userId: ctx.user.id },
          { isDefault: true },
        ],
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // If familyId is provided, verify user has access to family
    if (input.familyId) {
      const familyMember = await ctx.prisma.familyMember.findFirst({
        where: {
          familyId: input.familyId,
          userId: ctx.user.id,
        },
      });

      if (!familyMember) {
        throw new AppError('Access denied to family', 403);
      }
    }

    const transaction = await ctx.prisma.transaction.create({
      data: {
        amount: input.amount,
        description: input.description.trim(),
        type: input.type,
        date: input.date,
        categoryId: input.categoryId,
        userId: ctx.user.id,
        familyId: input.familyId,
      },
      include: {
        category: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return transaction as any;
  }

  /**
   * Update an existing transaction
   */
  @Authorized()
  @Mutation(() => TransactionType)
  async updateTransaction(
    @Arg('id') id: string,
    @Arg('input') input: UpdateTransactionInput,
    @Ctx() ctx: Context
  ): Promise<TransactionType> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify transaction exists and belongs to user
    const existingTransaction = await ctx.prisma.transaction.findFirst({
      where: {
        id,
        userId: ctx.user.id,
      },
    });

    if (!existingTransaction) {
      throw new AppError('Transaction not found', 404);
    }

    // Build update data
    const updateData: any = {};

    if (input.amount !== undefined) {
      if (input.amount <= 0) {
        throw new AppError('Amount must be greater than 0', 400, 'VALIDATION_ERROR');
      }
      updateData.amount = input.amount;
    }

    if (input.description !== undefined) {
      if (!input.description.trim()) {
        throw new AppError('Description cannot be empty', 400, 'VALIDATION_ERROR');
      }
      updateData.description = input.description.trim();
    }

    if (input.type !== undefined) {
      updateData.type = input.type;
    }

    if (input.date !== undefined) {
      updateData.date = input.date;
    }

    if (input.categoryId !== undefined) {
      // Verify category exists and belongs to user
      const category = await ctx.prisma.category.findFirst({
        where: {
          id: input.categoryId,
          OR: [
            { userId: ctx.user.id },
            { isDefault: true },
          ],
        },
      });

      if (!category) {
        throw new AppError('Category not found', 404);
      }

      updateData.categoryId = input.categoryId;
    }

    const transaction = await ctx.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return transaction as any;
  }

  /**
   * Delete a transaction
   */
  @Authorized()
  @Mutation(() => Boolean)
  async deleteTransaction(
    @Arg('id') id: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify transaction exists and belongs to user
    const transaction = await ctx.prisma.transaction.findFirst({
      where: {
        id,
        userId: ctx.user.id,
      },
    });

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    await ctx.prisma.transaction.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Get transaction statistics for dashboard
   */
  @Authorized()
  @Query(() => String) // TODO: Create proper stats type
  async transactionStats(
    @Arg('startDate', { nullable: true }) startDate: Date,
    @Arg('endDate', { nullable: true }) endDate: Date,
    @Ctx() ctx: Context
  ): Promise<string> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // TODO: Implement transaction statistics
    // This should return income, expenses, balance, category breakdowns, etc.
    return 'Stats placeholder';
  }
}