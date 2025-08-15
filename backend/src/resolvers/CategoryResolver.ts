import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from 'type-graphql';
import { Context } from '../types/context';
import { AppError } from '../middleware/errorHandler';
import { ObjectType, InputType, Field, registerEnumType } from 'type-graphql';
import { TransactionType as PrismaTransactionType } from '@prisma/client';

/**
 * GraphQL Object Types
 */
@ObjectType()
class CategoryType {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  color!: string;

  @Field({ nullable: true })
  icon?: string;

  @Field(() => PrismaTransactionType)
  type!: PrismaTransactionType;

  @Field({ nullable: true })
  userId?: string;

  @Field()
  isDefault!: boolean;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

/**
 * GraphQL Input Types
 */
@InputType()
class CreateCategoryInput {
  @Field()
  name!: string;

  @Field()
  color!: string;

  @Field({ nullable: true })
  icon?: string;

  @Field(() => PrismaTransactionType)
  type!: PrismaTransactionType;
}

@InputType()
class UpdateCategoryInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  color?: string;

  @Field({ nullable: true })
  icon?: string;
}

/**
 * Category resolver for managing transaction categories
 */
@Resolver(() => CategoryType)
export class CategoryResolver {
  /**
   * Get all categories available to the user (user's + default categories)
   */
  @Authorized()
  @Query(() => [CategoryType])
  async categories(
    @Arg('type', () => PrismaTransactionType, { nullable: true }) type: PrismaTransactionType,
    @Ctx() ctx: Context
  ): Promise<CategoryType[]> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    const where: any = {
      OR: [
        { userId: ctx.user.id },
        { isDefault: true },
      ],
    };

    if (type) {
      where.type = type;
    }

    const categories = await ctx.prisma.category.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' }, // Default categories first
        { name: 'asc' },
      ],
    });

    return categories as CategoryType[];
  }

  /**
   * Get single category by ID
   */
  @Authorized()
  @Query(() => CategoryType, { nullable: true })
  async category(
    @Arg('id') id: string,
    @Ctx() ctx: Context
  ): Promise<CategoryType | null> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    const category = await ctx.prisma.category.findFirst({
      where: {
        id,
        OR: [
          { userId: ctx.user.id },
          { isDefault: true },
        ],
      },
    });

    return category as CategoryType | null;
  }

  /**
   * Create a new category
   */
  @Authorized()
  @Mutation(() => CategoryType)
  async createCategory(
    @Arg('input') input: CreateCategoryInput,
    @Ctx() ctx: Context
  ): Promise<CategoryType> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Validate input
    if (!input.name.trim()) {
      throw new AppError('Category name is required', 400, 'VALIDATION_ERROR');
    }

    if (input.name.trim().length > 50) {
      throw new AppError('Category name must be 50 characters or less', 400, 'VALIDATION_ERROR');
    }

    // Validate color format (hex color)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(input.color)) {
      throw new AppError('Invalid color format. Use hex color (e.g., #FF0000)', 400, 'VALIDATION_ERROR');
    }

    // Check if category with same name already exists for this user
    const existingCategory = await ctx.prisma.category.findFirst({
      where: {
        name: {
          equals: input.name.trim(),
          mode: 'insensitive',
        },
        userId: ctx.user.id,
        type: input.type,
      },
    });

    if (existingCategory) {
      throw new AppError('A category with this name already exists', 409, 'CATEGORY_EXISTS');
    }

    const category = await ctx.prisma.category.create({
      data: {
        name: input.name.trim(),
        color: input.color.toUpperCase(),
        icon: input.icon?.trim() || undefined,
        type: input.type,
        userId: ctx.user.id,
        isDefault: false,
      },
    });

    return category as CategoryType;
  }

  /**
   * Update an existing category
   */
  @Authorized()
  @Mutation(() => CategoryType)
  async updateCategory(
    @Arg('id') id: string,
    @Arg('input') input: UpdateCategoryInput,
    @Ctx() ctx: Context
  ): Promise<CategoryType> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify category exists and belongs to user (cannot update default categories)
    const existingCategory = await ctx.prisma.category.findFirst({
      where: {
        id,
        userId: ctx.user.id,
      },
    });

    if (!existingCategory) {
      throw new AppError('Category not found or cannot be modified', 404);
    }

    // Build update data
    const updateData: any = {};

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new AppError('Category name cannot be empty', 400, 'VALIDATION_ERROR');
      }

      if (input.name.trim().length > 50) {
        throw new AppError('Category name must be 50 characters or less', 400, 'VALIDATION_ERROR');
      }

      // Check if another category with same name exists
      const duplicateCategory = await ctx.prisma.category.findFirst({
        where: {
          name: {
            equals: input.name.trim(),
            mode: 'insensitive',
          },
          userId: ctx.user.id,
          type: existingCategory.type,
          id: { not: id },
        },
      });

      if (duplicateCategory) {
        throw new AppError('A category with this name already exists', 409, 'CATEGORY_EXISTS');
      }

      updateData.name = input.name.trim();
    }

    if (input.color !== undefined) {
      // Validate color format
      const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexColorRegex.test(input.color)) {
        throw new AppError('Invalid color format. Use hex color (e.g., #FF0000)', 400, 'VALIDATION_ERROR');
      }
      updateData.color = input.color.toUpperCase();
    }

    if (input.icon !== undefined) {
      updateData.icon = input.icon?.trim() || null;
    }

    const category = await ctx.prisma.category.update({
      where: { id },
      data: updateData,
    });

    return category as CategoryType;
  }

  /**
   * Delete a category
   */
  @Authorized()
  @Mutation(() => Boolean)
  async deleteCategory(
    @Arg('id') id: string,
    @Arg('moveTransactionsTo', { nullable: true }) moveTransactionsTo: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify category exists and belongs to user (cannot delete default categories)
    const category = await ctx.prisma.category.findFirst({
      where: {
        id,
        userId: ctx.user.id,
      },
    });

    if (!category) {
      throw new AppError('Category not found or cannot be deleted', 404);
    }

    // Check if category has transactions
    const transactionCount = await ctx.prisma.transaction.count({
      where: {
        categoryId: id,
        userId: ctx.user.id,
      },
    });

    if (transactionCount > 0) {
      if (!moveTransactionsTo) {
        throw new AppError(
          `Cannot delete category with ${transactionCount} transactions. Please specify a category to move transactions to.`,
          400,
          'CATEGORY_HAS_TRANSACTIONS'
        );
      }

      // Verify target category exists and belongs to user
      const targetCategory = await ctx.prisma.category.findFirst({
        where: {
          id: moveTransactionsTo,
          OR: [
            { userId: ctx.user.id },
            { isDefault: true },
          ],
          type: category.type, // Must be same type
        },
      });

      if (!targetCategory) {
        throw new AppError('Target category not found or incompatible', 404);
      }

      // Move transactions to target category
      await ctx.prisma.transaction.updateMany({
        where: {
          categoryId: id,
          userId: ctx.user.id,
        },
        data: {
          categoryId: moveTransactionsTo,
        },
      });
    }

    // Delete the category
    await ctx.prisma.category.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Get default system categories
   */
  @Query(() => [CategoryType])
  async defaultCategories(
    @Arg('type', () => PrismaTransactionType, { nullable: true }) type: PrismaTransactionType,
    @Ctx() ctx: Context
  ): Promise<CategoryType[]> {
    const where: any = { isDefault: true };

    if (type) {
      where.type = type;
    }

    const categories = await ctx.prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return categories as CategoryType[];
  }
}