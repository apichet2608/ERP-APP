import React, { useState } from "react";
import PdfPreviewModal from "./PdfPreviewModal";
import Decimal from "decimal.js";
import ThaiBahtText from "thai-baht-text";

// สร้าง Helper สำหรับสร้าง ID (UUID) แบบ Fallback กรณี crypto.randomUUID ไม่ทำงาน (เช่น HTTP หรือ Non-localhost)
const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// สร้าง Interface สำหรับ Item เพื่อความชัดเจนของ Type
interface InvoiceItem {
  id: string; // ใช้สำหรับอ้างอิงตอนลบ/แก้ไข (หลีกเลี่ยงการใช้ Index)
  name: string;
  unitPrice: number | string;
  quantity: number | string;
  discountType?: "amount" | "percent";
  discountValue?: number | string;
  amount: number;
}

function PdfApp() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  // คำนวณวันปัจจุบันและวันครบกำหนดสำหรับค่าเริ่มต้น
  const today = new Date();
  const getYYYYMMDD = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const todayStr = getYYYYMMDD(today);
  const dueDefault = new Date(today);
  dueDefault.setDate(dueDefault.getDate() + 30);
  const dueDefaultStr = getYYYYMMDD(dueDefault);

  // State หลักสำหรับตั้งค่าและประเภทข้อมูล
  const [config, setConfig] = useState({
    filename: "Monthly_Invoice_Preview",
    itemCount: 50,
    dataType: "custom", // ค่าเริ่มต้น
    docTitle: "ใบกำกับภาษี / ใบเสร็จรับเงิน",
    // ส่วนลูกค้า
    customerName: "Apichet Juntodum",
    customerAddress: "123 Moo 4, Bangna-Trad Rd., Bangna, Bangkok 10260",
    customerTaxId: "0123456789012",
    customerBranchType: "branch",
    customerBranch: "00001",
    customerTel: "081-234-5678",
    // ส่วนเอกสาร
    docNo: "001/2026",
    docDate: todayStr,
    creditDays: "30",
    dueDate: dueDefaultStr,
    salePerson: "Apichet Juntodum",
    saleZone: "อยุธยา",
    billDiscount: "",
    deposit: "",
    vatRate: "7",
    whtRate: "3",
    bathText: "",
  });

  // State ใหม่สำหรับเก็บรายการสินค้าที่กรอกเอง (Custom Items)
  const [customItems, setCustomItems] = useState<InvoiceItem[]>([
    {
      id: generateUUID(),
      name: "",
      unitPrice: 0,
      quantity: 1,
      discountType: "amount",
      discountValue: 0,
      amount: 0,
    },
  ]);

  const handlePreview = async () => {
    setIsLoading(true);
    // const ip = "http://127.0.0.1:3000";
    const ip = "http://192.168.1.38:8082";
    // const ip = "http://172.20.10.3:8082";
    //

    const apiUrl = `${ip}/api/nest-pdf/pdf/generate`;

    try {
      let mockItems: InvoiceItem[] = [];

      // 1. เตรียม Data ตามประเภทที่เลือก
      if (config.dataType === "it") {
        mockItems = [
          {
            id: "1",
            name: "MacBook Pro 14-inch (M3)",
            unitPrice: 59900,
            quantity: 1,
            amount: 59900,
          },
          {
            id: "2",
            name: "Magic Mouse",
            unitPrice: 3200,
            quantity: 2,
            amount: 6400,
          },
          {
            id: "3",
            name: "LG UltraFine 4K Display",
            unitPrice: 24900,
            quantity: 1,
            amount: 24900,
          },
          {
            id: "4",
            name: "Keychron K3 Pro Wireless",
            unitPrice: 4500,
            quantity: 1,
            amount: 4500,
          },
          {
            id: "5",
            name: "USB-C to HDMI Adapter",
            unitPrice: 890,
            quantity: 3,
            amount: 2670,
          },
        ];
      } else if (config.dataType === "office") {
        mockItems = [
          {
            id: "1",
            name: "กระดาษ A4 Double A (กล่อง)",
            unitPrice: 550,
            quantity: 10,
            amount: 5500,
          },
          {
            id: "2",
            name: "ปากกาลูกลื่น สีน้ำเงิน (แพ็ค 50 ด้าม)",
            unitPrice: 250,
            quantity: 5,
            amount: 1250,
          },
          {
            id: "3",
            name: "แฟ้มตราช้าง สันกว้าง 3 นิ้ว",
            unitPrice: 65,
            quantity: 20,
            amount: 1300,
          },
          {
            id: "4",
            name: "หมึกพิมพ์ HP LaserJet",
            unitPrice: 2150,
            quantity: 2,
            amount: 4300,
          },
        ];
      } else if (config.dataType === "custom") {
        // ใช้ข้อมูลจาก State customItems ที่ผู้ใช้กรอก กรองเอาเฉพาะที่กรอกชื่อแล้ว
        mockItems = customItems.filter((item) => item.name.trim() !== "");
        if (mockItems.length === 0) {
          throw new Error("กรุณากรอกรายการสินค้าอย่างน้อย 1 รายการ");
        }
      } else {
        // กรณีเลือก 'random' เพื่อทดสอบการล้นหน้า
        mockItems = Array.from({ length: Number(config.itemCount) }, (_, i) => {
          const price = Math.floor(Math.random() * 500) + 100;
          const qty = Math.floor(Math.random() * 5) + 1;
          return {
            id: `random-${i}`,
            name: `รายการสินค้าทดสอบที่ ${i + 1}`,
            unitPrice: price,
            quantity: qty,
            amount: price * qty,
          };
        });
      }

      // คำนวณยอดเงินต่างๆ สำหรับส่งไปหลังบ้าน
      const safeDecimal = (val: any) => {
        if (!val) return new Decimal(0);
        const num = Number(val);
        return isNaN(num) ? new Decimal(0) : new Decimal(num);
      };

      const rawTotal = mockItems.reduce((sum, item) => sum + item.amount, 0);
      const subtotalDec = new Decimal(rawTotal);
      const billDiscountDec = safeDecimal(config.billDiscount);
      const afterDiscount = subtotalDec.minus(billDiscountDec);
      const depositDec = safeDecimal(config.deposit);
      const afterDeposit = afterDiscount.minus(depositDec);

      const finalBaseForVat = afterDeposit.isNegative()
        ? new Decimal(0)
        : afterDeposit;
      const vatRateVal = safeDecimal(config.vatRate).div(100);
      const whtRateVal = safeDecimal(config.whtRate).div(100);

      const vatAmount = finalBaseForVat.mul(vatRateVal);
      const grandTotal = finalBaseForVat.plus(vatAmount);

      const whtAmount = finalBaseForVat.mul(whtRateVal);
      const netTotal = grandTotal.minus(whtAmount);
      const bathTextStr = ThaiBahtText(netTotal.toNumber());

      // กำหนด Payload ตามข้อมูลที่กรอกในฟอร์ม
      const payload = {
        customerName: config.customerName,
        customerAddress: config.customerAddress,
        customerTaxId: config.customerTaxId,
        customerBranch:
          config.customerBranchType === "head"
            ? "สำนักงานใหญ่"
            : config.customerBranch,
        customerTel: config.customerTel,
        items: mockItems,
        total: rawTotal,
        billDiscount: Number(config.billDiscount) || 0,
        deposit: Number(config.deposit) || 0,

        // แนบค่าคำนวณที่ได้จากหน้าบ้านไปให้หลังบ้าน
        subtotal: rawTotal, // ยอดรวมก่อนหัก/บวก
        vatAmount: vatAmount.toNumber(), // ภาษีมูลค่าเพิ่ม
        whtAmount: whtAmount.toNumber(), // ภาษีหัก ณ ที่จ่าย
        grandTotal: grandTotal.toNumber(), // ยอดรวมก่อนหักภาษีหัก ณ ที่จ่าย
        netTotal: netTotal.toNumber(), // ยอดสุทธิ
        afterDiscount: afterDiscount.toNumber(), // ยอดหลังหักส่วนลด
        afterDeposit: afterDeposit.toNumber(), // ยอดหลังหักเงินมัดจำ
        bathText: bathTextStr, // ยอดสุทธิเป็นตัวอักษร

        filename: config.filename,
        docTitle: config.docTitle,
        docNo: config.docNo,
        // แปลง YYYY-MM-DD กลับเป็น DD/MM/YYYY สำหรับหลังบ้าน
        docDate: config.docDate.split("-").reverse().join("/"),
        creditDays: config.creditDays,
        dueDate: config.dueDate.split("-").reverse().join("/"),
        salePerson: config.salePerson,
        saleZone: config.saleZone,
        vatRate: config.vatRate,
        whtRate: config.whtRate,
      };

      // 2. เรียก API เดิม
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
      alert(`${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setConfig((prev) => {
      const nextConfig = { ...prev, [name]: value };

      // คำนวณวันครบกำหนด (dueDate) อัตโนมัติเมื่อเปลี่ยนวันที่หรือจำนวนวันเครดิต
      if (name === "docDate" || name === "creditDays") {
        try {
          // แปลงวันที่จากรูปแบบ YYYY-MM-DD
          const parts = nextConfig.docDate.split("-");
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1; // เดือนใน JS เริ่มที่ 0
            const day = parseInt(parts[2], 10);

            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
              const daysToAdd = parseInt(nextConfig.creditDays, 10) || 0;
              date.setDate(date.getDate() + daysToAdd);

              const newY = date.getFullYear();
              const newM = String(date.getMonth() + 1).padStart(2, "0");
              const newD = String(date.getDate()).padStart(2, "0");

              nextConfig.dueDate = `${newY}-${newM}-${newD}`;
            }
          }
        } catch (error) {
          // หากเกิดข้อผิดพลาดในการคำนวณ ปล่อยผ่านไป (ให้ผู้ใช้แก้ไขเองได้)
        }
      }

      return nextConfig;
    });
  };

  // ----- ฟังก์ชันจัดการ Custom Items -----
  const handleCustomItemChange = (
    id: string,
    field: keyof InvoiceItem,
    value: string | number,
  ) => {
    setCustomItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // คำนวณ Amount อัตโนมัติด้วย decimal.js เมื่อราคา, จำนวน หรือส่วนลดเปลี่ยน
          if (
            field === "unitPrice" ||
            field === "quantity" ||
            field === "discountType" ||
            field === "discountValue"
          ) {
            // ป้องกัน invalid input
            const safeNum = (v: any) => {
              if (v === "" || v === null || v === undefined) return 0;
              const n = Number(v);
              return isNaN(n) ? 0 : n;
            };

            const price = new Decimal(safeNum(updatedItem.unitPrice));
            const qty = new Decimal(safeNum(updatedItem.quantity));
            const sub = price.mul(qty);

            const discVal = new Decimal(safeNum(updatedItem.discountValue));
            let discAmt = new Decimal(0);

            if (updatedItem.discountType === "percent") {
              discAmt = sub.mul(discVal).div(100);
            } else {
              discAmt = discVal;
            }

            let finalAmt = sub.minus(discAmt);
            // ป้องกันไม่ให้ราคาสินค้าติดลบ
            if (finalAmt.isNegative()) {
              finalAmt = new Decimal(0);
            }

            updatedItem.amount = finalAmt.toNumber(); // เก็บเป็น number ทั่วไป
          }
          return updatedItem;
        }
        return item;
      }),
    );
  };

  const addCustomItem = () => {
    setCustomItems((prev) => [
      ...prev,
      {
        id: generateUUID(),
        name: "",
        unitPrice: 0,
        quantity: 1,
        discountType: "amount",
        discountValue: 0,
        amount: 0,
      },
    ]);
  };

  const removeCustomItem = (id: string) => {
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
  };
  // --------------------------------------

  // คำนวณยอดรวม (Summary) สำหรับ customItems
  const safeDecimal = (val: any) => {
    if (!val) return new Decimal(0);
    const num = Number(val);
    return isNaN(num) ? new Decimal(0) : new Decimal(num);
  };

  const customSubtotal = customItems.reduce((sum, item) => {
    return sum.plus(new Decimal(item.amount || 0));
  }, new Decimal(0));

  const customBillDiscount = safeDecimal(config.billDiscount);
  const customAfterDiscount = customSubtotal.minus(customBillDiscount);

  const customDeposit = safeDecimal(config.deposit);
  const customAfterDeposit = customAfterDiscount.minus(customDeposit);

  const finalBaseForVat = customAfterDeposit.isNegative()
    ? new Decimal(0)
    : customAfterDeposit;

  // ดึงอัตราภาษีจาก config มาใช้คิดคำนวณ
  const vatRateVal = safeDecimal(config.vatRate).div(100);
  const whtRateVal = safeDecimal(config.whtRate).div(100);

  // คำนวณ VAT
  const customVat = finalBaseForVat.mul(vatRateVal);
  const customGrandTotal = finalBaseForVat.plus(customVat);

  // คำนวณภาษีหัก ณ ที่จ่าย (WHT) คิดจากยอดก่อนรวม VAT ตามหลักสรรพากร
  const customWithholdingTax = finalBaseForVat.mul(whtRateVal);
  const customGrandTotalWithWithholdingTax =
    customGrandTotal.minus(customWithholdingTax);

  // แปลงตัวเลขเป็นภาษาไทย
  const customGrandTotalWithWithholdingTaxText = ThaiBahtText(
    customGrandTotalWithWithholdingTax.toNumber(),
  );

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-slate-100 flex flex-col items-center gap-10">
        <header className="flex flex-col md:flex-row items-center gap-6 w-full pb-6 border-b border-slate-100">
          <div className="flex-shrink-0 p-4 bg-indigo-50 rounded-2xl text-indigo-600 text-5xl shadow-inner">
            📊
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold text-slate-950 mb-1">
              ระบบ Preview PDF
            </h1>
            <p className="text-slate-500 text-sm">
              ตรวจสอบความถูกต้องและทดสอบข้อมูลก่อนพิมพ์จริง
            </p>
          </div>
        </header>

        <div className="w-full space-y-6">
          {/* Section 1: การตั้งค่าทั่วไป */}
          <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <span className="text-indigo-500">⚙️</span> การตั้งค่าทั่วไป
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  ชื่อไฟล์ PDF
                </label>
                <input
                  name="filename"
                  value={config.filename}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all"
                  placeholder="เช่น Monthly_Invoice_Preview"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  รูปแบบข้อมูลสินค้า
                </label>
                <select
                  name="dataType"
                  value={config.dataType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all bg-white cursor-pointer"
                  // disabled
                >
                  <option value="it">💻 ชุดอุปกรณ์ไอที (5 รายการ)</option>
                  <option value="office">
                    📎 ชุดอุปกรณ์สำนักงาน (4 รายการ)
                  </option>
                  <option value="random">
                    🎲 สุ่มข้อมูล (เพื่อทดสอบการล้นหน้า)
                  </option>
                  <option value="custom">✍️ กำหนดข้อมูลเอง (Custom)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: ข้อมูลลูกค้า */}
          <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <span className="text-indigo-500">👤</span> ข้อมูลลูกค้า
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  เลขประจำตัวผู้เสียภาษี
                </label>
                <input
                  name="customerTaxId"
                  value={config.customerTaxId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all"
                  placeholder="กรอกเลขประจำตัว 13 หลัก..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  ที่อยู่
                </label>
                <input
                  name="customerAddress"
                  value={config.customerAddress}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all"
                  placeholder="กรอกที่อยู่..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 flex items-center justify-between mb-1.5">
                  <span>สาขา</span>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="customerBranchType"
                        value="head"
                        checked={config.customerBranchType === "head"}
                        onChange={handleInputChange}
                        className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-normal">สำนักงานใหญ่</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="customerBranchType"
                        value="branch"
                        checked={config.customerBranchType === "branch"}
                        onChange={handleInputChange}
                        className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <span className="text-xs font-normal">สาขา</span>
                    </label>
                  </div>
                </label>

                {config.customerBranchType === "branch" ? (
                  <input
                    name="customerBranch"
                    value={config.customerBranch}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all animate-fade-in"
                    placeholder="เช่น 00001 หรือ สาขาบางนา"
                  />
                ) : (
                  <input
                    value="สำนักงานใหญ่"
                    disabled
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none text-sm cursor-not-allowed animate-fade-in"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  เบอร์โทรศัพท์
                </label>
                <input
                  name="customerTel"
                  value={config.customerTel}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all"
                  placeholder="กรอกเบอร์โทรศัพท์..."
                />
              </div>
            </div>
          </div>

          {/* Section 3: ข้อมูลเอกสาร */}
          <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <span className="text-indigo-500">📄</span> ข้อมูลเอกสาร
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  ประเภทเอกสาร (หัวกระดาษ)
                </label>
                <select
                  name="docTitle"
                  value={config.docTitle}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all bg-white cursor-pointer"
                >
                  <option value="">-- กรุณาเลือกประเภทเอกสาร --</option>
                  <option value="ใบกำกับภาษี / ใบเสร็จรับเงิน">
                    ใบกำกับภาษี / ใบเสร็จรับเงิน (Tax Invoice / Receipt)
                  </option>
                  <option value="ใบส่งสินค้า / ใบกำกับภาษี">
                    ใบส่งสินค้า / ใบกำกับภาษี (Delivery Order / Tax Invoice)
                  </option>
                  <option value="ใบแจ้งหนี้ / ใบวางบิล">
                    ใบแจ้งหนี้ / ใบวางบิล (Invoice / Billing)
                  </option>
                  <option value="ใบเสนอราคา">ใบเสนอราคา (Quotation)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  เลขที่เอกสาร
                </label>
                <input
                  name="docNo"
                  value={config.docNo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  วันที่เอกสาร
                </label>
                <input
                  type="date"
                  name="docDate"
                  value={config.docDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  เครดิต (วัน)
                </label>
                <input
                  type="number"
                  min="0"
                  name="creditDays"
                  value={config.creditDays}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5 flex justify-between items-center">
                  <span>วันครบกำหนด</span>
                  <span className="text-xs text-indigo-500 font-normal bg-indigo-50 px-2 py-0.5 rounded-full">
                    คำนวณอัตโนมัติ
                  </span>
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={config.dueDate}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  พนักงานขาย
                </label>
                <input
                  name="salePerson"
                  value={config.salePerson}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  เขตการขาย
                </label>
                <input
                  name="saleZone"
                  value={config.saleZone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 outline-none text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* แสดงช่องกรอกจำนวน เฉพาะเมื่อเลือก "สุ่มข้อมูล" */}
          {config.dataType === "random" && (
            <div className="animate-fade-in p-4 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                จำนวนรายการที่ต้องการสุ่ม (ทดสอบการล้นหน้า)
              </label>
              <input
                type="number"
                name="itemCount"
                value={config.itemCount}
                onChange={handleInputChange}
                min="1"
                max="1000"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-200 text-sm transition-all outline-none"
              />
            </div>
          )}

          {/* ฟอร์มกรอกข้อมูลเอง (Dynamic Form) เฉพาะเมื่อเลือก "กำหนดข้อมูลเอง" */}
          {config.dataType === "custom" && (
            <div className="animate-fade-in space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-700">รายการสินค้า</h3>
                <button
                  onClick={addCustomItem}
                  className="text-sm px-3 py-1.5 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded-lg font-medium transition-colors"
                >
                  + เพิ่มรายการ
                </button>
              </div>

              {customItems.map((item, index) => (
                <div
                  key={item.id}
                  className="grid grid-cols-2 lg:grid-cols-12 gap-3 items-end bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm relative group"
                >
                  <div className="col-span-2 lg:col-span-7">
                    <label className="block text-xs text-slate-500 mb-1 font-medium">
                      ชื่อรายการ
                    </label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleCustomItemChange(item.id, "name", e.target.value)
                      }
                      placeholder={`รายการที่ ${index + 1}`}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-200 outline-none"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-1 lg:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1 font-medium">
                      ราคา/หน่วย
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.unitPrice === 0 ? "" : item.unitPrice}
                      onKeyDown={(e) => {
                        if (e.key === "-") e.preventDefault();
                      }}
                      onChange={(e) =>
                        handleCustomItemChange(
                          item.id,
                          "unitPrice",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-200 outline-none text-right"
                    />
                  </div>
                  <div className="col-span-1 md:col-span-1 lg:col-span-1">
                    <label className="block text-xs text-slate-500 mb-1 font-medium">
                      จำนวน
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={item.quantity === 0 ? "" : item.quantity}
                      onKeyDown={(e) => {
                        if (e.key === "-") e.preventDefault();
                      }}
                      onChange={(e) =>
                        handleCustomItemChange(
                          item.id,
                          "quantity",
                          e.target.value,
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-200 outline-none text-center"
                    />
                  </div>
                  {/* <div className="col-span-1 lg:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1 font-medium">
                      ส่วนลด
                    </label>
                    <div className="flex rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-200 overflow-hidden">
                      <select
                        value={item.discountType || "amount"}
                        onChange={(e) =>
                          handleCustomItemChange(
                            item.id,
                            "discountType",
                            e.target.value,
                          )
                        }
                        className="px-1 py-2 bg-slate-50 text-slate-600 text-xs border-r border-slate-200 outline-none cursor-pointer"
                      >
                        <option value="amount">฿</option>
                        <option value="percent">%</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={
                          item.discountValue === 0 ? "" : item.discountValue
                        }
                        onKeyDown={(e) => {
                          if (e.key === "-") e.preventDefault();
                        }}
                        onChange={(e) =>
                          handleCustomItemChange(
                            item.id,
                            "discountValue",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-2 text-sm outline-none text-right min-w-[50px]"
                      />
                    </div>
                  </div> */}
                  <div className="col-span-1 lg:col-span-2">
                    <label className="block text-xs text-slate-500 mb-1 text-right font-medium">
                      รวม (บาท)
                    </label>
                    <div className="w-full px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-sm text-right text-indigo-700 font-bold overflow-hidden text-ellipsis whitespace-nowrap">
                      {item.amount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>

                  {/* ปุ่มลบ */}
                  <button
                    onClick={() => removeCustomItem(item.id)}
                    disabled={customItems.length === 1}
                    className="absolute -right-2 -top-2 w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity disabled:hidden hover:bg-red-200"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* สรุปยอดรวม (Summary) */}
              {customItems.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <div className="w-full md:w-1/2 lg:w-2/3 xl:w-1/2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                    <div className="flex justify-between items-center text-sm text-slate-600">
                      <span>รวมเป็นเงิน</span>
                      <span className="font-medium">
                        {customSubtotal.toNumber().toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-slate-600">
                      <span>หัก ส่วนลด</span>
                      <input
                        type="number"
                        min="0"
                        name="billDiscount"
                        value={config.billDiscount}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === "-") e.preventDefault();
                        }}
                        className="w-28 px-2 py-1 text-right border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex justify-between items-center text-sm text-slate-600 pb-2 border-b border-slate-100">
                      <span>ยอดหลังหักส่วนลด</span>
                      <span className="font-medium">
                        {customAfterDiscount
                          .toNumber()
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-slate-600">
                      <span>หัก เงินมัดจำ</span>
                      <input
                        type="number"
                        min="0"
                        name="deposit"
                        value={config.deposit}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          if (e.key === "-") e.preventDefault();
                        }}
                        className="w-28 px-2 py-1 text-right border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        placeholder="0.00"
                      />
                    </div>

                    <div className="flex justify-between items-center text-sm text-slate-600 pb-2 border-b border-slate-100">
                      <span>จำนวนเงินหลังหักมัดจำ</span>
                      <span className="font-medium">
                        {customAfterDeposit
                          .toNumber()
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <span>ภาษีมูลค่าเพิ่ม (VAT)</span>
                        <select
                          name="vatRate"
                          value={config.vatRate}
                          onChange={handleInputChange}
                          className="w-20 px-2 py-1 text-right border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        >
                          <option value="0">0%</option>
                          <option value="7">7%</option>
                        </select>
                      </div>
                      <span className="font-medium">
                        {customVat.toNumber().toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <span>หัก ณ ที่จ่าย (WHT)</span>
                        <select
                          name="whtRate"
                          value={config.whtRate}
                          onChange={handleInputChange}
                          className="w-20 px-2 py-1 text-right border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                        >
                          <option value="0">ไม่มี</option>
                          <option value="1">1%</option>
                          <option value="2">2%</option>
                          <option value="3">3%</option>
                          <option value="5">5%</option>
                        </select>
                      </div>
                      <span className="font-medium">
                        {customWithholdingTax
                          .toNumber()
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center font-bold text-lg text-slate-800 border-t border-slate-200 pt-3">
                      <span>จำนวนเงินรวมทั้งสิ้น</span>
                      <span className="text-indigo-600">
                        {customGrandTotalWithWithholdingTax
                          .toNumber()
                          .toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                      </span>
                    </div>

                    {/* เพิ่มสรุปค่าเงินเป็นภาษาไทย */}
                    <div className="mt-3 text-right">
                      <div className="inline-block bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-100">
                        {customGrandTotalWithWithholdingTaxText}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handlePreview}
            disabled={isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-3 mt-8
              ${
                isLoading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-indigo-100"
              }`}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                กำลังสร้าง PDF...
              </>
            ) : (
              <>
                <span>🔍 Preview Document</span>
              </>
            )}
          </button>
        </div>
      </div>

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
