import test from 'node:test';
import assert from 'node:assert/strict';

import {
  toAbsoluteTimestamp,
  getTimeZoneOffsetMinutes,
  formatCountdownText,
  sortEvents,
  prepareEventFromInput,
  previewEvent
} from '../src/time-utils.js';

test('toAbsoluteTimestamp converts UTC wall time into an absolute instant', () => {
  const instant = toAbsoluteTimestamp('2026-10-08', '14:30', 'UTC');
  assert.equal(new Date(instant).toISOString(), '2026-10-08T14:30:00.000Z');
});

test('toAbsoluteTimestamp respects a non-UTC timezone when converting input', () => {
  const instant = toAbsoluteTimestamp('2026-10-08', '14:30', 'Asia/Taipei');
  const parsed = new Date(instant);
  assert.equal(parsed.toISOString(), '2026-10-08T06:30:00.000Z');
});

test('getTimeZoneOffsetMinutes returns a sensible offset for UTC and Taipei', () => {
  const utcOffset = getTimeZoneOffsetMinutes(new Date('2026-10-08T14:30:00Z'), 'UTC');
  const taipeiOffset = getTimeZoneOffsetMinutes(new Date('2026-10-08T14:30:00Z'), 'Asia/Taipei');

  assert.equal(utcOffset, 0);
  assert.ok(Math.abs(taipeiOffset - 480) < 1);
});

test('formatCountdownText produces a readable duration for upcoming events', () => {
  const text = formatCountdownText(3 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000);
  assert.equal(text, '3 days, 6 hours');
});

test('sortEvents supports soonest, furthest, and category ordering', () => {
  const events = [
    { id: 'b', startsAt: '2026-10-05T00:00:00Z', category: 'Travel' },
    { id: 'a', startsAt: '2026-10-03T00:00:00Z', category: 'Gimbalabs' },
    { id: 'c', startsAt: '2026-10-04T00:00:00Z', category: 'Personal' }
  ];

  const soonest = sortEvents(events, 'soonest');
  assert.deepEqual(soonest.map((event) => event.id), ['a', 'c', 'b']);

  const furthest = sortEvents(events, 'furthest');
  assert.deepEqual(furthest.map((event) => event.id), ['b', 'c', 'a']);

  const category = sortEvents(events, 'category');
  assert.deepEqual(category.map((event) => event.id), ['a', 'c', 'b']);
});

test('prepareEventFromInput keeps the canonical timestamp and user-facing metadata', () => {
  const event = prepareEventFromInput({
    title: 'Open Space',
    date: '2026-10-08',
    time: '14:30',
    timezone: 'UTC',
    category: 'Gimbalabs',
    url: 'https://example.com',
    notes: 'Bring a laptop'
  });

  assert.equal(event.title, 'Open Space');
  assert.equal(event.startsAt, '2026-10-08T14:30:00.000Z');
  assert.equal(event.timezone, 'UTC');
  assert.equal(event.category, 'Gimbalabs');
  assert.equal(event.originalTime, '2026-10-08T14:30');
});

test('previewEvent reports the source and local interpretations before saving', () => {
  const preview = previewEvent({
    title: 'Open Space',
    date: '2026-10-08',
    time: '14:30',
    timezone: 'UTC'
  });

  assert.equal(preview.title, 'Open Space');
  assert.equal(preview.source, '14:30 UTC');
  assert.match(preview.countdown, /^Starts in \d+ day/);

  const pastPreview = previewEvent({
    title: 'Past Event',
    date: '2000-01-01',
    time: '00:00',
    timezone: 'UTC'
  });

  assert.equal(pastPreview.countdown, 'Past event');
});
