import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExistingData() {
  console.log('🔍 Checking existing data in product_icegate_imports_copy...');

  try {
    // Get basic statistics
    const stats = await prisma.productIcegateImport.aggregate({
      _count: true,
      _sum: {
        total_value_usd: true,
      },
      _avg: {
        total_value_usd: true,
      },
    });

    console.log('\n📊 Database Statistics:');
    console.log(`Total Records: ${stats._count.toLocaleString()}`);
    console.log(`Total Import Value: $${stats._sum.total_value_usd?.toFixed(2) || 0}`);
    console.log(`Average Import Value: $${stats._avg.total_value_usd?.toFixed(2) || 0}`);

    // Get sample of records to verify structure
    const sampleRecords = await prisma.productIcegateImport.findMany({
      take: 5,
      orderBy: { target_date: 'desc' },
    });

    console.log('\n📋 Sample Records:');
    sampleRecords.forEach((record, index) => {
      console.log(`${index + 1}. System ID: ${record.system_id}`);
      console.log(`   Product: ${record.unique_product_name || 'N/A'}`);
      console.log(`   Importer: ${record.true_importer_name || 'N/A'}`);
      console.log(`   Origin: ${record.origin_country || 'N/A'}`);
      console.log(`   Value: $${record.total_value_usd || 0}`);
      console.log('   ---');
    });

    // Get country distribution
    const countryStats = await prisma.productIcegateImport.groupBy({
      by: ['origin_country'],
      _count: {
        origin_country: true,
      },
      orderBy: {
        _count: {
          origin_country: 'desc',
        },
      },
      take: 10,
    });

    console.log('\n🌍 Top 10 Origin Countries:');
    countryStats.forEach((item: any) => {
      console.log(`  ${item.origin_country || 'Unknown'}: ${item._count.origin_country.toLocaleString()}`);
    });

    // Get importer distribution
    const importerStats = await prisma.productIcegateImport.groupBy({
      by: ['true_importer_name'],
      _count: {
        true_importer_name: true,
      },
      orderBy: {
        _count: {
          true_importer_name: 'desc',
        },
      },
      take: 10,
    });

    console.log('\n🏢 Top 10 Importers:');
    importerStats.forEach((item: any) => {
      console.log(`  ${item.true_importer_name || 'Unknown'}: ${item._count.true_importer_name.toLocaleString()}`);
    });

    // Check for null product names that can be updated
    const nullProductNames = await prisma.productIcegateImport.count({
      where: {
        unique_product_name: null,
      },
    });

    const emptyProductNames = await prisma.productIcegateImport.count({
      where: {
        unique_product_name: '',
      },
    });

    console.log('\n✏️ Editable Records:');
    console.log(`  Records with null product names: ${nullProductNames.toLocaleString()}`);
    console.log(`  Records with empty product names: ${emptyProductNames.toLocaleString()}`);
    console.log(`  Total potentially editable: ${(nullProductNames + emptyProductNames).toLocaleString()}`);

    // Test connection and table accessibility
    console.log('\n✅ Database connection successful!');
    console.log('✅ Table "product_icegate_imports_copy" is accessible');
    console.log('✅ Ready for the application to use existing data');

  } catch (error) {
    console.error('❌ Error accessing the table:', error);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Ensure the table "product_icegate_imports_copy" exists');
    console.log('2. Check database connection in .env file');
    console.log('3. Verify user has SELECT/UPDATE permissions on the table');
    throw error;
  }
}

async function main() {
  try {
    await checkExistingData();
  } catch (error) {
    console.error('❌ Error checking existing data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
