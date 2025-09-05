import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function introspectTable() {
  console.log('🔍 Introspecting product_icegate_imports_copy table structure...');

  try {
    // Get table information using raw SQL
    const tableInfo = await prisma.$queryRaw`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'product_icegate_imports_copy'
      ORDER BY ordinal_position;
    `;

    console.log('\n📋 Table Structure:');
    console.log('Column Name | Data Type | Nullable | Default | Max Length');
    console.log('=' .repeat(70));
    
    (tableInfo as any[]).forEach((column: any) => {
      const nullable = column.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const maxLength = column.character_maximum_length || '-';
      const defaultValue = column.column_default || '-';
      
      console.log(
        `${column.column_name.padEnd(25)} | ${column.data_type.padEnd(12)} | ${nullable.padEnd(8)} | ${String(defaultValue).padEnd(12)} | ${maxLength}`
      );
    });

    // Check if unique constraint exists
    const constraints = await prisma.$queryRaw`
      SELECT 
        constraint_name,
        constraint_type
      FROM information_schema.table_constraints 
      WHERE table_name = 'product_icegate_imports_copy';
    `;

    console.log('\n🔒 Constraints:');
    if ((constraints as any[]).length > 0) {
      (constraints as any[]).forEach((constraint: any) => {
        console.log(`  ${constraint.constraint_name}: ${constraint.constraint_type}`);
      });
    } else {
      console.log('  No constraints found');
    }

    // Check indexes
    const indexes = await prisma.$queryRaw`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'product_icegate_imports_copy';
    `;

    console.log('\n📊 Indexes:');
    if ((indexes as any[]).length > 0) {
      (indexes as any[]).forEach((index: any) => {
        console.log(`  ${index.indexname}`);
        console.log(`    ${index.indexdef}`);
      });
    } else {
      console.log('  No indexes found');
    }

    // Test a sample query to verify data access
    const sampleQuery = await prisma.$queryRaw`
      SELECT id, unique_product_name, true_importer_name, origin_country, total_value_usd
      FROM product_icegate_imports_copy 
      LIMIT 3;
    `;

    console.log('\n📄 Sample Data:');
    (sampleQuery as any[]).forEach((row: any, index: number) => {
      console.log(`${index + 1}. ID: ${row.id}`);
      console.log(`   Product: ${row.unique_product_name || 'NULL'}`);
      console.log(`   Importer: ${row.true_importer_name || 'NULL'}`);
      console.log(`   Country: ${row.origin_country || 'NULL'}`);
      console.log(`   Value: ${row.total_value_usd || 'NULL'}`);
      console.log('   ---');
    });

    console.log('\n✅ Table introspection completed successfully!');
    console.log('📝 The Prisma schema has been updated to use "product_icegate_imports_copy"');

  } catch (error) {
    console.error('❌ Error during introspection:', error);
    console.log('\n🔧 Please check:');
    console.log('1. Table name is correct: "product_icegate_imports_copy"');
    console.log('2. Database connection is working');
    console.log('3. User has necessary permissions');
    throw error;
  }
}

async function main() {
  try {
    await introspectTable();
  } catch (error) {
    console.error('❌ Introspection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
