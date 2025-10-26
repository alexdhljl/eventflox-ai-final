
import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const translations = {
  zh: {
    // Navigation
    nav_dashboard: "我的活动",
    nav_create: "AI创建活动",
    nav_reports: "复盘报告",
    
    // Dashboard
    dashboard_title: "我的活动",
    dashboard_subtitle: "管理和跟踪所有活动的进展",
    dashboard_total: "总活动数",
    dashboard_ongoing: "进行中",
    dashboard_completed: "已完成",
    dashboard_no_events: "暂无活动",
    dashboard_create_first: "创建您的第一个活动",
    you_are_organizer: "您是组织者",
    you_are_participant: "您是参与者",
    
    // Create Event Page
    create_title: "AI 智能活动策划",
    create_subtitle: "描述您的活动需求，AI 将为您生成完整的活动方案",
    create_example: "示例描述",
    create_example_text: "下个月在罗岛Octagon举办一个100人左右的新年聚会，有摄影和抽奖。",
    create_example_hint: "提示：请包含时间、地点、规模和活动性质，越详细效果越好",
    create_input_label: "描述您的活动",
    create_input_placeholder: "例如：下个月在会议中心举办200人的产品发布会，需要舞台搭建、LED屏幕、现场直播...",
    create_generate: "AI 生成方案",
    create_generating: "AI 正在生成方案...",
    create_preview: "方案预览",
    create_confirm: "确认创建活动",
    create_creating: "正在创建活动...",
    create_success: "创建成功！",
    create_success_redirect: "正在跳转到活动详情页...",
    
    // Buttons
    btn_create: "创建活动",
    btn_create_ai: "AI创建活动",
    btn_view_detail: "查看详情",
    btn_edit: "编辑",
    btn_delete: "删除",
    btn_cancel: "取消",
    btn_confirm: "确认",
    btn_save: "保存",
    btn_submit: "提交",
    btn_upload: "上传",
    btn_download: "下载",
    btn_send: "发送",
    btn_back: "返回",
    btn_next: "下一步",
    btn_copy: "复制",
    btn_share: "分享",
    btn_refresh: "刷新",
    btn_back_dashboard: "返回我的活动",
    btn_copy_event: "复制并规划下次活动",
    
    // Task Fields
    task_name: "任务名称",
    task_description: "任务描述",
    task_assignee: "负责人",
    task_due_date: "截止日期",
    task_stage: "所属阶段",
    task_priority: "优先级",
    task_status: "任务状态",
    task_details: "任务详情",
    task_optional: "可选",
    
    // Task Dialog Actions
    tasks_edit: "编辑任务",
    tasks_claim: "认领任务",
    tasks_submit: "提交方案",
    claim_as: "认领为",
    claim_task_note: "认领说明",
    confirm_claim: "确认认领",
    solution_text: "方案说明",
    solution_files: "方案附件",
    solution_submitted: "已提交方案",

    // Task Form Labels
    tasks_title: "任务清单",
    tasks_name_label: "任务名称",
    tasks_name_placeholder: "输入任务名称",
    tasks_description_label: "任务描述",
    tasks_description_placeholder: "详细描述任务内容...",
    tasks_due_date_label: "截止日期",
    tasks_stage_label: "所属阶段",
    tasks_priority_label: "优先级",
    tasks_status_label: "任务状态",
    tasks_create: "创建任务",
    creating: "创建中...",
    
    // Event Status
    status_preparing: "筹备中",
    status_ongoing: "进行中",
    status_completed: "已结束",
    status_reviewed: "已复盘",
    status_筹备中: "筹备中",
    status_进行中: "进行中",
    status_已结束: "已结束",
    status_已复盘: "已复盘",
    
    // Task Status
    status_pending: "待开始",
    status_in_progress: "进行中",
    status_done: "已完成",
    status_delayed: "延期",
    task_status_pending: "待开始",
    task_status_ongoing: "进行中",
    task_status_completed: "已完成",
    task_status_delayed: "延期",
    
    // Task Stage
    stage_preparation: "筹备阶段",
    stage_execution: "执行阶段",
    stage_review: "复盘阶段",
    
    // Task Priority
    priority_low: "低",
    priority_medium: "中",
    priority_high: "高",
    priority_urgent: "紧急",
    
    // Event Detail
    event_date: "活动日期",
    event_location: "活动地点",
    event_scale: "活动规模",
    event_type: "活动类型",
    event_organizer: "负责人",
    event_description: "活动描述",
    event_requirements: "特殊需求",
    event_not_found: "活动不存在",
    event_not_found_desc: "无法找到该活动",
    
    // Activity Management
    activity_management: "活动管理",
    activity_management_desc: "管理报名和签到功能",
    registration_page: "报名页面",
    check_in_page: "签到页面",
    share_event_links: "活动链接分享",
    share_link_desc: "复制这些链接并分享给参与者",
    registration_link: "报名链接",
    check_in_link: "签到链接",
    open_in_new_tab: "在新标签页打开",
    how_to_use: "使用说明",
    how_to_use_description: "复制这些链接并通过邮件、网站或社交媒体分享。参与者可以使用这些链接进行报名和签到。",
    
    // Registration & Check-in Stats
    stats_title: "报名与签到统计",
    total_registered: "已报名人数",
    total_checked_in: "已签到人数",
    not_checked_in: "未签到人数",
    checkin_rate: "签到率",
    registration_conversion: "报名转化率",
    recent_registrations: "最近报名",
    no_registrations: "暂无报名记录",
    export_csv: "导出CSV",
    checked_in: "已签到",
    registered_at: "报名时间",
    
    // Organizer QR Code
    organizer_qr: "组织者二维码",
    organizer_qr_desc: "扫描此二维码快速访问活动管理后台",
    organizer_qr_note: "此二维码仅供活动组织者使用",
    
    // Registration Page
    event_registration: "活动报名",
    register_for_event: "报名参加活动",
    registration_link_title: "活动报名链接",
    registration_link_desc: "复制此链接，分享给活动参与者进行报名",
    full_name_required: "姓名（必填）",
    email_required: "邮箱（必填）",
    phone_number: "联系电话",
    organization: "所属组织",
    notes_optional: "备注（可选）",
    notes_placeholder: "特殊需求或其他说明...",
    your_full_name: "您的姓名",
    your_email_placeholder: "your.email@example.com",
    your_organization_placeholder: "您的公司或组织",
    complete_registration: "完成报名",
    registering: "报名中...",
    registration_agreement: "提交报名即表示您同意接收活动相关通知",
    registration_successful: "报名成功！",
    registration_success_desc: "您已成功报名此活动",
    event_details: "活动详情",
    registration_failed: "报名失败",
    registration_disabled: "活动报名功能未启用",
    registration_closed: "报名已截止",
    registration_deadline_passed_desc: "报名截止时间已过",
    registration_deadline_passed_alert: "报名截止时间已过",
    event_full: "活动已满",
    event_full_desc: "活动已达到最大参与人数",
    event_is_full_alert: "活动名额已满",
    fill_required_fields: "请填写必填项",
    failed_to_load_event: "加载活动失败",
    spots_available: "剩余名额",
    left: "剩余",
    full: "已满",
    registration_deadline: "报名截止",
    checkin_preview_title: "签到预览",
    checkin_preview_desc: "请于活动当天通过以下页面签到",
    view_checkin_page: "查看签到页面",
    
    // Check-in Page
    event_checkin: "活动签到",
    confirm_attendance: "确认到场",
    manual_checkin: "手动签到",
    qr_checkin: "二维码签到",
    please_enter_name: "请输入您的姓名",
    please_enter_email: "请输入您的邮箱",
    checkin_now: "立即签到",
    checking_in: "签到中...",
    check_in_success: "签到成功",
    check_in_failed: "签到失败，请重试",
    checkin_time: "签到时间",
    checked_in_success: "签到成功！",
    checkin_success_desc: "您已成功签到此活动",
    enjoy_event: "欢迎参加活动！",
    checkin_confirms: "签到确认您的到场，帮助组织者统计参与情况",
    not_registered: "您尚未报名",
    not_registered_desc: "建议先报名再签到",
    checkin_disabled: "签到功能未启用",
    checkin_failed: "签到失败",
    enter_checkin_info: "请输入签到信息",
    name_required: "姓名（必填）",
    email_optional: "邮箱（可选）",
    
    // Tabs
    tab_tasks: "任务清单",
    tab_messages: "团队沟通",
    tab_files: "文件资料",
    tab_report: "AI复盘",
    
    // Task Views
    view_kanban: "看板视图",
    view_list: "列表视图",
    kanban_search: "搜索任务...",
    kanban_filter: "筛选",
    tasks_add: "添加任务",
    task_unclaimed: "待认领",
    
    // Reports Page
    reports_title: "AI复盘报告",
    reports_summary: "活动总结",
    reports_highlights: "活动亮点",
    reports_issues: "问题与不足",
    reports_suggestions: "改进建议",
    reports_no_reports: "暂无复盘报告",
    reports_generate: "生成AI复盘",
    reports_generating: "生成中...",
    reports_regenerate: "重新生成",
    reports_ai_description: "AI将分析活动数据并生成详细的复盘报告",
    
    // Messages
    messages_title: "团队沟通",
    messages_placeholder: "输入消息...",
    messages_no_messages: "暂无消息",
    messages_tips: "按 Enter 发送，Shift + Enter 换行",
    messages_translation_zh: "中文翻译",
    messages_translation_en: "英文翻译",
    messages_attach: "添加附件",
    messages_pending_attachments: "待发送附件",
    messages_image: "图片",
    messages_video: "视频",
    messages_file: "文件",
    messages_video_not_supported: "您的浏览器不支持视频播放",
    
    // Files
    files_title: "文件资料",
    files_upload: "上传文件",
    files_uploading: "上传中...",
    files_no_files: "暂无文件",
    
    // Common
    loading: "加载中...",
    people: "人",
    date: "日期",
    time: "时间",
    location: "地点",
    created_by: "创建者",
    updated_at: "更新时间",
    optional: "可选",
    you: "您",
    event: "活动",
    
    // Language
    language: "语言",
    language_zh: "中文",
    language_en: "English",
    switch_language: "切换语言",
    
    // Roles
    organizer: "组织者",
    participants: "参与者",
    participant_list: "参与者列表",
    
    // Copy & Share
    copied: "已复制",
    copy: "复制",
    qr_share: "分享二维码",
    qr_download: "下载二维码",
    
    // Join Event
    join_event_title: "您收到活动邀请！",
    join_event_subtitle: "扫描二维码加入活动",
    join_event: "加入活动",
    joining: "加入中...",
    already_joined: "您已是参与者",
    already_joined_desc: "您可以从我的活动中访问此活动",
    view_event: "查看活动",
    join_event_note: "加入后，您将可以访问任务、聊天、文件和所有活动更新",
    join_failed: "加入失败",
    login_required: "请先登录",
    login_to_join: "登录以加入活动",
    login_required_note: "您需要登录才能加入此活动",
    login: "登录",
    loading_failed: "加载失败",

    // Plan & Billing
    plan_free: "免费版",
    plan_starter: "Starter",
    plan_pro: "Pro",
    plan_team: "Team",
    upgrade_plan: "升级套餐",
    current_plan: "当前套餐",
    events_used: "已使用活动",
    billing_cycle: "计费周期",
    next_reset: "下次重置",
  },
  
  en: {
    // Navigation
    nav_dashboard: "My Events",
    nav_create: "Create with AI",
    nav_reports: "AI Reports",
    
    // Dashboard
    dashboard_title: "My Events",
    dashboard_subtitle: "Manage and track all event progress",
    dashboard_total: "Total Events",
    dashboard_ongoing: "Ongoing",
    dashboard_completed: "Completed",
    dashboard_no_events: "No events yet",
    dashboard_create_first: "Create your first event",
    you_are_organizer: "You're the organizer",
    you_are_participant: "You're a participant",
    
    // Create Event Page
    create_title: "AI Event Planning",
    create_subtitle: "Describe your event requirements, AI will generate a complete event plan for you",
    create_example: "Example Description",
    create_example_text: "Host a New Year party for about 100 people at Rhode Island Octagon next month, with photography and lottery.",
    create_example_hint: "Tip: Include time, location, scale, and event type for best results",
    create_input_label: "Describe Your Event",
    create_input_placeholder: "e.g., Product launch event for 200 people at conference center next month, need stage setup, LED screens, live streaming...",
    create_generate: "Generate AI Plan",
    create_generating: "AI is generating plan...",
    create_preview: "Plan Preview",
    create_confirm: "Confirm & Create Event",
    create_creating: "Creating event...",
    create_success: "Created Successfully!",
    create_success_redirect: "Redirecting to event details...",
    
    // Buttons
    btn_create: "Create Event",
    btn_create_ai: "Create with AI",
    btn_view_detail: "View Details",
    btn_edit: "Edit",
    btn_delete: "Delete",
    btn_cancel: "Cancel",
    btn_confirm: "Confirm",
    btn_save: "Save",
    btn_submit: "Submit",
    btn_upload: "Upload",
    btn_download: "Download",
    btn_send: "Send",
    btn_back: "Back",
    btn_next: "Next",
    btn_copy: "Copy",
    btn_share: "Share",
    btn_refresh: "Refresh",
    btn_back_dashboard: "Back to My Events",
    btn_copy_event: "Plan Next Event",
    
    // Task Fields
    task_name: "Task Name",
    task_description: "Task Description",
    task_assignee: "Assignee",
    task_due_date: "Due Date",
    task_stage: "Stage",
    task_priority: "Priority",
    task_status: "Status",
    task_details: "Task Details",
    task_optional: "Optional",
    
    // Task Dialog Actions
    tasks_edit: "Edit Task",
    tasks_claim: "Claim Task",
    tasks_submit: "Submit Solution",
    claim_as: "Claim as",
    claim_task_note: "Claim Note",
    confirm_claim: "Confirm Claim",
    solution_text: "Solution Description",
    solution_files: "Solution Files",
    solution_submitted: "Solution Submitted",

    // Task Form Labels
    tasks_title: "Task List",
    tasks_name_label: "Task Name",
    tasks_name_placeholder: "Enter task name",
    tasks_description_label: "Task Description",
    tasks_description_placeholder: "Describe the task in detail...",
    tasks_due_date_label: "Due Date",
    tasks_stage_label: "Stage",
    tasks_priority_label: "Priority",
    tasks_status_label: "Task Status",
    tasks_create: "Create Task",
    creating: "Creating...",
    
    // Event Status
    status_preparing: "Preparing",
    status_ongoing: "Ongoing",
    status_completed: "Completed",
    status_reviewed: "Reviewed",
    
    // Task Status
    status_pending: "Pending",
    status_in_progress: "In Progress",
    status_done: "Completed",
    status_delayed: "Delayed",
    task_status_pending: "Pending",
    task_status_ongoing: "In Progress",
    task_status_completed: "Completed",
    task_status_delayed: "Delayed",
    
    // Task Stage
    stage_preparation: "Preparation",
    stage_execution: "Execution",
    stage_review: "Review",
    
    // Task Priority
    priority_low: "Low",
    priority_medium: "Medium",
    priority_high: "High",
    priority_urgent: "Urgent",
    
    // Event Detail
    event_date: "Event Date",
    event_location: "Location",
    event_scale: "Scale",
    event_type: "Type",
    event_organizer: "Organizer",
    event_description: "Description",
    event_requirements: "Special Requirements",
    event_not_found: "Event Not Found",
    event_not_found_desc: "Unable to find this event",
    
    // Activity Management
    activity_management: "Activity Management",
    activity_management_desc: "Manage registration and check-in features",
    registration_page: "Registration Page",
    check_in_page: "Check-in Page",
    share_event_links: "Share Event Links",
    share_link_desc: "Copy and share these links with participants",
    registration_link: "Registration Link",
    check_in_link: "Check-in Link",
    open_in_new_tab: "Open in new tab",
    how_to_use: "How to use",
    how_to_use_description: "Copy these links and share them via email, website, or social media. Participants can register and check-in using these links.",
    
    // Registration & Check-in Stats
    stats_title: "Registration & Check-in Stats",
    total_registered: "Total Registered",
    total_checked_in: "Checked In",
    not_checked_in: "Not Checked In",
    checkin_rate: "Check-in Rate",
    registration_conversion: "Registration Conversion",
    recent_registrations: "Recent Registrations",
    no_registrations: "No registrations yet",
    export_csv: "Export CSV",
    checked_in: "Checked In",
    registered_at: "Registered at",
    
    // Organizer QR Code
    organizer_qr: "Organizer QR Code",
    organizer_qr_desc: "Scan this QR code to quickly access event management",
    organizer_qr_note: "This QR code is for event organizers only",
    
    // Registration Page
    event_registration: "Event Registration",
    register_for_event: "Register for this event",
    registration_link_title: "Event Registration Link",
    registration_link_desc: "Copy this link and share it with participants to register",
    full_name_required: "Full Name (Required)",
    email_required: "Email (Required)",
    phone_number: "Phone Number",
    organization: "Organization",
    notes_optional: "Notes (Optional)",
    notes_placeholder: "Any special requirements or notes...",
    your_full_name: "Your full name",
    your_email_placeholder: "your.email@example.com",
    your_organization_placeholder: "Your company or organization",
    complete_registration: "Complete Registration",
    registering: "Registering...",
    registration_agreement: "By registering, you agree to receive event updates and notifications",
    registration_successful: "Registration Successful!",
    registration_success_desc: "You have successfully registered for this event",
    event_details: "Event Details",
    registration_failed: "Registration Failed",
    registration_disabled: "Registration is not enabled for this event",
    registration_closed: "Registration Closed",
    registration_deadline_passed_desc: "The registration deadline has passed",
    registration_deadline_passed_alert: "Registration deadline has passed",
    event_full: "Event Full",
    event_full_desc: "This event has reached maximum capacity",
    event_is_full_alert: "Event is full",
    fill_required_fields: "Please fill in required fields",
    failed_to_load_event: "Failed to load event",
    spots_available: "Spots Available",
    left: "left",
    full: "Full",
    registration_deadline: "Registration Deadline",
    checkin_preview_title: "Check-in Preview",
    checkin_preview_desc: "Please use this page to check in on the event day",
    view_checkin_page: "View Check-in Page",
    
    // Check-in Page
    event_checkin: "Event Check-In",
    confirm_attendance: "Confirm your attendance",
    manual_checkin: "Manual Check-in",
    qr_checkin: "QR Check-in",
    please_enter_name: "Please enter your name",
    please_enter_email: "Please enter your email",
    checkin_now: "Check In Now",
    checking_in: "Checking In...",
    check_in_success: "Check-in Successful",
    check_in_failed: "Check-in failed, please try again",
    checkin_time: "Check-in Time",
    checked_in_success: "Checked In Successfully!",
    checkin_success_desc: "You have successfully checked in to this event",
    enjoy_event: "Welcome to the event! Enjoy your time here.",
    checkin_confirms: "Check-in confirms your attendance and helps organizers track participation",
    not_registered: "Not Registered",
    not_registered_desc: "You haven't registered for this event yet. Registration is recommended before check-in.",
    checkin_disabled: "Check-in is not enabled for this event",
    checkin_failed: "Check-in failed",
    enter_checkin_info: "Enter check-in information",
    name_required: "Name (Required)",
    email_optional: "Email (Optional)",
    
    // Tabs
    tab_tasks: "Task List",
    tab_messages: "Team Chat",
    tab_files: "Files",
    tab_report: "AI Recap",
    
    // Task Views
    view_kanban: "Kanban",
    view_list: "List",
    kanban_search: "Search tasks...",
    kanban_filter: "Filter",
    tasks_add: "Add Task",
    task_unclaimed: "Unclaimed",
    
    // Reports Page
    reports_title: "AI Review Reports",
    reports_summary: "Event Summary",
    reports_highlights: "Highlights",
    reports_issues: "Issues & Challenges",
    reports_suggestions: "Improvement Suggestions",
    reports_no_reports: "No reports yet",
    reports_generate: "Generate AI Recap",
    reports_generating: "Generating...",
    reports_regenerate: "Regenerate",
    reports_ai_description: "AI will analyze event data and generate a detailed recap report",
    
    // Messages
    messages_title: "Team Communication",
    messages_placeholder: "Type a message...",
    messages_no_messages: "No messages yet",
    messages_tips: "Press Enter to send, Shift + Enter for new line",
    messages_translation_zh: "Chinese Translation",
    messages_translation_en: "English Translation",
    messages_attach: "Attach file",
    messages_pending_attachments: "Pending attachments",
    messages_image: "Image",
    messages_video: "Video",
    messages_file: "File",
    messages_video_not_supported: "Your browser does not support video playback",
    
    // Files
    files_title: "Files",
    files_upload: "Upload File",
    files_uploading: "Uploading...",
    files_no_files: "No files yet",
    
    // Common
    loading: "Loading...",
    people: "People",
    date: "Date",
    time: "Time",
    location: "Location",
    created_by: "Created By",
    updated_at: "Updated At",
    optional: "optional",
    you: "You",
    event: "Event",
    
    // Language
    language: "Language",
    language_zh: "中文",
    language_en: "English",
    switch_language: "Switch Language",
    
    // Roles
    organizer: "Organizer",
    participants: "Participants",
    participant_list: "Participant List",
    
    // Copy & Share
    copied: "Copied",
    copy: "Copy",
    qr_share: "Share QR Code",
    qr_download: "Download QR Code",
    
    // Join Event
    join_event_title: "You're Invited!",
    join_event_subtitle: "Scan this QR code to join the event",
    join_event: "Join Event",
    joining: "Joining...",
    already_joined: "You're already a participant!",
    already_joined_desc: "You can access this event from your dashboard",
    view_event: "View Event",
    join_event_note: "By joining, you'll get access to tasks, chat, files, and all event updates",
    join_failed: "Failed to join",
    login_required: "Please login first",
    login_to_join: "Login to Join Event",
    login_required_note: "You need to login to join this event",
    login: "Login",
    loading_failed: "Loading failed",

    // Plan & Billing
    plan_free: "Free Plan",
    plan_starter: "Starter",
    plan_pro: "Pro",
    plan_team: "Team",
    upgrade_plan: "Upgrade Plan",
    current_plan: "Current Plan",
    events_used: "Events Used",
    billing_cycle: "Billing Cycle",
    next_reset: "Next Reset",
  }
};

