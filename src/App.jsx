import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { hasSupabaseConfig, supabase } from "./lib/supabase";

const seedEvent = {
  id: "demo-event",
  title: "EventFloX Demo Launch",
  slug: "demo-launch",
  date: "2026-07-18",
  location: "New York, NY",
  description: "A shared event room for team communication, task ownership, guest registration, and on-site check-in.",
  organizer_name: "EventFloX Team",
  status: "planning",
};

const seedTasks = [
  {
    id: "task-venue",
    event_id: "demo-event",
    title: "Confirm venue setup timeline",
    description: "Coordinate loading dock time, AV test, signage, and reception desk setup.",
    status: "open",
    owner_name: "",
  },
  {
    id: "task-guest",
    event_id: "demo-event",
    title: "Prepare guest registration flow",
    description: "Review the public registration form and check-in process before sharing the event link.",
    status: "open",
    owner_name: "",
  },
];

const seedMessages = [
  {
    id: "message-demo",
    event_id: "demo-event",
    author_name: "EventFloX Demo",
    body: "Welcome. Use this room to keep all event decisions, task updates, and check-in notes in one place.",
    created_at: new Date().toISOString(),
  },
];

const emptyEvent = {
  title: "",
  date: "",
  location: "",
  organizer_name: "",
  description: "",
};

