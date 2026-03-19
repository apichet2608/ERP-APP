import { useState } from "react";
import { Decimal } from "decimal.js";
import ThaiBaht from "thai-baht-text"; // npm i thai-baht-text

const mockProducts = [
  { id: "P001", name: "Software License", price: 15000 },
  { id: "P002", name: "Web Hosting (1 Year)", price: 3500 },
  { id: "P003", name: "IT Consultation (Hour)", price: 2000 },
  { id: "P004", name: "Hardware Repair Service", price: 1200 },
  { id: "P005", name: "Network Setup", price: 8000 },
];

const mockHistory = [
  {
    id: "INV-2026-001",
    date: "2026-03-01",
    type: "TAX_INVOICE",
    total: 28408,
    status: "PAID",
    customer: "บริษัท เอบีซี จำกัด",
  },
  {
    id: "INV-2026-002",
    date: "2026-03-15",
    type: "QUOTATION",
    total: 4500,
    status: "PENDING",
    customer: "นายสมชาย ใจดี",
  },
  {
    id: "INV-2026-003",
    date: "2026-03-18",
    type: "RECEIPT",
    total: 8500,
    status: "PAID",
    customer: "บริษัท ดีอีเอฟ จำกัด",
  },
];

const docTypeLabels: any = {
  QUOTATION: "ใบเสนอราคา",
  DELIVERY_NOTE: "ใบส่งของ",
  RECEIPT: "ใบเสร็จรับเงิน",
  TAX_INVOICE: "ใบกำกับภาษี",
};

