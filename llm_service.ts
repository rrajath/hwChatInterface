import { OpenAI } from './deps.ts';
import { ApiClient } from './api_client.ts';

export class LlmService {
  private openai: OpenAI;
  private apiClient: ApiClient;
  private conversationHistory: Array<
    | { role: 'user' | 'assistant'; content: string }
    | { role: 'function'; name: string; content: string }
  >;

  constructor(apiKey: string, apiClient: ApiClient) {
    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    this.apiClient = apiClient;
    this.conversationHistory = [];
  }

  async processMessage(
    message: string,
    agentId: string,
    clientId: string
  ): Promise<string> {
    const functions = [
      {
        name: 'get_appointments',
        description: 'Get all appointments for the agent',
        parameters: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'ID of the agent to get appointments for',
            },
            clientId: {
              type: 'string',
              description: 'ID of the client to get appointments for',
            },
          },
          required: ['agentId', 'clientId'],
        },
      },
      {
        name: 'book_appointment',
        description: 'Book an appointment for a client at a specific time',
        parameters: {
          type: 'object',
          properties: {
            startTime: {
              type: 'string',
              description: 'ISO 8601 format start time for the appointment',
            },
            endTime: {
              type: 'string',
              description: 'ISO 8601 format end time for the appointment',
            },
            title: {
              type: 'string',
              description: 'Title of the appointment',
            },
            description: {
              type: 'string',
              description: 'Optional description of the appointment',
            },
          },
          required: ['startTime', 'title'],
        },
      },
      {
        name: 'find_availability',
        description: 'Find available time slots for appointments',
        parameters: {
          type: 'object',
          properties: {
            timeRanges: {
              type: 'string',
              description: 'Time ranges to check for availability',
            },
            eventType: {
              type: 'string',
              description: 'Type of event - showing, call or meeting',
            },
            count: {
              type: 'number',
              description: 'Number of available slots to return',
            },
          },
          required: ['timeRanges', 'eventType'],
        },
      },
      {
        name: 'find_optimal_days',
        description:
          'Find optimal days for reconnecting with clients or doing work',
        parameters: {
          //   type: 'object',
          //   properties: {
          //     startDate: {
          //       type: 'string',
          //       description: 'ISO 8601 format start date',
          //     },
          //     endDate: {
          //       type: 'string',
          //       description: 'ISO 8601 format end date',
          //     },
          //   },
          //   required: ['startDate', 'endDate'],
        },
      },
    ];

    this.conversationHistory.push({ role: 'user', content: message });

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant for real estate agents. You help them manage their schedule and book appointments with clients. \
              Today's date is ${new Date().toISOString().split('T')[0]}. \
              You can call functions to get appointments, book appointments, find availability, and find optimal days for reconnecting with clients. \
              You can also ask the user for more information if needed. \
              If clientId and agentId are not provided, use the default values of 1 for each. \

              While booking an appointment, \
              - if the end time is not provided, ask how long the appointment is for. \
              - if the title is not provided, make sure to ask for the title of the appointment. \

              While trying to find availability, \
              - if the input contains a date in natural language, convert it to a valid date format. \
              - if the input is something like "this weekend" or "tomorrow" or "next week", convert it to valid time range(s) \
              - if the time ranges are provided, convert them into valid date formats and separate the start time and end time with a '|' character. \
              - if multiple time ranges are provided, separate out each time range with a comma. \
              - if the event type is not specified while finding availability, ask for it and it should be one of - showing, call, meeting. \
              - a successful response should contain the time ranges in ISO 8601 format. Convert them to natural language \

              Example inputs and time range conversions and event type deductions: \
              - Input: "When am I available tomorrow for a showing?"
                time range: 2025-04-28T00:00:00|2025-04-28T23:59:59
                event type: showing
              - Input: "Find availability for a meeting this weekend."
                time range: 2025-05-03T00:00:00|2025-05-04T23:59:59
                event type: meeting
              - Input: "I need to find a time for a call next week."
                time range: 2025-05-05T00:00:00|2025-05-11T23:59:59
                event type: call

              While finding optimal days, if you get a list of dates as a response,
              return those dates in natural language while maintaining the order in which they were returned.
              Example inputs:
              - when should I reconnect with my longer term clients? \
              - when should I do my work? \
              - when should I do my follow ups? \
              `,
          },
          ...this.conversationHistory,
        ],
        functions,
        function_call: 'auto',
      });

      const responseMessage = response.choices[0].message;

      if (responseMessage.function_call) {
        const functionName = responseMessage.function_call.name;
        const functionArgs = JSON.parse(
          responseMessage.function_call.arguments
        );

        let functionResponse;
        switch (functionName) {
          case 'get_appointments':
            functionResponse = await this.apiClient.getAppointments({
              agentId,
              clientId,
            });
            break;
          case 'book_appointment':
            functionResponse = await this.apiClient.bookAppointment({
              agentId,
              clientId,
              startTime: functionArgs.startTime,
              endTime:
                functionArgs.endTime ||
                new Date(
                  new Date(functionArgs.startTime).getTime() + 60 * 60 * 1000
                ).toISOString(),
              title: functionArgs.title,
              description: functionArgs.description,
            });
            break;
          case 'find_availability':
            functionResponse = await this.apiClient.findAvailability({
              agentId,
              clientId,
              timeRanges: functionArgs.timeRanges,
              eventType: functionArgs.eventType,
              count: functionArgs.count || 3,
            });
            break;
          case 'find_optimal_days':
            functionResponse = await this.apiClient.findOptimalDays({
              agentId,
              clientId,
            });
            break;
        }

        // Get a response from the LLM based on the function result
        const followUpResponse = await this.openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful assistant for real estate agents. You help them manage their schedule and book appointments with clients.',
            },
            { role: 'user', content: message },
            {
              role: 'assistant',
              content: null,
              function_call: responseMessage.function_call,
            },
            {
              role: 'function',
              name: functionName,
              content: JSON.stringify(functionResponse),
            },
          ],
        });

        return (
          followUpResponse.choices[0].message.content ||
          "I processed your request but couldn't generate a response."
        );
      }

      return responseMessage.content || "I couldn't understand your request.";
    } catch (error: any) {
      console.error('Error processing message:', error);
      return `Sorry, I encountered an error: ${error.message}`;
    }
  }
}
