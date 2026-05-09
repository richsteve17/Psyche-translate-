/**
 * Regenerate a module's content (phrases / drills / scenarios) from a short
 * brief, using the Anthropic API. Writes a TypeScript file to
 * src/content/modules/<id>.ts that you can then wire into tracks.ts.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/regen-content.ts \
 *     --id frontdesk-phones \
 *     --title "Phone Scripts" \
 *     --blurb "Answer, transfer, take a message, schedule." \
 *     --brief "Front-desk phone language for a psych clinic in Delaware. Caribbean and Mexican Spanish. Cover answering, putting on hold, transferring, taking a message, and scheduling." \
 *     [--region pr|mx|do|general] [--phrases 20] [--drills 8] [--scenarios 3]
 *
 * Then edit src/content/tracks.ts to import and slot the new module.
 */
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'node:fs';
import * as path from 'node:path';

type Args = Record<string, string>;

function parseArgs(argv: string[]): Args {
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      out[key] = val;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));

const id = args.id;
const title = args.title;
const blurb = args.blurb;
const brief = args.brief;
const region = (args.region ?? 'general') as 'mx' | 'pr' | 'do' | 'general';
const nPhrases = Number(args.phrases ?? 18);
const nDrills = Number(args.drills ?? 8);
const nScenarios = Number(args.scenarios ?? 3);

if (!id || !title || !blurb || !brief) {
  console.error(
    'Missing required args. Need --id, --title, --blurb, --brief. See script header for example.',
  );
  process.exit(1);
}

const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Set ANTHROPIC_API_KEY in your shell.');
  process.exit(1);
}

const client = new Anthropic({ apiKey });

const SYSTEM = `You generate Spanish-language training content for a U.S. psychiatric front-desk worker / future psych nurse in Delaware. Content must be:
- Voice-first: phrases people actually say, not textbook constructions.
- Regionally weighted toward Caribbean (Puerto Rican, Dominican) and Mexican Spanish. Never Castilian. Never "neutral LatAm."
- Clinically appropriate: psych setting, HIPAA-aware, trauma-informed.
- Honest about regional variation: tag each item with mx, pr, do, or general.

Output ONLY valid JSON. No prose, no code fences.`;

const USER = `Module: ${title}
Blurb: ${blurb}
Region weight: ${region}
Brief: ${brief}

Generate:
- ${nPhrases} phrases (mix of staff/patient/family lines, mix of regions, with optional pronunciation/usage notes where regional differences matter)
- ${nDrills} drills (English situation -> target Spanish line, with 1-3 acceptable variants)
- ${nScenarios} roleplay scenarios (title, setup, persona, opener line in Spanish)

JSON shape:
{
  "phrases": [{"id":"p-1","en":"...","es":"...","region":"mx|pr|do|general","note":"...","speaker":"patient|family|staff"}],
  "drills":  [{"id":"d-1","situation":"...","target":"...","acceptableVariants":["..."],"region":"mx|pr|do|general","hint":"..."}],
  "scenarios":[{"id":"s-1","title":"...","setup":"...","persona":"...","opener":"...","region":"mx|pr|do|general"}]
}`;

async function main() {
  console.log(`Generating module: ${id} (${title})…`);
  const res = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    temperature: 0.6,
    system: SYSTEM,
    messages: [{ role: 'user', content: USER }],
  });
  const text = res.content
    .map((b) => (b.type === 'text' ? b.text : ''))
    .join('')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse JSON. Raw output:\n', text);
    process.exit(1);
  }

  const camelId = id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const file = `import { Module } from '../../types';

export const ${camelId}: Module = ${JSON.stringify(
    {
      id,
      title,
      blurb,
      available: true,
      phrases: parsed.phrases ?? [],
      drills: parsed.drills ?? [],
      scenarios: parsed.scenarios ?? [],
    },
    null,
    2,
  )};
`;

  const out = path.join(process.cwd(), 'src', 'content', 'modules', `${id}.ts`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, file, 'utf8');
  console.log(`Wrote ${out}`);
  console.log(
    `\nNow edit src/content/tracks.ts:\n  import { ${camelId} } from './modules/${id}';\n  // and replace the stub for "${id}" with ${camelId}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