const InvoiceDemo = () => {
  const [viewMode, setViewMode] = useState<"dashboard" | "invoice">(
    "dashboard",
  );
  // --- 📝 States ---
  const [docType, setDocType] = useState("TAX_INVOICE");
  const docTypeOptions = {
    QUOTATION: { th: "ใบเสนอราคา", en: "QUOTATION" },
    DELIVERY_NOTE: { th: "ใบส่งของ", en: "DELIVERY NOTE" },
    RECEIPT: { th: "ใบเสร็จรับเงิน", en: "RECEIPT" },
    TAX_INVOICE: { th: "ใบกำกับภาษี", en: "TAX INVOICE" },
  };

  const [invoiceMeta, setInvoiceMeta] = useState({
    invoiceNo: `INV-${new Date().getFullYear()}-001`,
    refPo: "",
    issueDate: new Date().toISOString().split("T")[0],
    creditDays: 30,
  });

  const [items, setItems] = useState([
    {
      id: 1,
      refNo: "XXXX-01",
      desc: "Software Development",
      qty: 1,
      price: 0,
      discType: "fixed",
      discValue: 0,
    },
    {
      id: 2,
      refNo: "XXXX-02",
      desc: "Hardware",
      qty: 1,
      price: 0,
      discType: "percent",
      discValue: 10,
    },
  ]);

  const [globalDiscount, setGlobalDiscount] = useState({
    type: "fixed",
    value: 0,
  } as any);
  const [taxConfig, setTaxConfig] = useState({ isVat: true, isWHT: false });

  // --- 📅 Date Calculation ---
  const calculateDueDate = (dateStr: string, days: number) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    date.setDate(date.getDate() + Number(days));
    return date.toISOString().split("T")[0];
  };
  const dueDate = calculateDueDate(
    invoiceMeta.issueDate,
    invoiceMeta.creditDays,
  );

  // --- 🧮 Calculation Logic with Decimal.js ---
  const calculatedItems = items.map((item) => {
    const qty = new Decimal(item.qty || 0);
    const price = new Decimal(item.price || 0);
    const discValue = new Decimal(item.discValue || 0);
    const rowGross = qty.times(price);

    let rowDiscount = new Decimal(0);
    if (item.discType === "percent") {
      rowDiscount = rowGross.times(discValue.dividedBy(100));
    } else {
      rowDiscount = discValue;
    }

    return {
      ...item,
      rowTotal: rowGross.minus(rowDiscount).greaterThan(0)
        ? rowGross.minus(rowDiscount)
        : new Decimal(0),
      rowDiscount,
    };
  });

  const totalAfterLineDiscounts = calculatedItems.reduce(
    (acc, item) => acc.plus(item.rowTotal),
    new Decimal(0),
  );

  let finalGlobalDiscount = new Decimal(0);
  const gDiscValue = new Decimal(globalDiscount.value || 0);
  if (globalDiscount.type === "percent") {
    finalGlobalDiscount = totalAfterLineDiscounts.times(
      gDiscValue.dividedBy(100),
    );
  } else {
    finalGlobalDiscount = gDiscValue;
  }

  const subTotal = totalAfterLineDiscounts
    .minus(finalGlobalDiscount)
    .greaterThan(0)
    ? totalAfterLineDiscounts.minus(finalGlobalDiscount)
    : new Decimal(0);

  const vatAmount = taxConfig.isVat
    ? subTotal.times(0.07).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    : new Decimal(0);
  const grandTotal = subTotal.plus(vatAmount);

  const whtAmount = taxConfig.isWHT
    ? subTotal.times(0.03).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    : new Decimal(0);
  const netPayable = grandTotal.minus(whtAmount);

  // --- 🖱️ Handlers ---
  const updateItem = (index: number, field: string, value: string) => {
    const newItems: any = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const updateMeta = (field: string, value: string) => {
    setInvoiceMeta({ ...invoiceMeta, [field]: value });
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  if (viewMode === "dashboard") {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              แดชบอร์ดประวัติเอกสาร
            </h1>
            <button
              onClick={() => setViewMode("invoice")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
            >
              + สร้างเอกสารใหม่
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
              <h3 className="text-gray-500 text-sm font-semibold mb-1">
                ยอดรวมทั้งหมด (เดือนนี้)
              </h3>
              <p className="text-2xl font-black text-gray-800">
                41,408{" "}
                <span className="text-sm font-normal text-gray-500">THB</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
              <h3 className="text-gray-500 text-sm font-semibold mb-1">
                ชำระแล้ว
              </h3>
              <p className="text-2xl font-black text-green-600">2 รายการ</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-orange-500">
              <h3 className="text-gray-500 text-sm font-semibold mb-1">
                รอชำระ
              </h3>
              <p className="text-2xl font-black text-orange-600">1 รายการ</p>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">
                ประวัติเอกสารล่าสุด
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <th className="py-3 px-6">เลขที่เอกสาร</th>
                    <th className="py-3 px-6">วันที่</th>
                    <th className="py-3 px-6">ลูกค้า</th>
                    <th className="py-3 px-6">ประเภท</th>
                    <th className="py-3 px-6 text-right">ยอดรวม</th>
                    <th className="py-3 px-6 text-center">สถานะ</th>
                    <th className="py-3 px-6 text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {mockHistory.map((doc, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-6 font-semibold text-blue-600">
                        {doc.id}
                      </td>
                      <td className="py-4 px-6 text-gray-600">{doc.date}</td>
                      <td className="py-4 px-6 text-gray-800">
                        {doc.customer}
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-xs font-semibold">
                          {docTypeLabels[doc.type] || doc.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-gray-800">
                        {doc.total.toLocaleString()} ฿
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`py-1 px-3 rounded-full text-xs font-semibold ${
                            doc.status === "PAID"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {doc.status === "PAID" ? "ชำระแล้ว" : "รอชำระ"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => setViewMode("invoice")}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="ดูรายละเอียด"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mx-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen font-sans text-gray-800 print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 10mm;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: white !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            border-top: 8px solid #2563eb !important; /* border-blue-600 */
          }
          input, textarea, select {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            appearance: none !important;
            -webkit-appearance: none !important;
            outline: none !important;
            resize: none !important;
            box-shadow: none !important;
          }
          input[type="date"]::-webkit-calendar-picker-indicator,
          input[type="date"]::-webkit-inner-spin-button {
            display: none !important;
            -webkit-appearance: none !important;
          }
          input::placeholder, textarea::placeholder {
            color: transparent !important;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          /* Print Page break rules */
          thead {
            display: table-header-group !important;
          }
          .avoid-break {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          /* Force Flex Layouts */
          .flex-print-row {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .flex-print-4 {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            width: 100% !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .flex-print-4 > div {
            width: 23% !important;
          }
          .w-print-1-2 {
            width: 48% !important;
          }
          /* Grid Fix for Header Info */
          .grid-print-2 {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
          }
          .nowrap-print {
            white-space: nowrap !important;
          }
          /* Table Column Widths */
          .col-code { width: 13% !important; }
          .col-desc { width: 33% !important; }
          .col-qty { width: 9% !important; }
          .col-price { width: 13% !important; }
          .col-disc { width: 15% !important; }
          .col-total { width: 17% !important; }
          
          /* Remove Scrollbars */
          .print-no-scroll {
            overflow: visible !important;
          }
          table {
            table-layout: fixed !important;
            width: 100% !important;
            border-collapse: collapse !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          td {
            padding-top: 4px !important;
            padding-bottom: 4px !important;
            font-size: 13px !important;
            word-break: break-word !important;
            vertical-align: top !important;
          }
          th {
            padding-top: 4px !important;
            padding-bottom: 4px !important;
            font-size: 13px !important;
            white-space: nowrap !important;
            vertical-align: middle !important;
          }
          
          /* Watermark Adjustments */
          .watermark-container-print {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            z-index: -1 !important;
            width: 100vw !important;
            height: 100vh !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
        }
      `}</style>

      {/* Action Bar */}
      <div className="max-w-5xl mx-auto flex justify-between items-center mb-4 print:hidden">
        <button
          onClick={() => setViewMode("dashboard")}
          className="text-gray-500 hover:text-gray-800 flex items-center gap-2 transition-colors text-sm font-semibold"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          กลับหน้าแดชบอร์ด
        </button>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-semibold shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 012 2h6a2 2 0 012-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
              clipRule="evenodd"
            />
          </svg>
          พิมพ์เอกสาร (PDF)
        </button>
      </div>

      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-5 md:p-10 border-t-8 border-blue-600 relative overflow-visible print-container">
        {/* Watermark */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10 overflow-hidden print:watermark-container-print">
          <span className="text-[4rem] sm:text-[6rem] md:text-[10rem] font-black text-gray-200 opacity-[0.1] -rotate-45 select-none whitespace-nowrap print:opacity-[0.05]">
            Apichet.J
          </span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between mb-10 border-b border-gray-100 pb-8 flex-print-row print:mb-4 print:pb-4">
          {/* ซ้าย: ข้อมูลเอกสาร */}
          <div className="w-full md:w-1/2 w-print-1-2">
            <div className="flex justify-between items-start mb-4 flex-print-row print:mb-2">
              <div className="flex flex-col">
                <div className="print:hidden">
                  <select
                    className="text-2xl md:text-3xl font-bold text-blue-600 tracking-tight bg-transparent border-0 border-b-2 border-dashed border-blue-200 focus:border-blue-500 focus:ring-0 cursor-pointer p-0 pr-8 outline-none hover:border-blue-400 transition-colors"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    {Object.entries(docTypeOptions).map(([key, val]) => (
                      <option
                        key={key}
                        value={key}
                        className="text-base text-gray-800"
                      >
                        {val.th} ({val.en})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="hidden print:block mb-2">
                  <h1 className="text-2xl font-bold text-blue-600 tracking-tight whitespace-nowrap">
                    {docTypeOptions[docType as keyof typeof docTypeOptions].th}
                  </h1>
                  <h2 className="text-lg font-bold text-blue-600 tracking-tight whitespace-nowrap mt-1">
                    {docTypeOptions[docType as keyof typeof docTypeOptions].en}
                  </h2>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm text-gray-700 print:space-y-1">
              <div className="flex items-center">
                <span className="w-28 font-semibold nowrap-print">
                  เลขที่เอกสาร:
                </span>
                <input
                  type="text"
                  className="border border-gray-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 w-full md:w-48 print:border-none print:p-0 print:font-bold"
                  value={invoiceMeta.invoiceNo}
                  onChange={(e) => updateMeta("invoiceNo", e.target.value)}
                />
              </div>
              <div className="flex items-center">
                <span className="w-28 font-semibold nowrap-print">
                  อ้างอิง (PO):
                </span>
                <input
                  type="text"
                  placeholder="เช่น PO-2026-001"
                  className="border border-gray-200 rounded p-1.5 focus:ring-1 focus:ring-blue-500 w-full md:w-48 bg-yellow-50 print:bg-transparent print:border-none print:p-0"
                  value={invoiceMeta.refPo}
                  onChange={(e) => updateMeta("refPo", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ขวา: ข้อมูลบริษัทและเครดิต */}
          <div className="w-full md:w-1/2 text-left md:text-right mt-6 md:mt-0 w-print-1-2 print:mt-0">
            <h2 className="font-bold text-base">
              บริษัท มนตรีอะไหล่แอร์ จำกัด สำนักงานใหญ่
            </h2>
            <p className="text-sm text-gray-500 mb-4 print:mb-1">
              เลขประจำตัวผู้เสียภาษี: 1-2345-67890-12-3
            </p>
            <p className="text-sm text-gray-500 mb-4">
              77/1 หมู่ที่ ตำบลจำปา อำเภอท่าเรือ จังหวัดพระนครศรีอยุธยา 13130
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100 inline-block text-left w-full md:max-w-sm ml-auto print:bg-transparent print:border-none print:p-0 grid-print-2">
              <div className="text-gray-500 flex items-center nowrap-print">
                วันที่ออกเอกสาร:
              </div>
              <div className="nowrap-print">
                <input
                  type="date"
                  className="border border-gray-200 rounded p-1 w-full print:border-none print:p-0"
                  value={invoiceMeta.issueDate}
                  onChange={(e) => updateMeta("issueDate", e.target.value)}
                />
              </div>
              <div className="text-gray-500 flex items-center nowrap-print">
                เครดิต (วัน):
              </div>
              <div className="nowrap-print">
                <input
                  type="number"
                  className="border border-gray-200 rounded p-1 w-full print:border-none print:p-0"
                  value={invoiceMeta.creditDays}
                  onChange={(e) => updateMeta("creditDays", e.target.value)}
                />
              </div>
              <div className="text-gray-500 flex items-center font-semibold nowrap-print">
                วันครบกำหนด:
              </div>
              <div className="p-1 font-bold text-blue-600 nowrap-print">
                {dueDate || "-"}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4 mb-6 print:hidden">
          {calculatedItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative shadow-sm"
            >
              <button
                onClick={() => removeItem(idx)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1"
                title="ลบรายการ"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    รหัสสินค้า
                  </label>
                  <input
                    type="text"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="รหัส..."
                    value={item.refNo}
                    onChange={(e) => updateItem(idx, "refNo", e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    รายละเอียดสินค้า
                  </label>
                  <textarea
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    rows={1}
                    placeholder="ชื่อรายการ..."
                    value={item.desc}
                    onChange={(e) => updateItem(idx, "desc", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    จำนวน
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-center font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={item.qty}
                    onChange={(e) => updateItem(idx, "qty", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    ราคา/หน่วย
                  </label>
                  <input
                    type="number"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-right font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={item.price}
                    onChange={(e) => updateItem(idx, "price", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-dashed border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <input
                      type="number"
                      className="w-20 p-2 text-right text-red-500 font-bold focus:outline-none"
                      value={item.discValue}
                      onChange={(e) =>
                        updateItem(idx, "discValue", e.target.value)
                      }
                    />
                    <select
                      className="bg-gray-100 px-2 py-2 text-xs font-bold border-l border-gray-200 outline-none"
                      value={item.discType}
                      onChange={(e) =>
                        updateItem(idx, "discType", e.target.value)
                      }
                    >
                      <option value="fixed">฿</option>
                      <option value="percent">%</option>
                    </select>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    รวมเงิน
                  </span>
                  <span className="text-lg font-black text-blue-600">
                    {item.rowTotal
                      .toNumber()
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Table Section (Desktop/Tablet) */}
        <div className="hidden md:block overflow-x-auto mb-6 print:block print:overflow-visible print-no-scroll">
          <table className="w-full text-left min-w-[800px] print:min-w-0">
            <thead>
              <tr className="border-b-2 border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-2 w-32 col-code">รหัสสินค้า</th>
                <th className="py-3 px-2 col-desc">รายละเอียด</th>
                <th className="py-3 px-2 w-20 text-center col-qty">จำนวน</th>
                <th className="py-3 px-2 w-28 text-right col-price">
                  ราคา/หน่วย
                </th>
                <th className="py-3 px-2 w-48 text-center col-disc">
                  ส่วนลดสินค้า
                </th>
                <th className="py-3 px-2 w-32 text-right col-total">รวมเงิน</th>
                <th className="py-3 px-2 w-10 no-print"></th>
              </tr>
            </thead>
            <tbody>
              {calculatedItems.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50 group">
                  <td className="py-4 px-2 col-code align-top">
                    <input
                      className="w-full bg-transparent focus:ring-0 print:hidden"
                      placeholder="รหัส..."
                      value={item.refNo}
                      onChange={(e) => updateItem(idx, "refNo", e.target.value)}
                    />
                    <div className="hidden print:block font-semibold break-words">
                      {item.refNo}
                    </div>
                  </td>
                  <td className="py-4 px-2 col-desc align-top">
                    <textarea
                      className="w-full bg-transparent focus:ring-0 print:hidden resize-none overflow-hidden block"
                      rows={1}
                      placeholder="ชื่อรายการ..."
                      value={item.desc}
                      onChange={(e) => {
                        e.target.style.height = "inherit";
                        e.target.style.height = `${e.target.scrollHeight}px`;
                        updateItem(idx, "desc", e.target.value);
                      }}
                    />
                    <div className="hidden print:block whitespace-pre-wrap break-words">
                      {item.desc}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-center col-qty align-top">
                    <input
                      type="number"
                      className="w-16 border rounded p-1 text-center print:hidden"
                      value={item.qty}
                      onChange={(e) => updateItem(idx, "qty", e.target.value)}
                    />
                    <div className="hidden print:block">{item.qty}</div>
                  </td>
                  <td className="py-4 px-2 text-right col-price align-top">
                    <input
                      type="number"
                      className="w-24 border rounded p-1 text-right print:hidden"
                      value={item.price}
                      onChange={(e) => updateItem(idx, "price", e.target.value)}
                    />
                    <div className="hidden print:block">{item.price}</div>
                  </td>
                  <td className="py-4 px-2 col-disc align-top">
                    <div className="flex items-center space-x-1 justify-center print:hidden">
                      <input
                        type="number"
                        className="w-20 border rounded p-1 text-right text-red-500"
                        value={item.discValue}
                        onChange={(e) =>
                          updateItem(idx, "discValue", e.target.value)
                        }
                      />
                      <select
                        className="text-xs border rounded p-1"
                        value={item.discType}
                        onChange={(e) =>
                          updateItem(idx, "discType", e.target.value)
                        }
                      >
                        <option value="fixed">฿</option>
                        <option value="percent">%</option>
                      </select>
                    </div>
                    <div className="hidden print:block text-center text-gray-800">
                      {item.discValue > 0
                        ? `${item.discValue} ${item.discType === "fixed" ? "฿" : "%"}`
                        : "-"}
                    </div>
                  </td>
                  <td className="py-4 px-2 text-right font-semibold col-total align-top">
                    {item.rowTotal
                      .toNumber()
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 px-2 text-right no-print align-top">
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity print:hidden no-print"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-4 mb-10 print:hidden text-sm font-bold">
          <button
            onClick={() =>
              setItems([
                ...items,
                {
                  id: Date.now(),
                  refNo: "",
                  desc: "",
                  qty: 1,
                  price: 0,
                  discType: "fixed",
                  discValue: 0,
                },
              ])
            }
            className="text-blue-600"
          >
            + เพิ่มรายการเปล่า
          </button>

          <div className="relative group">
            <button className="text-green-600 flex items-center gap-1">
              + เลือกสินค้าจาก Catalog
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
                รายการสินค้าจำลอง
              </div>
              <div className="max-h-64 overflow-y-auto">
                {mockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer text-gray-800 font-normal transition-colors"
                    onClick={() =>
                      setItems([
                        ...items,
                        {
                          id: Date.now(),
                          refNo: p.id,
                          desc: p.name,
                          qty: 1,
                          price: p.price,
                          discType: "fixed",
                          discValue: 0,
                        },
                      ])
                    }
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-sm">{p.name}</span>
                      <span className="text-blue-600 font-bold text-sm">
                        {p.price.toLocaleString()} ฿
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">รหัส: {p.id}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="flex flex-col md:flex-row justify-between border-t border-gray-200 pt-6 flex-print-row items-end print:pt-4 avoid-break">
          {/* ซ้าย: แสดงตัวอักษรภาษาไทย */}
          <div className="w-full md:w-1/2 mb-6 md:mb-0 pr-0 md:pr-8 flex flex-col justify-end w-print-1-2 h-full print:mb-0">
            <div className="bg-blue-50 text-blue-800 text-center p-4 rounded-lg font-semibold shadow-inner border border-blue-100 print:p-2 print:text-sm">
              {netPayable.greaterThan(0)
                ? `( ${ThaiBaht(netPayable.toNumber())} )`
                : "( ศูนย์บาทถ้วน )"}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              * ตัวอักษรแปลงจากยอด Net Paid อัตโนมัติ
            </p>
          </div>

          {/* ขวา: การคำนวณเงิน */}
          <div className="w-full md:w-80 space-y-4 print:w-80 print:ml-auto">
            <div className="flex justify-between text-gray-500 flex-print-row">
              <span>รวมเงิน (Gross)</span>
              <span>
                {totalAfterLineDiscounts
                  .toNumber()
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Global Discount */}
            <div className="flex justify-between items-center bg-red-50 p-2 rounded-md border border-red-100 print:bg-red-50 print:border-red-100 flex-print-row">
              <div className="flex items-center space-x-2">
                <span className="text-red-600 font-bold text-xs uppercase">
                  ส่วนลดท้ายระบุ
                </span>
                <span className="hidden print:inline text-red-600 font-bold text-xs ml-1">
                  ({globalDiscount.type === "fixed" ? "฿" : "%"})
                </span>
                <select
                  className="text-xs border-none bg-transparent p-0 text-red-600 font-bold focus:ring-0 print:hidden"
                  value={globalDiscount.type}
                  onChange={(e) =>
                    setGlobalDiscount({
                      ...globalDiscount,
                      type: e.target.value,
                    })
                  }
                >
                  <option value="fixed">฿</option>
                  <option value="percent">%</option>
                </select>
              </div>
              <input
                type="number"
                className="w-20 text-right bg-transparent border-b border-red-300 text-red-600 font-semibold focus:outline-none print:border-none print:p-0"
                value={globalDiscount.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setGlobalDiscount({
                    ...globalDiscount,
                    value: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex justify-between font-bold text-gray-900 border-b pb-3">
              <span>ยอดหลังหักส่วนลด (Sub-total)</span>
              <span>
                {subTotal
                  .toNumber()
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-gray-600">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxConfig.isVat}
                  onChange={(e) =>
                    setTaxConfig({ ...taxConfig, isVat: e.target.checked })
                  }
                  className="mr-2 rounded text-blue-600 focus:ring-blue-500 print:hidden"
                />
                VAT 7%
              </label>
              <span>
                {vatAmount
                  .toNumber()
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-xl font-black text-blue-600 border-t pt-2">
              <span>GRAND TOTAL</span>
              <span>
                {grandTotal
                  .toNumber()
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center text-orange-600 text-sm">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxConfig.isWHT}
                  onChange={(e) =>
                    setTaxConfig({ ...taxConfig, isWHT: e.target.checked })
                  }
                  className="mr-2 rounded text-orange-600 focus:ring-orange-500 print:hidden"
                />
                หัก ณ ที่จ่าย 3%
              </label>
              <span>
                -
                {whtAmount
                  .toNumber()
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between text-2xl font-black text-gray-900 border-t-4 border-double pt-2">
              <span className="text-xs uppercase text-gray-400 self-center">
                Net Paid
              </span>
              <span className="underline decoration-blue-500 underline-offset-4">
                {netPayable
                  .toNumber()
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 pt-8 border-t border-gray-200 print:mt-12 print:pt-8 flex-print-4 avoid-break text-gray-700">
          <div className="text-center flex flex-col items-center">
            <div className="border-b border-gray-400 border-solid w-3/4 mt-12 mb-3"></div>
            <p className="text-sm font-semibold">ผู้รับสินค้า</p>
            <p className="text-xs text-gray-500 mt-2">วันที่ ____/____/____</p>
          </div>
          <div className="text-center flex flex-col items-center">
            <div className="border-b border-gray-400 border-solid w-3/4 mt-12 mb-3"></div>
            <p className="text-sm font-semibold">ผู้ส่งสินค้า</p>
            <p className="text-xs text-gray-500 mt-2">วันที่ ____/____/____</p>
          </div>
          <div className="text-center flex flex-col items-center">
            <div className="border-b border-gray-400 border-solid w-3/4 mt-12 mb-3"></div>
            <p className="text-sm font-semibold">ผู้รับเงิน</p>
            <p className="text-xs text-gray-500 mt-2">วันที่ ____/____/____</p>
          </div>
          <div className="text-center flex flex-col items-center">
            <div className="border-b border-gray-400 border-solid w-3/4 mt-12 mb-3"></div>
            <p className="text-sm font-semibold">ผู้มีอำนาจลงนาม</p>
            <p className="text-xs text-gray-500 mt-2">วันที่ ____/____/____</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDemo;
