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
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTimeInTimeZone(dateValue, timeZone = 'UTC') {
  const date = new Date(dateValue);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const values = {};
  for (const part of parts) {
    if (part.type !== 'literal' && part.type !== 'timeZoneName') {
      values[part.type] = part.value;
    }
  }

  const year = values.year ?? '1970';
  const month = values.month ?? '01';
  const day = values.day ?? '01';
  const hour = values.hour ?? '00';
  const minute = values.minute ?? '00';

  return `${year}-${month}-${day}T${hour}:${minute}`;
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

  let day = Number(values.day);
  let hour = Number(values.hour);
  const minute = Number(values.minute);
  const second = Number(values.second);
  const year = Number(values.year);
  const month = Number(values.month) - 1;

  if (hour === 24) {
    hour = 0;
    day += 1;
  }

  const zoneTime = new Date(Date.UTC(year, month, day, hour, minute, second)).getTime();
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
  if (ms <= 0) {
    return 'Past event';
  }

  const { days, hours } = formatCountdown(ms);

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}, ${hours} hour${hours === 1 ? '' : 's'}`;
  }

  return `${hours} hour${hours === 1 ? '' : 's'}`;
}

export function formatCountdownParts(ms) {
  if (ms <= 0) {
    return { primary: 'Past', primaryLabel: 'EVENT', secondary: '', secondaryLabel: '' };
  }

  const { days, hours } = formatCountdown(ms);

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
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
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
  return new Date(Date.now() + daysFromNow * DAY_MS + hoursFromNow * HOUR_MS);
}

export function createSeedEvents() {
  const browserZone = getBrowserTimeZone();

  const openSpace = buildSeedInstant(3, 6);
  const travel = buildSeedInstant(9, 4);
  const deadline = buildSeedInstant(18, 12);
  const pastMilestone = buildSeedInstant(-2, 1);

  return [
    {
      id: 'seed-gimbalabs-open-space',
      title: 'Gimbalabs Open Space',
      startsAt: openSpace.toISOString(),
      timezone: 'UTC',
      originalTime: formatDateTimeInTimeZone(openSpace, 'UTC').slice(0, 16),
      category: 'Gimbalabs',
      url: '',
      notes: 'Community meetup and project updates.'
    },
    {
      id: 'seed-travel-flight',
      title: 'Flight to Taipei',
      startsAt: travel.toISOString(),
      timezone: 'Asia/Taipei',
      originalTime: formatDateTimeInTimeZone(travel, 'Asia/Taipei').slice(0, 16),
      category: 'Travel',
      url: '',
      notes: 'Check in early and review travel docs.'
    },
    {
      id: 'seed-deadline',
      title: 'Project proposal due',
      startsAt: deadline.toISOString(),
      timezone: browserZone,
      originalTime: formatDateTimeInTimeZone(deadline, browserZone).slice(0, 16),
      category: 'Deadlines',
      url: '',
      notes: 'Send final draft to the team.'
    },
    {
      id: 'seed-past',
      title: 'Past milestone',
      startsAt: pastMilestone.toISOString(),
      timezone: 'UTC',
      originalTime: formatDateTimeInTimeZone(pastMilestone, 'UTC').slice(0, 16),
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
  const unixDiff = dateValue.getTime() - Date.now();

  if (unixDiff <= 0) {
    return {
      title: title?.trim() || 'Untitled event',
      source: `${time} ${timezone}`,
      local: `Your local time: ${formatLocalTime(dateValue)}`,
      countdown: 'Past event'
    };
  }

  const countdown = formatCountdownText(unixDiff);

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
