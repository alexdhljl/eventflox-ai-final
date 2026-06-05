import React, { useState, useEffect } from "react";
import { Event, Task, Message, EventFile, EventParticipant, Report, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, RefreshCw, MessageCircle, CheckCircle2, FolderOpen, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import EventInfo from "../components/detail/EventInfo";
import TaskSection from "../components/detail/TaskSection";
import MessageSection from "../components/detail/MessageSection";
import FileSection from "../components/detail/FileSection";
import ReportSection from "../components/detail/ReportSection";
import RegistrationStats from "../components/detail/RegistrationStats";
import { useLanguage } from "../components/LanguageProvider";

export default function EventDetail() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");

  const [event, setEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [showReportTab, setShowReportTab] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEventData();
    }
  }, [eventId]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      setCurrentUser(user);

      const [eventData, tasksData, messagesData, filesData, participantsData, reportsData] = await Promise.all([
        Event.list().then(events => events.find(e => e.id === eventId)),
        Task.filter({ event_id: eventId }),
        Message.filter({ event_id: eventId }, "-created_date"),
        EventFile.filter({ event_id: eventId }),
        EventParticipant.filter({ event_id: eventId }),
        Report.filter({ event_id: eventId })
      ]);

      if (!eventData) {
        setLoading(false);
        return;
      }

      const isEventCreator = eventData.created_by === user.email;
      const isParticipant = participantsData.some(p => p.user_email === user.email);
      const canAccess = isEventCreator || isParticipant;

      if (!canAccess) {
        navigate(createPageUrl(`JoinEvent?id=${eventId}`));
        setLoading(false);
        return;
      }

      setHasAccess(true);
      setIsCreator(isEventCreator);
      setEvent(eventData);
      setTasks(tasksData || []);
      setMessages(messagesData || []);
      setFiles(filesData || []);
      setParticipants(participantsData || []);
      setReports(reportsData || []);

      const hasReport = reportsData && reportsData.length > 0;
      setShowReportTab(isEventCreator || hasReport);
    } catch (error) {
      console.error("加载失败:", error);
    }
    setLoading(false);
  };

  const refreshTasks = async () => {
    setRefreshing(true);
    try {
      const tasksData = await Task.filter({ event_id: eventId });
      setTasks(tasksData || []);
    } catch (error) {
      console.error("刷新任务失败:", error);
    }
    setRefreshing(false);
  };

  const refreshMessages = async () => {
    const messagesData = await Message.filter({ event_id: eventId }, "-created_date");
    setMessages(messagesData || []);
  };

  const refreshFiles = async () => {
    const filesData = await EventFile.filter({ event_id: eventId });
    setFiles(filesData || []);
  };

  const refreshReports = async () => {
    const reportsData = await Report.filter({ event_id: eventId });
    setReports(reportsData || []);

    const hasReport = reportsData && reportsData.length > 0;
    setShowReportTab(isCreator || hasReport);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-slate-900 animate-spin mb-4" />
        <p className="text-slate-600">{t("loading")}</p>
      </div>
    );
  }

  if (!event || !hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t("event_not_found")}</h2>
          <p className="text-slate-600 mb-4">{t("event_not_found_desc")}</p>
          <Button onClick={() => navigate(createPageUrl("Dashboard"))}>
            {t("btn_back_dashboard")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("btn_back_dashboard")}
          </Button>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 md:p-8">
            <EventInfo
              event={event}
              onUpdate={loadEventData}
              isCreator={isCreator}
              participants={participants}
            />
          </div>
        </motion.div>

        {isCreator && event && (
          <RegistrationStats eventId={eventId} isCreator={isCreator} />
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex gap-3">
            <MessageCircle className="w-5 h-5 text-cyan-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 text-sm">{t("tab_messages")}</p>
              <p className="text-xs text-slate-500">
                {language === "zh" ? "所有决定先沉淀在沟通区。" : "Keep decisions in the conversation first."}
              </p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 text-sm">{t("tab_tasks")} ({tasks.length})</p>
              <p className="text-xs text-slate-500">
                {language === "zh" ? "把决定转成负责人明确的任务。" : "Turn decisions into owned tasks."}
              </p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex gap-3">
            <FolderOpen className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900 text-sm">{t("tab_files")}</p>
              <p className="text-xs text-slate-500">
                {language === "zh" ? "资料和上下文放在一起。" : "Keep files beside their context."}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="messages" className="w-full">
          <TabsList className="bg-white border border-slate-200 flex flex-wrap h-auto">
            <TabsTrigger value="messages" className="gap-2">
              <MessageCircle className="w-4 h-4" />
              {t("tab_messages")} ({messages.length})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {t("tab_tasks")} ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="files" className="gap-2">
              <FolderOpen className="w-4 h-4" />
              {t("tab_files")} ({files.length})
            </TabsTrigger>
            {showReportTab && (
              <TabsTrigger value="report" className="gap-2">
                <Sparkles className="w-4 h-4" />
                {t("tab_report")}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="messages" className="mt-6">
            <MessageSection
              eventId={eventId}
              messages={messages}
              onRefresh={refreshMessages}
            />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <div className="flex justify-end mb-4">
              <Button
                onClick={refreshTasks}
                variant="outline"
                size="sm"
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {t("btn_refresh")}
              </Button>
            </div>
            <TaskSection
              eventId={eventId}
              tasks={tasks}
              onRefresh={refreshTasks}
              isCreator={isCreator}
            />
          </TabsContent>

          <TabsContent value="files" className="mt-6">
            <FileSection
              eventId={eventId}
              files={files}
              onRefresh={refreshFiles}
            />
          </TabsContent>

          {showReportTab && (
            <TabsContent value="report" className="mt-6">
              <ReportSection
                event={event}
                tasks={tasks}
                messages={messages}
                isCreator={isCreator}
                existingReport={reports.length > 0 ? reports[0] : null}
                onReportGenerated={refreshReports}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
