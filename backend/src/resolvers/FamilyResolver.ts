import { Resolver, Query, Mutation, Arg, Ctx, Authorized } from 'type-graphql';
import { Context } from '../types/context';
import { AppError } from '../middleware/errorHandler';
import { ObjectType, InputType, Field, registerEnumType } from 'type-graphql';
import { FamilyRole } from '@prisma/client';

// Register enum for GraphQL
registerEnumType(FamilyRole, {
  name: 'FamilyRole',
  description: 'Role of family member',
});

/**
 * GraphQL Object Types
 */
@ObjectType()
class FamilyType {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  createdBy!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
class FamilyMemberType {
  @Field()
  id!: string;

  @Field()
  familyId!: string;

  @Field()
  userId!: string;

  @Field(() => FamilyRole)
  role!: FamilyRole;

  @Field(() => [String])
  permissions!: string[];

  @Field()
  joinedAt!: Date;

  // Virtual fields populated from relations
  @Field({ nullable: true })
  userName?: string;

  @Field({ nullable: true })
  userEmail?: string;

  @Field({ nullable: true })
  userAvatar?: string;
}

@ObjectType()
class FamilyWithMembers {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  createdBy!: string;

  @Field(() => [FamilyMemberType])
  members!: FamilyMemberType[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

/**
 * GraphQL Input Types
 */
@InputType()
class CreateFamilyInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
class UpdateFamilyInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;
}

@InputType()
class InviteMemberInput {
  @Field()
  email!: string;

  @Field(() => FamilyRole, { defaultValue: FamilyRole.MEMBER })
  role!: FamilyRole;

  @Field(() => [String], { defaultValue: ['VIEW', 'ADD_TRANSACTIONS'] })
  permissions!: string[];
}

@InputType()
class UpdateMemberInput {
  @Field(() => FamilyRole, { nullable: true })
  role?: FamilyRole;

  @Field(() => [String], { nullable: true })
  permissions?: string[];
}

/**
 * Family resolver for managing family groups and shared finances
 */
@Resolver(() => FamilyType)
export class FamilyResolver {
  /**
   * Get all families user is a member of
   */
  @Authorized()
  @Query(() => [FamilyWithMembers])
  async families(@Ctx() ctx: Context): Promise<FamilyWithMembers[]> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    const familyMembers = await ctx.prisma.familyMember.findMany({
      where: { userId: ctx.user.id },
      include: {
        family: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return familyMembers.map((fm) => ({
      ...fm.family,
      members: fm.family.members.map((member) => ({
        id: member.id,
        familyId: member.familyId,
        userId: member.userId,
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.joinedAt,
        userName: member.user.name,
        userEmail: member.user.email,
        userAvatar: member.user.avatar,
      })),
    })) as FamilyWithMembers[];
  }

  /**
   * Get single family by ID
   */
  @Authorized()
  @Query(() => FamilyWithMembers, { nullable: true })
  async family(
    @Arg('id') id: string,
    @Ctx() ctx: Context
  ): Promise<FamilyWithMembers | null> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify user is a member of this family
    const familyMember = await ctx.prisma.familyMember.findFirst({
      where: {
        familyId: id,
        userId: ctx.user.id,
      },
    });

    if (!familyMember) {
      throw new AppError('Family not found or access denied', 404);
    }

    const family = await ctx.prisma.family.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!family) {
      return null;
    }

    return {
      ...family,
      members: family.members.map((member) => ({
        id: member.id,
        familyId: member.familyId,
        userId: member.userId,
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.joinedAt,
        userName: member.user.name,
        userEmail: member.user.email,
        userAvatar: member.user.avatar,
      })),
    } as FamilyWithMembers;
  }

  /**
   * Create a new family
   */
  @Authorized()
  @Mutation(() => FamilyWithMembers)
  async createFamily(
    @Arg('input') input: CreateFamilyInput,
    @Ctx() ctx: Context
  ): Promise<FamilyWithMembers> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Validate input
    if (!input.name.trim()) {
      throw new AppError('Family name is required', 400, 'VALIDATION_ERROR');
    }

    if (input.name.trim().length > 100) {
      throw new AppError('Family name must be 100 characters or less', 400, 'VALIDATION_ERROR');
    }

