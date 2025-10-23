import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Copy, Download, Check, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "./LanguageProvider";

export default function QRCodeDisplay({ eventId, eventTitle }) {
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrError, setQrError] = useState(false);
  const { t } = useLanguage();

  // 🎯 Use EventDetail page for organizer QR code
  const eventUrl = `${window.location.origin}${window.location.pathname.replace(/\/[^/]*$/, '/EventDetail')}?id=${eventId}`;
  
  // Multiple backup APIs
  const qrApis = [
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(eventUrl)}`,
    `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(eventUrl)}`,
    `https://api.qr-code-generator.com/v1/create?access-token=free&qr_code_text=${encodeURIComponent(eventUrl)}&image_format=PNG&image_width=300`
  ];

  const [currentApiIndex, setCurrentApiIndex] = useState(0);
  const qrCodeUrl = qrApis[currentApiIndex];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
      const textArea = document.createElement("textarea");
      textArea.value = eventUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${eventTitle}-OrganizerQR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(qrCodeUrl, '_blank');
    }
  };

  const handleImageError = () => {
    console.error(`QR API ${currentApiIndex + 1} failed, trying next...`);
    if (currentApiIndex < qrApis.length - 1) {
      setCurrentApiIndex(currentApiIndex + 1);
      setQrLoaded(false);
    } else {
      setQrError(true);
    }
  };

  const handleImageLoad = () => {
    setQrLoaded(true);
    setQrError(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <QrCode className="w-4 h-4" />
          {t("organizer_qr")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("organizer_qr")}</DialogTitle>
          <p className="text-sm text-slate-600 mt-2">
            ⚠️ {t("organizer_qr_note")}
          </p>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center items-center p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200 min-h-[312px]">
            {!qrLoaded && !qrError && (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-sm text-slate-500">
                  {t("qr_loading")}
                </p>
              </div>
            )}
            
            {qrError ? (
              <div className="flex flex-col items-center gap-3 text-center p-4">
                <AlertCircle className="w-12 h-12 text-orange-400" />
                <p className="text-sm text-slate-600">
                  {t("qr_error")}
                </p>
                <p className="text-xs text-slate-500">
                  {t("qr_error_hint")}
                </p>
              </div>
            ) : (
              <img
                src={qrCodeUrl}
                alt="Organizer QR Code"
                className={`rounded-lg w-64 h-64 ${qrLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                crossOrigin="anonymous"
              />
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 mb-2">
              🔗 {t("event_management_link") || "Event Management Link"}
            </p>
            <div className="flex gap-2">
              <input
                value={eventUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg"
                onClick={(e) => e.target.select()}
              />
              <Button
                onClick={handleCopy}
                variant="outline"
                size="icon"
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <Button 
            onClick={handleDownload} 
            className="w-full gap-2"
            disabled={qrError}
          >
            <Download className="w-4 h-4" />
            {t("qr_download")}
          </Button>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-800">
              💡 <strong>{t("organizer_qr_desc")}</strong>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}