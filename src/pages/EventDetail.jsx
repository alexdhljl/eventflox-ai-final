
import React, { useState, useEffect } from "react";
import { Event, Task, Message, EventFile, EventParticipant, Report, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import EventInfo from "../components/detail/EventInfo";
import TaskSection from "../components/detail/TaskSection";
import MessageSection from "../components/detail/MessageSection";
import FileSection from "../components/detail/FileSection";
import ReportSection from "../components/detail/ReportSection";
import RegistrationStats from "../components/detail/RegistrationStats"; // New import
import { useLanguage } from "../components/LanguageProvider";

export default function EventDetail() {
  const navigate = useNavigate();
  const { t } = useLanguage();
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
      console.log("Loading event data for ID:", eventId);
      
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
      
      console.log("Event data loaded:", eventData);
      console.log("Participants loaded:", participantsData);
      console.log("Reports loaded:", reportsData);
      
      if (!eventData) {
        setLoading(false);
        return;
      }

      // Check if user has access to this event
      const isEventCreator = eventData.created_by === user.email;
      const isParticipant = participantsData.some(p => p.user_email === user.email);
      const canAccess = isEventCreator || isParticipant;

      if (!canAccess) {
        // Redirect to join page if user doesn't have access
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

      // Show report tab if:
      // 1. User is creator (can always generate)
      // 2. OR report already exists (all members can view)
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
      console.log("Tasks refreshed:", tasksData);
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
    
    // Update showReportTab after refresh - if report exists, all members can see it
    const hasReport = reportsData && reportsData.length > 0;
    setShowReportTab(isCreator || hasReport);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
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
    <div className="min-h-screen p-4 md:p-8">
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

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 p-6 md:p-8">
            <EventInfo 
              event={event} 
              onUpdate={loadEventData} 
              isCreator={isCreator}
              participants={participants}
            />
          </div>
        </motion.div>

        {/* Registration & Check-in Stats - Only for creator */}
        {isCreator && event && (
          <RegistrationStats eventId={eventId} isCreator={isCreator} />
        )}

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="bg-white/80 backdrop-blur-xl border border-slate-200">
            <TabsTrigger value="tasks">
              {t("tab_tasks")} ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="messages">{t("tab_messages")}</TabsTrigger>
            <TabsTrigger value="files">{t("tab_files")}</TabsTrigger>
            {showReportTab && (
              <TabsTrigger value="report" className="gap-2">
                <span>🤖</span>
                {t("tab_report")}
                {!isCreator && reports.length > 0 && <span className="ml-1">👁️</span>}
              </TabsTrigger>
            )}
          </TabsList>

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

          <TabsContent value="messages" className="mt-6">
            <MessageSection 
              eventId={eventId}
              messages={messages}
              onRefresh={refreshMessages}
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
