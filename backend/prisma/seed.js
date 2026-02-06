const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Hash passwords properly with bcrypt
  const hashedAdminPassword = await bcrypt.hash('admin123', 12);
  const hashedUserPassword = await bcrypt.hash('user123', 12);

  // Create sample users with hashed passwords
  const user1 = await prisma.user.upsert({
    where: { email: 'admin@tikit.com' },
    update: {},
    create: {
      email: 'admin@tikit.com',
      name: 'Admin User',
      password: hashedAdminPassword,
      role: 'admin',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user@tikit.com' },
    update: {},
    create: {
      email: 'user@tikit.com',
      name: 'Regular User',
      password: hashedUserPassword,
      role: 'user',
    },
  });

  console.log('✅ Created users:');
  console.log('   - admin@tikit.com (password: admin123)');
  console.log('   - user@tikit.com (password: user123)');

  // Create sample tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      title: 'Setup development environment',
      description: 'Configure Docker and development tools',
      status: 'completed',
      priority: 'high',
      userId: user1.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: 'Implement Prisma ORM',
      description: 'Add Prisma for database management',
      status: 'completed',
      priority: 'high',
      userId: user1.id,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: 'Implement JWT authentication',
      description: 'Add JWT authentication with bcrypt password hashing',
      status: 'completed',
      priority: 'high',
      userId: user1.id,
    },
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      title: 'Add role-based access control',
      description: 'Implement RBAC for API endpoints',
      status: 'open',
      priority: 'medium',
      userId: user2.id,
    },
  });

  console.log('✅ Created tickets:', { ticket1, ticket2, ticket3, ticket4 });
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
