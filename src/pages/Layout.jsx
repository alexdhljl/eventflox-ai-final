
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { LayoutDashboard, Sparkles, FileText, Menu, X, Globe, Crown } from "lucide-react";
import { User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { LanguageProvider, useLanguage } from "./components/LanguageProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function LayoutContent({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, switchLanguage, t } = useLanguage();

  useEffect(() => {
    User.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { title: t("nav_dashboard"), url: createPageUrl("Dashboard"), icon: LayoutDashboard },
    { title: t("nav_create"), url: createPageUrl("CreateEvent"), icon: Sparkles },
    { title: t("nav_reports"), url: createPageUrl("Reports"), icon: FileText },
  ];

  const currentPage = navItems.find(item => item.url === location.pathname);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e325d09d039fe429257d6b/3d44cb0f7_image.png" 
            alt="EventFloX AI Logo"
            className="w-8 h-8 object-contain rounded-lg"
          />
          <div>
            <h2 className="font-bold text-slate-900 text-sm">EventFloX AI</h2>
            <p className="text-xs text-slate-500">{currentPage?.title || t("nav_dashboard")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-slate-100">
                <Globe className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => switchLanguage("zh")}>
                <span className={language === "zh" ? "font-bold" : ""}>🇨🇳 {t("language_zh")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchLanguage("en")}>
                <span className={language === "en" ? "font-bold" : ""}>🇬🇧 {t("language_en")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-slate-200
        transform transition-transform duration-300 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col
      `}>
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e325d09d039fe429257d6b/3d44cb0f7_image.png" 
              alt="EventFloX AI Logo"
              className="w-10 h-10 object-contain rounded-lg"
            />
            <div>
              <h2 className="font-bold text-slate-900">EventFloX AI</h2>
              <p className="text-xs text-slate-500">
                {language === "zh" ? "智能活动管理" : "Smart Event Management"}
              </p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.title}
              to={item.url}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                location.pathname === item.url
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.title}</span>
            </Link>
          ))}

          {/* Subscription Link */}
          <Link
            to={createPageUrl("Subscription")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
              location.pathname === createPageUrl("Subscription")
                ? 'bg-blue-600 text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Crown className="w-5 h-5" />
            <span className="font-medium">
              {language === "zh" ? "订阅管理" : "Subscription"}
            </span>
          </Link>
        </nav>

        <div className="hidden md:block p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Globe className="w-4 h-4" />
                {language === "zh" ? "中文" : "English"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => switchLanguage("zh")}>
                <span className={language === "zh" ? "font-bold" : ""}>🇨🇳 {t("language_zh")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchLanguage("en")}>
                <span className={language === "en" ? "font-bold" : ""}>🇬🇧 {t("language_en")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.full_name?.[0] || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 text-sm truncate">
                {user?.full_name || t("loading")}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <LanguageProvider>
      <LayoutContent>{children}</LayoutContent>
    </LanguageProvider>
  );
}
