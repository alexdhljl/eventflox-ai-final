
import React, { useState } from "react";
import { Task, User } from "@/api/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle, Clock, AlertCircle, UserPlus, Upload, Loader2, Edit, Trash2, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../LanguageProvider";

const statusIcons = {
  "pending": <Clock className="w-4 h-4" />,
  "in_progress": <AlertCircle className="w-4 h-4" />,
  "completed": <CheckCircle className="w-4 h-4" />,
  "delayed": <AlertCircle className="w-4 h-4" />
};

const statusColors = {
  "pending": "bg-slate-100 text-slate-700",
  "in_progress": "bg-blue-100 text-blue-700",
  "completed": "bg-green-100 text-green-700",
  "delayed": "bg-red-100 text-red-700"
};

const statusMap = {
  "待开始": "pending",
  "进行中": "in_progress",
  "已完成": "completed",
  "延期": "delayed",
  "Pending": "pending",
  "In Progress": "in_progress",
  "Completed": "completed",
  "Delayed": "delayed"
};

const stageMap = {
  "筹备阶段": "preparation",
  "执行阶段": "execution",
  "复盘阶段": "review",
  "Preparation": "preparation",
  "Execution": "execution",
  "Review": "review"
};

const priorityMap = {
  "低": "low",
  "中": "medium",
  "高": "high",
  "紧急": "urgent",
  "Low": "low",
  "Medium": "medium",
  "High": "high",
  "Urgent": "urgent"
};

