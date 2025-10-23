
import React, { useState, useEffect } from "react";
import { Event, EventParticipant } from "@/api/entities";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Sparkles, Calendar, MapPin, Users, Crown } from "lucide-react";
import { useLanguage } from "../components/LanguageProvider";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    loadUserAndEvents();
  }, []);

  // ✅ ALSO: Reload when window gains focus (user returns from payment)
  useEffect(() => {
    const handleFocus = () => {
      console.log("🔄 [Dashboard] Window focused - reloading data");
      loadUserAndEvents();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadUserAndEvents = async () => {
    try {
      // ✅ Force fresh user data fetch with aggressive retry
      let user;
      let retries = 5; // Increased retries
      
      while (retries > 0) {
        try {
          user = await base44.auth.me();
          console.log("👤 [Dashboard] Current user:", user);
          console.log("📊 [Dashboard] Plan:", user.plan_type, "| Limit:", user.event_limit, "| Used:", user.event_count);
          break; // Successfully fetched user, break the retry loop
        } catch (error) {
          retries--;
          console.warn(`[Dashboard] Attempt to fetch user failed. Retries left: ${retries}. Error:`, error.message);
          if (retries === 0) throw error; // If no retries left, re-throw the error
          await new Promise(resolve => setTimeout(resolve, 1000)); // Longer delay
        }
      }
      
      // ✅ Check if we need to reset event count (retained as per original function logic,
      // but applied to the 'user' variable obtained after potential retries)
      await checkAndResetEventCount(user);
      
      // ✅ Reload user after potential reset (retained as per original function logic,
      // to ensure `currentUser` and `userEvents` reflect the latest state after reset)
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

  // ✅ Auto-reset event count after 30 days
  const checkAndResetEventCount = async (user) => {
    if (!user.next_reset_at) return;

    const now = new Date();
    const resetDate = new Date(user.next_reset_at);

    if (now >= resetDate) {
      // Time to reset!
      const nextReset = new Date();
      nextReset.setDate(nextReset.getDate() + 30);

      await base44.auth.updateMe({
        event_count: 0,
        next_reset_at: nextReset.toISOString()
      });

      console.log("🔄 Event count has been reset for new billing cycle");
    }
  };

  const getPlanColor = (planType) => {
    const colors = {
      free: "from-slate-400 to-slate-500",
      starter: "from-blue-500 to-indigo-600",
      pro: "from-purple-500 to-pink-600",
      team: "from-orange-500 to-red-600"
    };
    return colors[planType] || colors.free;
  };

  // ✅ Safe plan display function
  const getPlanDisplay = () => {
    const planType = currentUser?.plan_type || "free";
    
    const planConfig = {
      free: {
        emoji: "💡",
        name: language === "zh" ? "免费版" : "Free Plan"
      },
      starter: {
        emoji: "🚀",
        name: "Starter Plan"
      },
      pro: {
        emoji: "🌟",
        name: "Pro Plan"
      },
      team: {
        emoji: "🏢",
        name: "Team Plan"
      }
    };

    const plan = planConfig[planType] || planConfig.free;
    return `${plan.emoji} ${plan.name}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2">
              {t("dashboard_title")}
            </h1>
            <p className="text-sm md:text-base text-slate-600">
              {t("dashboard_subtitle")}
            </p>
          </div>
          <Link to={createPageUrl("CreateEvent")}>
            <Button className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
              <Sparkles className="w-5 h-5 mr-2" />
              {t("btn_create_ai")}
            </Button>
          </Link>
        </div>

        {/* ✅ Plan Status Card */}
        {currentUser && (
          <Link to={createPageUrl("Subscription")}>
            <div className={`bg-gradient-to-r ${getPlanColor(currentUser.plan_type || "free")} rounded-2xl p-6 mb-8 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer`}>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Crown className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-sm font-medium opacity-90">
                      {getPlanDisplay()}
                    </p>
                    <p className="text-2xl font-bold">
                      {currentUser.event_count || 0} / {currentUser.event_limit || 2} {language === "zh" ? "活动" : "events"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <span>{language === "zh" ? "点击管理订阅" : "Click to manage"}</span>
                  <Crown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {events.length > 0 ? (
            events.map((event) => (
              <Link key={event.id} to={createPageUrl(`EventDetail?id=${event.id}`)}>
                <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-slate-900">{event.title}</h3>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {t(`status_${event.status?.toLowerCase().replace(/\s/g, '_')}`) || event.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.location}</span>
                    </div>
                    {event.scale && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event.scale} {t("people")}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    {event.created_by === currentUser?.email ? (
                      <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                        👑 {t("you_are_organizer")}
                      </span>
                    ) : (
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        ✓ {t("you_are_participant")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{t("dashboard_no_events")}</h3>
              <p className="text-slate-600 mb-4">{t("dashboard_create_first")}</p>
              <Link to={createPageUrl("CreateEvent")}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  {t("btn_create")}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
