
import React, { useState, useEffect } from "react";
import { Event, Report } from "@/api/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "../components/LanguageProvider";

export default function Reports() {
  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const { language, t } = useLanguage();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [eventsData, reportsData] = await Promise.all([
      Event.list("-created_date"),
      Report.list("-created_date")
    ]);
    setEvents(eventsData);
    setReports(reportsData);
    setLoading(false);
  };

  const getEventById = (eventId) => {
    return events.find(e => e.id === eventId);
  };

  const dateLocale = language === "zh" ? zhCN : enUS;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e325d09d039fe429257d6b/3d44cb0f7_image.png" 
              alt="EventFloX AI"
              className="w-10 h-10 object-contain rounded-lg"
            />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t("reports_title")}
            </h1>
          </div>
          <p className="text-slate-600">
            {language === "zh" ? "查看所有活动的AI生成总结报告" : "View AI-generated summary reports for all events"}
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
        ) : reports.length > 0 ? (
          <div className="space-y-4 md:space-y-6">
            {reports.map((report, index) => {
              const event = getEventById(report.event_id);
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 md:gap-4 mb-4">
                      <div className="flex items-start gap-3 md:gap-4 flex-1">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 md:w-6 md:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-bold text-slate-900 mb-1 break-words">
                            {event?.title || (language === "zh" ? "未知活动" : "Unknown Event")}
                          </h3>
                          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-500">
                            <Calendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                            <span className="truncate">
                              {report.created_date && format(new Date(report.created_date), "PPP", { locale: dateLocale })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Link to={createPageUrl(`EventDetail?id=${report.event_id}`)}>
                        <Button variant="outline" size="sm" className="w-full md:w-auto">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {language === "zh" ? "查看活动" : "View Event"}
                        </Button>
                      </Link>
                    </div>

                    <div className="space-y-3 md:space-y-4">
                      {report.summary && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm md:text-base">
                            {t("reports_summary")}
                          </h4>
                          <p className="text-slate-600 whitespace-pre-wrap text-sm md:text-base">{report.summary}</p>
                        </div>
                      )}

                      {report.highlights && report.highlights.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm md:text-base">
                            ✨ {t("reports_highlights")}
                          </h4>
                          <ul className="space-y-2">
                            {report.highlights.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-600 text-sm md:text-base">
                                <span className="text-green-500 mt-1 flex-shrink-0">●</span>
                                <span className="break-words">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {report.issues && report.issues.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm md:text-base">
                            ⚠️ {t("reports_issues")}
                          </h4>
                          <ul className="space-y-2">
                            {report.issues.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-600 text-sm md:text-base">
                                <span className="text-orange-500 mt-1 flex-shrink-0">●</span>
                                <span className="break-words">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {report.suggestions && report.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-slate-900 mb-2 text-sm md:text-base">
                            💡 {t("reports_suggestions")}
                          </h4>
                          <ul className="space-y-2">
                            {report.suggestions.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-slate-600 text-sm md:text-base">
                                <span className="text-blue-500 mt-1 flex-shrink-0">●</span>
                                <span className="break-words">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg p-8 md:p-12 text-center">
            <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg md:text-xl font-semibold text-slate-900 mb-2">{t("reports_no_reports")}</h3>
            <p className="text-sm md:text-base text-slate-600">
              {language === "zh" ? "完成活动后生成AI复盘报告即可在此查看" : "Generate AI review reports after completing events to view them here"}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
