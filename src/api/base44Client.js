import { createClient } from "@base44/sdk";

const now = new Date().toISOString();

const demoEvents = [
  {
    id: "demo-launch",
    title: "EventFloX Product Launch",
    date: "2026-07-18",
    time: "14:00",
    location: "New York, NY",
    type: "Product Launch",
    scale: 120,
    status: "Preparing",
    stage: "Preparation",
    description: "A demo event room showing how EventFloX keeps communication, tasks, files, and review in one place.",
    created_by: "guest@eventflox.ai",
    created_date: now,
  },
  {
    id: "demo-summit",
    title: "Community Partner Summit",
    date: "2026-08-06",
    time: "09:30",
    location: "Toronto, ON",
    type: "Conference",
    scale: 80,
    status: "Planning",
    stage: "Preparation",
    description: "Coordinate speakers, vendor files, registration, and post-event learning from a single workspace.",
    created_by: "guest@eventflox.ai",
    created_date: now,
  },
];

const demoTasks = [
  {
    id: "task-venue",
    event_id: "demo-launch",
    name: "Confirm venue setup timeline",
    description: "Align arrival time, stage setup, AV test, and signage placement with the venue team.",
    stage: "Preparation",
    priority: "High",
    status: "Pending",
    created_date: now,
  },
  {
    id: "task-press",
    event_id: "demo-launch",
    name: "Prepare media briefing pack",
    description: "Collect agenda, speaker bios, product notes, and media contact list.",
    stage: "Preparation",
    priority: "Medium",
    status: "In Progress",
    created_date: now,
  },
];

const demoMessages = [
  {
    id: "msg-1",
    event_id: "demo-launch",
    content: "Venue confirmed the loading dock opens at 9:00 AM. We should move AV testing before guest check-in.",
    author_name: "EventFloX Demo",
    author_email: "guest@eventflox.ai",
    message_type: "Text",
    language: "en",
    created_date: now,
  },
  {
    id: "msg-2",
    event_id: "demo-launch",
    content: "请把最新嘉宾名单放到资料区，签到团队今天下午会核对。",
    author_name: "EventFloX Demo",
    author_email: "guest@eventflox.ai",
    message_type: "文本",
    language: "zh",
    created_date: now,
  },
];

const demoFiles = [
  {
    id: "file-brief",
    event_id: "demo-launch",
    file_name: "Launch run-of-show.pdf",
    file_url: "#",
    file_type: "application/pdf",
    uploader: "EventFloX Demo",
    created_date: now,
  },
];

const demoParticipants = [
  {
    id: "participant-guest",
    event_id: "demo-launch",
    user_email: "guest@eventflox.ai",
    name: "Guest",
  },
];

function matchesFilter(item, filters = {}) {
  return Object.entries(filters).every(([key, value]) => item[key] === value);
}

function createDemoEntity(initialRows = []) {
  let rows = [...initialRows];

  const entity = {
    list: async () => rows,
    filter: async (filters = {}) => rows.filter((item) => matchesFilter(item, filters)),
    create: async (data) => {
      const row = {
        id: data.id || `demo-${Date.now()}`,
        created_date: new Date().toISOString(),
        created_by: data.created_by || "guest@eventflox.ai",
        ...data,
      };
      rows = [row, ...rows];
      return row;
    },
    bulkCreate: async (items = []) => Promise.all(items.map((item) => entity.create(item))),
    update: async (id, data) => {
      rows = rows.map((row) => (row.id === id ? { ...row, ...data } : row));
      return rows.find((row) => row.id === id) || { id, ...data };
    },
    delete: async (id) => {
      rows = rows.filter((row) => row.id !== id);
      return true;
    },
  };

  return entity;
}

function createDemoClient() {
  const Event = createDemoEntity(demoEvents);
  const Task = createDemoEntity(demoTasks);
  const Message = createDemoEntity(demoMessages);
  const EventFile = createDemoEntity(demoFiles);
  const Report = createDemoEntity([]);
  const EventParticipant = createDemoEntity(demoParticipants);
  const Registration = createDemoEntity([]);
  const CheckIn = createDemoEntity([]);

  return {
    auth: {
      me: async () => ({
        id: "guest",
        email: "guest@eventflox.ai",
        full_name: "Guest",
        plan_type: "free",
        event_limit: 2,
        event_count: demoEvents.length,
      }),
      updateMe: async (data) => ({
        id: "guest",
        email: "guest@eventflox.ai",
        full_name: "Guest",
        plan_type: "free",
        event_limit: 2,
        event_count: demoEvents.length,
        ...data,
      }),
    },
    entities: {
      Event,
      Task,
      Message,
      EventFile,
      Report,
      EventParticipant,
      Registration,
      CheckIn,
    },
    integrations: {
      Core: {
        InvokeLLM: async () => ({
          event: {
            title: "AI Generated Event Room",
            date: "2026-09-12",
            time: "10:00",
            location: "Hybrid",
            type: "Meeting",
            scale: 60,
            description: "Demo AI output. Add your Base44 app ID to enable live AI generation.",
            special_requirements: ["Communication owner", "Shared file space", "Post-event review"],
            organizer: "EventFloX Team",
            budget: 5000,
          },
          tasks: [
            {
              name: "Confirm event brief",
              description: "Review goal, audience, timeline, and team ownership.",
              stage: "Preparation",
              priority: "High",
            },
          ],
        }),
        SendEmail: async () => ({ success: true }),
        UploadFile: async ({ file } = {}) => ({ file_url: "#", file_name: file?.name || "demo-file" }),
        GenerateImage: async () => ({ url: "#" }),
        ExtractDataFromUploadedFile: async () => ({}),
        CreateFileSignedUrl: async () => ({ url: "#" }),
        UploadPrivateFile: async ({ file } = {}) => ({ file_url: "#", file_name: file?.name || "demo-file" }),
      },
    },
    cleanup: () => {},
  };
}

const appId = import.meta.env.VITE_BASE44_APP_ID || import.meta.env.VITE_BASE44_APPID;

export const base44 = appId
  ? createClient({
      appId,
      options: {
        onError: (error) => console.warn("Base44 SDK error:", error),
      },
    })
  : createDemoClient();

export async function generateAIEvent(prompt) {
  return base44.integrations.Core.InvokeLLM({ prompt });
}
