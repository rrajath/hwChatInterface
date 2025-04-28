import {
  Appointment,
  AvailabilityRequest,
  OptimalDayRequest,
  ApiResponse,
} from './types.ts';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getAppointments({
    agentId,
    clientId,
  }: {
    agentId: string;
    clientId: string;
  }): Promise<ApiResponse<Appointment[]>> {
    try {
      const url = `${this.baseUrl}/api/appointments?agentId=${agentId}&clientId=${clientId}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to get appointments: ${error.message}`,
      };
    }
  }

  async bookAppointment(
    appointment: Appointment
  ): Promise<ApiResponse<Appointment>> {
    try {
      const url = `${this.baseUrl}/api/appointments/book`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointment),
      });

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to book appointment: ${error.message}`,
      };
    }
  }

  async findAvailability(
    request: AvailabilityRequest
  ): Promise<ApiResponse<string[]>> {
    try {
      const url = `${this.baseUrl}/api/availability?agentId=${request.agentId}&clientId=${request.clientId}&eventType=${request.eventType}&timeRanges=${request.timeRanges}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to find availability: ${error.message}`,
      };
    }
  }

  async findOptimalDays(
    request: OptimalDayRequest
  ): Promise<ApiResponse<string[]>> {
    const url = `${this.baseUrl}/api/availability/optimal-days?agentId=${request.agentId}&clientId=${request.clientId}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error: any) {
      return {
        success: false,
        error: `Failed to find optimal days: ${error.message}`,
      };
    }
  }
}
