import type { TurnLog } from './agent';

export function printTrace(trace: TurnLog[]) {
  console.log('\n=== 実行トレース ===');
  let totalCost = 0;
  let totalIn = 0;
  let totalOut = 0;
  for (const t of trace) {
    console.log(
      `ターン${t.turn}: 入力${t.inputTokens} / 出力${
        t.outputTokens
      }トークン → $${t.costUsd.toFixed(6)}`
    );
    totalCost += t.costUsd;
    totalIn += t.inputTokens;
    totalOut += t.outputTokens;
  }
  console.log(
    `--- 合計: 入力${totalIn} / 出力${totalOut}トークン → $${totalCost.toFixed(
      6
    )}`
  );
  console.log(
    `--- 円換算（1ドル150円想定）: 約${(totalCost * 150).toFixed(4)}円`
  );
}