    // Create family with creator as admin
    const family = await ctx.prisma.family.create({
      data: {
        name: input.name.trim(),
        description: input.description?.trim(),
        createdBy: ctx.user.id,
        members: {
          create: {
            userId: ctx.user.id,
            role: FamilyRole.ADMIN,
            permissions: ['VIEW', 'ADD_TRANSACTIONS', 'EDIT_TRANSACTIONS', 'MANAGE_BUDGETS', 'MANAGE_MEMBERS'],
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    return {
      ...family,
      members: family.members.map((member) => ({
        id: member.id,
        familyId: member.familyId,
        userId: member.userId,
        role: member.role,
        permissions: member.permissions,
        joinedAt: member.joinedAt,
        userName: member.user.name,
        userEmail: member.user.email,
        userAvatar: member.user.avatar,
      })),
    } as FamilyWithMembers;
  }

  /**
   * Update family details
   */
  @Authorized()
  @Mutation(() => FamilyType)
  async updateFamily(
    @Arg('id') id: string,
    @Arg('input') input: UpdateFamilyInput,
    @Ctx() ctx: Context
  ): Promise<FamilyType> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify user is admin of this family
    await this.verifyFamilyAdmin(id, ctx.user.id, ctx);

    // Build update data
    const updateData: any = {};

    if (input.name !== undefined) {
      if (!input.name.trim()) {
        throw new AppError('Family name cannot be empty', 400, 'VALIDATION_ERROR');
      }
      if (input.name.trim().length > 100) {
        throw new AppError('Family name must be 100 characters or less', 400, 'VALIDATION_ERROR');
      }
      updateData.name = input.name.trim();
    }

    if (input.description !== undefined) {
      updateData.description = input.description?.trim() || null;
    }

    const family = await ctx.prisma.family.update({
      where: { id },
      data: updateData,
    });

    return family as FamilyType;
  }

  /**
   * Invite a user to join family by email
   */
  @Authorized()
  @Mutation(() => Boolean)
  async inviteMember(
    @Arg('familyId') familyId: string,
    @Arg('input') input: InviteMemberInput,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify user can manage members in this family
    await this.verifyFamilyPermission(familyId, ctx.user.id, 'MANAGE_MEMBERS', ctx);

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      throw new AppError('Invalid email address', 400, 'VALIDATION_ERROR');
    }

    // Check if user exists
    const invitedUser = await ctx.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (!invitedUser) {
      throw new AppError('User with this email address not found', 404, 'USER_NOT_FOUND');
    }

    // Check if user is already a member
    const existingMember = await ctx.prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: invitedUser.id,
      },
    });

    if (existingMember) {
      throw new AppError('User is already a member of this family', 409, 'ALREADY_MEMBER');
    }

    // Add user to family
    await ctx.prisma.familyMember.create({
      data: {
        familyId,
        userId: invitedUser.id,
        role: input.role,
        permissions: input.permissions,
      },
    });

    // TODO: Send invitation email notification

    return true;
  }

  /**
   * Update family member permissions
   */
  @Authorized()
  @Mutation(() => FamilyMemberType)
  async updateMember(
    @Arg('familyId') familyId: string,
    @Arg('memberId') memberId: string,
    @Arg('input') input: UpdateMemberInput,
    @Ctx() ctx: Context
  ): Promise<FamilyMemberType> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify user can manage members in this family
    await this.verifyFamilyPermission(familyId, ctx.user.id, 'MANAGE_MEMBERS', ctx);

    // Verify member exists in this family
    const member = await ctx.prisma.familyMember.findFirst({
      where: {
        id: memberId,
        familyId,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    if (!member) {
      throw new AppError('Family member not found', 404);
    }

    // Prevent changing own role/permissions
    if (member.userId === ctx.user.id) {
      throw new AppError('Cannot modify your own role or permissions', 400, 'SELF_MODIFICATION');
    }

    // Build update data
    const updateData: any = {};

    if (input.role !== undefined) {
      updateData.role = input.role;
    }

    if (input.permissions !== undefined) {
      updateData.permissions = input.permissions;
    }

    const updatedMember = await ctx.prisma.familyMember.update({
      where: { id: memberId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, avatar: true },
        },
      },
    });

    return {
      id: updatedMember.id,
      familyId: updatedMember.familyId,
      userId: updatedMember.userId,
      role: updatedMember.role,
      permissions: updatedMember.permissions,
      joinedAt: updatedMember.joinedAt,
      userName: updatedMember.user.name,
      userEmail: updatedMember.user.email,
      userAvatar: updatedMember.user.avatar,
    } as FamilyMemberType;
  }

