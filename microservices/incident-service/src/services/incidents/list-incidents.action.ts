import { db } from '@vertiaccess/database'
import type { CognitoUser } from '@vertiaccess/core'
import { ensureAuthenticatedUserExists } from './ensure-user.action'
import { incidentInclude, serializeIncident } from './helpers'

export async function listIncidentsAction(cognitoUser: CognitoUser) {
  await ensureAuthenticatedUserExists(cognitoUser)
  const role = (cognitoUser.role || '').toLowerCase()
  const isAdmin = role === 'admin'

  let where = {}
  if (!isAdmin) {
    if (role === 'landowner') {
      where = {
        OR: [
          { reporterId: cognitoUser.sub },
          {
            site: { landownerId: cognitoUser.sub },
            reporterId: { not: cognitoUser.sub },
            messages: { some: { visibility: 'target' } },
          },
        ],
      }
    } else {
      // operator
      where = {
        OR: [
          { reporterId: cognitoUser.sub },
          {
            booking: { operatorId: cognitoUser.sub },
            reporterId: { not: cognitoUser.sub },
            messages: { some: { visibility: 'target' } },
          },
        ],
      }
    }
  }

  const incidents = await db.incident.findMany({
    where,
    include: incidentInclude,
    orderBy: { createdAt: 'desc' },
  })

  return incidents.map((incident) =>
    serializeIncident(
      incident,
      isAdmin ? 'admin' : role === 'landowner' ? 'landowner' : 'operator',
    ),
  )
}
