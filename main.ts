import { parse } from './deps.ts';

const args = parse(Deno.args);

if (args.help || args.h) {
  console.log(`
House Whisper CLI Chat Interface

USAGE:
  deno run --allow-net --allow-env main.ts [OPTIONS]

OPTIONS:
  --agent=<id>        Agent ID (default: agent123)
  --client=<id>       Client ID (default: client456)
  --api-key=<key>     OpenAI API key (required)
  --server=<url>      Server URL (default: http://localhost:8000)
  --help, -h          Show this help message

EXAMPLES:
  deno run --allow-net --allow-env main.ts --api-key=sk-... --agent=1 --client=1
  `);
  Deno.exit(0);
}

await import('./cli.ts');
