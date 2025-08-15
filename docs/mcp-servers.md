# MCP Servers Configuration for FinTrack

## Currently Installed MCP Servers

### Railway MCP Server
**Status**: ✅ Installed and Configured
**Purpose**: Deploy and manage FinTrack application on Railway platform
**Authentication**: Railway API token configured

**Features Available:**
- Deploy frontend and backend services to Railway
- Manage PostgreSQL database on Railway
- Monitor application logs and metrics
- Configure environment variables
- Set up custom domains

## MCP Server Usage in Development

### Railway Deployment
The Railway MCP server enables seamless deployment of the FinTrack application:

1. **Frontend Deployment**: Next.js application with static optimization
2. **Backend Deployment**: Node.js GraphQL API with Apollo Server
3. **Database**: PostgreSQL with automatic backups
4. **Environment Management**: Secure environment variable handling

### Development Workflow
1. Develop locally using Docker containers
2. Test using the demo user (demo@fintrack.app / demo123456)
3. Deploy to Railway using MCP server for staging/production

## Additional MCP Servers (Future Enhancement)

### PostgreSQL MCP Server (Planned)
- Direct database query capabilities
- Schema inspection and management
- Performance monitoring
- Database administration tasks

### GraphQL MCP Server (Planned)
- GraphQL schema introspection
- Query testing and optimization
- API documentation generation
- Real-time subscription monitoring

## Railway Deployment Configuration

### Environment Variables Required:
```bash
# Database
DATABASE_URL=postgresql://[railway-provided-url]

# Authentication
JWT_SECRET=your-secure-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret

# Frontend URL
NEXT_PUBLIC_API_URL=https://your-backend-url
FRONTEND_URL=https://your-frontend-url

# Redis (if using Railway Redis)
REDIS_URL=redis://[railway-provided-url]
```

### Deployment Commands:
```bash
# Deploy backend
railway up --service backend

# Deploy frontend  
railway up --service frontend

# Run database migrations
railway run npx prisma migrate deploy

# Seed database
railway run npm run db:seed
```

## Local Development with MCP

The current setup allows for local development with Docker while using Railway MCP for deployment management. This hybrid approach provides:

1. **Fast local development** with hot reload
2. **Production-like environment** with Docker
3. **Easy deployment** with Railway integration
4. **Database management** through Railway dashboard

## Security Considerations

- Railway API token is securely stored in Claude settings
- Database credentials are managed by Railway
- JWT secrets are environment-specific
- All API calls use HTTPS in production

## Next Steps

1. Complete local development environment setup
2. Test all application features locally
3. Deploy to Railway staging environment
4. Configure production environment variables
5. Set up monitoring and logging
6. Configure custom domain (if needed)

## Troubleshooting

### Common Issues:
- **MCP Server Connection**: Ensure Railway token is valid and has proper permissions
- **Database Access**: Verify DATABASE_URL format and credentials
- **Deployment Failures**: Check application logs in Railway dashboard
- **Environment Variables**: Ensure all required variables are set in Railway

### Support Resources:
- Railway Documentation: https://docs.railway.app/
- MCP Server Issues: Check Railway MCP GitHub repository
- Application Logs: Available through Railway dashboard
- Database Monitoring: Railway PostgreSQL metrics