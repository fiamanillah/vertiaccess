import { db as prisma } from '@vertiaccess/database';



async function main() {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      transactions: true,
      lifecycleEvents: true,
    }
  });

  console.log(JSON.stringify(bookings, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
