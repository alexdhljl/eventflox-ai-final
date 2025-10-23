import React, { useState } from "react";
import { Message, User } from "@/api/entities";
import { InvokeLLM, UploadFile } from "@/api/integrations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, MessageCircle, Languages, Loader2, Paperclip, Image as ImageIcon, Video, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { zhCN, enUS } from "date-fns/locale";
import { motion } from "framer-motion";
import { useLanguage } from "../LanguageProvider";

export default function MessageSection({ eventId, messages, onRefresh }) {
  const { language, t } = useLanguage();
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState(null);
  const [translatingId, setTranslatingId] = useState(null);
  const [showTranslation, setShowTranslation] = useState({});
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    User.me().then(setUser).catch(() => {});
  }, []);

  const detectLanguage = (text) => {
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g);
    return chineseChars && chineseChars.length > text.length * 0.3 ? "zh" : "en";
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const { file_url } = await UploadFile({ file });
      setAttachedFiles([...attachedFiles, {
        url: file_url,
        name: file.name,
        type: file.type
      }]);
    } catch (error) {
      console.error("上传失败:", error);
    }
    setUploadingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!content.trim() && attachedFiles.length === 0) return;
    
    setSending(true);
    const lang = detectLanguage(content);
    
    try {
      if (attachedFiles.length > 0) {
        for (const file of attachedFiles) {
          await Message.create({
            event_id: eventId,
            content: file.url,
            author_name: user?.full_name || (language === "zh" ? "用户" : "User"),
            author_email: user?.email,
            message_type: language === "zh" ? "文件" : "File",
            language: lang,
            file_name: file.name,
            file_type: file.type
          });
        }
        setAttachedFiles([]);
      }
      
      if (content.trim()) {
        await Message.create({
          event_id: eventId,
          content: content.trim(),
          author_name: user?.full_name || (language === "zh" ? "用户" : "User"),
          author_email: user?.email,
          message_type: language === "zh" ? "文本" : "Text",
          language: lang
        });
        setContent("");
      }
      
      onRefresh();
    } catch (error) {
      console.error("发送失败:", error);
    }
    
    setSending(false);
  };

  const handleTranslate = async (message, targetLang) => {
    setTranslatingId(message.id);
    
    try {
      const translationField = targetLang === "zh" ? "translation_zh" : "translation_en";
      
      if (message[translationField]) {
        setShowTranslation({
          ...showTranslation,
          [message.id]: targetLang
        });
      } else {
        const result = await InvokeLLM({
          prompt: `Please translate the following text to ${targetLang === "zh" ? "Chinese" : "English"}. Only return the translation, no explanations:

${message.content}`,
        });

        const translation = typeof result === 'string' ? result : result.output || result.text || "";
        
        await Message.update(message.id, {
          [translationField]: translation
        });
        
        onRefresh();
        setShowTranslation({
          ...showTranslation,
          [message.id]: targetLang
        });
      }
    } catch (error) {
      console.error("翻译失败:", error);
    }
    
    setTranslatingId(null);
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    if (fileType?.startsWith("video/")) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const renderMessageContent = (msg) => {
    if (msg.message_type === "文件" || msg.message_type === "File") {
      const isImage = msg.file_type?.startsWith("image/");
      const isVideo = msg.file_type?.startsWith("video/");
      
      return (
        <div className="mt-2">
          {isImage && (
            <a href={msg.content} target="_blank" rel="noopener noreferrer">
              <img 
                src={msg.content} 
                alt={msg.file_name || t("messages_image")}
                className="max-w-xs rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
              />
            </a>
          )}
          {isVideo && (
            <video 
              controls 
              className="max-w-xs rounded-lg"
              src={msg.content}
            >
              {t("messages_video_not_supported")}
            </video>
          )}
          {!isImage && !isVideo && (
            <a 
              href={msg.content} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
            >
              {getFileIcon(msg.file_type)}
              <span className="text-sm text-slate-700">{msg.file_name || t("messages_file")}</span>
            </a>
          )}
        </div>
      );
    }
    
    return <p className="text-slate-700 whitespace-pre-wrap">{msg.content}</p>;
  };

  const dateLocale = language === "zh" ? zhCN : enUS;

  return (
    <Card className="bg-white/80 backdrop-blur-xl border-slate-200 shadow-lg p-6">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        {t("messages_title")}
      </h2>

      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-semibold">
                        {msg.author_name?.[0] || "U"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">{msg.author_name}</span>
                      {msg.language && (
                        <span className="ml-2 text-xs text-slate-500">
                          {msg.language === "zh" ? "🇨🇳" : "🇬🇧"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {msg.created_date && format(new Date(msg.created_date), "PPp", { locale: dateLocale })}
                    </span>
                    {(msg.message_type === "文本" || msg.message_type === "Text") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity gap-1"
                        onClick={() => {
                          const targetLang = msg.language === "zh" ? "en" : "zh";
                          handleTranslate(msg, targetLang);
                        }}
                        disabled={translatingId === msg.id}
                      >
                        {translatingId === msg.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Languages className="w-3 h-3" />
                        )}
                        <span className="text-xs">
                          {msg.language === "zh" ? "EN" : "中"}
                        </span>
                      </Button>
                    )}
                  </div>
                </div>
                
                {renderMessageContent(msg)}
                
                {(msg.message_type === "文本" || msg.message_type === "Text") && showTranslation[msg.id] && (
                  <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <Languages className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-800">
                        {showTranslation[msg.id] === "zh" ? t("messages_translation_zh") : t("messages_translation_en")}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap">
                      {showTranslation[msg.id] === "zh" ? msg.translation_zh : msg.translation_en}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500">{t("messages_no_messages")}</p>
          </div>
        )}
      </div>

      {attachedFiles.length > 0 && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg space-y-2">
          <p className="text-sm font-medium text-slate-700">{t("messages_pending_attachments")}</p>
          {attachedFiles.map((file, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border border-slate-200">
              {getFileIcon(file.type)}
              <span className="text-sm flex-1 truncate">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex gap-2">
          <Textarea
            placeholder={t("messages_placeholder")}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="resize-none flex-1"
            rows={3}
          />
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              disabled={uploadingFile}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingFile}
              title={t("messages_attach")}
            >
              {uploadingFile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
            </Button>
            <Button
              onClick={handleSend}
              disabled={(!content.trim() && attachedFiles.length === 0) || sending}
              size="icon"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              title={t("btn_send")}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center">
          {t("messages_tips")}
        </p>
      </div>
    </Card>
  );
}