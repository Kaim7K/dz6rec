import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { mock, test } from 'node:test';

let calls=0,failNext=false;
process.env.DATABASE_URL='postgres://isolated.test/never-connected';
mock.module('@neondatabase/serverless',{exports:{neon:()=>async()=>{calls++;if(failNext){failNext=false;throw new Error('Simulated database outage');}return [];}}});
const {ensureDatabase}=await import('../api/_db.js');
const {default:handler}=await import('../api/[...path].js');
test('a transient bootstrap failure can retry, then shares successful initialization',async()=>{
  failNext=true;await assert.rejects(ensureDatabase(),/Simulated database outage/);const afterFailure=calls;
  await Promise.all([ensureDatabase(),ensureDatabase(),ensureDatabase()]);assert.equal(calls-afterFailure,4);
  const initialized=calls;await ensureDatabase();assert.equal(calls,initialized);
});
test('an asynchronous auth database failure is returned as JSON instead of escaping the route',async t=>{
  t.mock.method(console,'error',()=>{});await ensureDatabase();failNext=true;
  const req=Readable.from([Buffer.from(JSON.stringify({email:'test@isolated.local',password:'not-a-real-password'}))]);req.url='/api/auth/login';req.method='POST';req.headers={};
  const res={setHeader(){},end(text){this.body=JSON.parse(text);}};await handler(req,res);
  assert.equal(res.statusCode,500);assert.equal(res.body.error,'Simulated database outage');
});
