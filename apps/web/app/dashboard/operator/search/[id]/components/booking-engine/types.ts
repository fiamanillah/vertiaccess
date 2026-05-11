export interface MissionData {
    droneModel: string;
    weightClass: string;
    missionIntent: string;
    flyerId: string;
    operatorId: string;
}

export type OperationType = 'toal' | 'emergency';

export interface BookingState {
    step: number;
    operationType: OperationType;
    selectedDate: Date | undefined;
    selectedStartTime: string | undefined;
    selectedEndTime: string | undefined;
    missionData: MissionData;
}
