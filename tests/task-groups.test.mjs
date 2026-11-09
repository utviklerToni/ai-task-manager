import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, imports) {
   const source = ts.transpileModule(readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
   }).outputText;
   const context = {
      exports: {},
      require(name) {
         assert.ok(imports[name], `Unexpected import: ${name}`);
         return imports[name];
      },
   };
   vm.runInNewContext(source, context);
   return context.exports;
}

// A fake Supabase client: records every query and answers from `respond`.
function fakeDb(respond) {
   const queries = [];
   return {
      queries,
      from(table) {
         const q = { table, ops: [] };
         queries.push(q);
         const builder = {
            then(resolve, reject) {
               return Promise.resolve(respond(q)).then(resolve, reject);
            },
            single() {
               q.ops.push(['single']);
               return Promise.resolve(respond(q));
            },
         };
         for (const op of ['select', 'insert', 'delete', 'eq', 'in']) {
            builder[op] = (...args) => {
               q.ops.push([op, ...args]);
               return builder;
            };
         }
         return builder;
      },
   };
}

const has = (q, op, ...args) =>
   q.ops.some(([o, ...a]) => o === op && JSON.stringify(a) === JSON.stringify(args));

function request(method, body) {
   return new Request('http://localhost/api', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
   });
}

function routeImports(db, signedIn = true) {
   return {
      'next/server': { NextResponse: Response },
      '@/lib/auth': { auth: async () => (signedIn ? { user: { id: 'user-1' } } : null) },
      '@/lib/supabase': { supabaseAdmin: db },
      '@/lib/taskGroups': {
         TASK_SELECT: '*, group:task_groups(id, title)',
         stripGroupFields: (b) => b,
         deleteEmptyGroups: async (userId, ids) => {
            db.cleanup = { userId, ids };
         },
      },
   };
}

const ID_A = '11111111-1111-4111-8111-111111111111';
const ID_B = '22222222-2222-4222-8222-222222222222';

test('bulk delete only targets the signed-in user and cleans up groups', async () => {
   const db = fakeDb(() => ({
      data: [
         { id: ID_A, group_id: 'g1' },
         { id: ID_B, group_id: null },
      ],
   }));
   const { DELETE } = load('src/app/api/tasks/route.ts', routeImports(db));

   const res = await DELETE(request('DELETE', { ids: [ID_A, ID_B] }));
   assert.equal(res.status, 200);
   assert.deepEqual(await res.json(), { deletedIds: [ID_A, ID_B] });

   const [q] = db.queries;
   assert.ok(has(q, 'delete'));
   assert.ok(has(q, 'eq', 'user_id', 'user-1'));
   assert.ok(has(q, 'in', 'id', [ID_A, ID_B]));
   assert.deepEqual(db.cleanup, { userId: 'user-1', ids: ['g1', null] });
});

test('bulk delete rejects bad input and signed-out users without touching the database', async () => {
   const db = fakeDb(() => ({ data: [] }));
   const { DELETE } = load('src/app/api/tasks/route.ts', routeImports(db));
   for (const body of [{}, { ids: [] }, { ids: ['not-a-uuid'] }, { ids: 'x' }]) {
      assert.equal((await DELETE(request('DELETE', body))).status, 400);
   }

   const signedOut = load('src/app/api/tasks/route.ts', routeImports(db, false));
   assert.equal((await signedOut.DELETE(request('DELETE', { ids: [ID_A] }))).status, 401);
   assert.equal(db.queries.length, 0);
});

test('creating a group saves tasks in step order under that group', async () => {
   const db = fakeDb((q) => {
      if (q.table === 'task_groups') return { data: { id: 'g1', title: 'Bake a cake' } };
      const insert = q.ops.find(([o]) => o === 'insert')[1];
      return { data: insert };
   });
   const { POST } = load('src/app/api/task-groups/route.ts', routeImports(db));

   const res = await POST(
      request('POST', {
         title: 'Bake a cake',
         tasks: [
            { title: 'Shop', priority: 'high', subtasks: [{ id: '1', title: 'Flour', completed: true }] },
            { title: 'Bake', priority: 'urgent', user_id: 'someone-else' },
         ],
      }),
   );
   assert.equal(res.status, 201);
   const { tasks } = await res.json();

   assert.deepEqual(
      tasks.map((t) => [t.title, t.group_id, t.group_position, t.user_id, t.priority]),
      [
         ['Shop', 'g1', 0, 'user-1', 'high'],
         ['Bake', 'g1', 1, 'user-1', 'medium'],
      ],
   );
   // AI output can't mark subtasks as already done.
   assert.equal(tasks[0].subtasks[0].completed, false);
});

test('a failed task insert removes the new group', async () => {
   const db = fakeDb((q) => {
      if (q.table === 'task_groups') return { data: { id: 'g1', title: 'x' } };
      return { error: { message: 'insert failed' } };
   });
   const { POST } = load('src/app/api/task-groups/route.ts', routeImports(db));

   const res = await POST(request('POST', { title: 'x', tasks: [{ title: 'a' }, { title: 'b' }] }));
   assert.equal(res.status, 500);
   const rollback = db.queries.at(-1);
   assert.equal(rollback.table, 'task_groups');
   assert.ok(has(rollback, 'delete'));
   assert.ok(has(rollback, 'eq', 'id', 'g1'));
});

test('creating a group validates its input', async () => {
   const db = fakeDb(() => ({ data: null }));
   const { POST } = load('src/app/api/task-groups/route.ts', routeImports(db));
   for (const body of [
      { tasks: [{ title: 'a' }] },
      { title: 'x', tasks: [] },
      { title: 'x', tasks: [{ title: '' }] },
   ]) {
      assert.equal((await POST(request('POST', body))).status, 400);
   }
   assert.equal(db.queries.length, 0);
});
