import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequestTracker, trackServiceRequests } from '../src/services/requestActivity.ts';

test('loader remains active until every overlapping request settles', async () => {
  const tracker = createRequestTracker();
  const counts = [];
  const unsubscribe = tracker.subscribe(() => counts.push(tracker.getSnapshot()));
  let finishFirst, failSecond;
  const first = tracker.run(() => new Promise(resolve => { finishFirst = resolve; }));
  const second = tracker.run(() => new Promise((resolve, reject) => { failSecond = reject; }));
  assert.equal(tracker.getSnapshot(), 2);
  finishFirst('done');
  assert.equal(await first, 'done');
  assert.equal(tracker.getSnapshot(), 1);
  const failed = assert.rejects(second, /network failure/);
  failSecond(new Error('network failure'));
  await failed;
  assert.equal(tracker.getSnapshot(), 0);
  assert.deepEqual(counts, [1, 2, 1, 0]);
  unsubscribe();
  await tracker.run(async () => {});
  assert.deepEqual(counts, [1, 2, 1, 0]);
});

test('service wrapper preserves receiver, results and cleanup after synchronous exceptions', async () => {
  const tracker = createRequestTracker();
  const service = trackServiceRequests({
    value: 42,
    async read() { assert.ok(tracker.getSnapshot() > 0); return this.value; },
    async nested() { return this.read(); },
    fail() { throw new Error('failed'); },
  }, tracker);
  assert.equal(await service.nested(), 42);
  assert.equal(tracker.getSnapshot(), 0);
  await assert.rejects(service.fail(), /failed/);
  assert.equal(tracker.getSnapshot(), 0);
  assert.equal(service.read, service.read);
});
