import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

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

async function main() {
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: '大阪、明日は何を着ればいい？' },
  ];

  const maxIterations = 5;
  for (let i = 0; i < maxIterations; i++) {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      tools,
      messages,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason !== 'tool_use') {
      const finalText = response.content.find((b) => b.type === 'text');
      if (finalText && finalText.type === 'text') {
        console.log('\n=== 最終回答 ===\n' + finalText.text);
      }
      return;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === 'tool_use') {
        console.log(
          `[ツール実行] ${block.name}(${JSON.stringify(block.input)})`
        );

        let result = '';
        if (block.name === 'get_weather') {
          const input = block.input as { city: string };
          result = getWeather(input.city);
        }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        });
      }
    }

    messages.push({ role: 'user', content: toolResults });
  }

  console.log('maxIterationsに達しました');
}

main();
