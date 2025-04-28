// types.ts
export interface Appointment {
  clientId: string;
  agentId: string;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
}

export interface AvailabilityRequest {
  agentId: string;
  clientId: string;
  timeRanges: string;
  eventType: string; // showing, call or meeting
  count: number; // number of slots to return
}

export interface OptimalDayRequest {
  agentId: string;
  clientId: string;
  startDate: string;
  endDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
