const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildCoinFlipAnimation } = require('../coin-flip.js');
const angleOf = frame => Number(frame.transform.match(/rotateX\(([^)]+)deg\)/)[1]);

test('longer tosses add rotations while keeping airborne speed and phase timings fixed', () => {
    let previousRotations = 0;
    for (const duration of [500, 1900, 5000, 15000]) {
        const frames = buildCoinFlipAnimation(duration, 0, 0);
        assert.ok(Math.abs(frames[1].offset * duration - 150) < 1e-8);
        assert.ok(Math.abs((1 - frames[2].offset) * duration - 250) < 1e-8);
        for (let i = 1; i <= 2; i++) {
            const seconds = (frames[i].offset - frames[i - 1].offset) * duration / 1000;
            const speed = (angleOf(frames[i]) - angleOf(frames[i - 1])) / seconds;
            assert.ok(Math.abs(speed - 1080) < 1e-8, `speed ${speed} at ${duration}ms`);
        }
        assert.ok(angleOf(frames[3]) > previousRotations);
        previousRotations = angleOf(frames[3]);
    }
});

test('either prior face lands on either result without reversing direction', () => {
    for (const duration of [500, 700, 1900, 2700, 15000]) {
        for (const start of [0, 180]) for (const result of [0, 180]) {
            const frames = buildCoinFlipAnimation(duration, start, result);
            const angles = frames.map(angleOf);
            assert.equal(angles[0], start);
            assert.equal(angles.at(-1) % 360, result);
            assert.ok(angles.every((angle, i) => i === 0 || angle >= angles[i - 1]));
            assert.ok(angles.at(-1) - angles.at(-2) < 360);
            assert.equal(frames.at(-1).offset, 1);
        }
    }
});
