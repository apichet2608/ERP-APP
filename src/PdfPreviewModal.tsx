import React, { useEffect } from "react";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  blobUrl: string | null;
  filename: string;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  blobUrl,
  filename,
}) => {
  // สำคัญ: จัดการล้างหน่วยความจำเมื่อปิด Modal เพื่อไม่ให้ RAM เต็ม
  useEffect(() => {
    return () => {
      if (blobUrl) {
        window.URL.revokeObjectURL(blobUrl);
        console.log("Memory Cleaned: URL Revoked");
      }
    };
  }, [blobUrl, isOpen]);

  if (!isOpen || !blobUrl) return null;

  return (
    // Backdrop - ปรับ z-index ให้สูงที่สุด
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-2 md:p-6 transition-all">
      {/* Modal - ขยายขนาดเกือบเต็มจอจริงๆ */}
      <div className="bg-white w-[95vw] h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header - ส่วนควบคุม */}
        <div className="px-6 py-4 border-b bg-white flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-2xl shadow-inner">
              📄
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-slate-950 leading-tight">
                {filename}
              </h3>
              <p className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest font-mono">
                Live Preview Mode • Production Ready
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 active:scale-95 transition-all"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>

        {/* PDF Viewer - ยืดเต็มพื้นที่ */}
        <div className="flex-grow bg-slate-200 p-2 md:p-4">
          <iframe
            // #view=FitH: สั่งให้ PDF ขยายเต็มความกว้าง (Fit Horizontal)
            // #toolbar=1: แสดงแถบเครื่องมือของ PDF Viewer เพื่อให้คนใช้ขยาย/พิมพ์ได้เอง
            src={`${blobUrl}#view=FitH&toolbar=1`}
            className="w-full h-full rounded-lg border shadow-inner bg-white border-slate-300"
            title="PDF Preview"
            style={{ border: "none" }}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
