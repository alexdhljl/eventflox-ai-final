
import React, { useState, useEffect } from "react";
import { Event, CheckIn, Registration, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, MapPin, CheckCircle, Loader2, AlertCircle, User as UserIcon, Mail, QrCode } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import { useLanguage } from "../components/LanguageProvider";

export default function EventCheckIn() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");
  const dateLocale = language === "zh" ? zhCN : enUS;

  const [event, setEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState(null);
  const [checkInTime, setCheckInTime] = useState(null);
  
  // Manual check-in form data
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    setLoading(true);
    try {
      let user = null;
      try {
        user = await User.me();
        setCurrentUser(user);
        setManualName(user.full_name || "");
        setManualEmail(user.email || "");
      } catch (error) {
        console.log("User not logged in, manual check-in available");
      }

      const allEvents = await Event.list();
      const eventData = allEvents.find(e => e.id === eventId);

      if (!eventData) {
        setError(t("event_not_found"));
        setLoading(false);
        return;
      }

      if (eventData.checkin_enabled === false) {
        setError(t("checkin_disabled"));
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Check if user is registered
      if (user) {
        const registrations = await Registration.filter({ 
          event_id: eventId,
          user_email: user.email
        });
        setRegistered(registrations.length > 0);

        // Check if already checked in
        const checkIns = await CheckIn.filter({ 
          event_id: eventId,
          user_email: user.email
        });
        
        if (checkIns.length > 0) {
          setCheckedIn(true);
          setCheckInTime(checkIns[0].checkin_time);
        }
      }
    } catch (error) {
      console.error("Failed to load:", error);
      setError(t("failed_to_load_event"));
    }
    setLoading(false);
  };

  const handleManualCheckIn = async () => {
    if (!manualName.trim()) {
      alert(t("please_enter_name"));
      return;
    }

    setChecking(true);
    try {
      const checkInData = {
        event_id: eventId,
        user_name: manualName.trim(),
        user_email: manualEmail.trim() || (currentUser?.email || "guest@event.com"),
        checkin_time: new Date().toISOString(),
        checkin_method: "manual",
        location: event.location
      };

      await CheckIn.create(checkInData);

      setCheckedIn(true);
      setCheckInTime(new Date().toISOString());
    } catch (error) {
      console.error("Check-in failed:", error);
      alert(t("check_in_failed") + ": " + error.message);
    }
    setChecking(false);
  };

  const handleQRCheckIn = async () => {
    if (!currentUser) {
      alert(t("login_required"));
      return;
    }

    setChecking(true);
    try {
      await CheckIn.create({
        event_id: eventId,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email,
        checkin_time: new Date().toISOString(),
        checkin_method: "qr_code",
        location: event.location
      });

      setCheckedIn(true);
      setCheckInTime(new Date().toISOString());
    } catch (error) {
      console.error("Check-in failed:", error);
      alert(t("check_in_failed") + ": " + error.message);
    }
    setChecking(false);
  };

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
          <Button onClick={() => navigate(createPageUrl("Dashboard"))} className="mt-4">
            {t("btn_back_dashboard")}
          </Button>
        </Card>
      </div>
    );
  }

  if (checkedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-green-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md w-full p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              ✅ {t("checked_in_success")}
            </h2>
            <p className="text-slate-600 mb-4">
              {t("checkin_success_desc")}
            </p>
            
            <div className="text-left bg-slate-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-slate-600 mb-1">{t("event")}:</p>
              <p className="font-semibold text-slate-900">{event.title}</p>
              <p className="text-sm text-slate-600 mt-2">{t("checkin_time")}:</p>
              <p className="font-semibold text-slate-900">
                {format(new Date(checkInTime), "PPpp", { locale: dateLocale })}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-green-700">
                🎉 {t("enjoy_event")}
              </p>
            </div>

            <Button 
              onClick={() => navigate(createPageUrl("Dashboard"))}
              variant="outline"
              className="w-full"
            >
              {t("btn_back_dashboard")}
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-2xl">
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
            <h1 className="text-3xl font-bold text-slate-900">{t("event_checkin")}</h1>
          </div>
          <p className="text-slate-600">{t("confirm_attendance")}</p>
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
                  <p className="text-xs text-slate-500">{t("date")}</p>
                  <p className="font-semibold text-slate-900">
                    {format(new Date(event.date), "PPP", { locale: dateLocale })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("location")}</p>
                  <p className="font-semibold text-slate-900">{event.location}</p>
                </div>
              </div>
            </div>
          </div>

          {!registered && currentUser && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-orange-700 font-semibold">{t("not_registered")}</p>
                  <p className="text-sm text-orange-600 mt-1">
                    {t("not_registered_desc")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ NEW: Dual-mode check-in interface */}
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                {t("manual_checkin")}
              </TabsTrigger>
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                {t("qr_checkin")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t("name_required")}
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder={t("please_enter_name")}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t("email_optional")}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder={t("please_enter_email")}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleManualCheckIn}
                  disabled={!manualName.trim() || checking}
                  className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {t("checking_in")}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      {t("checkin_now")}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-slate-500">
                  {t("checkin_confirms")}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="qr" className="space-y-4">
              <div className="text-center py-8">
                <QrCode className="w-24 h-24 mx-auto text-indigo-600 mb-4" />
                <p className="text-slate-600 mb-6">
                  {language === "zh" 
                    ? "扫描活动二维码即可自动完成签到" 
                    : "Scan the event QR code to automatically check in"}
                </p>
                
                {currentUser ? (
                  <Button
                    onClick={handleQRCheckIn}
                    disabled={checking}
                    className="w-full h-14 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  >
                    {checking ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {t("checking_in")}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {t("checkin_now")}
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-700">
                      {language === "zh" 
                        ? "二维码签到需要登录账号" 
                        : "QR code check-in requires login"}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