function makeSlug(title) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base || "event"}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatDate(value) {
  if (!value) return "Date TBD";
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function readSharedSlug() {
  const params = new URLSearchParams(window.location.search);
  return params.get("event");
}

export default function App() {
  const [events, setEvents] = useState([seedEvent]);
  const [activeEventId, setActiveEventId] = useState(seedEvent.id);
  const [tasks, setTasks] = useState(seedTasks);
  const [messages, setMessages] = useState(seedMessages);
  const [registrations, setRegistrations] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [taskSubmissions, setTaskSubmissions] = useState([]);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [taskForm, setTaskForm] = useState({ title: "", description: "" });
  const [messageForm, setMessageForm] = useState({ author_name: "", body: "" });
  const [registrationForm, setRegistrationForm] = useState({ name: "", email: "", company: "", notes: "" });
  const [claimName, setClaimName] = useState("");
  const [submissionDrafts, setSubmissionDrafts] = useState({});
  const [notice, setNotice] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  const activeEvent = useMemo(
    () => events.find((event) => event.id === activeEventId) || events[0],
    [events, activeEventId]
  );

  const activeTasks = tasks.filter((task) => task.event_id === activeEvent?.id);
  const activeMessages = messages.filter((message) => message.event_id === activeEvent?.id);
  const activeRegistrations = registrations.filter((guest) => guest.event_id === activeEvent?.id);
  const activeCheckins = checkins.filter((checkin) => checkin.event_id === activeEvent?.id);
  const checkedEmails = new Set(activeCheckins.map((checkin) => checkin.guest_email));
  const shareUrl = activeEvent
    ? `${window.location.origin}/?event=${activeEvent.slug || activeEvent.id}`
    : window.location.origin;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;

  useEffect(() => {
    loadWorkspace();
  }, []);

  async function loadWorkspace() {
    const sharedSlug = readSharedSlug();
    if (!hasSupabaseConfig || !supabase) {
      setNotice("Demo mode: add Supabase environment variables and run the database schema to save shared data.");
      setLoading(false);
      return;
    }

    try {
      const [eventsRes, tasksRes, messagesRes, registrationsRes, checkinsRes, submissionsRes] = await Promise.all([
        supabase.from("events").select("*").order("created_at", { ascending: false }),
        supabase.from("event_tasks").select("*").order("created_at", { ascending: true }),
        supabase.from("event_messages").select("*").order("created_at", { ascending: false }),
        supabase.from("guest_registrations").select("*").order("created_at", { ascending: false }),
        supabase.from("checkins").select("*").order("created_at", { ascending: false }),
        supabase.from("task_submissions").select("*").order("created_at", { ascending: false }),
      ]);

      const firstError = [eventsRes, tasksRes, messagesRes, registrationsRes, checkinsRes, submissionsRes].find(
        (result) => result.error
      )?.error;

      if (firstError) throw firstError;

      const loadedEvents = eventsRes.data?.length ? eventsRes.data : [seedEvent];
      setEvents(loadedEvents);
      setTasks(tasksRes.data || []);
      setMessages(messagesRes.data || []);
      setRegistrations(registrationsRes.data || []);
      setCheckins(checkinsRes.data || []);
      setTaskSubmissions(submissionsRes.data || []);
      setIsConnected(true);

      const sharedEvent = loadedEvents.find((event) => event.slug === sharedSlug || event.id === sharedSlug);
      setActiveEventId(sharedEvent?.id || loadedEvents[0]?.id || seedEvent.id);
      setNotice("");
    } catch (error) {
      console.error(error);
      setNotice("Supabase is connected, but the EventFloX tables are not ready yet. Run the SQL schema in Supabase first.");
    } finally {
      setLoading(false);
    }
  }

  async function saveRow(table, row, localSetter) {
    if (!isConnected || !supabase) {
      const localRow = { id: `${table}-${Date.now()}`, created_at: new Date().toISOString(), ...row };
      localSetter((current) => [localRow, ...current]);
      return localRow;
    }

    const { data, error } = await supabase.from(table).insert(row).select().single();
    if (error) throw error;
    localSetter((current) => [data, ...current]);
    return data;
  }

  async function createEvent(event) {
    event.preventDefault();
    if (!eventForm.title.trim()) return;

    try {
      const created = await saveRow(
        "events",
        {
          ...eventForm,
          slug: makeSlug(eventForm.title),
          status: "planning",
        },
        setEvents
      );
      setActiveEventId(created.id);
      setEventForm(emptyEvent);
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function addTask(event) {
    event.preventDefault();
    if (!taskForm.title.trim() || !activeEvent) return;

    try {
      await saveRow(
        "event_tasks",
        {
          event_id: activeEvent.id,
          title: taskForm.title,
          description: taskForm.description,
          status: "open",
        },
        setTasks
      );
      setTaskForm({ title: "", description: "" });
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function claimTask(task) {
    if (!claimName.trim()) return;
    const updates = { owner_name: claimName.trim(), status: "claimed" };

    if (!isConnected || !supabase) {
      setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, ...updates } : item)));
      return;
    }

    const { error } = await supabase.from("event_tasks").update(updates).eq("id", task.id);
    if (error) {
      setNotice(error.message);
      return;
    }
    setTasks((current) => current.map((item) => (item.id === task.id ? { ...item, ...updates } : item)));
  }

  async function submitTaskPlan(task) {
    const body = submissionDrafts[task.id]?.trim();
    if (!body) return;

    try {
      await saveRow(
        "task_submissions",
        {
          task_id: task.id,
          event_id: activeEvent.id,
          author_name: task.owner_name || claimName || "Participant",
          body,
        },
        setTaskSubmissions
      );
      setSubmissionDrafts((current) => ({ ...current, [task.id]: "" }));
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!messageForm.body.trim() || !activeEvent) return;

    try {
      await saveRow(
        "event_messages",
        {
          event_id: activeEvent.id,
          author_name: messageForm.author_name || "Guest",
          body: messageForm.body,
        },
        setMessages
      );
      setMessageForm({ author_name: messageForm.author_name, body: "" });
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function registerGuest(event) {
    event.preventDefault();
    if (!registrationForm.name.trim() || !registrationForm.email.trim() || !activeEvent) return;

    try {
      await saveRow(
        "guest_registrations",
        {
          event_id: activeEvent.id,
          ...registrationForm,
        },
        setRegistrations
      );
      setRegistrationForm({ name: "", email: "", company: "", notes: "" });
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function checkInGuest(guest) {
    if (checkedEmails.has(guest.email)) return;

    try {
      await saveRow(
        "checkins",
        {
          event_id: activeEvent.id,
          guest_name: guest.name,
          guest_email: guest.email,
        },
        setCheckins
      );
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(shareUrl);
    setNotice("Share link copied.");
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">EventFloX</p>
          <h1>Event communication workspace</h1>
          <p className="lede">Create an event room, share the QR code, assign work, collect task plans, register guests, and check them in on site.</p>
        </div>
        <div className="status-pill">{isConnected ? "Supabase live" : "Demo mode"}</div>
      </section>

      {notice && <div className="notice">{notice}</div>}
      {loading && <div className="notice">Loading workspace...</div>}

      <div className="workspace-grid">
        <aside className="sidebar-panel">
          <div className="panel-heading">
            <h2>Event rooms</h2>
            <span>{events.length}</span>
          </div>
          <div className="event-list">
            {events.map((event) => (
              <button
                key={event.id}
                className={`event-button ${event.id === activeEvent?.id ? "active" : ""}`}
                onClick={() => setActiveEventId(event.id)}
              >
                <strong>{event.title}</strong>
                <span>{formatDate(event.date)} · {event.location || "Location TBD"}</span>
              </button>
            ))}
          </div>

          <form className="stacked-form" onSubmit={createEvent}>
            <h3>Create event</h3>
            <input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Event title" />
            <input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
            <input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Location" />
            <input value={eventForm.organizer_name} onChange={(e) => setEventForm({ ...eventForm, organizer_name: e.target.value })} placeholder="Organizer" />
            <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Event brief" rows="3" />
            <button className="primary-button" type="submit">Create event room</button>
          </form>
        </aside>

        {activeEvent && (
          <section className="main-panel">
            <header className="event-header">
              <div>
                <p className="eyebrow">Shared event room</p>
                <h2>{activeEvent.title}</h2>
                <p>{formatDate(activeEvent.date)} · {activeEvent.location || "Location TBD"}</p>
                <p>{activeEvent.description}</p>
              </div>
              <div className="share-card">
                <img src={qrUrl} alt="Event share QR code" />
                <button className="secondary-button" type="button" onClick={copyShareLink}>Copy share link</button>
              </div>
            </header>

            <div className="metrics-row">
              <div><strong>{activeMessages.length}</strong><span>Messages</span></div>
              <div><strong>{activeTasks.length}</strong><span>Tasks</span></div>
              <div><strong>{activeRegistrations.length}</strong><span>Guests</span></div>
              <div><strong>{activeCheckins.length}</strong><span>Checked in</span></div>
            </div>

            <div className="content-grid">
              <section className="tool-panel wide">
                <div className="panel-heading">
                  <h3>Group communication</h3>
                  <span>Before, during, and after</span>
                </div>
                <form className="message-form" onSubmit={sendMessage}>
                  <input value={messageForm.author_name} onChange={(e) => setMessageForm({ ...messageForm, author_name: e.target.value })} placeholder="Your name" />
                  <textarea value={messageForm.body} onChange={(e) => setMessageForm({ ...messageForm, body: e.target.value })} placeholder="Post an update, decision, question, or on-site note..." rows="3" />
                  <button className="primary-button" type="submit">Send message</button>
                </form>
                <div className="message-list">
                  {activeMessages.map((message) => (
                    <article key={message.id} className="message-card">
                      <strong>{message.author_name || "Guest"}</strong>
                      <p>{message.body}</p>
                      <span>{new Date(message.created_at).toLocaleString()}</span>
                    </article>
                  ))}
                </div>
              </section>

              <section className="tool-panel">
                <div className="panel-heading">
                  <h3>Task board</h3>
                  <span>Claim and submit plans</span>
                </div>
                <input value={claimName} onChange={(e) => setClaimName(e.target.value)} placeholder="Participant name for claiming tasks" />
                <form className="inline-form" onSubmit={addTask}>
                  <input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="New task" />
                  <button type="submit">Add</button>
                </form>
                <textarea value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} placeholder="Task description" rows="2" />
                <div className="task-list">
                  {activeTasks.map((task) => {
                    const submissions = taskSubmissions.filter((submission) => submission.task_id === task.id);
                    return (
                      <article key={task.id} className="task-card">
                        <div>
                          <strong>{task.title}</strong>
                          <p>{task.description}</p>
                          <span>{task.owner_name ? `Owner: ${task.owner_name}` : "Open task"}</span>
                        </div>
                        <button className="secondary-button" type="button" onClick={() => claimTask(task)}>Claim</button>
                        <textarea value={submissionDrafts[task.id] || ""} onChange={(e) => setSubmissionDrafts({ ...submissionDrafts, [task.id]: e.target.value })} placeholder="Submit your task plan..." rows="3" />
                        <button className="primary-button" type="button" onClick={() => submitTaskPlan(task)}>Submit plan</button>
                        {submissions.map((submission) => (
                          <div className="submission" key={submission.id}>
                            <strong>{submission.author_name}</strong>
                            <p>{submission.body}</p>
                          </div>
                        ))}
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="tool-panel">
                <div className="panel-heading">
                  <h3>Guest registration</h3>
                  <span>Online sign-up</span>
                </div>
                <form className="stacked-form" onSubmit={registerGuest}>
                  <input value={registrationForm.name} onChange={(e) => setRegistrationForm({ ...registrationForm, name: e.target.value })} placeholder="Guest name" />
                  <input value={registrationForm.email} onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })} placeholder="Email" />
                  <input value={registrationForm.company} onChange={(e) => setRegistrationForm({ ...registrationForm, company: e.target.value })} placeholder="Company / group" />
                  <textarea value={registrationForm.notes} onChange={(e) => setRegistrationForm({ ...registrationForm, notes: e.target.value })} placeholder="Notes" rows="2" />
                  <button className="primary-button" type="submit">Register guest</button>
                </form>
                <div className="guest-list">
                  {activeRegistrations.map((guest) => (
                    <article key={guest.id} className="guest-card">
                      <div>
                        <strong>{guest.name}</strong>
                        <span>{guest.email}</span>
                        <span>{guest.company}</span>
                      </div>
                      <button className={checkedEmails.has(guest.email) ? "checked-button" : "secondary-button"} type="button" onClick={() => checkInGuest(guest)}>
                        {checkedEmails.has(guest.email) ? "Checked in" : "Check in"}
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
