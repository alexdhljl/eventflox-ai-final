import React, { useState, useEffect } from "react";
import { Registration, CheckIn } from "@/api/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, CheckCircle, Clock, TrendingUp, Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useLanguage } from "../LanguageProvider";

export default function RegistrationStats({ eventId, isCreator }) {
  const { t } = useLanguage();
  const [registrations, setRegistrations] = useState([]);
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [regsData, checkInsData] = await Promise.all([
        Registration.filter({ event_id: eventId }),
        CheckIn.filter({ event_id: eventId })
      ]);
      setRegistrations(regsData || []);
      setCheckIns(checkInsData || []);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
    setLoading(false);
  };

  const checkInRate = registrations.length > 0 
    ? ((checkIns.length / registrations.length) * 100).toFixed(1)
    : 0;

  const exportData = () => {
    const csv = [
      ["Name", "Email", "Phone", "Organization", "Registration Time", "Checked In", "Check-in Time"],
      ...registrations.map(reg => {
        const checkIn = checkIns.find(c => c.user_email === reg.user_email);
        return [
          reg.user_name,
          reg.user_email,
          reg.phone || "",
          reg.organization || "",
          format(new Date(reg.registration_time), "PPpp"),
          checkIn ? "Yes" : "No",
          checkIn ? format(new Date(checkIn.checkin_time), "PPpp") : ""
        ];
      })
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `event-${eventId}-registrations.csv`;
    a.click();
  };

  if (!isCreator) return null;

  return (
    <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t("stats_title")}
        </h2>
        <div className="flex gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={exportData}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            {t("export_csv")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Users className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-900">{registrations.length}</span>
          </div>
          <p className="text-sm font-medium text-blue-700">{t("total_registered")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-green-900">{checkIns.length}</span>
          </div>
          <p className="text-sm font-medium text-green-700">{t("total_checked_in")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-orange-900">
              {registrations.length - checkIns.length}
            </span>
          </div>
          <p className="text-sm font-medium text-orange-700">{t("not_checked_in")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-purple-900">{checkInRate}%</span>
          </div>
          <p className="text-sm font-medium text-purple-700">{t("checkin_rate")}</p>
        </motion.div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-slate-900 mb-3">{t("recent_registrations")}</h3>
        {registrations.length > 0 ? (
          <div className="max-h-64 overflow-y-auto space-y-2">
            {registrations.slice(0, 10).map((reg, index) => {
              const checkIn = checkIns.find(c => c.user_email === reg.user_email);
              return (
                <motion.div
                  key={reg.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{reg.user_name}</p>
                    <p className="text-sm text-slate-600">{reg.user_email}</p>
                    <p className="text-xs text-slate-500">
                      {t("registered_at")}: {format(new Date(reg.registration_time), "PPp")}
                    </p>
                  </div>
                  <div className="text-right">
                    {checkIn ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-semibold">{t("checked_in")}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">{t("not_checked_in")}</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">{t("no_registrations")}</p>
        )}
      </div>
    </Card>
  );
}