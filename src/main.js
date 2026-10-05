import './style.css';
import {
  getTimezoneChoices,
  sortEvents,
  getCategories,
  isPastEvent,
  prepareEventFromInput,
  previewEvent,
  readStoredEvents,
  formatCountdownParts,
  formatCountdownText,
  formatSourceTime,
  formatLocalTime
} from './time-utils.js';

const STORAGE_KEY = 'countdown-board-events-v1';

const app = document.querySelector('#app');

const state = {
  events: readStoredEvents(),
  filter: 'All',
  sort: 'soonest',
  view: 'upcoming',
  editingId: null,
  formOpen: false
};

let countdownTicker = null;

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.events));
}

function renderApp() {
  if (countdownTicker) {
    clearInterval(countdownTicker);
    countdownTicker = null;
  }

  app.innerHTML = `
    <div class="board-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Personal Countdown Board</p>
          <h1>Upcoming moments</h1>
        </div>
        <button id="toggle-form" class="primary-button" type="button">+ Add Event</button>
      </header>

      <section class="toolbar">
        <div class="toolbar-group">
          <label for="category-filter">Category</label>
          <select id="category-filter"></select>
        </div>
        <div class="toolbar-group">
          <label for="sort-order">Sort</label>
          <select id="sort-order">
            <option value="soonest">Soonest first</option>
            <option value="furthest">Furthest first</option>
            <option value="category">Category</option>
          </select>
        </div>
        <div class="toolbar-group segmented-control" aria-label="Event timeline toggles">
          <button class="segment-button active" data-view="upcoming" type="button">Upcoming</button>
          <button class="segment-button" data-view="past" type="button">Past</button>
        </div>
      </section>

      <section id="event-form" class="event-form hidden" aria-label="Event form">
        <form id="event-form-el">
          <div class="form-header">
            <h2 id="form-title">Add event</h2>
            <button id="close-form" class="ghost-button" type="button">Close</button>
          </div>

          <div class="form-grid">
            <label>
              Title
              <input id="event-title" name="title" type="text" placeholder="Gimbalabs Open Space" required />
            </label>
            <label>
              Category
              <input id="event-category" name="category" type="text" placeholder="Personal" />
            </label>
            <label>
              Date
              <input id="event-date" name="date" type="date" required />
            </label>
            <label>
              Time
              <input id="event-time" name="time" type="time" required />
            </label>
            <label>
              Timezone
              <select id="event-timezone" name="timezone"></select>
            </label>
            <label>
              URL (optional)
              <input id="event-url" name="url" type="url" placeholder="https://" />
            </label>
            <label class="full-width">
              Notes (optional)
              <textarea id="event-notes" name="notes" rows="3" placeholder="Add reminders or context"></textarea>
            </label>
          </div>

          <div class="preview-box" aria-live="polite">
            <h3 id="preview-title">Preview</h3>
            <p id="preview-source">Choose a date and time</p>
            <p id="preview-local">Your local time: --</p>
            <p id="preview-countdown">Preview will appear here.</p>
          </div>

          <div class="form-actions">
            <button class="primary-button" type="submit">Save Event</button>
            <button id="cancel-edit" class="ghost-button" type="button">Cancel</button>
          </div>
        </form>
      </section>

      <div id="event-list" class="event-list"></div>
    </div>
  `;

  const categoryFilter = document.querySelector('#category-filter');
  const sortOrder = document.querySelector('#sort-order');
  const eventList = document.querySelector('#event-list');
  const form = document.querySelector('#event-form');
  const formEl = document.querySelector('#event-form-el');
  const toggleFormButton = document.querySelector('#toggle-form');
  const closeFormButton = document.querySelector('#close-form');
  const cancelEditButton = document.querySelector('#cancel-edit');
  const segmentButtons = document.querySelectorAll('.segment-button');

  categoryFilter.innerHTML = getCategories(state.events)
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join('');
  categoryFilter.value = state.filter;

  sortOrder.value = state.sort;

  segmentButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.view === state.view);
  });

  form.classList.toggle('hidden', !state.formOpen);
  formEl.dataset.mode = state.editingId ? 'edit' : 'new';
  document.querySelector('#form-title').textContent = state.editingId ? 'Edit event' : 'Add event';

  populateTimezoneOptions();

  if (state.editingId) {
    const event = state.events.find((item) => item.id === state.editingId);
    if (event) {
      fillFormFields(event);
    }
  } else {
    resetFormFields();
  }

  const filteredEvents = getVisibleEvents();
  if (!filteredEvents.length) {
    eventList.innerHTML = `
      <div class="empty-state">
        <h3>No events in this view.</h3>
        <p>Try changing the filters or add a new event.</p>
      </div>
    `;
    return;
  }

  eventList.innerHTML = filteredEvents
    .map((event) => renderEventCard(event))
    .join('');

  const updateCountdownDisplay = () => {
    const cards = eventList.querySelectorAll('.event-card');
    let shouldRefresh = false;

    cards.forEach((card) => {
      const eventId = card.dataset.eventId;
      const event = state.events.find((item) => item.id === eventId);
      if (!event) {
        return;
      }

      const diff = Date.parse(event.startsAt) - Date.now();
      if (state.view === 'upcoming' && diff <= 0) {
        shouldRefresh = true;
      }

      const countdown = formatCountdownParts(diff);
      const countdownPrimary = card.querySelector('.countdown-primary');
      const countdownSecondary = card.querySelector('.countdown-secondary');
      const countdownLabel = card.querySelector('.countdown-label');
      const countdownSubtitle = card.querySelector('.countdown-subtitle');
      const summary = card.querySelector('.card-details p:last-child');

      if (countdownPrimary) countdownPrimary.textContent = countdown.primary;
      if (countdownSecondary) countdownSecondary.textContent = countdown.secondary;
      if (countdownLabel) countdownLabel.textContent = countdown.primaryLabel;
      if (countdownSubtitle) countdownSubtitle.textContent = countdown.secondaryLabel;
      if (summary) summary.textContent = formatCountdownText(diff);
    });

    if (shouldRefresh) {
      renderApp();
    }
  };

  categoryFilter.addEventListener('change', (event) => {
    state.filter = event.target.value;
    renderApp();
  });

  sortOrder.addEventListener('change', (event) => {
    state.sort = event.target.value;
    renderApp();
  });

  toggleFormButton.addEventListener('click', () => {
    state.formOpen = true;
    state.editingId = null;
    renderApp();
  });

  closeFormButton.addEventListener('click', () => {
    state.formOpen = false;
    state.editingId = null;
    resetFormFields();
    renderApp();
  });

  cancelEditButton.addEventListener('click', () => {
    state.formOpen = false;
    state.editingId = null;
    resetFormFields();
    renderApp();
  });

  segmentButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.view = button.dataset.view;
      renderApp();
    });
  });

  formEl.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextEvent = prepareEventFromInput({
      id: state.editingId,
      title: formData.get('title'),
      date: formData.get('date'),
      time: formData.get('time'),
      timezone: formData.get('timezone'),
      category: formData.get('category'),
      url: formData.get('url'),
      notes: formData.get('notes')
    });

    if (state.editingId) {
      state.events = state.events.map((item) => (item.id === state.editingId ? nextEvent : item));
    } else {
      state.events = [...state.events, nextEvent];
    }

    saveEvents();
    state.formOpen = false;
    state.editingId = null;
    resetFormFields();
    renderApp();
  });

  document.querySelectorAll('#event-title, #event-date, #event-time, #event-timezone, #event-category').forEach((field) => {
    field.addEventListener('input', updatePreview);
    field.addEventListener('change', updatePreview);
  });

  eventList.querySelectorAll('.event-card').forEach((card) => {
    const editButton = card.querySelector('[data-action="edit"]');
    const deleteButton = card.querySelector('[data-action="delete"]');

    editButton?.addEventListener('click', () => {
      state.formOpen = true;
      state.editingId = editButton.dataset.id;
      renderApp();
    });

    deleteButton?.addEventListener('click', () => {
      const id = deleteButton.dataset.id;
      state.events = state.events.filter((event) => event.id !== id);
      saveEvents();
      renderApp();
    });
  });

  countdownTicker = setInterval(updateCountdownDisplay, 20000);
}

