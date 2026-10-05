export const IANA_TIMEZONES = [
  'Asia/Taipei',
  'America/New_York',
  'America/Denver',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Australia/Sydney'
];

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

export function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

export function getTimezoneChoices() {
  return Array.from(new Set(['UTC', getBrowserTimeZone(), ...IANA_TIMEZONES]));
}

export function createUniqueId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatInputDate(dateValue) {
  const date = new Date(dateValue);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatInputTime(dateValue, timeZone = 'UTC') {
  const date = new Date(dateValue);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

export function getTimeZoneOffsetMinutes(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const values = {};

  for (const part of parts) {
    if (part.type !== 'literal' && part.type !== 'timeZoneName') {
      values[part.type] = part.value;
    }
  }

  const candidates = [
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  ];

  const zoneTime = Date.UTC(...candidates);
  return (zoneTime - date.getTime()) / 60000;
}

export function toAbsoluteTimestamp(dateString, timeString, timeZone) {
  if (!dateString || !timeString || !timeZone) {
    return null;
  }

  const [year, month, day] = dateString.split('-').map(Number);
  const [hour, minute] = timeString.split(':').map(Number);

  const wallClock = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(wallClock), timeZone);

  return new Date(wallClock - offsetMinutes * 60000).toISOString();
}

export function formatCountdown(ms) {
  const totalMs = Math.max(0, ms);
  const totalSeconds = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return {
    days,
    hours,
    minutes,
    totalSeconds
  };
}

export function formatCountdownText(ms) {
  const totalMs = Math.max(0, ms);
  const { days, hours } = formatCountdown(totalMs);

  if (ms <= 0) {
    return 'Past event';
  }

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}, ${hours} hour${hours === 1 ? '' : 's'}`;
  }

  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

export function formatCountdownParts(ms) {
  const totalMs = Math.max(0, ms);
  const { days, hours } = formatCountdown(totalMs);

  if (ms <= 0) {
    return { primary: 'Past', primaryLabel: '', secondary: '', secondaryLabel: '' };
  }

  return {
    primary: String(days),
    primaryLabel: days === 1 ? 'DAY' : 'DAYS',
    secondary: String(hours),
    secondaryLabel: hours === 1 ? 'HOUR' : 'HOURS'
  };
}

export function formatSourceTime(date, timeZone) {
  const eventDate = new Date(date);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'short'
  });

  const parts = formatter.formatToParts(eventDate);
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Thu';
  const month = parts.find((part) => part.type === 'month')?.value ?? 'Jan';
  const day = parts.find((part) => part.type === 'day')?.value ?? '1';
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  const tzName = parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone;

  return {
    dayLabel: `${weekday} ${month} ${day}`,
    timeLabel: `${hour}:${minute}`,
    zoneLabel: tzName === 'GMT' ? 'UTC' : tzName,
    full: `${weekday} ${month} ${day} · ${hour}:${minute} ${tzName === 'GMT' ? 'UTC' : tzName}`
  };
}

export function formatLocalTime(date) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
  return formatter.format(new Date(date));
}

export function formatDateInputValue(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTimeInputValue(date, timeZone) {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(d);
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
  return `${hour}:${minute}`;
}

function buildSeedInstant(daysFromNow, hoursFromNow = 0) {
  return new Date(Date.now() + daysFromNow * DAY_MS + hoursFromNow * HOUR_MS).toISOString();
}

export function createSeedEvents() {
  const browserZone = getBrowserTimeZone();

  return [
    {
      id: 'seed-gimbalabs-open-space',
      title: 'Gimbalabs Open Space',
      startsAt: buildSeedInstant(3, 6),
      timezone: 'UTC',
      originalTime: '2026-10-08T14:30',
      category: 'Gimbalabs',
      url: '',
      notes: 'Community meetup and project updates.'
    },
    {
      id: 'seed-travel-flight',
      title: 'Flight to Taipei',
      startsAt: buildSeedInstant(9, 4),
      timezone: 'Asia/Taipei',
      originalTime: '2026-10-18T11:00',
      category: 'Travel',
      url: '',
      notes: 'Check in early and review travel docs.'
    },
    {
      id: 'seed-deadline',
      title: 'Project proposal due',
      startsAt: buildSeedInstant(18, 12),
      timezone: browserZone,
      originalTime: '2026-10-28T17:00',
      category: 'Deadlines',
      url: '',
      notes: 'Send final draft to the team.'
    },
    {
      id: 'seed-past',
      title: 'Past milestone',
      startsAt: buildSeedInstant(-2, 1),
      timezone: 'UTC',
      originalTime: '2026-10-03T09:00',
      category: 'Personal',
      url: '',
      notes: 'This one should sit in the Past column.'
    }
  ];
}

export function sortEvents(events, sortKey) {
  const list = [...events];

  if (sortKey === 'furthest') {
    return list.sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt));
  }

  if (sortKey === 'category') {
    return list.sort((a, b) => {
      const catCompare = (a.category || '').localeCompare(b.category || '');
      return catCompare || new Date(a.startsAt) - new Date(b.startsAt);
    });
  }

  return list.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
}

export function getCategories(events) {
  const categories = new Set(events.map((event) => event.category || 'General'));
  return ['All', ...Array.from(categories).sort((a, b) => a.localeCompare(b))];
}

export function isPastEvent(event) {
  return new Date(event.startsAt).getTime() < Date.now();
}

export function prepareEventFromInput(input) {
  const { title, date, time, timezone, category, url, notes } = input;
  const startsAt = toAbsoluteTimestamp(date, time, timezone);

  return {
    id: input.id || createUniqueId(),
    title: title.trim() || 'Untitled event',
    startsAt,
    timezone,
    originalTime: `${date}T${time}`,
    category: category.trim() || 'General',
    url: url.trim(),
    notes: notes.trim()
  };
}

export function previewEvent(input) {
  const { title, date, time, timezone } = input;
  const startsAt = toAbsoluteTimestamp(date, time, timezone);

  if (!startsAt) {
    return {
      title: title?.trim() || 'Untitled event',
      source: 'Choose a date and time',
      local: 'Your local time: --',
      countdown: 'Preview will appear here.'
    };
  }

  const dateValue = new Date(startsAt);
  const countdown = formatCountdownText(dateValue.getTime() - Date.now());

  return {
    title: title?.trim() || 'Untitled event',
    source: `${time} ${timezone}`,
    local: `Your local time: ${formatLocalTime(dateValue)}`,
    countdown: `Starts in ${countdown}`
  };
}

export function readStoredEvents() {
  const seed = createSeedEvents();

  if (typeof localStorage === 'undefined') {
    return seed;
  }

  const stored = localStorage.getItem('countdown-board-events-v1');
  if (!stored) {
    localStorage.setItem('countdown-board-events-v1', JSON.stringify(seed));
    return seed;
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : seed;
  } catch (error) {
    localStorage.setItem('countdown-board-events-v1', JSON.stringify(seed));
    return seed;
  }
}
