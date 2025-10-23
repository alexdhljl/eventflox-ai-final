import React, { useState } from "react";
import { Task, User } from "@/api/entities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutGrid, List, RefreshCw, Loader2 } from "lucide-react";
import TaskListView from "./TaskListView";
import TaskKanbanView from "./TaskKanbanView";
import TaskEditDialog from "./TaskEditDialog";
import TaskClaimDialog from "./TaskClaimDialog";
import TaskSubmitDialog from "./TaskSubmitDialog";
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
import { useLanguage } from "../LanguageProvider";

export default function TaskSection({ eventId, tasks, onRefresh, isCreator }) {
  const { t } = useLanguage();
  const [view, setView] = useState("kanban");
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [claimingTask, setClaimingTask] = useState(null);
  const [submittingTask, setSubmittingTask] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleDelete = async () => {
    if (!deletingTask) return;
    
    setDeleting(true);
    try {
      await Task.delete(deletingTask.id);
      onRefresh();
      setDeletingTask(null);
    } catch (error) {
      console.error("删除任务失败:", error);
      alert(t("tasks_delete_failed") || "Failed to delete task: " + error.message);
    }
    setDeleting(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const handleAddTask = () => {
    // Switch to list view and show form
    setView("list");
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      {/* View Switcher */}
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={setView} className="w-auto">
          <TabsList className="bg-white border border-slate-200">
            <TabsTrigger value="kanban" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              {t("view_kanban")}
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-2">
              <List className="w-4 h-4" />
              {t("view_list")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {t("btn_refresh")}
        </Button>
      </div>

      {/* Task Views */}
      {view === "kanban" ? (
        <TaskKanbanView
          tasks={tasks}
          onRefresh={onRefresh}
          onEdit={setEditingTask}
          onDelete={setDeletingTask}
          onClaim={setClaimingTask}
          onSubmit={setSubmittingTask}
          onAddTask={handleAddTask}
          isCreator={isCreator}
        />
      ) : (
        <TaskListView
          tasks={tasks}
          eventId={eventId}
          onRefresh={onRefresh}
          onEdit={setEditingTask}
          onDelete={setDeletingTask}
          onClaim={setClaimingTask}
          onSubmit={setSubmittingTask}
          showForm={showForm}
          setShowForm={setShowForm}
          isCreator={isCreator}
        />
      )}

      {/* Dialogs */}
      {editingTask && (
        <TaskEditDialog
          task={editingTask}
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSuccess={onRefresh}
        />
      )}

      {claimingTask && (
        <TaskClaimDialog
          task={claimingTask}
          open={!!claimingTask}
          onClose={() => setClaimingTask(null)}
          onSuccess={onRefresh}
        />
      )}

      {submittingTask && (
        <TaskSubmitDialog
          task={submittingTask}
          open={!!submittingTask}
          onClose={() => setSubmittingTask(null)}
          onSuccess={onRefresh}
        />
      )}

      <AlertDialog open={!!deletingTask} onOpenChange={() => setDeletingTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("tasks_delete_confirm_title") || "删除任务"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("tasks_delete_confirm_desc") || "确定要删除此任务吗？此操作无法撤销。"}
              {deletingTask && (
                <p className="mt-2 font-semibold text-slate-900">"{deletingTask.name}"</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("btn_cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("deleting") || "删除中..."}
                </>
              ) : (
                t("btn_delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}