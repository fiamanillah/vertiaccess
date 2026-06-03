import { db } from '/mnt/315428a3-e92d-418a-bcb6-a7a98cb46a54/Project/Akshav/vertiaccess/packages/database/index.ts';

async function main() {
  const landownerId = "01db6570-20a1-70df-5ae1-8bae0158be76"; // From our check-db.ts output for Haviva Waller site
  
  // Find all siteIds owned by this landowner
  const ownedSites = await db.site.findMany({
    where: { landownerId, deletedAt: null },
    select: { id: true },
  });

  const siteIds = ownedSites.map((s) => s.id);
  console.log("Owned site IDs:", siteIds);

  const queryDate = "2026-06-10";
  const startOfDay = new Date(queryDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(queryDate);
  endOfDay.setUTCHours(23, 59, 59, 999);

  console.log("Query startOfDay:", startOfDay.toISOString());
  console.log("Query endOfDay:", endOfDay.toISOString());

  const andConditions: any[] = [{ siteId: { in: siteIds } }];
  andConditions.push({
    startTime: { lt: endOfDay },
    endTime: { gt: startOfDay },
  });

  const where = { AND: andConditions };

  const bookings = await db.booking.findMany({
    where,
    include: {
      site: true,
    }
  });

  console.log("Found bookings count:", bookings.length);
  for (const b of bookings) {
    console.log({
      id: b.id,
      ref: b.bookingReference,
      siteId: b.siteId,
      siteName: b.site?.name,
      startTimeISO: b.startTime.toISOString(),
      endTimeISO: b.endTime.toISOString(),
      status: b.status,
    });
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
