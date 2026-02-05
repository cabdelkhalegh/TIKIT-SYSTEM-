// TIKIT System - Prisma Client Test
// This file verifies that Prisma Client is properly configured and can connect to the database

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function testPrismaClient() {
  try {
    console.log('Testing Prisma Client connection...');
    
    // Test database connection
    await prisma.$connect();
    console.log('✓ Successfully connected to database');
    
    // Test creating a record
    const testRecord = await prisma.testEntity.create({
      data: {
        name: 'TIKIT Phase 1 Test'
      }
    });
    console.log('✓ Created test record:', testRecord);
    
    // Test reading records
    const allRecords = await prisma.testEntity.findMany();
    console.log('✓ Found', allRecords.length, 'record(s) in database');
    
    // Clean up test record
    await prisma.testEntity.delete({
      where: { id: testRecord.id }
    });
    console.log('✓ Cleaned up test record');
    
    console.log('\n✅ Prisma Client is working correctly!');
    
  } catch (error) {
    console.error('❌ Error testing Prisma Client:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

testPrismaClient();
