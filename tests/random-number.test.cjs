const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generateSequence } = require('../random-number.js');

test('drawing every available number yields the entire inclusive range once', () => {
    for (const random of [() => 0, () => 0.5, () => 0.9999999999999999]) {
        const result = generateSequence(1, 10, 10, true, random);
        assert.deepEqual([...result].sort((a, b) => a - b), [1,2,3,4,5,6,7,8,9,10]);
    }
});

test('sampling a huge range uses bounded draws without duplicate retries', () => {
    let calls = 0;
    const result = generateSequence(1, Number.MAX_SAFE_INTEGER, 1000, true, () => { calls++; return 0; });
    assert.equal(calls, 1000);
    assert.equal(result.length, 1000);
    assert.equal(new Set(result).size, 1000);
    assert.ok(result.every(n => Number.isSafeInteger(n) && n >= 1 && n <= Number.MAX_SAFE_INTEGER));
});

test('repeat mode permits more outputs than the range size', () => {
    assert.deepEqual(generateSequence(7, 7, 5, false), [7,7,7,7,7]);
    assert.deepEqual(generateSequence(7, 7, 1, true), [7]);
    assert.throws(() => generateSequence(7, 7, 2, true), RangeError);
});

test('invalid ranges and quantities are rejected before sampling', () => {
    const random = () => { throw new Error('Random must not be called for invalid input'); };
    for (const [min, max, count] of [[0,10,5],[-1,10,5],[1.5,10,5],[10,1,1],[1,Infinity,1],[1,Number.MAX_SAFE_INTEGER+1,1],[1,10,0],[1,10,1.5],[1,10,1001],[1,10,11]]) {
        assert.throws(() => generateSequence(min, max, count, true, random), RangeError);
    }
});

test('large numbers preserve all significant integer digits', () => {
    assert.deepEqual(generateSequence(10000,10000,1,true), [10000]);
    assert.deepEqual(generateSequence(Number.MAX_SAFE_INTEGER-2, Number.MAX_SAFE_INTEGER,3,true,()=>0).sort((a,b)=>a-b), [Number.MAX_SAFE_INTEGER-2,Number.MAX_SAFE_INTEGER-1,Number.MAX_SAFE_INTEGER]);
});
