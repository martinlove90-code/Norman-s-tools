const { test } = require('node:test');
const assert = require('node:assert/strict');
const { getJiaobeiResult, buildJiaobeiAnimation } = require('../jiaobei.js');

test('both mixed orders are sheng, two flat faces are xiao, two convex faces are ku', () => {
    assert.equal(getJiaobeiResult(true, false).key, 'sheng');
    assert.equal(getJiaobeiResult(false, true).key, 'sheng');
    assert.equal(getJiaobeiResult(true, true).key, 'xiao');
    assert.equal(getJiaobeiResult(false, false).key, 'ku');
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
