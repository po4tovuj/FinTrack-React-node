import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from 'type-graphql';
import { Context } from '../types/context';
import { AppError } from '../middleware/errorHandler';
import { ObjectType, InputType, Field, Float, registerEnumType } from 'type-graphql';
import { ItemPriority } from '@prisma/client';

// Register enum for GraphQL
registerEnumType(ItemPriority, {
  name: 'ItemPriority',
  description: 'Priority level of shopping list item',
});

/**
 * GraphQL Object Types
 */
@ObjectType()
class ShoppingListItemType {
  @Field()
  id!: string;

  @Field()
  listId!: string;

  @Field()
  name!: string;

  @Field(() => Float)
  estimatedPrice!: number;

  @Field(() => Float, { nullable: true })
  actualPrice?: number;

  @Field({ nullable: true })
  categoryId?: string;

  @Field(() => ItemPriority)
  priority!: ItemPriority;

  @Field()
  purchased!: boolean;

  @Field({ nullable: true })
  purchasedAt?: Date;

  @Field({ nullable: true })
  purchasedBy?: string;

  @Field({ nullable: true })
  transactionId?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Virtual fields
  @Field({ nullable: true })
  categoryName?: string;

  @Field({ nullable: true })
  categoryColor?: string;
}

@ObjectType()
class ShoppingListType {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  userId!: string;

  @Field({ nullable: true })
  familyId?: string;

  @Field()
  shared!: boolean;

  @Field(() => [String])
  sharedWith!: string[];

  @Field(() => [ShoppingListItemType])
  items!: ShoppingListItemType[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  // Virtual fields
  @Field(() => Float)
  totalEstimated!: number;

  @Field(() => Float)
  totalActual!: number;

  @Field()
  totalItems!: number;

  @Field()
  purchasedItems!: number;
}

/**
 * GraphQL Input Types
 */
@InputType()
class CreateShoppingListInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ defaultValue: false })
  shared!: boolean;

  @Field(() => [String], { defaultValue: [] })
  sharedWith!: string[];

  @Field({ nullable: true })
  familyId?: string;
}

@InputType()
class UpdateShoppingListInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  shared?: boolean;

  @Field(() => [String], { nullable: true })
  sharedWith?: string[];
}

@InputType()
class CreateShoppingListItemInput {
  @Field()
  name!: string;

  @Field(() => Float)
  estimatedPrice!: number;

  @Field({ nullable: true })
  categoryId?: string;

  @Field(() => ItemPriority, { defaultValue: ItemPriority.NICE_TO_HAVE })
  priority!: ItemPriority;
}

@InputType()
class UpdateShoppingListItemInput {
  @Field({ nullable: true })
  name?: string;

  @Field(() => Float, { nullable: true })
  estimatedPrice?: number;

  @Field({ nullable: true })
  categoryId?: string;

  @Field(() => ItemPriority, { nullable: true })
  priority?: ItemPriority;
}

@InputType()
class MarkItemPurchasedInput {
  @Field(() => Float, { nullable: true })
  actualPrice?: number;

  @Field({ nullable: true })
  createTransaction?: boolean;
}

/**
 * Shopping List resolver for managing collaborative shopping lists
 */
@Resolver(() => ShoppingListType)
export class ShoppingListResolver {
  /**
   * Get all shopping lists for authenticated user
   */
  @Authorized()
  @Query(() => [ShoppingListType])
  async shoppingLists(
    @Arg('familyId', { nullable: true }) familyId: string,
    @Ctx() ctx: Context
  ): Promise<ShoppingListType[]> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    const where: any = {
      OR: [
        { userId: ctx.user.id },
        { sharedWith: { has: ctx.user.email } },
      ],
    };

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

