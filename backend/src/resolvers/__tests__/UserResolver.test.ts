import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { UserResolver } from '../UserResolver'
import { createTestUser } from '../setup'

describe('UserResolver', () => {
  let prisma: PrismaClient
  let userResolver: UserResolver

  beforeAll(() => {
    prisma = global.__PRISMA__
    userResolver = new UserResolver()
  })

  describe('register', () => {
    it('creates a new user with valid input', async () => {
      const input = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      }

      const result = await userResolver.register(input)

      expect(result).toMatchObject({
        user: {
          email: 'newuser@example.com',
          name: 'New User',
        },
        token: expect.any(String),
        refreshToken: expect.any(String),
      })

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      })
      expect(user).toBeTruthy()
      expect(user?.name).toBe(input.name)
    })

    it('hashes the password', async () => {
      const input = {
        email: 'hashtest@example.com',
        password: 'plaintext123',
        name: 'Hash Test',
      }

      await userResolver.register(input)

      const user = await prisma.user.findUnique({
        where: { email: input.email },
      })

      expect(user?.password).not.toBe(input.password)
      expect(user?.password).toMatch(/^\$2[ayb]\$.{56}$/) // bcrypt hash pattern
    })

    it('throws error for duplicate email', async () => {
      const input = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'Duplicate User',
      }

      await userResolver.register(input)

      await expect(userResolver.register(input)).rejects.toThrow(
        /email already exists/i
      )
    })

    it('validates required fields', async () => {
      const invalidInputs = [
        { email: '', password: 'pass', name: 'Name' },
        { email: 'test@test.com', password: '', name: 'Name' },
        { email: 'test@test.com', password: 'pass', name: '' },
        { email: 'invalid-email', password: 'pass', name: 'Name' },
      ]

      for (const input of invalidInputs) {
        await expect(userResolver.register(input)).rejects.toThrow()
      }
    })
  })

  describe('login', () => {
    let testUser: any

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)
      testUser = await createTestUser({
        email: 'logintest@example.com',
        password: hashedPassword,
      })
    })

    it('logs in with valid credentials', async () => {
      const input = {
        email: 'logintest@example.com',
        password: 'password123',
      }

      const result = await userResolver.login(input)

      expect(result).toMatchObject({
        user: {
          id: testUser.id,
          email: 'logintest@example.com',
        },
        token: expect.any(String),
        refreshToken: expect.any(String),
      })

      // Verify token is valid
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as any
      expect(decoded.userId).toBe(testUser.id)
    })

    it('throws error for invalid email', async () => {
      const input = {
        email: 'nonexistent@example.com',
        password: 'password123',
      }

      await expect(userResolver.login(input)).rejects.toThrow(
        /invalid credentials/i
      )
    })

    it('throws error for invalid password', async () => {
      const input = {
        email: 'logintest@example.com',
        password: 'wrongpassword',
      }

      await expect(userResolver.login(input)).rejects.toThrow(
        /invalid credentials/i
      )
    })

    it('validates input fields', async () => {
      const invalidInputs = [
        { email: '', password: 'pass' },
        { email: 'test@test.com', password: '' },
        { email: 'invalid-email', password: 'pass' },
      ]

      for (const input of invalidInputs) {
        await expect(userResolver.login(input)).rejects.toThrow()
      }
    })
  })

  describe('me', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await createTestUser()
    })

    it('returns current user information', async () => {
      const context = { userId: testUser.id }

      const result = await userResolver.me(context)

      expect(result).toMatchObject({
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
      })
    })

    it('throws error when user not found', async () => {
      const context = { userId: 'nonexistent-id' }

      await expect(userResolver.me(context)).rejects.toThrow(
        /user not found/i
      )
    })

    it('throws error when not authenticated', async () => {
      const context = {}

      await expect(userResolver.me(context)).rejects.toThrow(
        /authentication required/i
      )
    })
  })

  describe('updateProfile', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await createTestUser()
    })

    it('updates user profile', async () => {
      const input = {
        name: 'Updated Name',
        avatar: 'https://example.com/new-avatar.jpg',
      }
      const context = { userId: testUser.id }

      const result = await userResolver.updateProfile(input, context)

      expect(result).toMatchObject({
        id: testUser.id,
        name: 'Updated Name',
        avatar: 'https://example.com/new-avatar.jpg',
      })

      // Verify database was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      })
      expect(updatedUser?.name).toBe('Updated Name')
      expect(updatedUser?.avatar).toBe('https://example.com/new-avatar.jpg')
    })

    it('updates only provided fields', async () => {
      const originalName = testUser.name
      const input = {
        avatar: 'https://example.com/avatar.jpg',
      }
      const context = { userId: testUser.id }

      const result = await userResolver.updateProfile(input, context)

      expect(result.name).toBe(originalName) // Should remain unchanged
      expect(result.avatar).toBe('https://example.com/avatar.jpg')
    })

    it('throws error when user not found', async () => {
      const input = { name: 'New Name' }
      const context = { userId: 'nonexistent-id' }

      await expect(userResolver.updateProfile(input, context)).rejects.toThrow(
        /user not found/i
      )
    })
  })

  describe('changePassword', () => {
    let testUser: any

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('oldpassword', 10)
      testUser = await createTestUser({
        password: hashedPassword,
      })
    })

    it('changes password with valid current password', async () => {
      const input = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      }
      const context = { userId: testUser.id }

      const result = await userResolver.changePassword(input, context)

      expect(result).toMatchObject({
        success: true,
        message: expect.stringContaining('password changed'),
      })

      // Verify password was changed
      const updatedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      })
      const isNewPasswordValid = await bcrypt.compare(
        'newpassword123',
        updatedUser!.password
      )
      expect(isNewPasswordValid).toBe(true)
    })

    it('throws error for invalid current password', async () => {
      const input = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
      }
      const context = { userId: testUser.id }

      await expect(userResolver.changePassword(input, context)).rejects.toThrow(
        /current password is incorrect/i
      )
    })

    it('validates new password strength', async () => {
      const input = {
        currentPassword: 'oldpassword',
        newPassword: '123', // Too short
      }
      const context = { userId: testUser.id }

      await expect(userResolver.changePassword(input, context)).rejects.toThrow(
        /password must be at least/i
      )
    })
  })

  describe('refreshToken', () => {
    let testUser: any
    let validRefreshToken: string

    beforeEach(async () => {
      testUser = await createTestUser()
      validRefreshToken = jwt.sign(
        { userId: testUser.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '30d' }
      )
    })

    it('generates new tokens with valid refresh token', async () => {
      const result = await userResolver.refreshToken(validRefreshToken)

      expect(result).toMatchObject({
        token: expect.any(String),
        refreshToken: expect.any(String),
      })

      // Verify new token is valid
      const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as any
      expect(decoded.userId).toBe(testUser.id)
    })

    it('throws error for invalid refresh token', async () => {
      const invalidToken = 'invalid-token'

      await expect(userResolver.refreshToken(invalidToken)).rejects.toThrow(
        /invalid refresh token/i
      )
    })

    it('throws error for expired refresh token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: '-1s' }
      )

      await expect(userResolver.refreshToken(expiredToken)).rejects.toThrow(
        /invalid refresh token/i
      )
    })
  })
})