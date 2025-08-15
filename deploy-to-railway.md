# Railway Deployment Guide for FinTrack

## Option 1: Deploy via Railway Dashboard (Recommended)

Since Claude Code cannot authenticate interactively with Railway, please follow these steps:

### 1. Go to Railway Dashboard
Visit: https://railway.app/dashboard

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Connect your GitHub account if not already connected
- Select this repository

### 3. Configure Services

**Database Service:**
- Add PostgreSQL database service
- Note the connection details provided

**Backend Service:**
- Service Name: `fintrack-backend`
- Root Directory: `/backend`
- Dockerfile Path: `Dockerfile.prod`
- Port: `4000`

**Frontend Service:**
- Service Name: `fintrack-frontend`  
- Root Directory: `/frontend`
- Dockerfile Path: `Dockerfile.prod`
- Port: `3000`

### 4. Environment Variables

**Backend Environment Variables:**
```
NODE_ENV=production
DATABASE_URL=<Railway PostgreSQL connection string>
JWT_SECRET=<generate-secure-secret>
JWT_REFRESH_SECRET=<generate-secure-refresh-secret>
PORT=4000
CORS_ORIGIN=<frontend-url-will-be-provided-by-railway>
```

**Frontend Environment Variables:**
```
NODE_ENV=production
NEXTAUTH_URL=<frontend-url-will-be-provided-by-railway>
NEXTAUTH_SECRET=<generate-secure-secret>
NEXT_PUBLIC_GRAPHQL_URL=<backend-url-will-be-provided-by-railway>/graphql
NEXT_PUBLIC_API_URL=<backend-url-will-be-provided-by-railway>
```

### 5. Deploy Order
1. Deploy PostgreSQL database first
2. Deploy backend service (will run migrations automatically)
3. Deploy frontend service

## Option 2: Deploy via CLI (Manual Authentication Required)

If you prefer CLI deployment, you'll need to:

1. Run `railway login` in your terminal and authenticate
2. Run the deployment script below

### CLI Deployment Script
```bash
# Initialize project
railway init

# Add PostgreSQL
railway add postgresql

# Deploy backend
cd backend
railway up --service backend

# Deploy frontend  
cd ../frontend
railway up --service frontend
```

## Expected URLs
After successful deployment, you'll receive URLs like:
- **Frontend**: `https://fintrack-frontend-production-xxxx.up.railway.app`
- **Backend**: `https://fintrack-backend-production-xxxx.up.railway.app`
- **Database**: Internal Railway connection

## Testing Checklist
Once deployed, test these features:
- ✅ Landing page loads
- ✅ User registration works
- ✅ User login works  
- ✅ Dashboard displays
- ✅ Profile page loads
- ✅ PDF export downloads
- ✅ Excel export downloads
- ✅ Navigation between pages
- ✅ Responsive design on mobile