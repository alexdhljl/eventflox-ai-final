import React, { useState, useEffect } from "react";
import { Event, EventParticipant } from "@/api/entities";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Sparkles,
  Calendar,
  MapPin,
  Users,
  Crown,
  MessageCircle,
  CheckCircle2,
  FolderOpen,
  ArrowRight,
  Clock3,
  Activity,
} from "lucide-react";
import { useLanguage } from "../components/LanguageProvider";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    loadUserAndEvents();
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      loadUserAndEvents();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadUserAndEvents = async () => {
    try {
      let user;
      let retries = 5;

      while (retries > 0) {
        try {
          user = await base44.auth.me();
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      await checkAndResetEventCount(user);

      const updatedUser = await base44.auth.me();
      setCurrentUser(updatedUser);

      const allEvents = await Event.list("-created_date");
      const allParticipants = await EventParticipant.list();

      const userEvents = allEvents.filter(event => {
        if (event.created_by === updatedUser.email) return true;

        const isParticipant = allParticipants.some(
          p => p.event_id === event.id && p.user_email === updatedUser.email
        );
        if (isParticipant) return true;

        return false;
      });

      setEvents(userEvents || []);
    } catch (error) {
      console.error("[Dashboard] 加载失败:", error);
    }
    setLoading(false);
  };

  const checkAndResetEventCount = async (user) => {
    if (!user.next_reset_at) return;

    const now = new Date();
    const resetDate = new Date(user.next_reset_at);

    if (now >= resetDate) {
      const nextReset = new Date();
      nextReset.setDate(nextReset.getDate() + 30);

      await base44.auth.updateMe({
        event_count: 0,
        next_reset_at: nextReset.toISOString()
      });
    }
  };

  const getPlanColor = (planType) => {
    const colors = {
      free: "from-slate-700 to-slate-900",
      starter: "from-cyan-600 to-blue-700",
      pro: "from-fuchsia-600 to-rose-600",
      team: "from-emerald-600 to-teal-700"
    };
    return colors[planType] || colors.free;
  };

  const getPlanDisplay = () => {
    const planType = currentUser?.plan_type || "free";

    const planConfig = {
      free: { name: language === "zh" ? "免费版" : "Free Plan" },
      starter: { name: "Starter Plan" },
      pro: { name: "Pro Plan" },
      team: { name: "Team Plan" }
    };

    return planConfig[planType]?.name || planConfig.free.name;
  };

  const activeEvents = events.filter(event => {
    const status = (event.status || "").toLowerCase();
    return !status.includes("complete") && !status.includes("已完成") && !status.includes("finished");
  }).length;

  const ownedEvents = events.filter(event => event.created_by === currentUser?.email).length;
  const collaboratorEvents = Math.max(events.length - ownedEvents, 0);

  const workspaceStats = [
    {
      label: language === "zh" ? "活动空间" : "Event rooms",
      value: events.length,
      icon: Activity,
      tone: "bg-slate-900 text-white",
    },
    {
      label: language === "zh" ? "进行中" : "Active",
      value: activeEvents,
      icon: Clock3,
      tone: "bg-cyan-600 text-white",
    },
    {
      label: language === "zh" ? "我负责" : "Owned by me",
      value: ownedEvents,
      icon: CheckCircle2,
      tone: "bg-emerald-600 text-white",
    },
    {
      label: language === "zh" ? "我协作" : "Collaborating",
      value: collaboratorEvents,
      icon: Users,
      tone: "bg-amber-500 text-white",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-5">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-600 mb-4">
              <MessageCircle className="w-4 h-4" />
              {language === "zh" ? "EventFloX 沟通中枢" : "EventFloX communication hub"}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-slate-950 mb-3 tracking-normal">
              {t("dashboard_title")}
            </h1>
            <p className="text-base md:text-lg text-slate-600 leading-relaxed">
              {t("dashboard_subtitle")}
            </p>
          </div>
          <Link to={createPageUrl("CreateEvent")} className="w-full sm:w-auto">
            <Button className="bg-slate-900 hover:bg-slate-800 w-full sm:w-auto h-12 px-5">
              <Sparkles className="w-5 h-5 mr-2" />
              {t("btn_create_ai")}
            </Button>
          </Link>
        </div>

        {currentUser && (
          <Link to={createPageUrl("Subscription")}> 
            <div className={`bg-gradient-to-r ${getPlanColor(currentUser.plan_type || "free")} rounded-lg p-5 text-white shadow-sm hover:shadow-md transition-all cursor-pointer`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium opacity-90">{getPlanDisplay()}</p>
                    <p className="text-xl font-bold">
                      {currentUser.event_count || 0} / {currentUser.event_limit || 2} {language === "zh" ? "活动" : "events"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <span>{language === "zh" ? "管理订阅" : "Manage plan"}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {workspaceStats.map((stat) => (
            <div key={stat.label} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${stat.tone}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-slate-950">{stat.value}</p>
              <p className="text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 items-start">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {language === "zh" ? "我的活动空间" : "My event rooms"}
                </h2>
                <p className="text-sm text-slate-500">
                  {language === "zh" ? "进入活动后，先看沟通，再处理任务和资料。" : "Open an event to start with communication, then tasks and files."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {events.length > 0 ? (
                events.map((event) => (
                  <Link key={event.id} to={createPageUrl(`EventDetail?id=${event.id}`)}>
                    <div className="bg-white p-5 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer h-full">
                      <div className="flex justify-between items-start gap-3 mb-4">
                        <div className="min-w-0">
                          <h3 className="text-lg font-bold text-slate-950 line-clamp-2">{event.title}</h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {event.created_by === currentUser?.email ? t("you_are_organizer") : t("you_are_participant")}
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded shrink-0">
                          {event.status || (language === "zh" ? "筹备中" : "Planning")}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{event.date || (language === "zh" ? "待定日期" : "Date TBD")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-400" />
                          <span className="truncate">{event.location || (language === "zh" ? "待定地点" : "Location TBD")}</span>
                        </div>
                        {event.scale && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span>{event.scale} {t("people")}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {language === "zh" ? "沟通" : "Chat"}
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {language === "zh" ? "任务" : "Tasks"}
                        </div>
                        <div className="flex items-center gap-1">
                          <FolderOpen className="w-3.5 h-3.5" />
                          {language === "zh" ? "资料" : "Files"}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="md:col-span-2 text-center py-16 bg-white border border-slate-200 rounded-lg">
                  <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">{t("dashboard_no_events")}</h3>
                  <p className="text-slate-600 mb-5 max-w-md mx-auto">{t("dashboard_create_first")}</p>
                  <Link to={createPageUrl("CreateEvent")}>
                    <Button className="bg-slate-900 hover:bg-slate-800">
                      <Sparkles className="w-4 h-4 mr-2" />
                      {t("btn_create")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </section>

          <aside className="bg-white border border-slate-200 rounded-lg p-5 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                {language === "zh" ? "今日协作重点" : "Today’s coordination focus"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {language === "zh" ? "进入活动空间后，用沟通记录承接所有决定。" : "Use the event room conversation as the source of truth."}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-3 p-3 rounded-lg bg-slate-50">
                <MessageCircle className="w-5 h-5 text-cyan-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {language === "zh" ? "先同步变更" : "Sync changes first"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {language === "zh" ? "把最新决定写进沟通区，再分派任务。" : "Record decisions before assigning tasks."}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-lg bg-slate-50">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {language === "zh" ? "任务需要负责人" : "Every task needs an owner"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {language === "zh" ? "避免只写待办，没人真正接手。" : "Avoid tasks that nobody actually owns."}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 p-3 rounded-lg bg-slate-50">
                <FolderOpen className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {language === "zh" ? "资料跟着上下文走" : "Keep files with context"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {language === "zh" ? "供应商文件、图稿、报价都放进活动空间。" : "Store vendor files, assets, and quotes in the event room."}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
