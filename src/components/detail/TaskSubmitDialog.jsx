import React, { useState } from "react";
import { Task } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { useLanguage } from "../LanguageProvider";

export default function TaskSubmitDialog({ task, open, onClose, onSuccess }) {
  const { t } = useLanguage();
  const [solutionText, setSolutionText] = useState(task?.solution_text || "");
  const [solutionFiles, setSolutionFiles] = useState(task?.solution_files || []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setSolutionFiles([...solutionFiles, {
        url: file_url,
        name: file.name
      }]);
    } catch (error) {
      console.error("上传失败:", error);
    }
    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index) => {
    setSolutionFiles(solutionFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!solutionText.trim()) {
      alert(t("solution_text_required") || "Please enter solution description");
      return;
    }

    setSubmitting(true);
    try {
      await Task.update(task.id, {
        solution_text: solutionText,
        solution_files: solutionFiles.map(f => f.url),
        status: "已完成",
        submitted_at: new Date().toISOString()
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("提交失败:", error);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("tasks_submit")}: {task?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("solution_text")} *
            </label>
            <Textarea
              value={solutionText}
              onChange={(e) => setSolutionText(e.target.value)}
              placeholder={t("solution_text_placeholder") || "描述您的解决方案..."}
              rows={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t("solution_files")}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("uploading")}...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {t("btn_upload")}
                </>
              )}
            </Button>

            {solutionFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                {solutionFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              {t("btn_cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !solutionText.trim()}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("submitting")}...
                </>
              ) : (
                t("btn_submit")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}