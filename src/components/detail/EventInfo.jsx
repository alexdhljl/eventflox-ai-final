
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Tag, User, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import QRCodeDisplay from "../QRCodeDisplay";
import { useLanguage } from "../LanguageProvider";

const statusColors = {
  "筹备中": "bg-blue-100 text-blue-700 border-blue-200",
  "进行中": "bg-green-100 text-green-700 border-green-200",
  "已结束": "bg-slate-100 text-slate-700 border-slate-200",
  "已复盘": "bg-purple-100 text-purple-700 border-purple-200",
  "Preparing": "bg-blue-100 text-blue-700 border-blue-200",
  "Ongoing": "bg-green-100 text-green-700 border-green-200",
  "Completed": "bg-slate-100 text-slate-700 border-slate-200",
  "Reviewed": "bg-purple-100 text-purple-700 border-purple-200"
};

export default function EventInfo({ event, onUpdate, isCreator, participants = [] }) {
  const navigate = useNavigate();
  const { language, t } = useLanguage();

  // ✅ FIX: Format date without timezone conversion
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    
    // Parse date string directly without timezone conversion
    const [year, month, day] = dateString.split('-').map(Number);
    
    if (language === "zh") {
      return `${year}年${month}月${day}日`;
    } else {
      const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];
      return `${monthNames[month - 1]} ${day}, ${year}`;
    }
  };

  const handleCopyEvent = () => {
    navigate(createPageUrl(`CopyEvent?id=${event.id}`));
  };

  const openRegistrationPage = () => {
    window.open(createPageUrl(`EventRegister?id=${event.id}`), '_blank');
  };

  const openCheckInPage = () => {
    window.open(createPageUrl(`EventCheckIn?id=${event.id}`), '_blank');
  };

  // Calculate total participants (creator + participants)
  const totalParticipants = participants.length + 1;

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e325d09d039fe429257d6b/3d44cb0f7_image.png" 
              alt="EventFloX AI"
              className="w-10 h-10 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{event.title}</h1>
              {isCreator && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full mt-1">
                  👑 {t("organizer")}
                </span>
              )}
            </div>
          </div>
          <p className="text-slate-600">{event.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${statusColors[event.status]} border`}>
            {event.status}
          </Badge>
          {isCreator && (
            <>
              <QRCodeDisplay eventId={event.id} eventTitle={event.title} />
              {(event.status === "已结束" || event.status === "已复盘" || event.status === "Completed" || event.status === "Reviewed") && (
                <Button
                  onClick={handleCopyEvent}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {t("btn_copy_event")}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 🎯 Prominent Activity Management Card for Organizers */}
      {isCreator && (
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white">
              <h3 className="text-xl font-bold mb-1">📋 {t("activity_management")}</h3>
              <p className="text-sm text-blue-100">
                {t("activity_management_desc")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={openRegistrationPage}
                className="bg-white text-blue-600 hover:bg-blue-50 gap-2 shadow-md"
              >
                📝 {t("registration_page")}
              </Button>
              <Button
                onClick={openCheckInPage}
                className="bg-white text-indigo-600 hover:bg-indigo-50 gap-2 shadow-md"
              >
                ✅ {t("check_in_page")}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">{t("event_date")}</p>
            <p className="font-semibold text-slate-900">
              {formatDateDisplay(event.date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">{t("event_location")}</p>
            <p className="font-semibold text-slate-900">{event.location}</p>
          </div>
        </div>

        {event.scale && (
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t("event_scale")}</p>
              <p className="font-semibold text-slate-900">{event.scale} {t("people")}</p>
            </div>
          </div>
        )}

        {event.type && (
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Tag className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t("event_type")}</p>
              <p className="font-semibold text-slate-900">{event.type}</p>
            </div>
          </div>
        )}

        {event.organizer && (
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">{t("event_organizer")}</p>
              <p className="font-semibold text-slate-900">{event.organizer}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">{t("participants")}</p>
            <p className="font-semibold text-slate-900">
              {totalParticipants} {t("people")}
            </p>
          </div>
        </div>
      </div>

      {event.special_requirements && event.special_requirements.length > 0 && (
        <div className="mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
          <h4 className="font-semibold text-slate-900 mb-2">{t("event_requirements")}</h4>
          <div className="flex flex-wrap gap-2">
            {event.special_requirements.map((req, i) => (
              <Badge key={i} className="bg-indigo-100 text-indigo-700 border-indigo-200">
                {req}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {isCreator && participants.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <h4 className="font-semibold text-slate-900 mb-3">
            👥 {t("participant_list")} ({participants.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {participants.map((participant, i) => (
              <Badge key={i} variant="outline" className="border-blue-300 text-slate-700">
                {participant.user_name || participant.user_email}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
