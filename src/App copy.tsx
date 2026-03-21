import React, { useState } from "react";
import PdfPreviewModal from "./PdfPreviewModal";

function PdfApp() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // ข้อมูลสมมติที่ตรงกับ PdfPayload ของ Backend (NestJS)
  const [config, setConfig] = useState({
    customerName: "Apichet Juntodum",
    filename: "Monthly_Invoice_Preview",
    itemCount: 50, // จำนวนรายการเพื่อทดสอบการล้นหน้า
  });

  const handlePreview = async () => {
    setIsLoading(true);
    const apiUrl = "http://localhost:3000/api/nest-pdf/pdf/generate"; // ตรวจสอบ URL อีกครั้ง!

    try {
      // 1. เตรียม Data (ไม่ส่ง HTML ก้อนใหญ่ไป แต่ส่ง Data ไปให้ Backend วาด)
      const mockItems = Array.from(
        { length: Number(config.itemCount) },
        (_, i) => ({
          name: `รายการสินค้าที่ ${i + 1}`,
          amount: Math.floor(Math.random() * 5000) + 100,
        }),
      );

      const payload = {
        customerName: config.customerName,
        items: mockItems,
        total: mockItems.reduce((sum, item) => sum + item.amount, 0),
        filename: config.filename,
      };

      // 2. เรียก API
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Server ตอบกลับด้วย Error หรือ Path ผิด (404)");
      }

      // 3. รับ Blob และสร้าง URL สำหรับ Preview
      const blob = await response.blob();
      if (blob.type !== "application/pdf") {
        throw new Error("ไฟล์ที่ได้รับไม่ใช่ PDF");
      }

      const url = window.URL.createObjectURL(blob);

      // 4. แสดงผล Modal
      setBlobUrl(url);
      setIsPreviewOpen(true);
    } catch (err: any) {
      console.error("Fetch Error:", err);
      alert(`ไม่สามารถโหลด Preview ได้: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100 flex flex-col md:flex-row items-center gap-10">
        <div className="flex-shrink-0 p-6 bg-indigo-50 rounded-2xl text-indigo-600 text-6xl shadow-inner">
          📊
        </div>

        <div className="flex-grow space-y-6">
          <header>
            <h1 className="text-3xl font-extrabold text-slate-950 mb-1">
              ระบบ Preview PDF
            </h1>
            <p className="text-slate-500 text-sm">
              ตรวจสอบความถูกต้องก่อนพิมพ์จริง
            </p>
          </header>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                ชื่อลูกค้า
              </label>
              <input
                name="customerName"
                value={config.customerName}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all"
                placeholder="กรอกชื่อลูกค้า..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                จำนวนรายการ (ทดสอบการล้นหน้า)
              </label>
              <input
                type="number"
                name="itemCount"
                value={config.itemCount}
                onChange={handleInputChange}
                min="1"
                max="1000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 text-sm transition-all"
              />
            </div>
          </div>

          <button
            onClick={handlePreview}
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-3
              ${
                isLoading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-100"
              }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                กำลังประมวลผล PDF...
              </>
            ) : (
              <>
                <span>🔍 Preview Monthly Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Component Modal */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        blobUrl={blobUrl}
        filename={`${config.filename}.pdf`}
      />
    </div>
  );
}

export default PdfApp;
