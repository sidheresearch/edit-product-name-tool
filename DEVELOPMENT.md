# Development Setup Guide

## Prerequisites

Before starting, ensure you have:

- **Node.js 18+** and npm installed
- **PostgreSQL 12+** running locally or accessible remotely
- **Git** for version control

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Database Setup

1. **Create PostgreSQL Database:**
   ```sql
   CREATE DATABASE datahandler;
   CREATE USER your_username WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE datahandler TO your_username;
   ```

2. **Configure Environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run Migrations:**
   ```bash
   cd backend
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Seed Database (Optional):**
   ```bash
   npm run seed
   ```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Access Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

## Performance Tips for Million+ Records

### Database Optimization
- **Indexing:** Ensure proper indexes on searchable columns
- **Connection Pooling:** Configure PostgreSQL connection pool
- **Query Optimization:** Use EXPLAIN ANALYZE for slow queries

### Frontend Optimization
- **Virtual Scrolling:** Only renders visible rows
- **Debounced Search:** Reduces API calls during typing
- **Pagination:** Server-side pagination for performance
- **Caching:** React Query handles intelligent caching

### API Optimization
- **Response Compression:** Gzip enabled by default
- **Field Selection:** Only return needed columns
- **Batch Operations:** Group multiple updates

## Scaling Considerations

### For 10M+ Records:
1. **Database Partitioning:** Partition large tables by date/department
2. **Read Replicas:** Use read replicas for search queries
3. **Caching Layer:** Add Redis for frequently accessed data
4. **CDN:** Use CDN for static assets

### For High Concurrent Users:
1. **Load Balancing:** Multiple backend instances
2. **Database Connection Pooling:** Configure pgBouncer
3. **Rate Limiting:** Implement API rate limiting
4. **Monitoring:** Add application monitoring (DataDog, New Relic)

## Troubleshooting

### Common Issues:

**Database Connection Errors:**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Ensure database exists and user has permissions

**Frontend Not Loading Data:**
- Check backend is running on port 3001
- Verify CORS configuration
- Check browser network tab for API errors

**Slow Performance:**
- Check database indexes exist
- Monitor database query performance
- Verify pagination is working correctly

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://username:password@localhost:5432/datahandler"
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
API_VERSION=v1
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3001/api
```

## Production Deployment

### Backend Deployment:
1. Build application: `npm run build`
2. Set production environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Start application: `npm start`

### Frontend Deployment:
1. Build application: `npm run build`
2. Serve dist folder with nginx/Apache
3. Configure environment variables

## API Documentation

### Main Endpoints:

**GET /api/data**
- Query params: page, pageSize, search, status, department, sortBy, sortOrder
- Returns: Paginated data with metadata

**PUT /api/data/:id**
- Body: { field: string, value: any }
- Returns: Updated record

**GET /api/data/stats**
- Returns: Total count and last updated timestamp

### Example API Usage:

```javascript
// Fetch paginated data
const response = await fetch('/api/data?page=1&pageSize=50&search=john');

// Update a record
await fetch('/api/data/123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ field: 'status', value: 'active' })
});
```
