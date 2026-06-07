# EventFloX AI

EventFloX AI is an event communication workspace for organizers, teammates, participants, and guests. It now runs without Base44 or AI dependencies: GitHub stores the code, Vercel hosts the site, and Supabase stores shared event data.

## Core Workflow

- Organizers create an event room.
- The event room produces a share link and QR code.
- Participants open the shared link to join the same event room.
- Team members post group messages before, during, and after the event.
- Participants claim tasks and submit task plans.
- Guests register online.
- Staff can check guests in on site.

## Supabase Setup

Create these Vercel environment variables:

```text
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Then open Supabase:

```text
Supabase -> SQL Editor -> New query
```

Paste and run:

```text
supabase/schema.sql
```

The schema creates these public MVP tables:

- `events`
- `event_tasks`
- `task_submissions`
- `event_messages`
- `guest_registrations`
- `checkins`

This first version intentionally uses public read/write policies so shared event links work without login. Add authentication and stricter policies before using it for private or sensitive events.

## Running Locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

## Building

```bash
npm run build
```

## Deployment

The production site is hosted on Vercel:

https://eventflox-ai-final.vercel.app
