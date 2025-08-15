import { Resolver, Query, Mutation, Arg, Ctx, Authorized, Float } from 'type-graphql';
import { Context } from '../types/context';
import { AppError } from '../middleware/errorHandler';
import { ObjectType, InputType, Field, registerEnumType } from 'type-graphql';
import { BudgetPeriod } from '@prisma/client';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';

// Register enum for GraphQL
registerEnumType(BudgetPeriod, {
  name: 'BudgetPeriod',
  description: 'Budget period type',
});

/**
 * GraphQL Object Types
 */
@ObjectType()
class BudgetType {
  @Field()
  id!: string;

  @Field()
  categoryId!: string;

  @Field(() => Float)
  amount!: number;

  @Field(() => Float)
  spent!: number;

  @Field(() => BudgetPeriod)
  period!: BudgetPeriod;

  @Field()
  startDate!: Date;

  @Field()
  endDate!: Date;

  @Field()
  userId!: string;

  @Field({ nullable: true })
  familyId?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Virtual fields
  @Field(() => Float)
  remaining!: number;

  @Field(() => Float)
  percentage!: number;

  @Field()
  status!: string; // 'good' | 'warning' | 'danger'
}

@ObjectType()
class BudgetSummary {
  @Field(() => Float)
  totalBudget!: number;

  @Field(() => Float)
  totalSpent!: number;

  @Field(() => Float)  
  totalRemaining!: number;

  @Field(() => Float)
  overallPercentage!: number;

  @Field()
  categoriesOverBudget!: number;

  @Field()
  categoriesNearLimit!: number;
}

/**
 * GraphQL Input Types
 */
@InputType()
class CreateBudgetInput {
  @Field()
  categoryId!: string;

  @Field(() => Float)
  amount!: number;

  @Field(() => BudgetPeriod)
  period!: BudgetPeriod;

  @Field()
  startDate!: Date;

  @Field({ nullable: true })
  familyId?: string;
}

@InputType()
class UpdateBudgetInput {
  @Field(() => Float, { nullable: true })
  amount?: number;

  @Field(() => BudgetPeriod, { nullable: true })
  period?: BudgetPeriod;

  @Field({ nullable: true })
  startDate?: Date;
}

/**
 * Budget resolver for managing financial budgets
 */
@Resolver(() => BudgetType)
export class BudgetResolver {
  /**
   * Get all budgets for authenticated user
   */
  @Authorized()
  @Query(() => [BudgetType])
  async budgets(
    @Arg('period', () => BudgetPeriod, { nullable: true }) period: BudgetPeriod,
    @Arg('familyId', { nullable: true }) familyId: string,
    @Ctx() ctx: Context
  ): Promise<BudgetType[]> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    const where: any = { userId: ctx.user.id };

    if (period) {
      where.period = period;
    }

    if (familyId) {
      // Verify user has access to family
      const familyMember = await ctx.prisma.familyMember.findFirst({
        where: {
          familyId,
          userId: ctx.user.id,
        },
      });

      if (!familyMember) {
        throw new AppError('Access denied to family', 403);
      }

      where.familyId = familyId;
    }

