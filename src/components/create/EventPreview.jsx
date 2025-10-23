import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Tag, ArrowLeft, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../LanguageProvider";

const stageBadges = {
  "筹备阶段": "bg-blue-100 text-blue-700",
  "执行阶段": "bg-green-100 text-green-700",
  "复盘阶段": "bg-purple-100 text-purple-700",
  "Preparation": "bg-blue-100 text-blue-700",
  "Execution": "bg-green-100 text-green-700",
  "Review": "bg-purple-100 text-purple-700"
};

const priorityBadges = {
  "低": "bg-slate-100 text-slate-700",
  "中": "bg-yellow-100 text-yellow-700",
  "高": "bg-orange-100 text-orange-700",
  "紧急": "bg-red-100 text-red-700",
  "Low": "bg-slate-100 text-slate-700",
  "Medium": "bg-yellow-100 text-yellow-700",
  "High": "bg-orange-100 text-orange-700",
  "Urgent": "bg-red-100 text-red-700"
};

export default function EventPreview({ eventData, onConfirm, onBack }) {
  const { event, tasks } = eventData;
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

  const tasksByStage = {};
  tasks.forEach(task => {
    if (!tasksByStage[task.stage]) {
      tasksByStage[task.stage] = [];
    }
    tasksByStage[task.stage].push(task);
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-xl p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          {t("create_preview")}
        </h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">{event.title}</h3>
            <p className="text-slate-600">{event.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span>{formatDateDisplay(event.date)}</span>
              {event.time && <span className="text-slate-500">• {event.time}</span>}
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <MapPin className="w-5 h-5 text-blue-500" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Users className="w-5 h-5 text-blue-500" />
              <span>{event.scale} {t("people")}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Tag className="w-5 h-5 text-blue-500" />
              <span>{event.type}</span>
            </div>
          </div>

          {event.special_requirements && event.special_requirements.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">
                {language === "zh" ? "特殊需求" : "Special Requirements"}
              </h4>
              <div className="flex flex-wrap gap-2">
                {event.special_requirements.map((req, i) => (
                  <Badge key={i} variant="secondary" className="bg-indigo-100 text-indigo-700">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {language === "zh" ? `任务清单 (${tasks.length}项)` : `Task List (${tasks.length} items)`}
          </h3>
          
          <div className="space-y-4">
            {Object.entries(tasksByStage).map(([stage, stageTasks]) => (
              stageTasks.length > 0 && (
                <div key={stage}>
                  <Badge className={`${stageBadges[stage]} mb-3`}>{stage}</Badge>
                  <div className="space-y-2">
                    {stageTasks.map((task, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-slate-900">{task.name}</p>
                              {task.description && (
                                <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                              )}
                            </div>
                            <Badge className={`${priorityBadges[task.priority]} flex-shrink-0`}>
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("btn_back")}
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {t("create_confirm")}
        </Button>
      </div>
    </motion.div>
  );
}