  /**
   * Remove member from family
   */
  @Authorized()
  @Mutation(() => Boolean)
  async removeMember(
    @Arg('familyId') familyId: string,
    @Arg('memberId') memberId: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Get member details
    const member = await ctx.prisma.familyMember.findFirst({
      where: {
        id: memberId,
        familyId,
      },
    });

    if (!member) {
      throw new AppError('Family member not found', 404);
    }

    // Users can remove themselves, or admins can remove others
    if (member.userId !== ctx.user.id) {
      await this.verifyFamilyPermission(familyId, ctx.user.id, 'MANAGE_MEMBERS', ctx);
    }

    // Prevent removing the family creator if they're the only admin
    if (member.role === FamilyRole.ADMIN) {
      const adminCount = await ctx.prisma.familyMember.count({
        where: {
          familyId,
          role: FamilyRole.ADMIN,
        },
      });

      if (adminCount === 1) {
        throw new AppError('Cannot remove the last admin from the family', 400, 'LAST_ADMIN');
      }
    }

    await ctx.prisma.familyMember.delete({
      where: { id: memberId },
    });

    return true;
  }

  /**
   * Leave family (remove self)
   */
  @Authorized()
  @Mutation(() => Boolean)
  async leaveFamily(
    @Arg('familyId') familyId: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    const membership = await ctx.prisma.familyMember.findFirst({
      where: {
        familyId,
        userId: ctx.user.id,
      },
    });

    if (!membership) {
      throw new AppError('You are not a member of this family', 404);
    }

    // Check if user is the last admin
    if (membership.role === FamilyRole.ADMIN) {
      const adminCount = await ctx.prisma.familyMember.count({
        where: {
          familyId,
          role: FamilyRole.ADMIN,
        },
      });

      if (adminCount === 1) {
        throw new AppError('Cannot leave family as the last admin. Transfer admin role first.', 400, 'LAST_ADMIN');
      }
    }

    await ctx.prisma.familyMember.delete({
      where: { id: membership.id },
    });

    return true;
  }

  /**
   * Delete family (admin only)
   */
  @Authorized()
  @Mutation(() => Boolean)
  async deleteFamily(
    @Arg('id') id: string,
    @Ctx() ctx: Context
  ): Promise<boolean> {
    if (!ctx.user) {
      throw new AppError('User not authenticated', 401);
    }

    // Verify user is admin of this family
    await this.verifyFamilyAdmin(id, ctx.user.id, ctx);

    // Delete family (this will cascade delete members, transactions, etc.)
    await ctx.prisma.family.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Helper: Verify user is admin of family
   */
  private async verifyFamilyAdmin(familyId: string, userId: string, ctx: Context): Promise<void> {
    const membership = await ctx.prisma.familyMember.findFirst({
      where: {
        familyId,
        userId,
        role: FamilyRole.ADMIN,
      },
    });

    if (!membership) {
      throw new AppError('Access denied. Admin privileges required.', 403);
    }
  }

  /**
   * Helper: Verify user has specific permission in family
   */
  private async verifyFamilyPermission(
    familyId: string,
    userId: string,
    permission: string,
    ctx: Context
  ): Promise<void> {
    const membership = await ctx.prisma.familyMember.findFirst({
      where: {
        familyId,
        userId,
      },
    });

    if (!membership) {
      throw new AppError('Family not found or access denied', 404);
    }

    // Admins have all permissions
    if (membership.role === FamilyRole.ADMIN) {
      return;
    }

    // Check specific permission
    if (!membership.permissions.includes(permission)) {
      throw new AppError(`Access denied. ${permission} permission required.`, 403);
    }
  }
}