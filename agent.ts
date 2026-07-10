import Anthropic from '@anthropic-ai/sdk';
import { calcCost } from './calc-cost';
import { printTrace } from './print-trace';

export type TurnLog = {
  turn: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

const client = new Anthropic();

const MODEL = 'claude-haiku-4-5';

function getWeather(city: string) {
  const dummy: Record<string, string> = {
    大阪: '晴れ、最高32度、最低24度、降水確率10%',
    札幌: '曇りときどき雨、最高19度、最低12度、降水確率60%',
  };
  return dummy[city] ?? `${city}のデータはありません`;
}

const tools: Anthropic.Tool[] = [
  {
    name: 'get_weather',
    description:
      '指定した都市の明日の天気を取得する。天気を知る必要があるときに使う',
    input_schema: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: '天気を調べたい都市名。例: 大阪',
        },
      },
      required: ['city'],
    },
  },
];

const toolRegistry: Record<string, (input: any) => string> = {
  get_weather: (input) => getWeather(input.city),
};

async function main() {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: '大阪、明日は何を着ればいい？' },
  ];
  const trace: TurnLog[] = [];
  const maxIterations = 5;

  for (let i = 0; i < maxIterations; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      tools,
      messages,
    });

    const cost = calcCost(
      MODEL,
      response.usage.input_tokens,
      response.usage.output_tokens
    );

    trace.push({
      turn: i + 1,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      costUsd: cost,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason !== 'tool_use') {
      const finalText = response.content.find((b) => b.type === 'text');
      if (finalText && finalText.type === 'text') {
        console.log('\n=== 最終回答 ===\n' + finalText.text);
      }
      printTrace(trace);
      return;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        console.log(
          `[ツール実行] ${block.name}(${JSON.stringify(block.input)})`
        );

        const fn = toolRegistry[block.name];
        let result: string;
        let isError = false;
        if (fn) {
          result = fn(block.input);
        } else {
          result = `エラー: ツール "${block.name}"は存在しません`;
          isError = true;
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
          is_error: isError,
        });
      }
    }

    messages.push({ role: 'user', content: toolResults });
  }

  console.log('maxIterationsに達しました');
  printTrace(trace);
}

main();
