# FinTrack - Personal Finance Management Application

A comprehensive financial tracking application built with Next.js, Node.js, GraphQL, and PostgreSQL.

## Features

- 📊 **Personal Finance Dashboard** - Track income, expenses, and budgets
- 💰 **Budget Management** - Set monthly/yearly budgets with progress tracking
- 🛒 **Shopping Lists** - Collaborative lists that convert to transactions
- 👥 **Family/Group Expenses** - Split expenses and settle debts
- 📈 **Analytics & Charts** - Visual insights into spending patterns
- 💱 **Multi-Currency Support** - Live exchange rates
- 📱 **PWA Support** - Mobile-friendly progressive web app
- 🔒 **Secure Authentication** - Google OAuth integration

## Technology Stack

### Frontend
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** for styling
- **Apollo Client** for GraphQL data management
- **Redux Toolkit** for client-side state management
- **Recharts** for data visualization
- **NextAuth.js** for authentication

### Backend
- **Node.js** with Express.js and TypeScript
- **Apollo Server** for GraphQL API
- **Prisma ORM** with PostgreSQL
- **JWT** authentication
- **Redis** for caching and real-time features

### Infrastructure
- **Docker** for containerization
- **PostgreSQL** database
- **Redis** for caching
- **Railway** for deployment

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Git installed
- Node.js 18+ (optional, for development outside Docker)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd fintrack

# One-command setup (copies .env, builds containers, sets up database)
npm run setup
```

### 2. Start the Application
```bash
# Start all services (PostgreSQL, Redis, Backend, Frontend)
npm run dev

# Or start with logs visible
npm start
```

### 3. Initialize Database (if not done during setup)
```bash
# Run database migrations and seed demo data
npm run db:setup
```

### 4. Access the Application
- **Frontend**: got issgot issue ggfgdf
- **Backend GraphQL Playground**: http://localhost:4000/graphql
- **Database**: PostgreSQL on localhost:5432 (user: postgres, password: postgres)

### 5. Demo User Login
Use the pre-created demo account to explore the application:
- **Email**: demo@fintrack.app
- **Password**: demo123456

The demo user comes with sample transactions, budgets, and shopping lists!

## 📋 Available NPM Scripts

### Quick Commands
- `npm run setup` - Complete project setup (copies .env, builds, sets up DB)
- `npm run dev` - Start all services in background
- `npm start` - Start all services with logs visible
- `npm run stop` - Stop all services
- `npm run reset` - Complete reset and rebuild

### Development
- `npm run logs` - View all service logs
- `npm run ps` - Check service status
- `npm run build` - Rebuild containers
- `npm run clean` - Remove all containers and volumes

### Database
- `npm run db:setup` - Run migrations and seed data
- `npm run db:studio` - Open Prisma Studio
- `npm run db:shell` - Access PostgreSQL shell

### Testing
- `npm run test` - Run all tests
- `npm run lint` - Lint all code
- `npm run typecheck` - TypeScript checking

## 🛠️ Development

### Development Commands
```bash
# View all service logs
npm run logs

# View specific service logs
npm run logs:frontend
npm run logs:backend
npm run logs:db

# Stop all services
npm run stop

# Restart all services
npm run restart

# Rebuild containers after code changes
npm run build

# Clean reset (removes all data)
npm run clean

# Complete reset and rebuild
npm run reset

# Check service status
npm run ps
```

### Database Management
```bash
# Setup database (migrate + seed)
npm run db:setup

# Run database migrations only
npm run db:migrate

# Seed database with demo data
npm run db:seed

# View database with Prisma Studio
npm run db:studio

# Reset database (WARNING: deletes all data)
npm run db:reset

# Access PostgreSQL shell
npm run db:shell
```

### Development Outside Docker (Optional)
For faster development with hot reload:

```bash
# Run locally (installs deps, starts DB services, runs frontend & backend)
npm run dev:local

# Or manually:
# 1. Start only database services
npm run db:services

# 2. Install dependencies and start both frontend & backend
npm run start:local
```

### Testing & Quality
```bash
# Run all tests
npm run test

# Run specific tests
npm run test:frontend
npm run test:backend

# Lint code
npm run lint

# Type checking
npm run typecheck

# Check backend health
npm run health
```

## 🚨 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check if ports are already in use
lsof -i :3000  # Frontend
lsof -i :4000  # Backend
lsof -i :5432  # PostgreSQL

# Kill processes using the ports if needed
sudo kill -9 <PID>
```

**Database connection issues:**
```bash
# Check if PostgreSQL container is running
docker compose ps

# Restart database
docker compose restart postgres

# Check database logs
docker compose logs postgres
```

**Frontend not loading:**
```bash
# Check frontend logs
docker compose logs frontend

# Rebuild frontend container
docker compose up --build frontend
```

**Permission errors:**
```bash
# Fix ownership issues (Linux/Mac)
sudo chown -R $USER:$USER .
```

### Getting Help
- Check the logs: `docker-compose logs -f [service-name]`
- Verify all containers are running: `docker-compose ps`
- Reset everything: `docker-compose down -v && docker-compose up --build`
- Visit http://localhost:4000/health to check backend health

## Project Structure

```
fintrack/
├── frontend/          # Next.js application
├── backend/           # Node.js GraphQL API
├── database/          # Database initialization scripts
├── docker-compose.yml # Development environment
├── docker-compose.prod.yml # Production environment
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.