function getVisibleEvents() {
  const visible = state.events.filter((event) => {
    const matchesCategory = state.filter === 'All' || event.category === state.filter;
    const matchesView = state.view === 'upcoming' ? !isPastEvent(event) : isPastEvent(event);
    return matchesCategory && matchesView;
  });

  return sortEvents(visible, state.sort);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeUrl(value) {
  if (!value) {
    return '';
  }

  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return url.toString();
    }
  } catch (error) {
    return '';
  }

  return '';
}

function renderEventCard(event) {
  const source = formatSourceTime(event.startsAt, event.timezone);
  const local = formatLocalTime(event.startsAt);
  const countdown = formatCountdownParts(Date.parse(event.startsAt) - Date.now());
  const isPast = isPastEvent(event);
  const safeLink = safeUrl(event.url);
  const linkMarkup = safeLink
    ? `<a href="${escapeHtml(safeLink)}" target="_blank" rel="noreferrer">Open link</a>`
    : '';

  return `
    <article class="event-card ${isPast ? 'is-past' : ''}" data-event-id="${escapeHtml(event.id)}">
      <div class="card-body">
        <div class="card-header">
          <div>
            <p class="card-category">${escapeHtml(event.category || 'General')}</p>
            <h3>${escapeHtml(event.title)}</h3>
          </div>
          <div class="event-actions">
            <button type="button" class="icon-button" data-action="edit" data-id="${escapeHtml(event.id)}">Edit</button>
            <button type="button" class="icon-button danger" data-action="delete" data-id="${escapeHtml(event.id)}">Delete</button>
          </div>
        </div>

        <div class="countdown-block">
          <div class="countdown-primary">${escapeHtml(countdown.primary)}</div>
          <div class="countdown-label">${escapeHtml(countdown.primaryLabel)}</div>
          <div class="countdown-secondary">${escapeHtml(countdown.secondary)}</div>
          <div class="countdown-subtitle">${escapeHtml(countdown.secondaryLabel)}</div>
        </div>

        <div class="card-time-meta">
          <p>${escapeHtml(`${source.timeLabel} ${source.zoneLabel}`)}</p>
          <p>Your time · ${escapeHtml(local)}</p>
        </div>

        <div class="card-details">
          <p>${escapeHtml(source.dayLabel)}</p>
          <p>${escapeHtml(formatCountdownText(Date.parse(event.startsAt) - Date.now()))}</p>
        </div>

        ${event.notes ? `<p class="notes">${escapeHtml(event.notes)}</p>` : ''}
        ${linkMarkup}
      </div>
    </article>
  `;
}