    const budgets = await ctx.prisma.budget.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [
        { category: { name: 'asc' } },
        { period: 'asc' },
      ],
    });

    // Calculate spent amounts and virtual fields
    const budgetsWithCalculations = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await this.calculateSpentAmount(budget, ctx);
        const remaining = budget.amount - spent;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        
        let status = 'good';
        if (percentage >= 100) status = 'danger';
        else if (percentage >= 80) status = 'warning';

        return {
          ...budget,
          spent,
          remaining,
          percentage,
          status,
        };
      })
    );

    return budgetsWithCalculations as BudgetType[];
  }

  /**
   * Get single budget by ID
   */
  @Authorized()
  @Query(() => BudgetType, { nullable: true })
  async budget(
    @Arg('id') id: string,
    @Ctx() ctx: Context
  ): Promise<BudgetType | null> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    const budget = await ctx.prisma.budget.findFirst({
      where: {
        id,
        userId: ctx.user.id,
      },
      include: {
        category: true,
      },
    });

    if (!budget) {
      return null;
    }

    const spent = await this.calculateSpentAmount(budget, ctx);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    
    let status = 'good';
    if (percentage >= 100) status = 'danger';
    else if (percentage >= 80) status = 'warning';

    return {
      ...budget,
      spent,
      remaining,
      percentage,
      status,
    } as BudgetType;
  }

  /**
   * Create a new budget
   */
  @Authorized()
  @Mutation(() => BudgetType)
  async createBudget(
    @Arg('input') input: CreateBudgetInput,
    @Ctx() ctx: Context
  ): Promise<BudgetType> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Validate input
    if (input.amount <= 0) {
      throw new AppError('Budget amount must be greater than 0', 400, 'VALIDATION_ERROR');
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

    // Calculate end date based on period
    let endDate: Date;
    if (input.period === 'MONTHLY') {
      endDate = endOfMonth(input.startDate);
    } else {
      endDate = endOfYear(input.startDate);
    }

    // Check for overlapping budget
    const existingBudget = await ctx.prisma.budget.findFirst({
      where: {
        categoryId: input.categoryId,
        userId: ctx.user.id,
        familyId: input.familyId || null,
        period: input.period,
        OR: [
          {
            startDate: { lte: input.startDate },
            endDate: { gte: input.startDate },
          },
          {
            startDate: { lte: endDate },
            endDate: { gte: endDate },
          },
          {
            startDate: { gte: input.startDate },
            endDate: { lte: endDate },
          },
        ],
      },
    });

    if (existingBudget) {
      throw new AppError(
        `A budget for this category and period already exists (${format(existingBudget.startDate, 'MMM yyyy')} - ${format(existingBudget.endDate, 'MMM yyyy')})`,
        409,
        'BUDGET_EXISTS'
      );
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

    const budget = await ctx.prisma.budget.create({
      data: {
        categoryId: input.categoryId,
        amount: input.amount,
        period: input.period,
        startDate: input.startDate,
        endDate,
        userId: ctx.user.id,
        familyId: input.familyId,
      },
      include: {
        category: true,
      },
    });

    // Calculate initial spent amount
    const spent = await this.calculateSpentAmount(budget, ctx);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    
    let status = 'good';
    if (percentage >= 100) status = 'danger';
    else if (percentage >= 80) status = 'warning';

    return {
      ...budget,
      spent,
      remaining,
      percentage,
      status,
    } as BudgetType;
  }

  /**
   * Update an existing budget
   */
  @Authorized()
  @Mutation(() => BudgetType)
  async updateBudget(
    @Arg('id') id: string,
    @Arg('input') input: UpdateBudgetInput,
    @Ctx() ctx: Context
  ): Promise<BudgetType> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify budget exists and belongs to user
    const existingBudget = await ctx.prisma.budget.findFirst({
      where: {
        id,
        userId: ctx.user.id,
      },
    });

    if (!existingBudget) {
      throw new AppError('Budget not found', 404);
    }

    // Build update data
    const updateData: any = {};

    if (input.amount !== undefined) {
      if (input.amount <= 0) {
        throw new AppError('Budget amount must be greater than 0', 400, 'VALIDATION_ERROR');
      }
      updateData.amount = input.amount;
    }

    if (input.period !== undefined) {
      updateData.period = input.period;
      
      // Recalculate end date if period or start date changes
      const startDate = input.startDate || existingBudget.startDate;
      if (input.period === 'MONTHLY') {
        updateData.endDate = endOfMonth(startDate);
      } else {
        updateData.endDate = endOfYear(startDate);
      }
    }

    if (input.startDate !== undefined) {
      updateData.startDate = input.startDate;
      
      // Recalculate end date
      const period = input.period || existingBudget.period;
      if (period === 'MONTHLY') {
        updateData.endDate = endOfMonth(input.startDate);
      } else {
        updateData.endDate = endOfYear(input.startDate);
      }
    }

    const budget = await ctx.prisma.budget.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    // Recalculate spent amount
    const spent = await this.calculateSpentAmount(budget, ctx);
    const remaining = budget.amount - spent;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    
    let status = 'good';
    if (percentage >= 100) status = 'danger';
    else if (percentage >= 80) status = 'warning';

    return {
      ...budget,
      spent,
      remaining,
      percentage,
      status,
    } as BudgetType;
  }

  /**
   * Delete a budget
   */
  @Authorized()
  @Mutation(() => Boolean)
  async deleteBudget(
    @Arg('id') id: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify budget exists and belongs to user
    const budget = await ctx.prisma.budget.findFirst({
      where: {
        id,
        userId: ctx.user.id,
      },
    });

    if (!budget) {
      throw new AppError('Budget not found', 404);
    }

    await ctx.prisma.budget.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Get budget summary statistics
   */
  @Authorized()
  @Query(() => BudgetSummary)
  async budgetSummary(
    @Arg('period', () => BudgetPeriod, { nullable: true }) period: BudgetPeriod,
    @Arg('familyId', { nullable: true }) familyId: string,
    @Ctx() ctx: Context
  ): Promise<BudgetSummary> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    const where: any = { userId: ctx.user.id };

    if (period) {
      where.period = period;
    }

    if (familyId) {
      where.familyId = familyId;
    }

    const budgets = await ctx.prisma.budget.findMany({
      where,
      include: { category: true },
    });

    let totalBudget = 0;
    let totalSpent = 0;
    let categoriesOverBudget = 0;
    let categoriesNearLimit = 0;

    for (const budget of budgets) {
      const spent = await this.calculateSpentAmount(budget, ctx);
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

      totalBudget += budget.amount;
      totalSpent += spent;

      if (percentage >= 100) {
        categoriesOverBudget++;
      } else if (percentage >= 80) {
        categoriesNearLimit++;
      }
    }

    const totalRemaining = totalBudget - totalSpent;
    const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
      totalBudget,
      totalSpent,
      totalRemaining,
      overallPercentage,
      categoriesOverBudget,
      categoriesNearLimit,
    };
  }

  /**
   * Helper method to calculate spent amount for a budget period
   */
  private async calculateSpentAmount(budget: any, ctx: Context): Promise<number> {
    const result = await ctx.prisma.transaction.aggregate({
      where: {
        categoryId: budget.categoryId,
        userId: budget.userId,
        familyId: budget.familyId || null,
        type: 'EXPENSE',
        date: {
          gte: budget.startDate,
          lte: budget.endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount || 0;
  }
}