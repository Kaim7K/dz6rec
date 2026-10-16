import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createEntitySubscriptions } from '../src/api/entitySubscriptions.js';

function environment() {
  let time=0, id=0; const timers=new Map(); const win=new EventTarget(); const doc=new EventTarget(); doc.visibilityState='visible'; const channel=new EventTarget();
  const window={addEventListener:win.addEventListener.bind(win),removeEventListener:win.removeEventListener.bind(win),setTimeout:(fn,delay)=>{timers.set(++id,{fn,at:time+delay});return id;},clearTimeout:key=>timers.delete(key)};
  const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
  const advance=async ms=>{const end=time+ms;while(true){const due=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!due||due[1].at>end)break;time=due[1].at;timers.delete(due[0]);due[1].fn();await flush();}time=end;await flush();};
  const subscribe=createEntitySubscriptions({window,document:doc,channel,now:()=>time});
  const event=entity=>win.dispatchEvent(new CustomEvent('dz6:entity-change',{detail:{entity}}));
  const visible=value=>{doc.visibilityState=value?'visible':'hidden';doc.dispatchEvent(new Event('visibilitychange'));};
  return {subscribe,event,visible,advance,flush,timers,win,channel};
}
test('global polling is bounded and duplicate callback registrations share one refresh',async()=>{
  const env=environment();let calls=0;const refresh=()=>{calls++;};const stop1=env.subscribe('Notification',refresh,900);const stop2=env.subscribe('Notification',refresh,900);
  await env.advance(14999);assert.equal(calls,0);assert.equal(env.timers.size,1);await env.advance(1);assert.equal(calls,1);
  stop1();await env.advance(15000);assert.equal(calls,2);stop2();assert.equal(env.timers.size,0);
});
test('hidden tabs stop polling and visibility resumes with one fresh read',async()=>{
  const env=environment();let calls=0;env.subscribe('SystemFlag',()=>{calls++;},1000);env.visible(false);await env.advance(120000);assert.equal(calls,0);assert.equal(env.timers.size,0);
  env.event('SystemFlag');env.win.dispatchEvent(new Event('focus'));await env.flush();assert.equal(calls,0);
  env.visible(true);await env.flush();assert.equal(calls,1);await env.advance(29999);assert.equal(calls,1);await env.advance(1);assert.equal(calls,2);
});
test('local and cross-tab changes refresh immediately without overlapping a pending callback',async()=>{
  const env=environment();let calls=0,finish;const refresh=()=>{calls++;return new Promise(resolve=>{finish=resolve;});};env.subscribe('ProjectMessage',refresh,900);
  env.event('ProjectMessage');await env.flush();assert.equal(calls,1);
  for(let i=0;i<5;i++)env.event('ProjectMessage');await env.advance(8000);assert.equal(calls,1);
  finish();await env.flush();assert.equal(calls,2);finish();await env.flush();
  env.channel.dispatchEvent(new MessageEvent('message',{data:{entity:'ProjectMessage'}}));await env.flush();assert.equal(calls,3);finish();await env.flush();
});
test('unsubscribe cancels queued work and releases the timer and event listeners',async()=>{
  const env=environment();let calls=0,finish;const stop=env.subscribe('Project',()=>{calls++;return new Promise(resolve=>{finish=resolve;});});env.event('Project');await env.flush();env.event('Project');stop();finish();await env.flush();await env.advance(60000);env.event('Project');await env.flush();assert.equal(calls,1);assert.equal(env.timers.size,0);
});
test('overview and direct conversation subscriptions retain independent cadences',async()=>{
  const env=environment();let overview=0,messages=0;env.subscribe('DirectMessage',()=>{overview++;},15000);env.subscribe('DirectMessage',()=>{messages++;},4000);await env.advance(16000);assert.equal(overview,1);assert.equal(messages,4);
});
test('repeated unsubscribe cannot remove a newer subscription for the same entity',async()=>{
  const env=environment();const first=env.subscribe('Project',()=>{});first();let calls=0;env.subscribe('Project',()=>{calls++;});first();env.event('Project');await env.flush();assert.equal(calls,1);
});
