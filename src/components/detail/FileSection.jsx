import React, { useState } from "react";
import { EventFile, User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Loader2, Image, FileIcon } from "lucide-react";
import { format } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { useLanguage } from "../LanguageProvider";

export default function FileSection({ eventId, files, onRefresh }) {
  const { language, t } = useLanguage();
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    User.me().then(setUser).catch(() => {});
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      await EventFile.create({
        event_id: eventId,
        file_url,
        file_name: file.name,
        file_type: file.type,
        uploader: user?.full_name || (language === "zh" ? "用户" : "User")
      });
      onRefresh();
    } catch (error) {
      console.error("上传失败:", error);
    }
    setUploading(false);
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith("image/")) return <Image className="w-8 h-8 text-blue-500" />;
    return <FileIcon className="w-8 h-8 text-slate-500" />;
  };

  const dateLocale = language === "zh" ? zhCN : enUS;

  return (
    <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {t("files_title")}
        </h2>
        <label>
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <Button
            as="span"
            disabled={uploading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("files_uploading")}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {t("files_upload")}
              </>
            )}
          </Button>
        </label>
      </div>

      <div className="space-y-3">
        {files.length > 0 ? (
          files.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {getFileIcon(file.file_type)}
                <div>
                  <p className="font-medium text-slate-900">{file.file_name}</p>
                  <p className="text-sm text-slate-500">
                    {file.uploader} • {file.created_date && format(new Date(file.created_date), "PPp", { locale: dateLocale })}
                  </p>
                </div>
              </div>
              <a href={file.file_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" title={t("btn_download")}>
                  <Download className="w-4 h-4" />
                </Button>
              </a>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500">{t("files_no_files")}</p>
          </div>
        )}
      </div>
    </Card>
  );
}