export default function TaskListView({
  tasks,
  eventId,
  onRefresh,
  onEdit,
  onDelete,
  onClaim,
  onSubmit,
  showForm,
  setShowForm,
  isCreator
}) {
  const { t } = useLanguage();
  const [creating, setCreating] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [newTask, setNewTask] = useState({
    name: "",
    description: "",
    due_date: "",
    stage: "preparation",
    priority: "medium",
    status: "pending" // Added status field with default pending
  });

  React.useEffect(() => {
    User.me().then(setCurrentUser).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!newTask.name.trim()) {
      alert(t("tasks_name_required") || "Please enter task name");
      return;
    }

    setCreating(true);
    try {
      await Task.create({
        ...newTask,
        event_id: eventId,
        // Removed status: "pending" as it's now part of newTask state
      });

      setNewTask({
        name: "",
        description: "",
        due_date: "",
        stage: "preparation",
        priority: "medium",
        status: "pending" // Reset status to default pending
      });
      setShowForm(false);
      onRefresh();
    } catch (error) {
      console.error("创建任务失败:", error);
      alert(t("tasks_create_failed") || "Failed to create task: " + error.message);
    }
    setCreating(false);
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await Task.update(taskId, { status: newStatus });
      onRefresh();
    } catch (error) {
      console.error("更新状态失败:", error);
    }
  };

  const canEditTask = (task) => {
    if (!currentUser) return false;
    if (isCreator) return true;
    return task.assignee_email === currentUser.email;
  };

  const canClaimTask = (task) => {
    // 任务未被认领时，任何人（包括组织者）都可以认领
    return !task.assignee_email;
  };

  const canUpdateStatus = (task) => {
    if (!currentUser) return false;
    // 组织者或任务负责人可以更新状态
    return isCreator || task.assignee_email === currentUser.email;
  };

  const normalizeTask = (task) => {
    return {
      ...task,
      status: statusMap[task.status] || task.status,
      stage: stageMap[task.stage] || task.stage,
      priority: priorityMap[task.priority] || task.priority
    };
  };

  const normalizedTasks = tasks.map(normalizeTask);

  const tasksByStage = {
    "preparation": normalizedTasks.filter(t => t.stage === "preparation"),
    "execution": normalizedTasks.filter(t => t.stage === "execution"),
    "review": normalizedTasks.filter(t => t.stage === "review")
  };

  return (
    <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900">
          {t("tasks_title")} ({tasks.length})
        </h2>
        {isCreator && (
          <Button
            onClick={() => setShowForm(!showForm)}
            size="sm"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            {t("tasks_add")}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showForm && isCreator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-slate-50 rounded-xl space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("tasks_name_label")} *
              </label>
              <Input
                placeholder={t("tasks_name_placeholder")}
                value={newTask.name}
                onChange={(e) => setNewTask({...newTask, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("tasks_description_label")}
              </label>
              <Textarea
                placeholder={t("tasks_description_placeholder")}
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t("tasks_due_date_label")}
                </label>
                <Input
                  type="date"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t("tasks_stage_label")}
                </label>
                <Select value={newTask.stage} onValueChange={(v) => setNewTask({...newTask, stage: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preparation">{t("stage_preparation")}</SelectItem>
                    <SelectItem value="execution">{t("stage_execution")}</SelectItem>
                    <SelectItem value="review">{t("stage_review")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t("tasks_priority_label")}
                </label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({...newTask, priority: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("priority_low")}</SelectItem>
                    <SelectItem value="medium">{t("priority_medium")}</SelectItem>
                    <SelectItem value="high">{t("priority_high")}</SelectItem>
                    <SelectItem value="urgent">{t("priority_urgent")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t("tasks_status_label")}
                </label>
                <Select value={newTask.status} onValueChange={(v) => setNewTask({...newTask, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t("task_status_pending")}</SelectItem>
                    <SelectItem value="in_progress">{t("task_status_ongoing")}</SelectItem>
                    <SelectItem value="completed">{t("task_status_completed")}</SelectItem>
                    <SelectItem value="delayed">{t("task_status_delayed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                className="flex-1"
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("creating")}
                  </>
                ) : (
                  t("tasks_create")
                )}
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline">
                {t("btn_cancel")}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tasks.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">{t("tasks_no_tasks") || "No tasks yet"}</h3>
          <p className="text-slate-600 mb-4">{t("tasks_add_first") || "Click the button above to add your first task"}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(tasksByStage).map(([stage, stageTasks]) => {
            const stageKey = `stage_${stage}`;
            return (
              <div key={stage}>
                <h3 className="font-semibold text-slate-900 mb-3">
                  {t(stageKey)} ({stageTasks.length})
                </h3>
                <div className="space-y-3">
                  {stageTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-white border border-slate-200 rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="font-semibold text-slate-900">{task.name}</h4>
                            <Badge className={statusColors[task.status]}>
                              {statusIcons[task.status]}
                              <span className="ml-1">{t(`task_status_${task.status}`)}</span>
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 text-sm text-slate-500 mb-3">
                            {task.assignee ? (
                              <span className="flex items-center gap-1">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white text-xs font-semibold">
                                  {task.assignee[0]}
                                </div>
                                {task.assignee}
                                {task.assignee_email === currentUser?.email && (
                                  <Badge variant="outline" className="ml-1 text-xs border-green-300 text-green-700">
                                    {t("you") || "You"}
                                  </Badge>
                                )}
                              </span>
                            ) : (
                              <span className="text-amber-600 font-medium">
                                🔓 {t("task_unclaimed") || "Unclaimed"}
                              </span>
                            )}
                            {task.due_date && <span>📅 {task.due_date}</span>}
                            <Badge variant="outline">{t(`task_priority_${task.priority}`)}</Badge>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {canClaimTask(task) && (
                              <Button
                                onClick={() => onClaim(task)}
                                size="sm"
                                variant="outline"
                                className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <UserPlus className="w-4 h-4" />
                                {t("tasks_claim")}
                              </Button>
                            )}
                            {task.assignee_email && !task.solution_text && task.assignee_email === currentUser?.email && (
                              <Button
                                onClick={() => onSubmit(task)}
                                size="sm"
                                className="gap-2 bg-green-600 hover:bg-green-700"
                              >
                                <Upload className="w-4 h-4" />
                                {t("tasks_submit")}
                              </Button>
                            )}
                            {task.solution_text && (
                              <div className="w-full mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm font-semibold text-green-800 mb-1">
                                  ✓ {t("solution_submitted") || "Solution submitted"}
                                </p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{task.solution_text}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          {canUpdateStatus(task) && (
                            <Select
                              value={task.status}
                              onValueChange={(v) => handleUpdateStatus(task.id, v)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">{t("task_status_pending")}</SelectItem>
                                <SelectItem value="in_progress">{t("task_status_ongoing")}</SelectItem>
                                <SelectItem value="completed">{t("task_status_completed")}</SelectItem>
                                <SelectItem value="delayed">{t("task_status_delayed")}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}

                          {isCreator && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(task)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  {t("btn_edit")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onDelete(task)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {t("btn_delete")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {stageTasks.length === 0 && (
                    <p className="text-center text-slate-400 py-4 text-sm">
                      {t("stage_no_tasks") || "No tasks in this stage"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
