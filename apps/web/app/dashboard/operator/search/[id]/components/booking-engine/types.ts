export interface MissionData {
  droneModel: string
  manufacturer: string
  airframe: string
  mtow: string
  weightClass: string
  missionIntent: string
  flyerId: string
  operatorId: string
  operatorPhone: string
  operationReference?: string
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
