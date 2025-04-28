import { config, parse, readLines, colors } from './deps.ts';
import { ApiClient } from './api_client.ts';
import { LlmService } from './llm_service.ts';

const args = parse(Deno.args, {
  string: ['agent', 'client', 'api-key', 'server'],
  default: {
    agent: '1',
    client: '1',
  },
});

const apiKey = loadApiKey();
const SERVER_URL = 'http://localhost:8000';

function loadApiKey(): string | undefined {
  try {
    const env = config();
    const key = env.API_KEY;
    return key;
  } catch (_) {
    console.error(colors.red('Error: Failed to load .env file.'));
    Deno.exit(1);
  }
}

const apiClient = new ApiClient(SERVER_URL);
if (!apiKey) {
  console.error(colors.red('Error: API key is required but not provided.'));
  Deno.exit(1);
}
const llmService = new LlmService(apiKey, apiClient);

console.log(colors.green('🏠 House Whisper Chat Interface'));
console.log(colors.yellow(`Agent ID: ${args.agent}`));
console.log(colors.yellow(`Client ID: ${args.client}`));
console.log(colors.cyan("Type your message or 'exit' to quit"));
console.log(colors.gray('-------------------------------------------'));

async function startChat() {
  for await (const line of readLines(Deno.stdin)) {
    if (line.toLowerCase() === 'exit') {
      console.log(colors.green('Goodbye!'));
      break;
    }

    console.log(colors.gray('Processing...'));

    try {
      const response = await llmService.processMessage(
        line,
        args.agent,
        args.client
      );
      console.log(colors.blue('Assistant:'), response);
    } catch (error: any) {
      console.error(colors.red(`Error: ${error.message}`));
    }

    console.log(colors.gray('-------------------------------------------'));
    console.log(colors.green('You:'));
  }
}

await startChat();
