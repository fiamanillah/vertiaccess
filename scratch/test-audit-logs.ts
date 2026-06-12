import { db } from '../packages/database/index.ts'
import { recordAuditLog } from '../packages/core/src/utils/audit-log.ts'

async function runTest() {
  console.log('--- AUDIT LOG INTEGRATION TEST START ---')

  // 1. Fetch a user to act as actor/target
  const existingUser = await db.user.findFirst({
    select: { id: true, role: true }
  })

  if (!existingUser) {
    console.log('No user found in database. Please run migrations/seeds first.')
    return
  }

  console.log(`Using existing user ID ${existingUser.id} (${existingUser.role}) for audit log actor`)

  // 2. Fetch a site if available
  const existingSite = await db.site.findFirst({
    select: { id: true, name: true }
  })
  const siteId = existingSite?.id || null
  console.log(`Using site ID ${siteId} (${existingSite?.name || 'none'})`)

  // 3. Test recording an audit log for site status change
  console.log('Recording site status change log...')
  const log1 = await recordAuditLog(undefined, {
    siteId,
    entityType: 'site',
    entityId: siteId || 'dummy-site-id',
    eventType: 'site.status_changed',
    actorType: 'admin',
    actorId: existingUser.id,
    previousState: { status: 'PENDING' },
    newState: { status: 'ACTIVE' },
    metadata: { reason: 'Verified successfully' }
  }) as any

  console.log('Successfully recorded site log with event ID:', log1.eventId)

  // 4. Test recording an audit log for user suspension
  console.log('Recording user suspension log...')
  const log2 = await recordAuditLog(undefined, {
    entityType: 'user',
    entityId: existingUser.id,
    eventType: 'user.suspended',
    actorType: 'admin',
    actorId: existingUser.id,
    previousState: { status: 'ACTIVE' },
    newState: { status: 'SUSPENDED' },
    metadata: { reason: 'Test suspension', durationDays: 7 }
  }) as any

  console.log('Successfully recorded user log with event ID:', log2.eventId)

  // 5. Query logs back from database
  console.log('Querying recorded audit logs...')
  const queriedLogs = await db.auditLog.findMany({
    where: {
      eventId: {
        in: [log1.eventId, log2.eventId]
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  console.log(`Retrieved ${queriedLogs.length} logs from database.`)

  if (queriedLogs.length !== 2) {
    throw new Error(`Expected to query 2 logs, but got ${queriedLogs.length}`)
  }

  // Assert field values
  const [dbLog1, dbLog2] = queriedLogs

  console.log('Checking Log 1 (site.status_changed):')
  console.log('  Event ID:', dbLog1.eventId)
  console.log('  Entity Type:', dbLog1.entityType)
  console.log('  Event Type:', dbLog1.eventType)
  console.log('  Previous State:', dbLog1.previousState)
  console.log('  New State:', dbLog1.newState)
  console.log('  Metadata:', dbLog1.metadata)

  if (
    dbLog1.entityType !== 'site' ||
    dbLog1.eventType !== 'site.status_changed' ||
    (dbLog1.previousState as any)?.status !== 'PENDING' ||
    (dbLog1.newState as any)?.status !== 'ACTIVE'
  ) {
    throw new Error('Log 1 assertion failed!')
  }

  console.log('Checking Log 2 (user.suspended):')
  console.log('  Event ID:', dbLog2.eventId)
  console.log('  Entity Type:', dbLog2.entityType)
  console.log('  Event Type:', dbLog2.eventType)
  console.log('  Previous State:', dbLog2.previousState)
  console.log('  New State:', dbLog2.newState)
  console.log('  Metadata:', dbLog2.metadata)

  if (
    dbLog2.entityType !== 'user' ||
    dbLog2.eventType !== 'user.suspended' ||
    (dbLog2.previousState as any)?.status !== 'ACTIVE' ||
    (dbLog2.newState as any)?.status !== 'SUSPENDED'
  ) {
    throw new Error('Log 2 assertion failed!')
  }

  // 6. Clean up test logs
  console.log('Cleaning up test logs...')
  await db.auditLog.deleteMany({
    where: {
      eventId: {
        in: [log1.eventId, log2.eventId]
      }
    }
  })

  console.log('Cleanup complete.')
  console.log('--- AUDIT LOG INTEGRATION TEST PASSED ---')
}

runTest()
  .catch((err) => {
    console.error('Test failed with error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
