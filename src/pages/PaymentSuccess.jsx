
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Sparkles, TrendingUp, Loader2, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useLanguage } from "../components/LanguageProvider";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const plan = urlParams.get("plan") || "pro";
  
  const [updating, setUpdating] = useState(true);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [newPlanInfo, setNewPlanInfo] = useState(null);

  const planConfig = {
    starter: {
      name: "Starter",
      emoji: "🚀",
      limit: 8,
      price: "$1.9",
      color: "from-blue-500 to-indigo-600"
    },
    pro: {
      name: "Pro",
      emoji: "⭐",
      limit: 25,
      price: "$5.9",
      color: "from-purple-500 to-pink-600"
    },
    team: {
      name: "Team",
      emoji: "🏢",
      limit: 80,
      price: "$12.9",
      color: "from-orange-500 to-red-600"
    }
  };

  useEffect(() => {
    updateUserPlan();
  }, [plan]);

  const updateUserPlan = async () => {
    setUpdating(true);
    try {
      console.log("🔄 [PaymentSuccess] Starting plan upgrade to:", plan);
      
      const nextReset = new Date();
      nextReset.setDate(nextReset.getDate() + 30);

      const planInfo = planConfig[plan.toLowerCase()] || planConfig.pro;

      console.log("📦 [PaymentSuccess] Plan info:", planInfo);

      // ✅ Step 1: Update user entity
      const updatedUser = await base44.auth.updateMe({
        plan_type: plan.toLowerCase(),
        event_limit: planInfo.limit,
        event_count: 0,
        last_payment_plan: plan.toLowerCase(),
        payment_date: new Date().toISOString(),
        next_reset_at: nextReset.toISOString()
      });

      console.log("✅ [PaymentSuccess] User plan updated:", updatedUser);
      
      // ✅ Step 2: Wait longer to ensure DB propagation
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds
      
      // ✅ Step 3: Force multiple cache refreshes
      for (let i = 0; i < 3; i++) {
        const freshUser = await base44.auth.me();
        console.log(`✅ [PaymentSuccess] Cache refresh ${i + 1}/3: Plan Type - ${freshUser.plan_type}, Event Limit - ${freshUser.event_limit}`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setNewPlanInfo(planInfo);
      setUpdateSuccess(true);
    } catch (error) {
      console.error("❌ [PaymentSuccess] Failed to update plan:", error);
      setError(error.message || "Failed to upgrade plan");
    } finally {
      setUpdating(false);
    }
  };

  const handleGoToDashboard = async () => {
    console.log("🏠 [PaymentSuccess] Navigating to Dashboard");
    // Force one more refresh before navigation
    await base44.auth.me();
    navigate(createPageUrl("Dashboard"));
  };

  const handleGoToCreateEvent = async () => {
    console.log("✨ [PaymentSuccess] Navigating to CreateEvent");
    // Force one more refresh before navigation
    await base44.auth.me();
    navigate(createPageUrl("CreateEvent"));
  };

  const handleGoToSubscription = async () => {
    console.log("👑 [PaymentSuccess] Navigating to Subscription");
    // Force one more refresh before navigation
    await base44.auth.me();
    navigate(createPageUrl("Subscription"));
  };

  if (updating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-green-50">
        <Card className="max-w-md w-full p-12 text-center">
          <Loader2 className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {language === "zh" ? "正在升级您的套餐..." : "Upgrading your plan..."}
          </h2>
          <p className="text-slate-600">
            {language === "zh" ? "请稍候，正在更新您的账户信息" : "Please wait while we update your account"}
          </p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {language === "zh" ? "升级失败" : "Upgrade Failed"}
          </h2>
          <p className="text-slate-600 mb-6">
            {error}
          </p>
          <Button onClick={handleGoToDashboard}>
            {language === "zh" ? "返回首页" : "Back to Dashboard"}
          </Button>
        </Card>
      </div>
    );
  }

  if (!updateSuccess || !newPlanInfo) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-green-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className={`bg-gradient-to-br ${newPlanInfo.color} text-white p-8 md:p-12 shadow-2xl mb-6`}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 md:w-16 md:h-16" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              {language === "zh" ? "🎉 支付成功！" : "🎉 Payment Successful!"}
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              {language === "zh" 
                ? `恭喜您升级到 ${newPlanInfo.name} 套餐！` 
                : `Congratulations on upgrading to ${newPlanInfo.name} plan!`}
            </p>
          </motion.div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 mb-8">
            <div className="text-center mb-6">
              <span className="text-5xl md:text-6xl mb-4 block">{newPlanInfo.emoji}</span>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{newPlanInfo.name} {language === "zh" ? "套餐" : "Plan"}</h2>
              <p className="text-lg md:text-2xl font-semibold opacity-90">{newPlanInfo.price} / {language === "zh" ? "月" : "month"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6 text-center">
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-sm opacity-75 mb-1">
                  {language === "zh" ? "每月活动数" : "Events per Month"}
                </p>
                <p className="text-3xl md:text-4xl font-bold">{newPlanInfo.limit}</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4">
                <p className="text-sm opacity-75 mb-1">
                  {language === "zh" ? "当前已用" : "Currently Used"}
                </p>
                <p className="text-3xl md:text-4xl font-bold">0</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleGoToCreateEvent}
              size="lg"
              className="w-full bg-white text-indigo-600 hover:bg-white/90 font-semibold text-base md:text-lg h-12 md:h-14"
            >
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 mr-2" />
              {language === "zh" ? "立即创建活动" : "Create Event Now"}
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleGoToDashboard}
                variant="outline"
                size="lg"
                className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold h-12"
              >
                <LayoutDashboard className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                {language === "zh" ? "活动面板" : "Dashboard"}
              </Button>
              
              <Button
                onClick={handleGoToSubscription}
                variant="outline"
                size="lg"
                className="border-2 border-white/30 text-white hover:bg-white/10 font-semibold h-12"
              >
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                {language === "zh" ? "订阅详情" : "Subscription"}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="bg-blue-50 border-blue-200 p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-2">
                {language === "zh" ? "✅ 升级成功确认" : "✅ Upgrade Confirmed"}
              </h3>
              <ul className="text-xs md:text-sm text-slate-700 space-y-1">
                <li>✓ {language === "zh" ? "套餐已更新" : "Plan updated successfully"}</li>
                <li>✓ {language === "zh" ? "活动配额已重置" : "Event quota reset"}</li>
                <li>✓ {language === "zh" ? "下次计费周期：30天后" : "Next billing: 30 days from now"}</li>
                <li>✓ {language === "zh" ? "账户状态已同步" : "Account status synced"}</li>
              </ul>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
