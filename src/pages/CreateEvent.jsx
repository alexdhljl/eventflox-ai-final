
import React, { useState, useEffect } from "react";
import { Event, Task } from "@/api/entities";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2, CheckCircle, AlertCircle, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import EventPreview from "../components/create/EventPreview";
import { useLanguage } from "../components/LanguageProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function CreateEvent() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("input");
  const [eventData, setEventData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    // ✅ CRITICAL: Load fresh user data on mount
    loadFreshUserData();
  }, []); // Empty deps - only run on mount

  // ✅ ALSO: Reload when returning to this page
  useEffect(() => {
    const handleFocus = () => {
      console.log("🔄 [CreateEvent] Window focused - reloading user data");
      loadFreshUserData();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadFreshUserData = async () => {
    try {
      // Force cache refresh
      const user = await base44.auth.me();
      console.log("👤 [CreateEvent] Fresh user data loaded:", user);
      console.log("📊 [CreateEvent] Plan:", user.plan_type, "| Limit:", user.event_limit, "| Count:", user.event_count);
      setCurrentUser(user);
    } catch (error) {
      console.error("[CreateEvent] Failed to load user data:", error);
    }
  };

  // Simulate loading progress
  useEffect(() => {
    if (loading && step === "generating") {
      setLoadingProgress(0);
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [loading, step]);

  const checkEventLimit = () => {
    if (!currentUser) return false;
    
    const eventCount = currentUser.event_count || 0;
    const eventLimit = currentUser.event_limit || 2; // Default limit for free plan
    
    return eventCount >= eventLimit;
  };

  // ✅ ENHANCED: More robust date extraction
  const extractDateFromInput = (text) => {
    console.log("🔍 Extracting date from:", text);
    
    const monthMap = {
      jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
      jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
      january: 1, february: 2, march: 3, april: 4, june: 6,
      july: 7, august: 8, september: 9, october: 10, november: 11, december: 12
    };

    const patterns = [
      // 2026年1月1日 (Chinese)
      {
        regex: /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/,
        extract: (m) => ({ year: parseInt(m[1]), month: parseInt(m[2]), day: parseInt(m[3]) })
      },
      // 2026-01-01 (ISO-like)
      {
        regex: /(\d{4})-(\d{1,2})-(\d{1,2})/,
        extract: (m) => ({ year: parseInt(m[1]), month: parseInt(m[2]), day: parseInt(m[3]) })
      },
      // 2026/01/01 (Slash separated)
      {
        regex: /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
        extract: (m) => ({ year: parseInt(m[1]), month: parseInt(m[2]), day: parseInt(m[3]) })
      },
      // 1月1日 2026年 (Chinese, day-month-year)
      {
        regex: /(\d{1,2})\s*月\s*(\d{1,2})\s*日.*?(\d{4})\s*年/,
        extract: (m) => ({ year: parseInt(m[3]), month: parseInt(m[1]), day: parseInt(m[2]) })
      },
      // English: Month Day, Year (e.g., January 1, 2026)
      {
        regex: /(?:(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?))\s+(\d{1,2}),?\s+(\d{4})/i,
        extract: (m) => ({ year: parseInt(m[3]), month: monthMap[m[1].toLowerCase()], day: parseInt(m[2]) })
      },
      // English: Day Month Year (e.g., 1 January 2026)
      {
        regex: /(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i,
        extract: (m) => ({ year: parseInt(m[3]), month: monthMap[m[2].toLowerCase()], day: parseInt(m[1]) })
      }
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match) {
        const { year, month, day } = pattern.extract(match);
        
        console.log(`📅 Found potential date components: Year=${year}, Month=${month}, Day=${day} from match:`, match);
        
        // Basic validation of date components
        if (year && month && day && year >= 2024 && year <= 2030 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          // Construct a Date object to perform more robust validation (e.g., Feb 30)
          const testDate = new Date(year, month - 1, day);
          if (testDate.getFullYear() === year && testDate.getMonth() === month - 1 && testDate.getDate() === day) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            console.log("✅ Valid date extracted:", dateStr);
            return dateStr;
          } else {
            console.warn("⚠️ Date components form an invalid calendar date:", { year, month, day });
          }
        } else {
          console.warn("⚠️ Invalid date components (out of range):", { year, month, day });
        }
      }
    }
    
    console.log("❌ No valid date found in input");
    return null;
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;

    // Check event limit before generating
    if (checkEventLimit()) {
      setShowUpgradeDialog(true);
      return;
    }

    setLoading(true);
    setStep("generating");
    setLoadingProgress(0);

    try {
      // ✅ Extract user-specified date FIRST
      const userSpecifiedDate = extractDateFromInput(input);
      
      const today = new Date();
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const currentDay = today.getDate();
      const todayString = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
      
      console.log("=== DATE EXTRACTION RESULTS ===");
      console.log("📅 Today:", todayString);
      console.log("👤 User input:", input);
      console.log("🎯 Extracted date:", userSpecifiedDate || "None");
      console.log("===============================");
      
      const threeMonthsLater = new Date(today);
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
      const sixMonthsLater = new Date(today);
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
      
      const minDate = threeMonthsLater.toISOString().split('T')[0];
      const maxDate = sixMonthsLater.toISOString().split('T')[0];

      const prompt = language === "zh" ? 
        `你是专业的活动策划助手。根据用户描述生成活动方案。

**🔴 关键要求 - 请严格遵守：**
${userSpecifiedDate ? `
**用户明确指定了日期：${userSpecifiedDate}**
**你必须在 date 字段中使用这个日期：${userSpecifiedDate}**
**不要修改、不要调整、不要计算，直接使用：${userSpecifiedDate}**
` : `
- 今天是 ${todayString}
- 如果用户没有指定日期，使用 ${minDate} 到 ${maxDate} 之间的日期
`}

用户描述：${input}

JSON格式：
{
  "event": {
    "title": "活动名称",
    "date": "${userSpecifiedDate || 'YYYY-MM-DD'}",
    "time": "活动时间",
    "location": "活动地点",
    "type": "会议/聚会/培训/展览/演出/竞赛/其他",
    "scale": 人数,
    "description": "详细描述",
    "special_requirements": ["需求1", "需求2"],
    "organizer": "负责人",
    "budget": 预算金额
  },
  "tasks": [
    {
      "name": "任务名称",
      "description": "任务描述",
      "stage": "筹备阶段/执行阶段/复盘阶段",
      "priority": "低/中/高/紧急"
    }
  ]
}` :
        `You are a professional event planning assistant.

**🔴 CRITICAL REQUIREMENT:**
${userSpecifiedDate ? `
**User specified date: ${userSpecifiedDate}**
**You MUST use this exact date in the date field: ${userSpecifiedDate}**
**Do NOT modify, adjust, or calculate. Use exactly: ${userSpecifiedDate}**
` : `
- Today is ${todayString}
- If user didn't specify a date, use between ${minDate} and ${maxDate}
`}

User description: ${input}

JSON format:
{
  "event": {
    "title": "Event name",
    "date": "${userSpecifiedDate || 'YYYY-MM-DD'}",
    "time": "Event time",
    "location": "Location",
    "type": "Meeting/Party/Training/Exhibition/Performance/Competition/Other",
    "scale": number,
    "description": "Description",
    "special_requirements": ["req1", "req2"],
    "organizer": "Organizer",
    "budget": amount
  },
  "tasks": [
    {
      "name": "Task name",
      "description": "Task description",
      "stage": "Preparation/Execution/Review",
      "priority": "Low/Medium/High/Urgent"
    }
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            event: {
              type: "object",
              properties: {
                title: { type: "string" },
                date: { type: "string" },
                time: { type: "string" },
                location: { type: "string" },
                type: { type: "string" },
                scale: { type: "number" },
                description: { type: "string" },
                special_requirements: { type: "array", items: { type: "string" } },
                organizer: { type: "string" },
                budget: { type: "number" }
              }
            },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  stage: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        }
      });

      console.log("=== AI RESPONSE ===");
      console.log("🤖 AI generated date:", result.event.date);
      console.log("===================");

      // ✅ FORCE override with user-specified date if exists
      if (userSpecifiedDate) {
        console.log("🔒 FORCING user-specified date:", userSpecifiedDate);
        result.event.date = userSpecifiedDate;
      } else if (result.event.date) {
        // Validate AI-generated date only if user didn't specify
        const [year, month, day] = result.event.date.split('-').map(Number);
        const eventDate = new Date(year, month - 1, day); // Month is 0-indexed in Date constructor
        
        // Create today's date at midnight for fair comparison
        const todayAtMidnight = new Date(currentYear, currentMonth - 1, currentDay, 0, 0, 0);
        
        console.log("📊 Date comparison:", {
          eventDate: eventDate.toISOString(),
          todayDate: todayAtMidnight.toISOString(),
          isPast: eventDate < todayAtMidnight
        });
        
        if (eventDate < todayAtMidnight) {
          console.warn("⚠️ AI generated past date, correcting...");
          const futureDate = new Date(today); // Use `today` for reference
          futureDate.setMonth(futureDate.getMonth() + 3);
          result.event.date = futureDate.toISOString().split('T')[0];
          console.log("✅ Corrected date to:", result.event.date);
        } else {
          console.log("✅ AI generated date is valid (future date or today)");
        }
      }

      console.log("✅ Final event date:", result.event.date);

      setLoadingProgress(100);
      setEventData(result);
      
      // Small delay to show 100% completion
      setTimeout(() => {
        setStep("preview");
      }, 500);
    } catch (error) {
      console.error("生成失败:", error);
      alert((language === "zh" ? "生成失败: " : "Generation failed: ") + error.message);
      setStep("input");
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    // ✅ Double-check event limit with fresh data before creating
    const freshUser = await base44.auth.me();
    setCurrentUser(freshUser); // Update state immediately with fresh user data
    
    if (freshUser.event_count >= freshUser.event_limit) {
      setShowUpgradeDialog(true);
      setStep("preview"); // Important: go back to preview, don't proceed with 'creating' step
      return;
    }

    setStep("creating");
    
    try {
      const statusMap = {
        zh: "筹备中",
        en: "Preparing"
      };
      
      const stageMap = {
        zh: "筹备阶段",
        en: "Preparation"
      };

      const createdEvent = await Event.create({
        ...eventData.event,
        status: statusMap[language],
        stage: stageMap[language],
        allow_public_access: true,
        registration_enabled: true,
        checkin_enabled: true
      });

      const statusPendingMap = {
        zh: "待开始",
        en: "Pending"
      };

      const tasksToCreate = eventData.tasks.map(task => ({
        name: task.name,
        description: task.description,
        stage: task.stage,
        priority: task.priority,
        event_id: createdEvent.id,
        status: statusPendingMap[language]
      }));

      if (tasksToCreate.length > 0) {
        await Task.bulkCreate(tasksToCreate);
      }

      // ✅ Increment event count based on freshUser
      const updatedUser = await base44.auth.updateMe({
        event_count: (freshUser.event_count || 0) + 1
      });
      setCurrentUser(updatedUser); // Update local state
      console.log("✅ Event count updated:", updatedUser.event_count);

      setStep("success");
      
      setTimeout(() => {
        navigate(createPageUrl(`EventDetail?id=${createdEvent.id}`));
      }, 2000);
    } catch (error) {
      console.error("创建失败:", error);
      alert((language === "zh" ? "创建失败: " : "Creation failed: ") + error.message);
      setStep("preview"); // On error, go back to preview step
    }
  };

  const loadingMessages = language === "zh" ? [
    "AI 正在分析您的需求...",
    "正在提取活动关键信息...",
    "正在生成活动框架...",
    "正在规划任务清单...",
    "正在优化活动方案...",
    "即将完成..."
  ] : [
    "AI is analyzing your requirements...",
    "Extracting key event information...",
    "Generating event framework...",
    "Planning task list...",
    "Optimizing event plan...",
    "Almost done..."
  ];

  const currentMessage = loadingMessages[Math.min(Math.floor(loadingProgress / 16), loadingMessages.length - 1)];

  const getPlanBadge = () => {
    const planNames = {
      free: language === "zh" ? "免费版" : "Free",
      starter: "Starter",
      pro: "Pro",
      team: "Team"
    };
    return planNames[currentUser?.plan_type || "free"];
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e325d09d039fe429257d6b/3d44cb0f7_image.png" 
              alt="EventFloX AI"
              className="w-12 h-12 object-contain rounded-lg"
            />
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t("create_title")}
            </h1>
          </div>
          <p className="text-slate-600">{t("create_subtitle")}</p>
          
          {/* Plan Status Display */}
          {currentUser && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-full border border-purple-200">
              <Crown className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-semibold text-purple-900">
                {getPlanBadge()}
              </span>
              <span className="text-xs text-slate-600">
                {currentUser.event_count || 0} / {currentUser.event_limit || 2} {language === "zh" ? "活动" : "events"}
              </span>
            </div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-xl p-8 md:p-12">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-xl border border-blue-200">
                    <Sparkles className="w-8 h-8 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-2 text-lg">{t("create_example")}</h3>
                      <p className="text-sm text-slate-600 mb-3">
                        "{t("create_example_text")}"
                      </p>
                      <p className="text-xs text-slate-500">
                        {t("create_example_hint")}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      {t("create_input_label")}
                    </label>
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={t("create_input_placeholder")}
                      className="min-h-[250px] text-base resize-none text-lg"
                    />
                  </div>

                  <Button
                    onClick={handleGenerate}
                    disabled={!input.trim() || loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-14 text-lg"
                  >
                    <Sparkles className="w-6 h-6 mr-2" />
                    {t("create_generate")}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === "generating" && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Card className="bg-white/90 backdrop-blur-xl border-slate-200 shadow-2xl p-12 max-w-md w-full">
                {/* Animated Logo */}
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
                  }}
                  className="mx-auto mb-8 w-24 h-24 flex items-center justify-center"
                >
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e325d09d039fe429257d6b/3d44cb0f7_image.png" 
                    alt="EventFloX AI"
                    className="w-20 h-20 object-contain rounded-lg"
                  />
                </motion.div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      initial={{ width: "0%" }}
                      animate={{ width: `${loadingProgress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <div className="text-center mt-2 text-sm font-semibold text-indigo-600">
                    {Math.round(loadingProgress)}%
                  </div>
                </div>

                {/* Loading Message */}
                <motion.div
                  key={currentMessage}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {t("create_generating")}
                  </h3>
                  <p className="text-slate-600">
                    {currentMessage}
                  </p>
                </motion.div>

                {/* Floating Sparkles */}
                <div className="mt-8 flex justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        y: [-10, 10, -10],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    >
                      <Sparkles className="w-6 h-6 text-blue-500" />
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}

          {step === "preview" && eventData && (
            <EventPreview
              eventData={eventData}
              onConfirm={handleCreate}
              onBack={() => setStep("input")}
            />
          )}

          {step === "creating" && (
            <motion.div
              key="creating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <Loader2 className="w-20 h-20 text-blue-600 animate-spin mb-6" />
              <h3 className="text-2xl font-semibold text-slate-900 mb-2">
                {t("create_creating")}
              </h3>
              <p className="text-slate-600">
                {t("create_subtitle")}
              </p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center"
              >
                <CheckCircle className="w-16 h-16 text-green-600" />
              </motion.div>
              <h3 className="text-3xl font-bold text-slate-900 mb-2">
                {t("create_success")}
              </h3>
              <p className="text-slate-600 text-lg mb-4">
                {t("create_success_redirect")}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Upgrade Dialog */}
      <AlertDialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>
            <AlertDialogTitle className="text-center text-2xl">
              {language === "zh" ? "活动数量已达上限 🎟️" : "Event Limit Reached 🎟️"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-4">
              <p className="text-base">
                {language === "zh" 
                  ? "您当前的套餐已达到最大活动数量，请升级套餐以继续使用。" 
                  : "You've reached your event limit for this plan. Upgrade to unlock more events."}
              </p>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600">
                  {language === "zh" ? "当前套餐" : "Current Plan"}: <span className="font-bold text-purple-600">{getPlanBadge()}</span>
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  {language === "zh" ? "活动数量" : "Events"}: <span className="font-bold">{currentUser?.event_count || 0} / {currentUser?.event_limit || 2}</span>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">
              {language === "zh" ? "稍后再说" : "Later"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => window.open("https://www.eventflox.com/#pricing", "_blank")}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Crown className="w-4 h-4 mr-2" />
              {language === "zh" ? "升级套餐" : "Upgrade Plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
