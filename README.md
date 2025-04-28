# hwChatInterface
Chat interface for hwScheduler

## Design

The `hwChatInterface` provides a command-line interface (CLI) for interacting with the `hwScheduler`. The design choices prioritize simplicity and ease of use:

- **CLI-Based Interface**: The chat interface is implemented as a CLI to ensure accessibility and straightforward usage without requiring additional graphical tools.
- **Continuous Chat Session**: The chat session remains active until the user explicitly types `exit`. This allows for seamless and uninterrupted interaction.
- **Hardcoded Identifiers**: Both the Agent ID and Client ID are hardcoded as `1` for simplicity. This design assumes that each client interacts with the language model (LLM) through this interface, and the chat interface automatically fills in the Agent ID and Client ID before making API calls.
- **LLM Integration**: The repository leverages LLM APIs with function calling capabilities to handle user interactions. The API key required for these calls must be stored in a `.env` file.
- **Environment Configuration**: If a `.env` file does not exist, it must be created at the root level of the project directory. This file should contain the necessary API key to enable communication with the LLM.

This design ensures a lightweight and efficient interface for scheduling tasks while maintaining flexibility for future enhancements.

### Design Decisions
Following were some of the decision points considered while designing this application:

#### Storing API Keys
In a production system, the keys will be stored in the vault or cloud hosted Secrets Manager. I chose .env file to both keep it simple as well as a "best practice" for rapid local development since .env files don't get committed to git repository and the ".env" file pattern is always included in `.gitignore` files.

#### Command Line Interface
This was chosen since it's easy to develop and maintain a chat interface since both running the program and typing inputs and viewing outputs can all be done from the terminal. No UI elements or CSS needed.

#### Hardcoded Identifiers
To keep things simple, the agent ID and client ID are hardcoded to 1. However, the APIs in the backend service accept them as input in every API. Adding more agents and clients is easy and straightforward.

#### Continuous chat session
The chat session remains active until the user types 'exit' (without quotes). This is to ensure that the context is not lost and the user has a seamless experience.

## Features
The chat interface supports the following features

### Get all events from the calendar
This is developed to be used for convenience to look at all the events in a calendar. Serves well for debugging purposes.

Chat inputs:
- show me my calendar
- get me my existing appointments
- what does my calendar look like?

#### Book an appointment
This is used for booking an appointment. It takes inputs like time, title and duration of the appointment. If any of this information is missing, it'll ask for clarification.

Chat inputs:
- book an appointment for tomorrow at 10am
  - follow up: the title is Bellevue House Tour and the duration would be 30 minutes
- book an appointment from 1pm to 2pm this saturday called Renton House Showing

#### Find available time slots
This is used for getting the available time slots given a range of time slots. Dates can be given in natural language and the LLM converts as necessary. It also handles multiple time ranges appropriately. It asks for clarification if event type is not mentioned.

Chat inputs:
- when am I free to do a showing this weekend?
- when can I schedule a call tomorrow?

#### Find optimal days
This is used for finding non-busy days. It takes lookAheadDays as a param. But not giving one would be okay too. The backend service uses a default of 7 days. The response it receives will be converted to natural language dates and presented to the user.

- when can I reconnect with my longer term clients?
- when should I do my follow-ups?
