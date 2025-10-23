
import React, { useState, useEffect } from "react";
import { Event, Registration, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar, MapPin, Users, CheckCircle, Loader2, AlertCircle, Clock, LinkIcon, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { format, isAfter, isBefore } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import { useLanguage } from "../components/LanguageProvider";

export default function EventRegister() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get("id");

  const [event, setEvent] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const dateLocale = language === "zh" ? zhCN : enUS;
  
  const [formData, setFormData] = useState({
    user_name: "",
    user_email: "",
    phone: "",
    organization: "",
    notes: ""
  });

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
        setFormData({
          user_name: user.full_name || "",
          user_email: user.email || "",
          phone: user.phone || "",
          organization: user.organization || "",
          notes: ""
        });
      } catch (error) {
        console.log("User not logged in");
      }

      const allEvents = await Event.list();
      const eventData = allEvents.find(e => e.id === eventId);

      if (!eventData) {
        setError(t("event_not_found") || "Event not found");
        setLoading(false);
        return;
      }

      // ✅ FIX: Default to enabled if field is undefined
      if (eventData.registration_enabled === false) {
        setError(t("registration_disabled") || "Registration is not enabled for this event");
        setLoading(false);
        return;
      }

      setEvent(eventData);

      const registrations = await Registration.filter({ event_id: eventId });
      setRegistrationCount(registrations.length);

      if (user) {
        const hasRegistered = registrations.some(r => r.user_email === user.email);
        if (hasRegistered) {
          setRegistered(true);
        }
      }
    } catch (error) {
      console.error("Failed to load:", error);
      setError(t("failed_to_load_event") || "Failed to load event");
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.user_name || !formData.user_email) {
      alert(t("fill_required_fields") || "Please fill in required fields");
      return;
    }

    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline);
      if (isAfter(new Date(), deadline)) {
        alert(t("registration_deadline_passed_alert") || "Registration deadline has passed");
        return;
      }
    }

    if (event.max_participants && registrationCount >= event.max_participants) {
      alert(t("event_is_full_alert") || "Event is full");
      return;
    }

    setSubmitting(true);
    try {
      await Registration.create({
        event_id: eventId,
        ...formData,
        registration_time: new Date().toISOString(),
        status: "confirmed"
      });

      setRegistered(true);
    } catch (error) {
      console.error("Registration failed:", error);
      alert((t("registration_failed") || "Registration failed") + ": " + error.message);
    }
    setSubmitting(false);
  };

  const copyRegistrationLink = () => {
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">{t("loading") || "Loading..."}</p>
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
            {t("btn_back_dashboard") || "Back to Dashboard"}
          </Button>
        </Card>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md w-full p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {t("registration_successful") || "Registration Successful!"}
            </h2>
            <p className="text-slate-600 mb-6">
              {t("registration_success_desc") || "You have successfully registered for this event."}
            </p>
            <div className="text-left bg-slate-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-slate-600 mb-1">{t("event_details") || "Event Details"}:</p>
              <p className="font-semibold text-slate-900">{event.title}</p>
              <p className="text-sm text-slate-600">{format(new Date(event.date), "PPP", { locale: dateLocale })} • {event.location}</p>
            </div>

            {/* ✅ NEW: Check-in Preview */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="font-semibold text-slate-900 mb-2">{t("checkin_preview_title") || "Check-in Page Preview"}</h3>
              <p className="text-sm text-slate-600 mb-3">
                {t("checkin_preview_desc") || "Your event's dedicated check-in page is now live. Share this link with your volunteers or staff to streamline attendee check-ins at the event entrance."}
              </p>
              <Button 
                onClick={() => window.open(createPageUrl(`EventCheckIn?id=${event.id}`), '_blank')}
                variant="outline"
                className="w-full"
              >
                {t("view_checkin_page") || "View Check-in Page"}
              </Button>
            </div>
            
            <Button 
              onClick={() => navigate(createPageUrl("Dashboard"))}
              className="w-full"
            >
              {t("btn_back_dashboard") || "Back to Dashboard"}
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  const registrationOpen = !event.registration_deadline || isBefore(new Date(), new Date(event.registration_deadline));
  const spotsLeft = event.max_participants ? event.max_participants - registrationCount : null;

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
            <h1 className="text-3xl font-bold text-slate-900">
              {t("event_registration")}
            </h1>
          </div>
          <p className="text-slate-600">
            {t("register_for_event")}
          </p>
        </motion.div>

        <Card className="bg-white/90 backdrop-blur-xl border-slate-200 shadow-2xl p-8">
          {/* ✅ UPDATED: Registration Link Section */}
          <div className="mb-6 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                {t("registration_link_title") || "Registration Link"}
              </h3>
              <Button
                onClick={copyRegistrationLink}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    {t("copied") || "Copied!"}
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    {t("copy") || "Copy"}
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 break-all bg-white p-2 rounded border border-slate-200">
              {window.location.href}
            </p>
            <p className="text-xs text-blue-700 mt-2">
              💡 {t("registration_link_desc") || "Share this link with others to invite them to register for the event."}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{event.title}</h2>
            <p className="text-slate-700 mb-6">{event.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{t("date") || "Date"}</p>
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
                  <p className="text-xs text-slate-500">{t("location") || "Location"}</p>
                  <p className="font-semibold text-slate-900">{event.location}</p>
                </div>
              </div>

              {event.max_participants && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t("spots_available") || "Spots Available"}</p>
                    <p className="font-semibold text-slate-900">
                      {spotsLeft > 0 ? `${spotsLeft} ${t("left") || "left"}` : (t("full") || "Full")}
                    </p>
                  </div>
                </div>
              )}

              {event.registration_deadline && (
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t("registration_deadline") || "Registration Deadline"}</p>
                    <p className="font-semibold text-slate-900">
                      {format(new Date(event.registration_deadline), "PPP", { locale: dateLocale })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {!registrationOpen ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 font-semibold">{t("registration_closed") || "Registration Closed"}</p>
              <p className="text-sm text-red-600 mt-1">
                {t("registration_deadline_passed_desc") || "The registration deadline has passed"}
              </p>
            </div>
          ) : spotsLeft !== null && spotsLeft <= 0 ? (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
              <AlertCircle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-orange-700 font-semibold">{t("event_full") || "Event Full"}</p>
              <p className="text-sm text-orange-600 mt-1">
                {t("event_full_desc") || "This event has reached maximum capacity"}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t("full_name_required") || "Full Name *"}
                </label>
                <Input
                  value={formData.user_name}
                  onChange={(e) => setFormData({...formData, user_name: e.target.value})}
                  placeholder={t("your_full_name") || "Your full name"}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t("email_required") || "Email *"}
                </label>
                <Input
                  type="email"
                  value={formData.user_email}
                  onChange={(e) => setFormData({...formData, user_email: e.target.value})}
                  placeholder={t("your_email_placeholder") || "your.email@example.com"}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t("phone_number") || "Phone Number"}
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t("organization") || "Organization"}
                </label>
                <Input
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  placeholder={t("your_organization_placeholder") || "Your company or organization"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t("notes_optional") || "Notes (Optional)"}
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder={t("notes_placeholder") || "Any special requirements or notes..."}
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t("registering") || "Registering..."}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {t("complete_registration") || "Complete Registration"}
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-slate-500 mt-4">
                {t("registration_agreement") || "By registering, you agree to receive event updates and notifications"}
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
