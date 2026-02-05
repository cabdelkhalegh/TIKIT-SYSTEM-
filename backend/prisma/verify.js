// Quick verification script to check Client entity data
const { PrismaClient } = require('@prisma/client')

const dbClient = new PrismaClient()

async function verifyClientData() {
  console.log('📊 Verifying Client entity data...\n')
  
  const allClients = await dbClient.client.findMany()
  
  console.log(`Found ${allClients.length} clients in database:\n`)
  
  allClients.forEach((client, index) => {
    console.log(`Client ${index + 1}:`)
    console.log(`  ID: ${client.clientId}`)
    console.log(`  Legal Name: ${client.legalCompanyName}`)
    console.log(`  Brand: ${client.brandDisplayName}`)
    console.log(`  Industry: ${client.industryVertical}`)
    console.log(`  Total Spend: $${client.totalAdSpend}`)
    console.log(`  Created: ${client.accountCreatedAt}`)
    console.log('')
  })
}

verifyClientData()
  .catch(console.error)
  .finally(() => dbClient.$disconnect())
