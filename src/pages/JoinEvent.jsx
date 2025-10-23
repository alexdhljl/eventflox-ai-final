
import React, { useState, useEffect } from "react";
import { Event, EventParticipant, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, MapPin, Users, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../components/LanguageProvider";
import { format } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";

export default function JoinEvent() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");

  const [event, setEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [error, setError] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    loadEventAndUser();
  }, [eventId]);

  const loadEventAndUser = async () => {
    setLoading(true);
    try {
      // Try to get current user
      let user = null;
      try {
        user = await User.me();
        setCurrentUser(user);
        setUserLoggedIn(true);
      } catch (error) {
        console.log("User not logged in");
        setUserLoggedIn(false);
      }

      // Load event
      const allEvents = await Event.list();
      const eventData = allEvents.find(e => e.id === eventId);

      if (!eventData) {
        setError(t("event_not_found") || "Event not found");
        setLoading(false);
        return;
      }

      // Check if event allows public access
      if (!eventData.allow_public_access && !user) {
        setError(t("login_required") || "Please login to view this event");
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Load participants from EventParticipant entity
      const participants = await EventParticipant.filter({ event_id: eventId });
      setParticipantCount(participants.length + 1); // +1 for organizer

      // If user is logged in, check if they already joined
      if (user) {
        const isCreator = eventData.created_by === user.email;
        const hasJoined = participants.some(p => p.user_email === user.email);
        
        if (isCreator || hasJoined) {
          setAlreadyJoined(true);
        }
      }
    } catch (error) {
      console.error("加载失败:", error);
      setError(t("loading_failed") || "Failed to load event");
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!userLoggedIn) {
      // Redirect to login with return URL
      const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?next=${currentUrl}`;
      return;
    }

    if (!currentUser) return;

    setJoining(true);
    try {
      // Check if already joined (double-check)
      const existingParticipants = await EventParticipant.filter({ 
        event_id: eventId,
        user_email: currentUser.email
      });

      if (existingParticipants.length > 0) {
        // Already joined, just redirect
        navigate(createPageUrl(`EventDetail?id=${event.id}`));
        return;
      }

      // Create new participant record
      await EventParticipant.create({
        event_id: eventId,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        joined_at: new Date().toISOString(),
        role: "participant"
      });

      // Success! Redirect to event detail page
      navigate(createPageUrl(`EventDetail?id=${event.id}`));
      
    } catch (error) {
      console.error("加入失败:", error);
      alert((t("join_failed") || "Failed to join event") + ": " + error.message);
    }
    setJoining(false);
  };

  const dateLocale = language === "zh" ? zhCN : enUS;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{error}</h2>
          <div className="space-y-3 mt-6">
            {!userLoggedIn && (
              <Button 
                onClick={() => {
                  const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
                  window.location.href = `/login?next=${currentUrl}`;
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {t("login") || "Login"}
              </Button>
            )}
            <Button 
              onClick={() => navigate(createPageUrl("Dashboard"))} 
              variant="outline"
              className="w-full"
            >
              {t("btn_back_dashboard")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (alreadyJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md w-full p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {t("already_joined") || "You're already a participant!"}
            </h2>
            <p className="text-slate-600 mb-6">
              {t("already_joined_desc") || "You can access this event from your dashboard"}
            </p>
            <Button 
              onClick={() => navigate(createPageUrl(`EventDetail?id=${event.id}`))}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {t("view_event") || "View Event"}
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e325d09d039fe429257d6b/3d44cb0f7_image.png" 
              alt="EventFloX AI"
              className="w-12 h-12 object-contain rounded-lg"
            />
            <h1 className="text-3xl font-bold text-slate-900">{t("join_event_title")}</h1>
          </div>
          <p className="text-slate-600">{t("join_event_subtitle")}</p>
        </motion.div>

        <Card className="bg-white/90 backdrop-blur-xl border-slate-200 shadow-2xl p-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{event.title}</h2>
            <p className="text-slate-700 mb-6">{event.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("event_date")}</p>
                  <p className="font-semibold text-slate-900">
                    {event.date && format(new Date(event.date), "PPP", { locale: dateLocale })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("event_location")}</p>
                  <p className="font-semibold text-slate-900">{event.location}</p>
                </div>
              </div>

              {event.scale && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t("event_scale")}</p>
                    <p className="font-semibold text-slate-900">{event.scale} {t("people")}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                <div>
                  <p className="text-xs text-slate-500">{t("participants") || "Participants"}</p>
                  <p className="font-semibold text-slate-900">
                    {participantCount} {t("people")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-slate-700 text-center">
              {t("join_event_note") || "By joining, you'll get access to tasks, chat, files, and all event updates"}
            </p>
          </div>

          {!userLoggedIn ? (
            <div className="space-y-3">
              <Button
                onClick={() => {
                  const currentUrl = encodeURIComponent(window.location.pathname + window.location.search);
                  window.location.href = `/login?next=${currentUrl}`;
                }}
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {t("login_to_join") || "Login to Join Event"}
              </Button>
              <p className="text-xs text-center text-slate-500">
                {t("login_required_note") || "You need to login to join this event"}
              </p>
            </div>
          ) : (
            <>
              <Button
                onClick={handleJoin}
                disabled={joining}
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t("joining") || "Joining..."}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {t("join_event") || "Join Event"}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-slate-500 mt-4">
                {t("join_event_privacy") || "You'll be added as a participant and can access all event features"}
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
