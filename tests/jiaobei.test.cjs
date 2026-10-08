const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getJiaobeiResult, buildJiaobeiAnimation, sampleJiaobeiThrow } = require('../jiaobei.js');

test('both mixed orders are sheng, two flat faces are xiao, two convex faces are ku', () => {
    assert.equal(getJiaobeiResult(true, false).key, 'sheng');
    assert.equal(getJiaobeiResult(false, true).key, 'sheng');
    assert.equal(getJiaobeiResult(true, true).key, 'xiao');
    assert.equal(getJiaobeiResult(false, false).key, 'ku');
});

test('each face and duration gets its own draw, with a 55 percent flat threshold', () => {
    const values = [0.549999, 0, 0.55, 0.999999];
    const plan = sampleJiaobeiThrow(() => values.shift());
    assert.equal(plan[0].flat, true);
    assert.equal(plan[1].flat, false);
    assert.equal(plan[0].duration, 1000);
    assert.ok(plan[1].duration > 4999 && plan[1].duration <= 5000);
    assert.equal(values.length, 0);
    assert.deepEqual(sampleJiaobeiThrow(() => 0.9).map(block => block.flat), [false, false]);
});

test('uniform face samples yield 55 percent flat for both blocks', () => {
    const counts = { sheng: 0, xiao: 0, ku: 0 };
    for (let a = 0; a < 100; a++) for (let b = 0; b < 100; b++) {
        const values = [(a + .5) / 100, .2, (b + .5) / 100, .8];
        const plan = sampleJiaobeiThrow(() => values.shift());
        counts[getJiaobeiResult(plan[0].flat, plan[1].flat).key]++;
    }
    assert.deepEqual(counts, { sheng: 4950, xiao: 3025, ku: 2025 });
});

test('near-equal durations are separated while remaining inside 1 to 5 seconds', () => {
    for (const value of [0, 0.5, 0.95, 0.999999]) {
        const plan = sampleJiaobeiThrow(() => value);
        assert.ok(Math.abs(plan[0].duration - plan[1].duration) >= 199.999999);
        assert.ok(plan.every(block => block.duration >= 1000 && block.duration <= 5000));
    }
});

test('each block keeps rotation speed as duration grows and lands on selected face', () => {
    const angleOf = frame => Number(frame.transform.match(/rotateX\(([^)]+)deg\)/)[1]);
    for (const duration of [500, 2000, 15000]) for (const start of [0, 180]) for (const end of [0, 180]) {
        const frames = buildJiaobeiAnimation(duration, start, end, -18);
        assert.equal(angleOf(frames[3]) % 360, end);
        assert.ok(angleOf(frames[3]) >= angleOf(frames[2]));
        assert.ok(Math.abs((angleOf(frames[2]) - angleOf(frames[1])) / ((frames[2].offset - frames[1].offset) * duration / 1000) - 1080) < 1e-8);
        assert.ok(Math.abs((1 - frames[2].offset) * duration - 250) < 1e-8);
    }
});
