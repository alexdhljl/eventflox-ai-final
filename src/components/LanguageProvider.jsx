import React, { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

const translations = {
  zh: {
    nav_dashboard: "活动空间",
    nav_create: "AI 创建",
    nav_reports: "复盘资料",
    loading: "加载中...",
    language: "语言",
    language_zh: "中文",
    language_en: "English",
    dashboard_title: "活动沟通工作台",
    dashboard_subtitle: "把沟通、任务、资料和复盘放进同一个活动空间。",
    btn_create_ai: "AI 创建活动",
    btn_create: "创建活动",
    dashboard_no_events: "还没有活动空间",
    dashboard_create_first: "用 AI 创建第一个活动，把团队沟通从群聊里搬出来。",
    people: "人",
    you_are_organizer: "你是组织者",
    you_are_participant: "你是协作者",
    tab_messages: "沟通",
    tab_tasks: "任务",
    tab_files: "资料",
    tab_report: "复盘",
    btn_back_dashboard: "返回工作台",
    btn_refresh: "刷新",
    event_not_found: "找不到这个活动",
    event_not_found_desc: "这个活动可能已被删除，或你还没有访问权限。",
    create_title: "AI 创建活动空间",
    create_subtitle: "描述活动目标、时间、地点和团队需求，EventFloX 会生成可协作的活动结构。",
    create_example: "可以这样描述",
    create_example_text: "下个月在纽约办一场 120 人产品发布会，需要嘉宾接待、签到、场地搭建和媒体沟通。",
    create_example_hint: "写得越接近真实沟通，生成的任务越容易直接分派。",
    create_input_label: "活动需求",
    create_input_placeholder: "输入活动背景、规模、日期、地点、预算、团队分工或特殊要求...",
    create_generate: "生成活动方案",
    create_generating: "正在生成活动空间",
    create_creating: "正在创建活动",
    create_success: "活动已创建",
    create_success_redirect: "正在进入活动空间...",
    messages_title: "活动沟通",
    messages_placeholder: "同步进展、提出问题、记录决定或上传资料...",
    messages_no_messages: "还没有沟通记录",
    messages_pending_attachments: "待发送附件",
    messages_attach: "添加附件",
    messages_tips: "按 Enter 发送，Shift + Enter 换行。",
    messages_file: "文件",
    messages_image: "图片",
    messages_video_not_supported: "浏览器不支持视频播放。",
    messages_translation_zh: "中文翻译",
    messages_translation_en: "English translation",
    files_title: "活动资料",
    files_upload: "上传资料",
    files_uploading: "上传中...",
    files_no_files: "还没有上传资料",
    btn_download: "下载",
    btn_send: "发送",
    view_kanban: "看板",
    view_list: "列表",
    btn_cancel: "取消",
    btn_delete: "删除",
    deleting: "删除中...",
    tasks_delete_failed: "删除任务失败",
    tasks_delete_confirm_title: "删除任务",
    tasks_delete_confirm_desc: "确定要删除此任务吗？此操作无法撤销。",
  },
  en: {
    nav_dashboard: "Event Rooms",
    nav_create: "AI Create",
    nav_reports: "Review Library",
    loading: "Loading...",
    language: "Language",
    language_zh: "中文",
    language_en: "English",
    dashboard_title: "Event Communication Workspace",
    dashboard_subtitle: "Keep conversations, tasks, files, and reviews together for every event.",
    btn_create_ai: "Create with AI",
    btn_create: "Create Event",
    dashboard_no_events: "No event rooms yet",
    dashboard_create_first: "Create the first event room and move planning out of scattered chats.",
    people: "people",
    you_are_organizer: "You are the organizer",
    you_are_participant: "You are a collaborator",
    tab_messages: "Communication",
    tab_tasks: "Tasks",
    tab_files: "Files",
    tab_report: "Review",
    btn_back_dashboard: "Back to Workspace",
    btn_refresh: "Refresh",
    event_not_found: "Event not found",
    event_not_found_desc: "This event may have been deleted, or you may not have access yet.",
    create_title: "Create an Event Room with AI",
    create_subtitle: "Describe the event goal, timing, location, and team needs. EventFloX will create a collaborative structure.",
    create_example: "Example prompt",
    create_example_text: "Host a 120-person product launch in New York next month, with guest reception, check-in, venue setup, and media coordination.",
    create_example_hint: "The closer it sounds to your real planning notes, the easier the generated tasks are to assign.",
    create_input_label: "Event brief",
    create_input_placeholder: "Enter event background, size, date, location, budget, team roles, or special requirements...",
    create_generate: "Generate Event Plan",
    create_generating: "Creating your event room",
    create_creating: "Creating event",
    create_success: "Event created",
    create_success_redirect: "Opening the event room...",
    messages_title: "Event Communication",
    messages_placeholder: "Share progress, ask questions, record decisions, or attach files...",
    messages_no_messages: "No messages yet",
    messages_pending_attachments: "Pending attachments",
    messages_attach: "Attach file",
    messages_tips: "Press Enter to send, Shift + Enter for a new line.",
    messages_file: "File",
    messages_image: "Image",
    messages_video_not_supported: "Your browser does not support video playback.",
    messages_translation_zh: "Chinese translation",
    messages_translation_en: "English translation",
    files_title: "Event Files",
    files_upload: "Upload File",
    files_uploading: "Uploading...",
    files_no_files: "No files uploaded yet",
    btn_download: "Download",
    btn_send: "Send",
    view_kanban: "Kanban",
    view_list: "List",
    btn_cancel: "Cancel",
    btn_delete: "Delete",
    deleting: "Deleting...",
    tasks_delete_failed: "Failed to delete task",
    tasks_delete_confirm_title: "Delete task",
    tasks_delete_confirm_desc: "Are you sure you want to delete this task? This action cannot be undone.",
  }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("zh");

  return (
    <LanguageContext.Provider value={{
      language,
      switchLanguage: (lang) => setLanguage(lang === "en" ? "en" : "zh"),
      t: (key) => translations[language]?.[key] || key,
      isReady: true
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export default LanguageProvider;
