
import React, { useState, useEffect } from "react";
import { Event, Task, Report } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Loader2, Calendar, Copy, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

export default function CopyEvent() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const sourceEventId = urlParams.get("id");

  const [sourceEvent, setSourceEvent] = useState(null);
  const [sourceTasks, setSourceTasks] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newEventData, setNewEventData] = useState({
    title: "",
    date: "",
    time: "",
    location: ""
  });
  const [aiSuggestions, setAiSuggestions] = useState(null);

  useEffect(() => {
    if (sourceEventId) {
      loadSourceData();
    }
  }, [sourceEventId]);

  const loadSourceData = async () => {
    setLoading(true);
    try {
      const [eventData, tasksData, reportsData] = await Promise.all([
        Event.list().then(events => events.find(e => e.id === sourceEventId)),
        Task.filter({ event_id: sourceEventId }),
        Report.filter({ event_id: sourceEventId })
      ]);
      
      setSourceEvent(eventData);
      setSourceTasks(tasksData || []);
      setReport(reportsData?.[0] || null);
      
      setNewEventData({
        title: `${eventData.title}（第二期）`,
        date: "",
        time: eventData.time || "",
        location: eventData.location || ""
      });
    } catch (error) {
      console.error("加载失败:", error);
    }
    setLoading(false);
  };

  const handleGenerateSuggestions = async () => {
    setGenerating(true);
    
    try {
      const result = await InvokeLLM({
        prompt: `你是一个专业的活动策划顾问。根据上一次活动的复盘报告和执行情况，为下一次同类型活动提供优化建议。

上次活动信息：
- 名称：${sourceEvent.title}
- 类型：${sourceEvent.type}
- 规模：${sourceEvent.scale}人
- 地点：${sourceEvent.location}

${report ? `
复盘总结：
${report.summary}

亮点：
${report.highlights?.join('\n') || '无'}

问题：
${report.issues?.join('\n') || '无'}

改进建议：
${report.suggestions?.join('\n') || '无'}
` : ''}

任务完成情况：
- 总任务数：${sourceTasks.length}
- 已完成：${sourceTasks.filter(t => t.status === "已完成").length}

请提供以下优化建议（JSON格式）：
{
  "improvements": ["改进建议1", "改进建议2", "改进建议3"],
  "new_tasks": [
    {
      "name": "新增或优化的任务名称",
      "description": "任务描述",
      "stage": "筹备阶段/执行阶段/复盘阶段",
      "priority": "低/中/高/紧急",
      "reason": "为什么要添加这个任务"
    }
  ],
  "timeline_suggestions": "时间规划建议",
  "budget_optimization": "预算优化建议"
}`,
        response_json_schema: {
          type: "object",
          properties: {
            improvements: { type: "array", items: { type: "string" } },
            new_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  stage: { type: "string" },
                  priority: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            timeline_suggestions: { type: "string" },
            budget_optimization: { type: "string" }
          }
        }
      });

      setAiSuggestions(result);
    } catch (error) {
      console.error("生成建议失败:", error);
    }
    
    setGenerating(false);
  };

  const handleCreateEvent = async () => {
    setGenerating(true);
    
    try {
      const createdEvent = await Event.create({
        ...sourceEvent,
        ...newEventData,
        status: "筹备中",
        stage: "筹备阶段"
      });

      const tasksToCreate = sourceTasks.map(task => ({
        name: task.name,
        description: task.description,
        stage: task.stage,
        priority: task.priority,
        event_id: createdEvent.id,
        status: "待开始"
      }));

      if (aiSuggestions?.new_tasks) {
        tasksToCreate.push(...aiSuggestions.new_tasks.map(task => ({
          ...task,
          event_id: createdEvent.id,
          status: "待开始"
        })));
      }

      await Task.bulkCreate(tasksToCreate);

      navigate(createPageUrl(`EventDetail?id=${createdEvent.id}`));
    } catch (error) {
      console.error("创建失败:", error);
    }
    
    setGenerating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl(`EventDetail?id=${sourceEventId}`))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回活动详情
          </Button>

          <div className="flex items-center gap-4 mb-6">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68e325d09d039fe429257d6b/3d44cb0f7_image.png" 
              alt="EventFloX AI"
              className="w-14 h-14 object-contain rounded-lg"
            />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                复制并规划下次活动
              </h1>
              <p className="text-slate-600">基于上次经验，AI将帮您优化活动框架</p>
            </div>
          </div>
        </motion.div>

        <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg p-6">
          <h3 className="font-bold text-lg text-slate-900 mb-4">📋 原活动信息</h3>
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm text-slate-500">活动名称</p>
              <p className="font-semibold">{sourceEvent.title}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">活动类型</p>
              <p className="font-semibold">{sourceEvent.type}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">参与人数</p>
              <p className="font-semibold">{sourceEvent.scale}人</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">任务数量</p>
              <p className="font-semibold">{sourceTasks.length}个</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg p-6">
          <h3 className="font-bold text-lg text-slate-900 mb-4">🎯 新活动信息</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                活动名称
              </label>
              <Input
                value={newEventData.title}
                onChange={(e) => setNewEventData({...newEventData, title: e.target.value})}
                placeholder="输入新活动名称"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  活动日期
                </label>
                <Input
                  type="date"
                  value={newEventData.date}
                  onChange={(e) => setNewEventData({...newEventData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  活动时间
                </label>
                <Input
                  value={newEventData.time}
                  onChange={(e) => setNewEventData({...newEventData, time: e.target.value})}
                  placeholder="例如：下午2点"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                活动地点
              </label>
              <Input
                value={newEventData.location}
                onChange={(e) => setNewEventData({...newEventData, location: e.target.value})}
                placeholder="输入活动地点"
              />
            </div>
          </div>
        </Card>

        {!aiSuggestions ? (
          <Button
            onClick={handleGenerateSuggestions}
            disabled={generating}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-12"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                AI正在分析并生成优化建议...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                生成AI优化建议
              </>
            )}
          </Button>
        ) : (
          <>
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg p-6">
              <h3 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                AI优化建议
              </h3>

              {aiSuggestions.improvements && aiSuggestions.improvements.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-slate-900 mb-3">💡 整体优化建议</h4>
                  <ul className="space-y-2">
                    {aiSuggestions.improvements.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-700">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSuggestions.timeline_suggestions && (
                <div className="mb-6 p-4 bg-white rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">📅 时间规划建议</h4>
                  <p className="text-slate-700">{aiSuggestions.timeline_suggestions}</p>
                </div>
              )}

              {aiSuggestions.budget_optimization && (
                <div className="p-4 bg-white rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-2">💰 预算优化建议</h4>
                  <p className="text-slate-700">{aiSuggestions.budget_optimization}</p>
                </div>
              )}
            </Card>

            {aiSuggestions.new_tasks && aiSuggestions.new_tasks.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg p-6">
                <h3 className="font-bold text-lg text-slate-900 mb-4">✨ 建议新增的任务</h3>
                <div className="space-y-3">
                  {aiSuggestions.new_tasks.map((task, i) => (
                    <div key={i} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-slate-900">{task.name}</h4>
                        <span className="text-xs px-2 py-1 bg-green-200 text-green-800 rounded">
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                      <p className="text-xs text-slate-500 italic">💡 {task.reason}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => setAiSuggestions(null)}
                variant="outline"
                className="flex-1"
              >
                重新生成建议
              </Button>
              <Button
                onClick={handleCreateEvent}
                disabled={!newEventData.title || !newEventData.date || generating}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    确认创建新活动
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