    const lists = await ctx.prisma.shoppingList.findMany({
      where,
      include: {
        items: {
          include: {
            category: {
              select: { name: true, color: true },
            },
          },
          orderBy: [
            { purchased: 'asc' }, // Unpurchased items first
            { priority: 'asc' },  // Must-have first
            { createdAt: 'asc' },
          ],
        },
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return lists.map((list) => ({
      ...list,
      items: list.items.map((item) => ({
        ...item,
        categoryName: item.category?.name,
        categoryColor: item.category?.color,
      })),
      totalEstimated: list.items.reduce((sum, item) => sum + item.estimatedPrice, 0),
      totalActual: list.items.reduce((sum, item) => sum + (item.actualPrice || 0), 0),
      totalItems: list.items.length,
      purchasedItems: list.items.filter((item) => item.purchased).length,
    })) as ShoppingListType[];
  }

  /**
   * Get single shopping list by ID
   */
  @Authorized()
  @Query(() => ShoppingListType, { nullable: true })
  async shoppingList(
    @Arg('id') id: string,
    @Ctx() ctx: Context
  ): Promise<ShoppingListType | null> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    const list = await ctx.prisma.shoppingList.findFirst({
      where: {
        id,
        OR: [
          { userId: ctx.user.id },
          { sharedWith: { has: ctx.user.email } },
        ],
      },
      include: {
        items: {
          include: {
            category: {
              select: { name: true, color: true },
            },
          },
          orderBy: [
            { purchased: 'asc' },
            { priority: 'asc' },
            { createdAt: 'asc' },
          ],
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!list) {
      return null;
    }

    return {
      ...list,
      items: list.items.map((item) => ({
        ...item,
        categoryName: item.category?.name,
        categoryColor: item.category?.color,
      })),
      totalEstimated: list.items.reduce((sum, item) => sum + item.estimatedPrice, 0),
      totalActual: list.items.reduce((sum, item) => sum + (item.actualPrice || 0), 0),
      totalItems: list.items.length,
      purchasedItems: list.items.filter((item) => item.purchased).length,
    } as ShoppingListType;
  }

  /**
   * Create a new shopping list
   */
  @Authorized()
  @Mutation(() => ShoppingListType)
  async createShoppingList(
    @Arg('input') input: CreateShoppingListInput,
    @Ctx() ctx: Context
  ): Promise<ShoppingListType> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Validate input
    if (!input.name.trim()) {
      throw new AppError('Shopping list name is required', 400, 'VALIDATION_ERROR');
    }

    if (input.name.trim().length > 100) {
      throw new AppError('Shopping list name must be 100 characters or less', 400, 'VALIDATION_ERROR');
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

    // Validate shared emails
    let sharedWith = input.sharedWith;
    if (input.shared && sharedWith.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      for (const email of sharedWith) {
        if (!emailRegex.test(email)) {
          throw new AppError(`Invalid email address: ${email}`, 400, 'VALIDATION_ERROR');
        }
      }

      // Remove duplicates and user's own email
      sharedWith = [...new Set(sharedWith)].filter(email => email !== ctx.user!.email);
    }

    const list = await ctx.prisma.shoppingList.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim(),
        shared: input.shared,
        sharedWith: sharedWith,
        userId: ctx.user.id,
        familyId: input.familyId,
      },
      include: {
        items: {
          include: {
            category: {
              select: { name: true, color: true },
            },
          },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return {
      ...list,
      items: [],
      totalEstimated: 0,
      totalActual: 0,
      totalItems: 0,
      purchasedItems: 0,
    } as ShoppingListType;
  }

  /**
   * Update shopping list details
   */
  @Authorized()
  @Mutation(() => ShoppingListType)
  async updateShoppingList(
    @Arg('id') id: string,
    @Arg('input') input: UpdateShoppingListInput,
    @Ctx() ctx: Context
  ): Promise<ShoppingListType> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify list exists and user has permission to edit
    const existingList = await ctx.prisma.shoppingList.findFirst({
      where: {
        id,
        userId: ctx.user.id, // Only owner can update
      },
    });

    if (!existingList) {
      throw new AppError('Shopping list not found or access denied', 404);
    }

    // Build update data
    const updateData: any = {};

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new AppError('Shopping list name cannot be empty', 400, 'VALIDATION_ERROR');
      }
      if (input.name.trim().length > 100) {
        throw new AppError('Shopping list name must be 100 characters or less', 400, 'VALIDATION_ERROR');
      }
      updateData.name = input.name.trim();
    }

    if (input.description !== undefined) {
      updateData.description = input.description?.trim() || null;
    }

    if (input.shared !== undefined) {
      updateData.shared = input.shared;
    }

    if (input.sharedWith !== undefined) {
      // Validate emails
      if (input.sharedWith.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const email of input.sharedWith) {
          if (!emailRegex.test(email)) {
            throw new AppError(`Invalid email address: ${email}`, 400, 'VALIDATION_ERROR');
          }
        }
      }

      // Remove duplicates and user's own email
      updateData.sharedWith = [...new Set(input.sharedWith)].filter(email => email !== ctx.user!.email);
    }

    const list = await ctx.prisma.shoppingList.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            category: {
              select: { name: true, color: true },
            },
          },
          orderBy: [
            { purchased: 'asc' },
            { priority: 'asc' },
            { createdAt: 'asc' },
          ],
        },
      },
    });

    return {
      ...list,
      items: list.items.map((item) => ({
        ...item,
        categoryName: item.category?.name,
        categoryColor: item.category?.color,
      })),
      totalEstimated: list.items.reduce((sum, item) => sum + item.estimatedPrice, 0),
      totalActual: list.items.reduce((sum, item) => sum + (item.actualPrice || 0), 0),
      totalItems: list.items.length,
      purchasedItems: list.items.filter((item) => item.purchased).length,
    } as ShoppingListType;
  }

  /**
   * Delete shopping list
   */
  @Authorized()
  @Mutation(() => Boolean)
  async deleteShoppingList(
    @Arg('id') id: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify list exists and user owns it
    const list = await ctx.prisma.shoppingList.findFirst({
      where: {
        id,
        userId: ctx.user.id,
      },
    });

    if (!list) {
      throw new AppError('Shopping list not found or access denied', 404);
    }

    await ctx.prisma.shoppingList.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Add item to shopping list
   */
  @Authorized()
  @Mutation(() => ShoppingListItemType)
  async addShoppingListItem(
    @Arg('listId') listId: string,
    @Arg('input') input: CreateShoppingListItemInput,
    @Ctx() ctx: Context
  ): Promise<ShoppingListItemType> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify user has access to list
    const list = await ctx.prisma.shoppingList.findFirst({
      where: {
        id: listId,
        OR: [
          { userId: ctx.user.id },
          { sharedWith: { has: ctx.user.email } },
        ],
      },
    });

    if (!list) {
      throw new AppError('Shopping list not found or access denied', 404);
    }

    // Validate input
    if (!input.name.trim()) {
      throw new AppError('Item name is required', 400, 'VALIDATION_ERROR');
    }

    if (input.estimatedPrice < 0) {
      throw new AppError('Estimated price cannot be negative', 400, 'VALIDATION_ERROR');
    }

    // Verify category exists if provided
    if (input.categoryId) {
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
    }

    const item = await ctx.prisma.shoppingListItem.create({
      data: {
        listId,
        name: input.name.trim(),
        estimatedPrice: input.estimatedPrice,
        categoryId: input.categoryId,
        priority: input.priority,
      },
      include: {
        category: {
          select: { name: true, color: true },
        },
      },
    });

    return {
      ...item,
      categoryName: item.category?.name,
      categoryColor: item.category?.color,
    } as ShoppingListItemType;
  }

  /**
   * Update shopping list item
   */
  @Authorized()
  @Mutation(() => ShoppingListItemType)
  async updateShoppingListItem(
    @Arg('itemId') itemId: string,
    @Arg('input') input: UpdateShoppingListItemInput,
    @Ctx() ctx: Context
  ): Promise<ShoppingListItemType> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify item exists and user has access
    const item = await ctx.prisma.shoppingListItem.findFirst({
      where: { id: itemId },
      include: {
        shoppingList: {
          select: {
            userId: true,
            sharedWith: true,
          },
        },
      },
    });

    if (!item) {
      throw new AppError('Shopping list item not found', 404);
    }

    // Check permissions
    const hasAccess = item.shoppingList.userId === ctx.user.id ||
                      item.shoppingList.sharedWith.includes(ctx.user.email);

    if (!hasAccess) {
      throw new AppError('Access denied to shopping list item', 403);
    }

    // Build update data
    const updateData: any = {};

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new AppError('Item name cannot be empty', 400, 'VALIDATION_ERROR');
      }
      updateData.name = input.name.trim();
    }

    if (input.estimatedPrice !== undefined) {
      if (input.estimatedPrice < 0) {
        throw new AppError('Estimated price cannot be negative', 400, 'VALIDATION_ERROR');
      }
      updateData.estimatedPrice = input.estimatedPrice;
    }

    if (input.priority !== undefined) {
      updateData.priority = input.priority;
    }

    if (input.categoryId !== undefined) {
      if (input.categoryId) {
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
      }
      updateData.categoryId = input.categoryId || null;
    }

    const updatedItem = await ctx.prisma.shoppingListItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        category: {
          select: { name: true, color: true },
        },
      },
    });

    return {
      ...updatedItem,
      categoryName: updatedItem.category?.name,
      categoryColor: updatedItem.category?.color,
    } as ShoppingListItemType;
  }

  /**
   * Mark item as purchased
   */
  @Authorized()
  @Mutation(() => ShoppingListItemType)
  async markItemPurchased(
    @Arg('itemId') itemId: string,
    @Arg('input') input: MarkItemPurchasedInput,
    @Ctx() ctx: Context
  ): Promise<ShoppingListItemType> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify item exists and user has access
    const item = await ctx.prisma.shoppingListItem.findFirst({
      where: { id: itemId },
      include: {
        shoppingList: true,
        category: {
          select: { name: true, color: true },
        },
      },
    });

    if (!item) {
      throw new AppError('Shopping list item not found', 404);
    }

    // Check permissions
    const hasAccess = item.shoppingList.userId === ctx.user.id ||
                      item.shoppingList.sharedWith.includes(ctx.user.email);

    if (!hasAccess) {
      throw new AppError('Access denied to shopping list item', 403);
    }

    const actualPrice = input.actualPrice || item.estimatedPrice;

    // Update item as purchased
    const updatedItem = await ctx.prisma.shoppingListItem.update({
      where: { id: itemId },
      data: {
        purchased: true,
        purchasedAt: new Date(),
        purchasedBy: ctx.user.id,
        actualPrice,
      },
      include: {
        category: {
          select: { name: true, color: true },
        },
      },
    });

    // Create transaction if requested
    if (input.createTransaction && item.categoryId) {
      const transaction = await ctx.prisma.transaction.create({
        data: {
          amount: actualPrice,
          description: `Shopping: ${item.name}`,
          type: 'EXPENSE',
          date: new Date(),
          categoryId: item.categoryId,
          userId: ctx.user.id,
          familyId: item.shoppingList.familyId,
        },
      });

      // Link transaction to shopping item
      await ctx.prisma.shoppingListItem.update({
        where: { id: itemId },
        data: { transactionId: transaction.id },
      });
    }

    return {
      ...updatedItem,
      categoryName: updatedItem.category?.name,
      categoryColor: updatedItem.category?.color,
    } as ShoppingListItemType;
  }

  /**
   * Remove item from shopping list
   */
  @Authorized()
  @Mutation(() => Boolean)
  async removeShoppingListItem(
    @Arg('itemId') itemId: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify item exists and user has access
    const item = await ctx.prisma.shoppingListItem.findFirst({
      where: { id: itemId },
      include: {
        shoppingList: {
          select: {
            userId: true,
            sharedWith: true,
          },
        },
      },
    });

    if (!item) {
      throw new AppError('Shopping list item not found', 404);
    }

    // Check permissions
    const hasAccess = item.shoppingList.userId === ctx.user.id ||
                      item.shoppingList.sharedWith.includes(ctx.user.email);

    if (!hasAccess) {
      throw new AppError('Access denied to shopping list item', 403);
    }

    await ctx.prisma.shoppingListItem.delete({
      where: { id: itemId },
    });

    return true;
  }
}