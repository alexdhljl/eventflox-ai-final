import React, { useState, useEffect } from "react";
import { Task, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserCircle2 } from "lucide-react";
import { useLanguage } from "../LanguageProvider";

export default function TaskClaimDialog({ task, open, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [claimNote, setClaimNote] = useState("");
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    User.me().then(setCurrentUser).catch(() => {});
  }, []);

  const handleClaim = async () => {
    if (!currentUser) return;
    
    setClaiming(true);
    try {
      await Task.update(task.id, {
        assignee: currentUser.full_name,
        assignee_email: currentUser.email,
        status: "进行中",
        claimed_at: new Date().toISOString()
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Claim failed:", error);
    }
    setClaiming(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle2 className="w-5 h-5" />
            {t("tasks_claim")}: {task?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-semibold text-slate-900 mb-2">
              {t("task_details")}
            </h4>
            <p className="text-sm text-slate-600 mb-2">{task?.description}</p>
            <div className="flex gap-4 text-xs text-slate-500">
              <span>{t("task_stage")}: {task?.stage}</span>
              <span>{t("task_priority")}: {task?.priority}</span>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              {t("claim_as")}:
            </h4>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {currentUser?.full_name?.[0] || "U"}
                </span>
              </div>
              <div>
                <p className="font-medium text-green-900">{currentUser?.full_name}</p>
                <p className="text-sm text-green-700">{currentUser?.email}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              💡 {t("claim_task_note")}
            </label>
            <Textarea
              value={claimNote}
              onChange={(e) => setClaimNote(e.target.value)}
              placeholder={t("claim_task_note")}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              {t("btn_cancel")}
            </Button>
            <Button onClick={handleClaim} disabled={claiming}>
              <UserCircle2 className="w-4 h-4 mr-2" />
              {t("confirm_claim")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}