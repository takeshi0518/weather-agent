const PRICING: Record<string, { input: number; output: number }> = {
  'claude-haiku-4-5': { input: 1.0, output: 5.0 },
  'claude-sonnet-4-6': { input: 3.0, output: 15.0 },
};

export function calcCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const rate = PRICING[model];
  if (!rate) return 0;

  const inputCost = (inputTokens / 1_000_000) * rate.input;
  const outputCost = (outputTokens / 1_000_000) * rate.output;
  return inputCost + outputCost;
}
