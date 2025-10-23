import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Search, MoreVertical, User, Calendar, Plus, CheckCircle2, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../LanguageProvider";
import { User as UserEntity } from "@/api/entities";

export default function TaskKanbanView({ 
  tasks, 
  onRefresh, 
  onEdit, 
  onDelete, 
  onClaim,
  onSubmit,
  onAddTask,
  isCreator 
}) {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    UserEntity.me().then(setCurrentUser).catch(() => {});
  }, []);

  // Stage configuration with colors
  const stages = {
    "筹备阶段": {
      title: language === "zh" ? "筹备阶段" : "Preparation",
      color: "from-blue-400 to-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-700",
      cardBg: "bg-blue-50/50", // Lighter shade for cards
      cardBorder: "border-l-blue-400",
      cardHoverBg: "hover:bg-blue-100/50"
    },
    "执行阶段": {
      title: language === "zh" ? "执行阶段" : "Execution",
      color: "from-green-400 to-green-500",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      cardBg: "bg-green-50/50", // Lighter shade for cards
      cardBorder: "border-l-green-400",
      cardHoverBg: "hover:bg-green-100/50"
    },
    "复盘阶段": {
      title: language === "zh" ? "复盘阶段" : "Review",
      color: "from-purple-400 to-purple-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-700",
      cardBg: "bg-purple-50/50", // Lighter shade for cards
      cardBorder: "border-l-purple-400",
      cardHoverBg: "hover:bg-purple-100/50"
    }
  };

  const priorityColors = {
    "低": "bg-slate-100 text-slate-700",
    "中": "bg-yellow-100 text-yellow-700",
    "高": "bg-orange-100 text-orange-700",
    "紧急": "bg-red-100 text-red-700",
    "Low": "bg-slate-100 text-slate-700",
    "Medium": "bg-yellow-100 text-yellow-700",
    "High": "bg-orange-100 text-orange-700",
    "Urgent": "bg-red-100 text-red-700"
  };

  const statusColors = {
    "待开始": "bg-slate-200 text-slate-800",
    "进行中": "bg-blue-500 text-white",
    "已完成": "bg-slate-800 text-white",
    "延期": "bg-orange-500 text-white",
    "Pending": "bg-slate-200 text-slate-800",
    "In Progress": "bg-blue-500 text-white",
    "Completed": "bg-slate-800 text-white",
    "Delayed": "bg-orange-500 text-white"
  };

  const filteredTasks = tasks.filter(task =>
    task.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTasksByStage = (stage) => {
    return filteredTasks.filter(task => task.stage === stage);
  };

  const TaskCard = ({ task }) => {
    const isCompleted = 
      task.status === "已完成" || 
      task.status === "Completed" || 
      task.status === "completed";
    
    const hasAssignee = task.assignee && task.assignee_email;
    const isMyTask = currentUser && task.assignee_email === currentUser.email;

    // Get stage config for this task
    const stageConfig = stages[task.stage] || stages["筹备阶段"];

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
      >
        <Card className={`p-4 mb-3 transition-all cursor-pointer border-l-4 ${
          isCompleted 
            ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-l-slate-900 shadow-md' 
            : `${stageConfig.cardBg} ${stageConfig.cardBorder} ${stageConfig.cardHoverBg} shadow-sm hover:shadow-md`
        }`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              {isCompleted && (
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
              )}
              <h4 className={`font-semibold ${isCompleted ? 'text-white' : 'text-slate-900'}`}>
                {task.name}
              </h4>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-8 w-8 -mt-1 ${isCompleted ? 'text-white hover:bg-slate-600' : 'hover:bg-white/50'}`}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* 认领任务 - 未认领的任务才显示 */}
                {!hasAssignee && (
                  <DropdownMenuItem onClick={() => onClaim(task)}>
                    <User className="w-4 h-4 mr-2" />
                    {t("tasks_claim")}
                  </DropdownMenuItem>
                )}

                {/* 提交方案 - 已认领但未完成，且是我的任务 */}
                {hasAssignee && !isCompleted && isMyTask && (
                  <DropdownMenuItem onClick={() => onSubmit(task)}>
                    <FileText className="w-4 h-4 mr-2" />
                    {t("tasks_submit")}
                  </DropdownMenuItem>
                )}

                {/* 分隔线 */}
                {(isCreator || (!hasAssignee || (hasAssignee && !isCompleted && isMyTask))) && (
                  <DropdownMenuSeparator />
                )}

                {/* 编辑 - 仅创建者可见 */}
                {isCreator && (
                  <DropdownMenuItem onClick={() => onEdit(task)}>
                    {t("btn_edit")}
                  </DropdownMenuItem>
                )}

                {/* 删除 - 仅创建者可见 */}
                {isCreator && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(task)}
                    className="text-red-600"
                  >
                    {t("btn_delete")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && (
            <p className={`text-sm mb-3 line-clamp-2 ${isCompleted ? 'text-slate-300' : 'text-slate-600'}`}>
              {task.description}
            </p>
          )}

          {/* 显示已提交的方案 */}
          {task.solution_text && (
            <div className={`mb-3 p-3 rounded-lg border-l-4 ${
              isCompleted 
                ? 'bg-green-900/30 border-l-green-400' 
                : 'bg-green-50 border-l-green-500'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <FileText className={`w-4 h-4 ${isCompleted ? 'text-green-400' : 'text-green-700'}`} />
                <span className={`text-sm font-semibold ${isCompleted ? 'text-green-300' : 'text-green-900'}`}>
                  {t("solution_submitted") || "已提交方案"}
                </span>
              </div>
              <p className={`text-sm ${isCompleted ? 'text-slate-300' : 'text-slate-700'}`}>
                {task.solution_text}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={statusColors[task.status] || "bg-slate-200 text-slate-800"}>
              {task.status}
            </Badge>
            <Badge className={priorityColors[task.priority] || "bg-slate-100 text-slate-700"}>
              {task.priority}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            {hasAssignee ? (
              <div className={`flex items-center gap-2 ${isCompleted ? 'text-slate-300' : 'text-slate-600'}`}>
                <div className={`w-6 h-6 ${isCompleted ? 'bg-slate-500' : 'bg-blue-500'} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-xs font-semibold">
                    {task.assignee?.[0]?.toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{task.assignee}</span>
                {isMyTask && (
                  <Badge variant="outline" className={`text-xs ${isCompleted ? 'border-slate-400 text-slate-300' : 'border-blue-300 text-blue-700'}`}>
                    {t("you")}
                  </Badge>
                )}
              </div>
            ) : (
              <div className={`flex items-center gap-2 ${isCompleted ? 'text-orange-300' : 'text-orange-600'}`}>
                <User className="w-4 h-4" />
                <span className="font-medium">{t("task_unclaimed")}</span>
              </div>
            )}

            {task.due_date && (
              <div className={`flex items-center gap-1 ${isCompleted ? 'text-slate-400' : 'text-slate-500'}`}>
                <Calendar className="w-4 h-4" />
                <span className="text-xs">{task.due_date}</span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t("kanban_search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(stages).map(([stageKey, stageConfig]) => {
          const stageTasks = getTasksByStage(stageKey);
          
          return (
            <div key={stageKey} className="space-y-3">
              {/* Stage Header */}
              <div className={`bg-gradient-to-r ${stageConfig.color} rounded-lg p-4 shadow-md`}>
                <div className="flex items-center justify-between text-white">
                  <h3 className="font-bold text-lg">{stageConfig.title}</h3>
                  <Badge className="bg-white/30 text-white border-0">
                    {stageTasks.length}
                  </Badge>
                </div>
              </div>

              {/* Tasks Container */}
              <div className={`${stageConfig.bgColor} ${stageConfig.borderColor} border-2 rounded-lg p-3 min-h-[200px]`}>
                {stageTasks.length > 0 ? (
                  <div className="space-y-3">
                    {stageTasks.map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className={`w-16 h-16 ${stageConfig.bgColor} rounded-full flex items-center justify-center mb-3`}>
                      <span className="text-2xl">📋</span>
                    </div>
                    <p className={`text-sm ${stageConfig.textColor} font-medium`}>
                      {language === "zh" ? "暂无任务" : "No tasks yet"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Button (for creators) */}
      {isCreator && (
        <Button
          onClick={onAddTask}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          {t("tasks_add")}
        </Button>
      )}
    </div>
  );
}