const LanguageContext = createContext();

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

export function LanguageProvider({ children }) {
  // FIXED: Initialize from localStorage synchronously
  const [language, setLanguage] = useState(() => {
    try {
      const saved = localStorage.getItem("eventflox_language");
      console.log("🔍 [LanguageProvider] Initial load from localStorage:", saved || "not found, defaulting to zh");
      return saved === "en" ? "en" : "zh";
    } catch (error) {
      console.error("❌ [LanguageProvider] Failed to read from localStorage:", error);
      return "zh";
    }
  });
  
  const [isReady, setIsReady] = useState(false);

  // Sync with user entity in background (only once on mount)
  useEffect(() => {
    const syncLanguage = async () => {
      try {
        const user = await base44.auth.me();
        
        // localStorage has priority over user entity
        // Only update if user entity is different AND we haven't explicitly set it
        if (user?.preferred_language) {
          const localStorageLang = localStorage.getItem("eventflox_language");
          
          if (localStorageLang === user.preferred_language) {
            // localStorage and user entity match, or localStorage was set by user entity previously
            // No action needed, or update if for some reason current 'language' state doesn't match
            if (language !== user.preferred_language) {
                console.log("✅ [LanguageProvider] User entity and localStorage match. Updating current language state.");
                setLanguage(user.preferred_language);
            } else {
                console.log("👍 [LanguageProvider] Language state, localStorage, and user entity all match:", user.preferred_language);
            }
          } else if (localStorageLang && localStorageLang !== user.preferred_language) {
            console.log("⚠️ [LanguageProvider] localStorage has priority:", localStorageLang, "over user entity:", user.preferred_language);
            // If localStorage has a value different from user.preferred_language,
            // we assume the user explicitly set it recently.
            // We can optionally update the user entity in the background to match localStorage.
            base44.auth.updateMe({ preferred_language: localStorageLang })
                .then(() => console.log("✅ [LanguageProvider] Synced user entity to localStorage language"))
                .catch(err => console.warn("⚠️ [LanguageProvider] Failed to sync user entity to localStorage language:", err));
            setLanguage(localStorageLang); // Ensure UI reflects localStorage
          } else if (!localStorageLang && user.preferred_language !== language) {
            // localStorage is empty, but user entity has a preferred_language
            console.log("🔄 [LanguageProvider] Syncing language from user entity (no localStorage preference):", user.preferred_language);
            setLanguage(user.preferred_language);
            localStorage.setItem("eventflox_language", user.preferred_language);
          }
        }
      } catch (error) {
        console.log("⚠️ [LanguageProvider] User not logged in or failed to load user, using localStorage value/default.");
      } finally {
        setIsReady(true);
      }
    };
    
   // ✅ 自动语言同步逻辑
  useEffect(() => {
    syncLanguage();
  }, []); // Empty deps - run only once on mount

  // ✅ 安全语言检测 + fallback
  const getSafeLanguage = (lang) => {
    const supported = ["en", "zh"];
    if (!supported.includes(lang)) {
      console.warn(`⚠️ [LanguageProvider] Unsupported language "${lang}", falling back to "en"`);
      return "en";
    }
    return lang;
  };

   const switchLanguage = async (newLang) => {
    const safeLang = getSafeLanguage(newLang);
    console.log("🔄 [LanguageProvider] Switching language to:", safeLang);
    
    // 1. Update state immediately (triggers re-render)
    setLanguage(safeLang);
    
    // 2. Save to localStorage immediately
    try {
      localStorage.setItem("eventflox_language", safeLang);
      console.log("✅ [LanguageProvider] Saved to localStorage:", safeLang);
    } catch (error) {
      console.error("❌ [LanguageProvider] Failed to save to localStorage:", error);
    }
    
    // 3. Optional: sync with backend (only if base44 exists)
    if (typeof base44 !== "undefined" && base44?.auth?.updateMe) {
      base44.auth.updateMe({ preferred_language: safeLang })
        .then(() => {
          console.log("✅ [LanguageProvider] Synced to user entity");
        })
        .catch((error) => {
          console.warn("⚠️ [LanguageProvider] Failed to sync to user entity:", error);
        });
    } else {
      console.log("ℹ️ [LanguageProvider] Skipping Base44 sync (running outside Base44)");
    }
  };

  const t = (key) => {
    const safeLang = getSafeLanguage(language);
    const translation = translations[safeLang]?.[key];
    if (!translation) {
      console.warn(`⚠️ [LanguageProvider] Missing translation for key: ${key} in language: ${safeLang}`);
      return key;
    }
    return translation;
  };

  // Don't block UI - show content immediately with current language
  return (
    <LanguageContext.Provider value={{ language, switchLanguage, t, isReady }}>
      {children}
    </LanguageContext.Provider>
  );
} // ✅ 补上这一行闭合整个组件函数

export default LanguageProvider; // ✅ 可选，但建议加上
