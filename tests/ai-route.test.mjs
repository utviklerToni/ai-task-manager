import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

const source = ts.transpileModule(
   readFileSync('src/app/api/ai/route.ts', 'utf8'),
   { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
).outputText;

// Exercise the actual route with auth, storage, and paid API calls replaced.
function setup({ signedIn = true, databaseFails = false, aiFails = false } = {}) {
   const state = { reservations: 0, aiCalls: 0 };
   const resetAt = new Date(Date.now() + 86_400_000).toISOString();
   const ai = async () => {
      state.aiCalls++;
      if (aiFails) throw new Error('Provider unavailable');
      return { message: 'OK' };
   };
   const imports = {
      'next/server': { NextResponse: Response },
      '@/lib/auth': { auth: async () => signedIn ? { user: { id: 'session-user' } } : null },
      '@/lib/anthropic': {
         breakdownTask: ai,
         suggestPriority: ai,
         createTasksFromNaturalLanguage: ai,
      },
      '@/lib/supabase': {
         createSupabaseAdminClient: () => ({
            rpc(name, args) {
               assert.equal(name, 'consume_ai_request');
               assert.equal(args.p_user_id, 'session-user');
               return {
                  async single() {
                     if (databaseFails) return { error: new Error('Database unavailable') };
                     const allowed = state.reservations < 6;
                     if (allowed) state.reservations++;
                     return { data: { allowed, remaining: 6 - state.reservations, reset_at: resetAt } };
                  },
               };
            },
         }),
      },
   };
   const context = {
      exports: {},
      require(name) {
         assert.ok(imports[name], `Unexpected import: ${name}`);
         return imports[name];
      },
      console: { error() {} },
   };
   vm.runInNewContext(source, context);
   return {
      state,
      post(body, raw = false) {
         return context.exports.POST(new Request('http://localhost/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: raw ? body : JSON.stringify(body),
         }));
      },
   };
}

test('unauthenticated requests never consume quota or reach Anthropic', async () => {
   const { post, state } = setup({ signedIn: false });
   assert.equal((await post({ action: 'priority', title: 'Task' })).status, 401);
   assert.deepEqual(state, { reservations: 0, aiCalls: 0 });
});

test('invalid requests never consume quota', async () => {
   const { post, state } = setup();
   for (const body of [null, [], {}, { action: 'unknown' },
      { action: 'priority', title: ' ' }, { action: 'breakdown', title: 1 },
      { action: 'priority', title: 'Task', description: {} },
      { action: 'natural-language', input: '' },
      { action: 'natural-language', input: {} }]) {
      assert.equal((await post(body)).status, 400);
   }
   assert.equal((await post('{', true)).status, 400);
   assert.deepEqual(state, { reservations: 0, aiCalls: 0 });
});

test('all actions share six requests; the seventh is blocked before Anthropic', async () => {
   const { post, state } = setup();
   const actions = ['priority', 'breakdown', 'natural-language'];
   for (let i = 0; i < 6; i++) {
      const response = await post({ action: actions[i % 3], title: 'Task', input: 'Task', user_id: 'forged-user' });
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('X-RateLimit-Remaining'), String(5 - i));
   }
   const blocked = await post({ action: 'priority', title: 'Task' });
   assert.equal(blocked.status, 429);
   assert.equal(blocked.headers.get('X-RateLimit-Remaining'), '0');
   assert.ok(Number(blocked.headers.get('Retry-After')) > 0);
   assert.match((await blocked.json()).error, /6 AI requests/);
   assert.deepEqual(state, { reservations: 6, aiCalls: 6 });
});

test('database failures block Anthropic calls', async () => {
   const { post, state } = setup({ databaseFails: true });
   assert.equal((await post({ action: 'breakdown', title: 'Task' })).status, 503);
   assert.deepEqual(state, { reservations: 0, aiCalls: 0 });
});

test('failed Anthropic attempts still consume quota', async () => {
   const { post, state } = setup({ aiFails: true });
   for (let i = 0; i < 6; i++) {
      assert.equal((await post({ action: 'priority', title: 'Task' })).status, 503);
   }
   assert.equal((await post({ action: 'priority', title: 'Task' })).status, 429);
   assert.deepEqual(state, { reservations: 6, aiCalls: 6 });
});
