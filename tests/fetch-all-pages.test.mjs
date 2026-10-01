import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const compiled = ts.transpileModule(readFileSync('src/lib/utils/fetch-all-pages.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { fetchAllPages } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
test('loads records beyond the old 100-row cap using inclusive ranges', async () => {
    const records = Array.from({length:215}, (_,i)=>i);
    const ranges = [];
    const result = await fetchAllPages(async (from,to) => { ranges.push([from,to]); return records.slice(from,to+1); });
    assert.deepEqual(result, records);
    assert.deepEqual(ranges,[[0,99],[100,199],[200,299]]);
});
test('does not report partial totals after a later page fails', async () => {
    await assert.rejects(fetchAllPages(async (from) => { if(from) throw new Error('unavailable'); return Array(100).fill(1); }), /unavailable/);
});
test('handles empty results', async () => assert.deepEqual(await fetchAllPages(async ()=>[]),[]));
