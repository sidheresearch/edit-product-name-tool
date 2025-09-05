# ICEGate Product Imports Data Handler

A high-performance web application specifically designed for managing the `product_icegate_imports` table with millions of rows, featuring efficient pagination, search, filtering, and **unique_product_name** column updates.

## 🎯 **Specific Features for ICEGate Data**

- **Large Dataset Handling**: Efficiently manages millions of import records using server-side pagination
- **Product Name Editing**: Secure inline editing of `unique_product_name` field only
- **Advanced Filtering**: Filter by importer, origin country, city, port, HS code, chapter
- **Smart Search**: Search across product names, importers, countries, and ports
- **Import Analytics**: View statistics on total records, import values, and trends
- **Optimistic Updates**: Immediate UI feedback for better user experience

## 🗄️ **Database Schema**

The application connects to your existing table `product_icegate_imports_copy`:

```sql
-- Your existing table: product_icegate_imports_copy
-- Contains millions of existing import records
-- Only unique_product_name field will be editable through the UI
```

## 🛠️ **Tech Stack**

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Material-UI (MUI)** for professional UI components
- **TanStack Query** for efficient data fetching and caching
- **MUI DataGrid** for virtualized table rendering

### Backend
- **Node.js** with Express framework
- **Prisma** ORM for database management
- **PostgreSQL** database with optimized indexing
- **TypeScript** for full-stack type safety
- **Zod** for input validation

## 🚀 **Quick Setup**

### 1. **Database Configuration (No Migration Needed)**
Since you already have `product_icegate_imports_copy` with millions of rows:

```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials:
# DATABASE_URL="postgresql://username:password@localhost:5432/your_database_name"
```

### 2. **Install Dependencies & Verify Connection**
```bash
# Backend setup
cd backend
npm install
npx prisma generate     # Generates client for your existing table

# Verify connection to your existing data
npm run check-data      # Shows statistics of your existing data
npm run introspect      # Shows table structure and sample records

# Frontend setup
cd ../frontend
npm install
```

### 3. **Start Development Servers**
```bash
# Terminal 1 - Backend (Port 3001)
cd backend
npm run dev

# Terminal 2 - Frontend (Port 3000)
cd frontend
npm run dev
```

### 4. **Access Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

## 📊 **Performance Features**

### Optimized for Millions of Records:
- ✅ **Server-side Pagination**: Only loads 50-100 rows at a time
- ✅ **Database Indexing**: Optimized indexes on searchable columns
- ✅ **Virtual Scrolling**: Smooth UI performance regardless of dataset size
- ✅ **Debounced Search**: Reduces API calls during typing
- ✅ **Smart Caching**: React Query handles intelligent data caching

### Search & Filter Capabilities:
- 🔍 **Global Search**: Across product names, importers, suppliers, cities
- 🌍 **Origin Country Filter**: Quick filter by country of origin
- 🏢 **Importer Filter**: Filter by specific importing companies
- 🏙️ **City/Port Filters**: Filter by Indian cities and ports
- 📊 **HS Code/Chapter**: Filter by specific trade codes
- 📅 **Date Range**: Filter by registration date

## ✏️ **Editing Product Names**

### Security Features:
- **Single Field Editing**: Only `unique_product_name` can be modified
- **Validation**: Input validation and sanitization
- **Optimistic Updates**: Immediate UI feedback with rollback on errors
- **Audit Trail**: All updates are logged with timestamps

### How to Edit:
1. Hover over any row to see the edit icon
2. Click the edit icon in the "Product Name" column
3. Modify the product name in the text field
4. Click save ✅ or cancel ❌
5. Changes are saved immediately with visual confirmation

## 🔧 **Configuration**

### Database Performance Tuning:
```sql
-- Recommended indexes (already included in Prisma schema)
CREATE INDEX IF NOT EXISTS idx_unique_product_name ON product_icegate_imports(unique_product_name);
CREATE INDEX IF NOT EXISTS idx_true_importer_name ON product_icegate_imports(true_importer_name);
CREATE INDEX IF NOT EXISTS idx_origin_country ON product_icegate_imports(origin_country);
CREATE INDEX IF NOT EXISTS idx_reg_date ON product_icegate_imports(reg_date);
CREATE INDEX IF NOT EXISTS idx_hs_code ON product_icegate_imports(hs_code);
```

### Environment Variables:
```bash
# Backend (.env)
DATABASE_URL="postgresql://user:password@localhost:5432/datahandler"
PORT=3001
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000

# Frontend (.env)
VITE_API_URL=http://localhost:3001/api
```

## � **Scaling for Production**

### For 1M+ Records:
- **Database Connection Pooling**: Configure PostgreSQL connection limits
- **Redis Caching**: Add Redis for frequently accessed data
- **Database Partitioning**: Partition by date or region for very large datasets

### For High Concurrent Users:
- **Load Balancing**: Multiple backend instances behind a load balancer
- **CDN**: Serve static assets through CDN
- **Database Read Replicas**: Separate read/write operations

## 🔍 **API Endpoints**

### Main Endpoints:
```javascript
// Get paginated imports data
GET /api/data?page=1&pageSize=50&search=electronic&origin_country=CHINA

// Update product name
PUT /api/data/IMPORT_00001234
Body: { "field": "unique_product_name", "value": "Updated Product Name" }

// Get statistics
GET /api/data/stats
```

### Example Usage:
```javascript
// Search for electronic products from China
const response = await fetch('/api/data?search=electronic&origin_country=CHINA');

// Update a product name
await fetch('/api/data/IMPORT_00001234', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    field: 'unique_product_name', 
    value: 'HIGH QUALITY ELECTRONIC COMPONENTS MODEL 2024' 
  })
});
```

## 🛡️ **Security Features**

- **Field Restriction**: Only `unique_product_name` can be updated
- **Input Validation**: Server-side validation with Zod schemas
- **SQL Injection Protection**: Prisma ORM provides automatic protection
- **CORS Configuration**: Controlled cross-origin access
- **Rate Limiting**: API rate limiting (can be added)

## 📋 **Sample Data**

The seed script creates realistic ICEGate import data including:
- 50,000+ sample records
- Realistic HS codes and chapters
- Indian importers (TATA, Reliance, Adani, etc.)
- Multiple origin countries
- Proper import values and quantities
- Various product categories

## 🔧 **Customization**

### Adding More Editable Fields:
1. Update `UpdateRecordRequest` type in `frontend/src/types/index.ts`
2. Modify validation schema in `backend/src/utils/validation.ts`
3. Update the data service in `backend/src/services/dataService.ts`
4. Add column editing in `frontend/src/components/ProductImportsTable.tsx`

### Adding New Filters:
1. Add filter to `DataFilters` interface
2. Update query parameters in API endpoints
3. Add filter logic in backend data service
4. Add UI controls in the frontend component

This application is specifically tailored for your ICEGate imports data and provides enterprise-grade performance for managing millions of records efficiently.
