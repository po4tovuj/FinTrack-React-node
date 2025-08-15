import 'reflect-metadata';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { buildSchema } from 'type-graphql';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

// Import resolvers
import { UserResolver } from './resolvers/UserResolver';
import { TransactionResolver } from './resolvers/TransactionResolver';
import { BudgetResolver } from './resolvers/BudgetResolver';
import { CategoryResolver } from './resolvers/CategoryResolver';
import { FamilyResolver } from './resolvers/FamilyResolver';
import { ShoppingListResolver } from './resolvers/ShoppingListResolver';

// Import middleware
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

// Import types
import { Context } from './types/context';

/**
 * Main server application for FinTrack GraphQL API
 * Handles authentication, GraphQL operations, and WebSocket subscriptions
 */
class FinTrackServer {
  private app: express.Application;
  private httpServer: any;
  private apolloServer: ApolloServer;
  private prisma: PrismaClient;
  private redis: any;
  
  constructor() {
    this.app = express();
    this.prisma = new PrismaClient();
    this.redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    this.setupMiddleware();
  }

  /**
   * Set up Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Allow GraphQL Playground in development
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL || 'http://localhost:3000']
        : true,
      credentials: true,
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // More requests in development
      message: 'Too many requests from this IP, please try again later.',
    });
    this.app.use('/graphql', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
      });
    });
  }

  /**
   * Initialize Apollo Server with GraphQL schema and subscriptions
   */
  private async initializeApolloServer(): Promise<void> {
    // Create HTTP server
    this.httpServer = createServer(this.app);

    // Build GraphQL schema
    const schema = await buildSchema({
      resolvers: [
        UserResolver,
        TransactionResolver,
        BudgetResolver,
        CategoryResolver,
        FamilyResolver,
        ShoppingListResolver,
      ],
      validate: false, // Disable class-validator integration for now
      authChecker: ({ context }: { context: Context }) => {
        // Simple auth check - user must be authenticated
        return !!context.user;
      },
    });

    // Create WebSocket server for subscriptions
    const wsServer = new WebSocketServer({
      server: this.httpServer,
      path: '/graphql',
    });

    // Set up GraphQL WebSocket server
    const serverCleanup = useServer({
      schema,
      context: async (ctx, msg, args) => {
        // Create context for WebSocket connections
        return {
          prisma: this.prisma,
          redis: this.redis,
          user: null, // TODO: Implement WebSocket authentication
        };
      },
    }, wsServer);

    // Create Apollo Server
    this.apolloServer = new ApolloServer({
      schema,
      plugins: [
        // Proper shutdown for HTTP server
        ApolloServerPluginDrainHttpServer({ httpServer: this.httpServer }),

        // Proper shutdown for WebSocket server
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
      ],
      // Enable GraphQL Playground in development
      introspection: process.env.NODE_ENV !== 'production',
      // Custom error formatting
      formatError: (error) => {
        console.error('GraphQL Error:', error);
        return {
          message: error.message,
          locations: error.locations,
          path: error.path,
          extensions: {
            code: error.extensions?.code,
            timestamp: new Date().toISOString(),
          },
        };
      },
    });

    await this.apolloServer.start();
  }

  /**
   * Set up GraphQL endpoint with context
   */
  private setupGraphQLEndpoint(): void {
    this.app.use(
      '/graphql',
      expressMiddleware(this.apolloServer, {
        context: async ({ req }): Promise<Context> => {
          // Create context for each request
          const context: Context = {
            prisma: this.prisma,
            redis: this.redis,
            user: null,
            req,
          };

          // Add authenticated user to context
          try {
            const user = await authMiddleware(req, this.prisma);
            context.user = user;
          } catch (error) {
            // User not authenticated - this is okay for some operations
            console.log('User not authenticated:', (error as Error).message);
          }

          return context;
        },
      })
    );
  }

  /**
   * Set up error handling
   */
  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  /**
   * Connect to database and Redis
   */
  private async connectDatabases(): Promise<void> {
    try {
      await this.prisma.$connect();
      console.log('✅ Connected to PostgreSQL database');

      await this.redis.connect();
      await this.redis.ping();
      console.log('✅ Connected to Redis');
    } catch (error) {
      console.error('❌ Database connection error:', error);
      throw error;
    }
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
    try {
      await this.connectDatabases();
      await this.initializeApolloServer();
      this.setupGraphQLEndpoint();
      this.setupErrorHandling();

      const PORT = process.env.PORT || 4000;
      
      this.httpServer.listen(PORT, () => {
        console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
        console.log(`📱 WebSocket subscriptions ready at ws://localhost:${PORT}/graphql`);
        console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
        
        if (process.env.NODE_ENV !== 'production') {
          console.log(`🎮 GraphQL Playground available at http://localhost:${PORT}/graphql`);
        }
      });

      // Graceful shutdown
      process.on('SIGTERM', async () => {
        console.log('SIGTERM received, shutting down gracefully');
        await this.shutdown();
      });

      process.on('SIGINT', async () => {
        console.log('SIGINT received, shutting down gracefully');
        await this.shutdown();
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    try {
      await this.apolloServer.stop();
      await this.prisma.$disconnect();
      await this.redis.disconnect();
      this.httpServer.close(() => {
        console.log('✅ Server shut down gracefully');
        process.exit(0);
      });
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new FinTrackServer();
server.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});