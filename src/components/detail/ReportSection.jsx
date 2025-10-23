import React, { useState, useEffect } from "react";
import { Report, EventParticipant } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, FileText, Eye, AlertCircle, Download, TrendingUp, Users, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../LanguageProvider";
import { format } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";

export default function ReportSection({ event, tasks, messages, isCreator, existingReport, onReportGenerated }) {
  const { language, t } = useLanguage();
  const [report, setReport] = useState(existingReport);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expandedReport, setExpandedReport] = useState(false);
  const dateLocale = language === "zh" ? zhCN : enUS;

  useEffect(() => {
    if (existingReport) {
      setReport(existingReport);
    }
  }, [existingReport]);

  const analyzeTeamPerformance = (messages, tasks) => {
    // Analyze message activity
    const messageStats = {};
    messages.forEach(msg => {
      if (msg.author_email) {
        if (!messageStats[msg.author_email]) {
          messageStats[msg.author_email] = {
            name: msg.author_name,
            email: msg.author_email,
            message_count: 0
          };
        }
        messageStats[msg.author_email].message_count++;
      }
    });

    // Analyze task completion
    const taskStats = {};
    tasks.forEach(task => {
      if (task.assignee_email && task.status === "已完成" || task.status === "completed") {
        if (!taskStats[task.assignee_email]) {
          taskStats[task.assignee_email] = {
            name: task.assignee,
            email: task.assignee_email,
            completed_tasks: 0
          };
        }
        taskStats[task.assignee_email].completed_tasks++;
      }
    });

    const most_active_members = Object.values(messageStats)
      .sort((a, b) => b.message_count - a.message_count)
      .slice(0, 3);

    const top_task_performers = Object.values(taskStats)
      .sort((a, b) => b.completed_tasks - a.completed_tasks)
      .slice(0, 3);

    // Calculate engagement rate
    const totalParticipants = new Set([
      ...messages.map(m => m.author_email),
      ...tasks.filter(t => t.assignee_email).map(t => t.assignee_email)
    ]).size;

    return {
      most_active_members,
      top_task_performers,
      engagement_rate: totalParticipants
    };
  };

  const handleGenerate = async () => {
    setGenerating(true);
    
    try {
      const completedTasks = tasks.filter(t => 
        t.status === "已完成" || t.status === "completed"
      ).length;
      const totalTasks = tasks.length;
      const taskCompletion = totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(0) : 0;

      const delayedTasks = tasks.filter(t => t.status === "延期" || t.status === "delayed").length;
      const highPriorityTasks = tasks.filter(t => t.priority === "高" || t.priority === "紧急" || t.priority === "high" || t.priority === "urgent").length;

      // Get recent messages for analysis
      const messagesSummary = messages.slice(-30).map(m => 
        `[${m.author_name}]: ${m.content}`
      ).join("\n");

      // Analyze team performance
      const teamPerformance = analyzeTeamPerformance(messages, tasks);

      // Get participants count
      const participants = await EventParticipant.filter({ event_id: event.id });
      const participantCount = participants.length + 1; // +1 for organizer

      const prompt = language === "zh" ?
        `你是一个专业的活动复盘分析师。请根据以下活动信息和数据，生成一份详细的AI复盘报告。

**活动基本信息：**
- 名称：${event.title}
- 类型：${event.type}
- 规模：${event.scale}人（实际参与：${participantCount}人）
- 地点：${event.location}
- 描述：${event.description}

**任务执行情况：**
- 总任务数：${totalTasks}
- 已完成：${completedTasks}
- 完成率：${taskCompletion}%
- 延期任务：${delayedTasks}
- 高优先级任务：${highPriorityTasks}

**团队沟通情况：**
- 总消息数：${messages.length}
- 活跃成员数：${teamPerformance.engagement_rate}

**最近的团队沟通记录：**
${messagesSummary || "无沟通记录"}

**团队表现数据：**
最活跃成员：${teamPerformance.most_active_members.map(m => `${m.name}(${m.message_count}条消息)`).join(", ")}
任务完成最多：${teamPerformance.top_task_performers.map(m => `${m.name}(${m.completed_tasks}个任务)`).join(", ")}

请按照以下JSON格式返回分析结果：
{
  "summary": "活动整体总结（200-300字，客观全面）",
  "highlights": ["亮点1", "亮点2", "亮点3"],
  "issues": ["问题1", "问题2"],
  "suggestions": ["改进建议1", "改进建议2", "改进建议3"],
  "team_performance": {
    "most_active_members": ${JSON.stringify(teamPerformance.most_active_members)},
    "top_task_performers": ${JSON.stringify(teamPerformance.top_task_performers)},
    "engagement_rate": ${teamPerformance.engagement_rate}
  },
  "overall_score": 一个0-10的数字评分,
  "overall_summary": "综合总结（100-150字）"
}

**评分标准：**
- 任务完成率占40%
- 沟通频率占30%
- 团队参与度占20%
- 问题处理占10%

**要求：**
1. summary要包含活动目标达成情况、参与度、执行效率
2. highlights要具体，列出3-5个突出表现
3. issues要诚实，指出1-3个需要改进的问题
4. suggestions要可行，给出3-5条具体建议
5. overall_score要基于数据客观评分
6. overall_summary要简洁有力` :
        `You are a professional event review analyst. Generate a detailed AI recap report based on the following event data.

**Event Information:**
- Name: ${event.title}
- Type: ${event.type}
- Scale: ${event.scale} people (Actual: ${participantCount})
- Location: ${event.location}
- Description: ${event.description}

**Task Execution:**
- Total tasks: ${totalTasks}
- Completed: ${completedTasks}
- Completion rate: ${taskCompletion}%
- Delayed: ${delayedTasks}
- High priority: ${highPriorityTasks}

**Team Communication:**
- Total messages: ${messages.length}
- Active members: ${teamPerformance.engagement_rate}

**Recent Communication:**
${messagesSummary || "No communication records"}

**Team Performance:**
Most active: ${teamPerformance.most_active_members.map(m => `${m.name}(${m.message_count} messages)`).join(", ")}
Top performers: ${teamPerformance.top_task_performers.map(m => `${m.name}(${m.completed_tasks} tasks)`).join(", ")}

Return analysis in JSON format:
{
  "summary": "Overall event summary (200-300 words)",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"],
  "issues": ["Issue 1", "Issue 2"],
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "team_performance": {
    "most_active_members": ${JSON.stringify(teamPerformance.most_active_members)},
    "top_task_performers": ${JSON.stringify(teamPerformance.top_task_performers)},
    "engagement_rate": ${teamPerformance.engagement_rate}
  },
  "overall_score": A number between 0-10,
  "overall_summary": "Comprehensive summary (100-150 words)"
}

**Scoring Criteria:**
- Task completion: 40%
- Communication frequency: 30%
- Team engagement: 20%
- Issue handling: 10%`;

      const result = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            highlights: { type: "array", items: { type: "string" } },
            issues: { type: "array", items: { type: "string" } },
            suggestions: { type: "array", items: { type: "string" } },
            team_performance: {
              type: "object",
              properties: {
                most_active_members: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      email: { type: "string" },
                      message_count: { type: "number" }
                    }
                  }
                },
                top_task_performers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      email: { type: "string" },
                      completed_tasks: { type: "number" }
                    }
                  }
                },
                engagement_rate: { type: "number" }
              }
            },
            overall_score: { type: "number" },
            overall_summary: { type: "string" }
          }
        }
      });

      let createdReport;
      const reportData = {
        ...result,
        report_type: language === "zh" ? "自动生成" : "Auto-generated",
        generation_time: new Date().toISOString()
      };

      if (report) {
        createdReport = await Report.update(report.id, reportData);
      } else {
        createdReport = await Report.create({
          event_id: event.id,
          ...reportData
        });
      }

      setReport(createdReport);
      
      if (onReportGenerated) {
        onReportGenerated();
      }
      
    } catch (error) {
      console.error("生成失败:", error);
      alert((language === "zh" ? "生成失败：" : "Generation failed: ") + error.message);
    }
    
    setGenerating(false);
  };

  const handleExportPDF = () => {
    // Create a printable version
    const printWindow = window.open('', '', 'height=800,width=800');
    printWindow.document.write('<html><head><title>AI Recap Report</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
      body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
      h1 { color: #1e40af; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; }
      h2 { color: #374151; margin-top: 30px; }
      .score { font-size: 48px; font-weight: bold; color: #10b981; text-align: center; margin: 30px 0; }
      .section { margin: 20px 0; padding: 15px; background: #f9fafb; border-left: 4px solid #3b82f6; }
      .item { margin: 10px 0; padding-left: 20px; }
      .member { display: inline-block; margin: 5px 10px; padding: 5px 10px; background: #dbeafe; border-radius: 5px; }
    `);
    printWindow.document.write('</style></head><body>');
    
    printWindow.document.write(`<h1>📊 ${language === "zh" ? "AI 复盘报告" : "AI Recap Report"}</h1>`);
    printWindow.document.write(`<p><strong>${language === "zh" ? "活动名称" : "Event"}:</strong> ${event.title}</p>`);
    printWindow.document.write(`<p><strong>${language === "zh" ? "生成时间" : "Generated"}:</strong> ${format(new Date(report.generation_time || report.created_date), "PPpp", { locale: dateLocale })}</p>`);
    
    if (report.overall_score) {
      printWindow.document.write(`<div class="score">${report.overall_score.toFixed(1)} / 10</div>`);
    }
    
    if (report.overall_summary) {
      printWindow.document.write(`<div class="section"><h2>📋 ${language === "zh" ? "综合总结" : "Overall Summary"}</h2><p>${report.overall_summary}</p></div>`);
    }
    
    if (report.summary) {
      printWindow.document.write(`<div class="section"><h2>📝 ${language === "zh" ? "活动总结" : "Event Summary"}</h2><p>${report.summary}</p></div>`);
    }
    
    if (report.highlights && report.highlights.length > 0) {
      printWindow.document.write(`<div class="section"><h2>✨ ${language === "zh" ? "活动亮点" : "Highlights"}</h2>`);
      report.highlights.forEach(item => {
        printWindow.document.write(`<div class="item">✓ ${item}</div>`);
      });
      printWindow.document.write('</div>');
    }
    
    if (report.issues && report.issues.length > 0) {
      printWindow.document.write(`<div class="section"><h2>⚠️ ${language === "zh" ? "问题与不足" : "Issues"}</h2>`);
      report.issues.forEach(item => {
        printWindow.document.write(`<div class="item">• ${item}</div>`);
      });
      printWindow.document.write('</div>');
    }
    
    if (report.suggestions && report.suggestions.length > 0) {
      printWindow.document.write(`<div class="section"><h2>💡 ${language === "zh" ? "改进建议" : "Suggestions"}</h2>`);
      report.suggestions.forEach(item => {
        printWindow.document.write(`<div class="item">→ ${item}</div>`);
      });
      printWindow.document.write('</div>');
    }
    
    if (report.team_performance) {
      printWindow.document.write(`<div class="section"><h2>👥 ${language === "zh" ? "团队表现" : "Team Performance"}</h2>`);
      
      if (report.team_performance.most_active_members?.length > 0) {
        printWindow.document.write(`<p><strong>${language === "zh" ? "最活跃成员：" : "Most Active:"}</strong></p>`);
        report.team_performance.most_active_members.forEach(member => {
          printWindow.document.write(`<span class="member">${member.name} (${member.message_count} ${language === "zh" ? "条消息" : "messages"})</span>`);
        });
      }
      
      if (report.team_performance.top_task_performers?.length > 0) {
        printWindow.document.write(`<p style="margin-top: 15px;"><strong>${language === "zh" ? "任务完成最多：" : "Top Performers:"}</strong></p>`);
        report.team_performance.top_task_performers.forEach(member => {
          printWindow.document.write(`<span class="member">${member.name} (${member.completed_tasks} ${language === "zh" ? "个任务" : "tasks"})</span>`);
        });
      }
      
      printWindow.document.write('</div>');
    }
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg p-12">
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg p-12 text-center">
        <Sparkles className="w-16 h-16 mx-auto text-blue-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          {t("reports_generate")}
        </h3>
        <p className="text-slate-600 mb-6">
          {t("reports_ai_description")}
        </p>
        {isCreator ? (
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("reports_generating")}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {t("reports_generate")}
              </>
            )}
          </Button>
        ) : (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-sm text-slate-700">
              {language === "zh" 
                ? "复盘报告尚未生成，请等待活动组织者生成报告。" 
                : "The recap report has not been generated yet. Please wait for the organizer to generate it."}
            </p>
          </div>
        )}
      </Card>
    );
  }

  // Compact view
  if (!expandedReport) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              {language === "zh" ? "📊 AI复盘报告" : "📊 AI Recap Report"}
            </h3>
            <p className="text-sm text-slate-600">
              {language === "zh" ? "上次生成时间：" : "Last generated: "}
              {format(new Date(report.generation_time || report.created_date), "PPp", { locale: dateLocale })}
            </p>
          </div>
          <div className="flex gap-2">
            {isCreator && (
              <Button
                onClick={handleGenerate}
                variant="outline"
                size="sm"
                disabled={generating}
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {report.overall_score && (
            <div className="bg-white rounded-lg p-4 text-center border-2 border-green-200">
              <div className="text-4xl font-bold text-green-600 mb-1">
                {report.overall_score.toFixed(1)}
                <span className="text-xl text-slate-400"> / 10</span>
              </div>
              <p className="text-sm text-slate-600">
                {language === "zh" ? "综合评分" : "Overall Score"}
              </p>
            </div>
          )}

          {report.team_performance && (
            <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-slate-900">
                  {language === "zh" ? "团队表现" : "Team Performance"}
                </span>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                {report.team_performance.most_active_members?.[0] && (
                  <div>
                    <Award className="w-4 h-4 inline mr-1 text-yellow-500" />
                    {language === "zh" ? "最活跃：" : "Most active: "}
                    {report.team_performance.most_active_members[0].name}
                  </div>
                )}
                {report.team_performance.top_task_performers?.[0] && (
                  <div>
                    <Award className="w-4 h-4 inline mr-1 text-green-500" />
                    {language === "zh" ? "最高效：" : "Top performer: "}
                    {report.team_performance.top_task_performers[0].name}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {report.overall_summary && (
          <div className="bg-white rounded-lg p-4 mb-4 border-l-4 border-blue-500">
            <p className="text-slate-700 text-sm leading-relaxed">
              {report.overall_summary}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          {report.highlights && report.highlights.length > 0 && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-sm font-semibold text-green-800 mb-2">
                ✅ {language === "zh" ? "亮点" : "Highlights"}
              </div>
              <div className="text-xs text-slate-600">
                {report.highlights[0]?.substring(0, 50)}...
              </div>
            </div>
          )}

          {report.issues && report.issues.length > 0 && (
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <div className="text-sm font-semibold text-orange-800 mb-2">
                ⚠️ {language === "zh" ? "问题" : "Issues"}
              </div>
              <div className="text-xs text-slate-600">
                {report.issues[0]?.substring(0, 50)}...
              </div>
            </div>
          )}

          {report.suggestions && report.suggestions.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-sm font-semibold text-blue-800 mb-2">
                💡 {language === "zh" ? "建议" : "Suggestions"}
              </div>
              <div className="text-xs text-slate-600">
                {report.suggestions[0]?.substring(0, 50)}...
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={() => setExpandedReport(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {language === "zh" ? "查看完整报告" : "View Full Report"}
        </Button>
      </Card>
    );
  }

  // Full expanded view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              {language === "zh" ? "AI 复盘报告" : "AI Recap Report"}
            </h2>
            {!isCreator && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {language === "zh" ? "查看模式" : "View Mode"}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {isCreator && (
              <Button
                onClick={handleGenerate}
                variant="outline"
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("reports_regenerate")}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t("reports_regenerate")}
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={handleExportPDF}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              {language === "zh" ? "导出PDF" : "Export PDF"}
            </Button>
            <Button
              onClick={() => setExpandedReport(false)}
              variant="outline"
            >
              {language === "zh" ? "收起" : "Collapse"}
            </Button>
          </div>
        </div>

        <div className="text-sm text-slate-600 mb-6">
          {language === "zh" ? "生成时间：" : "Generated: "}
          {format(new Date(report.generation_time || report.created_date), "PPpp", { locale: dateLocale })}
        </div>

        {report.overall_score && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 mb-6 text-center border-2 border-green-200">
            <div className="text-6xl font-bold text-green-600 mb-2">
              {report.overall_score.toFixed(1)}
              <span className="text-2xl text-slate-400"> / 10</span>
            </div>
            <p className="text-lg font-semibold text-slate-700">
              {language === "zh" ? "综合评分" : "Overall Score"}
            </p>
          </div>
        )}

        {report.overall_summary && (
          <div className="mb-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              {language === "zh" ? "综合总结" : "Overall Summary"}
            </h3>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
              {report.overall_summary}
            </p>
          </div>
        )}

        <div className="space-y-6">
          {report.summary && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                📋 {t("reports_summary")}
              </h3>
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap p-4 bg-slate-50 rounded-xl">
                {report.summary}
              </p>
            </div>
          )}

          {report.highlights && report.highlights.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                ✨ {t("reports_highlights")}
              </h3>
              <div className="space-y-3">
                {report.highlights.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                    <span className="text-green-600 font-bold flex-shrink-0">{i + 1}</span>
                    <p className="text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.issues && report.issues.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                ⚠️ {t("reports_issues")}
              </h3>
              <div className="space-y-3">
                {report.issues.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <span className="text-orange-600 font-bold flex-shrink-0">{i + 1}</span>
                    <p className="text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.suggestions && report.suggestions.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3">
                💡 {t("reports_suggestions")}
              </h3>
              <div className="space-y-3">
                {report.suggestions.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}</span>
                    <p className="text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.team_performance && (
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {language === "zh" ? "团队表现分析" : "Team Performance Analysis"}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.team_performance.most_active_members?.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-yellow-600" />
                      <h4 className="font-semibold text-slate-900">
                        {language === "zh" ? "最活跃成员" : "Most Active Members"}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {report.team_performance.most_active_members.map((member, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏆</span>
                            <span className="font-medium text-slate-900">{member.name}</span>
                          </div>
                          <span className="text-sm text-slate-600">
                            {member.message_count} {language === "zh" ? "条消息" : "messages"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {report.team_performance.top_task_performers?.length > 0 && (
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-slate-900">
                        {language === "zh" ? "任务完成最多" : "Top Task Performers"}
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {report.team_performance.top_task_performers.map((member, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">⭐</span>
                            <span className="font-medium text-slate-900">{member.name}</span>
                          </div>
                          <span className="text-sm text-slate-600">
                            {member.completed_tasks} {language === "zh" ? "个任务" : "tasks"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {report.team_performance.engagement_rate !== undefined && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {language === "zh" ? "团队参与度" : "Team Engagement"}
                    </span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {report.team_performance.engagement_rate} {language === "zh" ? "人" : "members"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}