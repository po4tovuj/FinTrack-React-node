# FinTrack Development Setup Guide

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git
- Railway account (for deployment)

## Quick Start

1. **Clone and setup environment**
   ```bash
   git clone <repository-url>
   cd fintrack
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start development environment**
   ```bash
   docker compose up -d
   ```

3. **Initialize database**
   ```bash
   # Run in backend container or locally
   cd backend
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend GraphQL: http://localhost:4000/graphql
   - Database: PostgreSQL on localhost:5432

## Development Workflow

### 1. Local Development
```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### 2. Database Management
```bash
# Generate Prisma client
cd backend && npx prisma generate

# Create new migration
cd backend && npx prisma migrate dev --name description

# Reset database (development only)
cd backend && npx prisma migrate reset

# View database
cd backend && npx prisma studio
```

### 3. Frontend Development
```bash
# Install dependencies
cd frontend && npm install

# Start development server (outside Docker)
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Run tests
cd frontend && npm test
```

### 4. Backend Development
```bash
# Install dependencies
cd backend && npm install

# Start development server (outside Docker)
cd backend && npm run dev

# Build TypeScript
cd backend && npm run build

# Run tests
cd backend && npm test
```

## Environment Configuration

### Required Environment Variables

**Root `.env`:**
```bash
# Database
POSTGRES_DB=fintrack
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# JWT
JWT_SECRET=your-development-jwt-secret
NEXTAUTH_SECRET=your-development-nextauth-secret

# URLs
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
```

**Backend `.env`:**
```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/fintrack
JWT_SECRET=your-development-jwt-secret
REDIS_URL=redis://redis:6379
NODE_ENV=development
```

### Google OAuth Setup (Optional)
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add to environment:
   ```bash
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

## Demo User

The seed script creates a demo user for testing:
- **Email**: demo@fintrack.app
- **Password**: demo123456

This user has sample transactions, budgets, and shopping lists pre-loaded.

## Available Services

### Frontend (Port 3000)
- Next.js 14 with App Router
- TypeScript and Tailwind CSS
- Redux Toolkit for state management
- Apollo Client for GraphQL

### Backend (Port 4000)
- GraphQL API with Apollo Server
- JWT authentication
- WebSocket subscriptions
- Redis caching

### Database (Port 5432)
- PostgreSQL 15
- Prisma ORM
- Auto-generated types
- Migration system

### Redis (Port 6379)
- Session storage
- Real-time subscriptions
- Caching

## Testing

### Unit Tests
```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test
```

### E2E Tests
```bash
# Install Playwright
npx playwright install

# Run E2E tests
npm run test:e2e
```

### Manual Testing
1. Register new user at http://localhost:3000/auth/register
2. Or use demo user: demo@fintrack.app / demo123456
3. Test all features:
   - Dashboard and analytics
   - Transaction management
   - Budget tracking
   - Shopping lists
   - Family features (create family, invite members)

## Common Commands

```bash
# Restart specific service
docker compose restart frontend

# View service logs
docker compose logs -f backend

# Execute command in container
docker compose exec backend npm run db:seed

# Clean up containers
docker compose down -v

# Rebuild containers
docker compose up --build

# Check service health
curl http://localhost:4000/health
```

## Debugging

### Backend Debugging
- GraphQL Playground: http://localhost:4000/graphql
- Check logs: `docker-compose logs -f backend`
- Database queries: Enable Prisma logging in development

### Frontend Debugging
- Redux DevTools browser extension
- Apollo DevTools browser extension
- Next.js debugging in browser DevTools

### Database Debugging
- Prisma Studio: `cd backend && npx prisma studio`
- Direct PostgreSQL access: `docker compose exec postgres psql -U postgres -d fintrack`

## Troubleshooting

### Common Issues

**Database Connection Failed:**
```bash
# Check if PostgreSQL is running
docker compose ps

# Restart database
docker compose restart postgres

# Check database logs
docker compose logs postgres
```

**Frontend Build Errors:**
```bash
# Clear Next.js cache
cd frontend && rm -rf .next

# Reinstall dependencies
cd frontend && rm -rf node_modules package-lock.json
cd frontend && npm install
```

**GraphQL Schema Issues:**
```bash
# Regenerate Prisma client
cd backend && npx prisma generate

# Check GraphQL schema
curl -X POST http://localhost:4000/graphql -H "Content-Type: application/json" -d '{"query":"{ __schema { types { name } } }"}'
```

## Performance Tips

1. **Use Docker layer caching**: Don't change package.json frequently
2. **Optimize database queries**: Use Prisma's `include` and `select` wisely
3. **Enable Redis caching**: For frequently accessed data
4. **Use GraphQL subscriptions**: For real-time features
5. **Optimize bundle size**: Use dynamic imports in frontend

## Next Steps

1. Complete feature implementation following the plan
2. Set up CI/CD pipeline
3. Configure monitoring and logging
4. Deploy to Railway staging environment
5. Set up production environment
6. Configure domain and SSL