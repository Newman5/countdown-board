# Countdown Board

A simple personal countdown board for keeping track of upcoming events and deadlines.

Countdown Board is built around a simple idea:

> **Absolute time → relative time**

An event happens at one specific moment, but what we often want to know is:

**How long from now?**

The app stores events as absolute timestamps and displays them as countdown cards. This makes the countdown useful even when traveling between time zones.

## Features

- Create personal countdown events
- Store events locally in the browser with LocalStorage
- Display live countdowns for upcoming events
- Show both the event time and your current local time
- Assign events to categories
- Filter events by category
- Sort by soonest, furthest, or category
- Edit and delete events
- Keep past events separate from upcoming events
- Persist personal events across browser refreshes

No account, backend, or database is required.

## Time Zones

Countdown Board separates an event's absolute time from the way that time is displayed.

For example, a Gimbalabs event might occur at:

```text
14:30 UTC
```

Someone in Taiwan might see:

```text
Your time: 10:30 PM
Starts in: 3 days, 6 hours
```

If that person later travels to another time zone, the absolute event time and countdown remain unchanged. Only the local-time display changes.

## Technology

Countdown Board is intentionally small.

It uses:

- Vanilla JavaScript
- HTML
- CSS
- Vite
- Browser LocalStorage
- Browser `Intl` APIs for time-zone display
- GitHub Pages for hosting

There is no JavaScript framework and no backend.

## Development

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Vite will provide a local development URL.

Run the tests with:

```bash
npm test
```

## Production Build

Create a production build with:

```bash
npm run build
```

Vite generates the deployable site in:

```text
dist/
```

You can preview that production build locally with:

```bash
npm run preview
```

The `dist/` directory is generated output and should not be committed to the repository.

## GitHub Pages Deployment

The app is deployed at:

https://newman5.github.io/countdown-board/

Pushes to `main` trigger the GitHub Actions workflow:

```text
.github/workflows/deploy-pages.yml
```

The deployment process is:

```text
source code
    ↓
npm ci
    ↓
npm test
    ↓
npm run build
    ↓
dist/
    ↓
GitHub Pages
```

GitHub Pages should be configured with:

**Settings → Pages → Build and deployment → Source → GitHub Actions**

The project uses a Vite base path of:

```js
base: '/countdown-board/'
```

because the application is hosted under the `/countdown-board/` project path rather than at the root of `newman5.github.io`.

GitHub's automatic Jekyll `pages-build-deployment` workflow is not used to deploy this application. The Vite production build in `dist/` is the site that should be published.

## Data

Personal countdowns are stored in the browser's LocalStorage.

That means:

- refreshing the page does not remove your events;
- deploying a new version of the application should not overwrite your personal events;
- data is specific to the browser/device where it was created;
- clearing browser storage can remove saved events.

There is currently no cloud synchronization.

## Project Direction

The initial goal is deliberately modest:

**Make upcoming events easy to understand as relative time.**

Future versions could potentially import events from sources such as calendars or community event feeds, but the core event model should remain simple:

```text
event source
     ↓
absolute timestamp
     ↓
personal countdown board
```

The application is intended to remain lightweight, understandable, and useful without requiring an account or complex infrastructure.