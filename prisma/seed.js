import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  // Create users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'agent',
    },
  })

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
    },
  })

  console.log('Created users:', { user1, user2, admin })

  // Create sample tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Login page not working',
      description: 'I am unable to login to my account. Getting an error message.',
      status: 'open',
      priority: 'high',
      userId: user1.id,
    },
  })

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Feature request: Dark mode',
      description: 'Would love to have a dark mode option for the application.',
      status: 'open',
      priority: 'low',
      userId: user2.id,
    },
  })

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Database connection timeout',
      description: 'The application is experiencing database connection timeouts during peak hours.',
      status: 'in_progress',
      priority: 'critical',
      userId: admin.id,
    },
  })

  console.log('Created tickets:', { ticket1, ticket2, ticket3 })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
