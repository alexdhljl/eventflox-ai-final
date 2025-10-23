import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, TrendingUp, ExternalLink, CheckCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "../components/LanguageProvider";
import { format } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";

export default function Subscription() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const dateLocale = language === "zh" ? zhCN : enUS;
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await base44.auth.me();
      console.log("👤 [Subscription] Loaded user data:", userData);
      console.log("📊 [Subscription] Plan:", userData.plan_type, "| Limit:", userData.event_limit, "| Used:", userData.event_count);
      setUser(userData);
    } catch (error) {
      console.error("Failed to load user data:", error);
    }
    setLoading(false);
  };

  // Plan configuration with new pricing
  const planConfig = {
    free: {
      name: "Free",
      emoji: "💡",
      limit: 2,
      price: "$0",
      period: language === "zh" ? "永久免费" : "Forever Free",
      color: "from-slate-400 to-slate-500",
      features: [
        language === "zh" ? "所有核心功能" : "All core features",
        language === "zh" ? "AI活动生成" : "AI event generation",
        language === "zh" ? "二维码签到" : "QR code check-in",
        language === "zh" ? "双语支持" : "Bilingual support"
      ]
    },
    starter: {
      name: "Starter",
      emoji: "🚀",
      limit: 8,
      price: "$1.9",
      period: language === "zh" ? "每月" : "per month",
      color: "from-blue-500 to-indigo-600",
      features: [
        language === "zh" ? "所有核心功能" : "All core features",
        language === "zh" ? "AI活动生成" : "AI event generation",
        language === "zh" ? "二维码签到" : "QR code check-in",
        language === "zh" ? "双语支持" : "Bilingual support"
      ]
    },
    pro: {
      name: "Pro",
      emoji: "⭐",
      limit: 25,
      price: "$5.9",
      period: language === "zh" ? "每月" : "per month",
      color: "from-purple-500 to-pink-600",
      popular: true,
      features: [
        language === "zh" ? "所有核心功能" : "All core features",
        language === "zh" ? "AI活动生成" : "AI event generation",
        language === "zh" ? "二维码签到" : "QR code check-in",
        language === "zh" ? "双语支持" : "Bilingual support"
      ]
    },
    team: {
      name: "Team",
      emoji: "🏢",
      limit: 80,
      price: "$12.9",
      period: language === "zh" ? "每月" : "per month",
      color: "from-orange-500 to-red-600",
      features: [
        language === "zh" ? "所有核心功能" : "All core features",
        language === "zh" ? "AI活动生成" : "AI event generation",
        language === "zh" ? "二维码签到" : "QR code check-in",
        language === "zh" ? "双语支持" : "Bilingual support"
      ]
    }
  };

  const currentPlan = user?.plan_type || "free";
  const currentPlanConfig = planConfig[currentPlan];

  const handleUpgrade = (plan) => {
    // Redirect to external payment page
    window.open(`https://www.eventflox.com/#pricing`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const getPlanColor = (planType) => {
    return planConfig[planType]?.color || planConfig.free.color;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t("btn_back_dashboard")}
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              {language === "zh" ? "订阅管理" : "Subscription Management"}
            </h1>
          </div>
          <p className="text-slate-600">
            {language === "zh" ? "管理您的套餐和计费信息" : "Manage your plan and billing information"}
          </p>
        </motion.div>

        {/* Current Plan Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className={`bg-gradient-to-r ${getPlanColor(currentPlan)} text-white p-6 md:p-8 mb-8 shadow-xl`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{currentPlanConfig.emoji}</span>
                  <div>
                    <p className="text-sm font-medium opacity-90">
                      {language === "zh" ? "当前套餐" : "Current Plan"}
                    </p>
                    <h2 className="text-2xl md:text-3xl font-bold">{currentPlanConfig.name}</h2>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm opacity-90">{language === "zh" ? "活动使用" : "Events Used"}</p>
                    <p className="text-2xl font-bold">
                      {user?.event_count || 0} / {currentPlanConfig.limit}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm opacity-90">{language === "zh" ? "计费周期" : "Billing Cycle"}</p>
                    <p className="text-lg font-semibold">{currentPlanConfig.price} <span className="text-sm opacity-75">/ {currentPlanConfig.period}</span></p>
                  </div>
                </div>
              </div>

              {currentPlan !== "team" && (
                <Button
                  onClick={() => handleUpgrade()}
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-white/90 font-semibold"
                >
                  <TrendingUp className="w-5 h-5 mr-2" />
                  {language === "zh" ? "升级套餐" : "Upgrade Plan"}
                </Button>
              )}
            </div>

            {/* Billing Info */}
            {user?.payment_date && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="opacity-90 mb-1">{language === "zh" ? "上次支付" : "Last Payment"}</p>
                    <p className="font-semibold">
                      {format(new Date(user.payment_date), "PPP", { locale: dateLocale })}
                    </p>
                  </div>
                  {user?.next_reset_at && (
                    <div>
                      <p className="opacity-90 mb-1">{language === "zh" ? "下次重置" : "Next Reset"}</p>
                      <p className="font-semibold">
                        {format(new Date(user.next_reset_at), "PPP", { locale: dateLocale })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Plan Comparison */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            {language === "zh" ? "套餐对比" : "Plan Comparison"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(planConfig).map(([key, plan], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className={`p-6 h-full flex flex-col relative ${
                  key === currentPlan ? 'ring-2 ring-indigo-600 shadow-lg' : ''
                } ${plan.popular ? 'ring-2 ring-purple-500' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-500 text-white px-4 py-1">
                        {language === "zh" ? "最受欢迎" : "Most Popular"}
                      </Badge>
                    </div>
                  )}
                  {key === currentPlan && (
                    <Badge className="mb-3 w-fit bg-indigo-600">
                      {language === "zh" ? "当前套餐" : "Current Plan"}
                    </Badge>
                  )}

                  <div className="text-center mb-4">
                    <span className="text-5xl mb-3 block">{plan.emoji}</span>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                    <div className="mb-1">
                      <span className="text-4xl font-bold text-indigo-600">{plan.price}</span>
                    </div>
                    <p className="text-sm text-slate-500">{plan.period}</p>
                  </div>

                  {/* Event Limit Display */}
                  <div className="bg-indigo-50 rounded-xl p-4 mb-4 text-center">
                    <div className="text-5xl font-bold text-indigo-600 mb-1">{plan.limit}</div>
                    <p className="text-sm text-slate-600">
                      {language === "zh" ? "场活动/月" : "events/month"}
                    </p>
                  </div>

                  <div className="flex-1 space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {key === "free" ? (
                    <Button
                      disabled={key === currentPlan}
                      variant={key === currentPlan ? "secondary" : "outline"}
                      className="w-full"
                    >
                      {language === "zh" ? "立即开始" : "Get Started"}
                    </Button>
                  ) : key === currentPlan ? (
                    <Button disabled className="w-full" variant="secondary">
                      {language === "zh" ? "当前使用中" : "Current Plan"}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleUpgrade(key)}
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {language === "zh" ? `升级至 ${plan.name}` : `Upgrade to ${plan.name}`}
                    </Button>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-2">
                {language === "zh" ? "需要帮助？" : "Need Help?"}
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                {language === "zh" 
                  ? "查看完整的定价详情和常见问题，或联系我们的支持团队。" 
                  : "View complete pricing details and FAQs, or contact our support team."}
              </p>
              <Button
                onClick={() => window.open("https://www.eventflox.com/#pricing", "_blank")}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                {language === "zh" ? "查看完整定价" : "View Full Pricing"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}