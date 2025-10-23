import React, { useState } from "react";
import { Task } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage } from "../LanguageProvider";

export default function TaskEditDialog({ task, open, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(task || {
    name: "",
    description: "",
    stage: "",
    priority: "",
    status: "",
    due_date: ""
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (task?.id) {
        await Task.update(task.id, formData);
      } else {
        await Task.create(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Save failed:", error);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("tasks_edit")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("task_name")} *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder={t("task_name")}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("task_description")}
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder={t("task_description")}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("task_assignee")} ({t("task_optional")})
              </label>
              <Input
                value={formData.assignee || ""}
                onChange={(e) => setFormData({...formData, assignee: e.target.value})}
                placeholder={t("task_assignee")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("task_due_date")}
              </label>
              <Input
                type="date"
                value={formData.due_date || ""}
                onChange={(e) => setFormData({...formData, due_date: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("task_stage")}
              </label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData({...formData, stage: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("task_stage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="筹备阶段">{t("stage_preparation")}</SelectItem>
                  <SelectItem value="执行阶段">{t("stage_execution")}</SelectItem>
                  <SelectItem value="复盘阶段">{t("stage_review")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t("task_priority")}
              </label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({...formData, priority: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("task_priority")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="低">{t("priority_low")}</SelectItem>
                  <SelectItem value="中">{t("priority_medium")}</SelectItem>
                  <SelectItem value="高">{t("priority_high")}</SelectItem>
                  <SelectItem value="紧急">{t("priority_urgent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("task_status")} *
            </label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({...formData, status: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("task_status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="待开始">{t("task_status_pending")}</SelectItem>
                <SelectItem value="进行中">{t("task_status_ongoing")}</SelectItem>
                <SelectItem value="已完成">{t("task_status_completed")}</SelectItem>
                <SelectItem value="延期">{t("task_status_delayed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              {t("btn_cancel")}
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name}>
              {t("btn_save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}