function populateTimezoneOptions() {
  const select = document.querySelector('#event-timezone');
  const options = getTimezoneChoices();
  const current = select.value || 'UTC';

  select.innerHTML = options
    .map((timezone) => `<option value="${escapeHtml(timezone)}">${escapeHtml(timezone)}</option>`)
    .join('');

  if (options.includes(current)) {
    select.value = current;
  } else {
    select.value = 'UTC';
  }
}

function fillFormFields(event) {
  document.querySelector('#event-title').value = event.title || '';
  document.querySelector('#event-category').value = event.category || '';
  document.querySelector('#event-date').value = event.originalTime ? event.originalTime.slice(0, 10) : '';
  document.querySelector('#event-time').value = event.originalTime ? event.originalTime.slice(11, 16) : '';
  document.querySelector('#event-timezone').value = event.timezone || 'UTC';
  document.querySelector('#event-url').value = event.url || '';
  document.querySelector('#event-notes').value = event.notes || '';
  updatePreview();
}

function resetFormFields() {
  const defaultTimeZone = getTimezoneChoices()[0] || 'UTC';
  document.querySelector('#event-form-el').reset();
  document.querySelector('#event-timezone').value = defaultTimeZone;
  updatePreview();
}

function updatePreview() {
  const form = document.querySelector('#event-form-el');
  const formData = new FormData(form);
  const preview = previewEvent({
    title: formData.get('title'),
    date: formData.get('date'),
    time: formData.get('time'),
    timezone: formData.get('timezone') || 'UTC'
  });

  document.querySelector('#preview-title').textContent = preview.title;
  document.querySelector('#preview-source').textContent = preview.source;
  document.querySelector('#preview-local').textContent = preview.local;
  document.querySelector('#preview-countdown').textContent = preview.countdown;
}

renderApp();
