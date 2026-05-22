import type { CognitoUser } from '@vertiaccess/core';
import { listIncidentsAction } from './list-incidents.action';
import { getIncidentAction } from './get-incident.action';
import { createIncidentAction } from './create-incident.action';
import { updateIncidentStatusAction } from './update-status.action';
import { updateAdminNotesAction } from './update-admin-notes.action';
import { addIncidentMessageAction } from './add-message.action';
import { addIncidentDocumentAction } from './add-document.action';
import { createIncidentDecisionAction } from './create-decision.action';
import { ensureAuthenticatedUserExists } from './ensure-user.action';
import { serializeIncident } from './helpers';

export class IncidentsService {
    static listIncidents = listIncidentsAction;
    static getIncident = getIncidentAction;
    static createIncident = createIncidentAction;
    static updateIncidentStatus = updateIncidentStatusAction;
    static updateAdminNotes = updateAdminNotesAction;
    static addMessage = addIncidentMessageAction;
    static addDocument = addIncidentDocumentAction;
    static createDecision = createIncidentDecisionAction;
    static ensureAuthenticatedUserExists = ensureAuthenticatedUserExists;
    static serializeIncident = serializeIncident;
}
