export interface MissionData {
  aircraftId: string
  droneModel: string
  manufacturer: string
  airframe: string
  mtow: string
  weightClass: string
  missionIntent: string
  supportingDocuments: {
    fileKey: string
    fileName?: string
    fileSize?: number
  }[]
  flyerId: string
  operatorId: string
  operatorPhone: string
  operationReference?: string
  operationType: 'INBOUND' | 'OUTBOUND'
}

export type OperationType = 'toal' | 'emergency'

export interface BookingEngineSite {
  id: string
  siteType: string
  autoApprove?: boolean
  clzEnabled?: boolean
  toalAccessFee?: number
  clzAccessFee?: number
}

export interface BookingState {
  step: number
  operationType: OperationType
  selectedDate: Date | undefined
  selectedStartTime: string | undefined
  selectedEndTime: string | undefined
  missionData: MissionData
}
