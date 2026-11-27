// 資料庫規則測試：npm test（需要 Java，會自動開 Firestore 模擬器）
import { test, before, after } from 'node:test';
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

let env;
const db = (uid) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();

before(async () => {
  env = await initializeTestEnvironment({ projectId: 'arice-test', firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') } });
  await env.withSecurityRulesDisabled(async (c) => {
    const f = c.firestore();
    await f.doc('members/uA').set({ sid: 's01' });                 // 學生 s01
    await f.doc('members/uB').set({ sid: 's02' });                 // 學生 s02
    await f.doc('members/uP').set({ sid: 's02', role: 'parent' }); // s02 的家長
    await f.doc('isl_stu/s01').set({ m: {} });
    await f.doc('isl_stu/s02').set({ m: {} });
    await f.doc('isl_rank/s02').set({ days: { '20261126': 4 } });
    await f.doc('isl_pmsg/s02_1').set({ sid: 's02', from: 'p', text: 'hi' });
    await f.doc('login/a11501').set({ email: 'a11501.v1@stu.arice.app', sid: 's01' });
  });
});
after(() => env.cleanup());

test('家長只讀得到自己小孩', async () => {
  await assertSucceeds(db('uP').doc('isl_stu/s02').get());
  await assertFails(db('uP').doc('isl_stu/s01').get());
});

test('學生只能寫自己的紀錄', async () => {
  await assertSucceeds(db('uA').doc('isl_stu/s01').set({ m: {}, _uid: 'uA' }));
  await assertFails(db('uA').doc('isl_stu/s02').set({ m: {}, _uid: 'uA' }));
});

test('學生只能讀公開排行榜和自己的詳細紀錄', async () => {
  await assertSucceeds(db('uA').doc('isl_rank/s02').get());
  await assertSucceeds(db('uA').doc('isl_stu/s01').get());
  await assertFails(db('uA').doc('isl_stu/s02').get());
  await assertFails(db('uA').doc('isl_log/s02_20261120').get());
});

test('學生不能在同學名下建立假紀錄', async () => {
  await assertFails(db('uA').doc('isl_log/s02_20261120').set({ a: [], _uid: 'uA' }));
  await assertSucceeds(db('uA').collection('kj_results').add({ n: 1, _uid: 'uA' })); // 遊戲成績照常可以新增
});

test('學生看不到家長留言', async () => {
  await assertFails(db('uA').doc('isl_pmsg/s02_1').get());
});

test('沒登入：能查單一帳號，不能列出全部', async () => {
  await assertSucceeds(db(null).doc('login/a11501').get());
  await assertFails(db(null).collection('login').get());
});
