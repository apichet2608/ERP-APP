import React, { useState } from "react";
import { Decimal } from "decimal.js"; // อย่าลืม npm i decimal.js

const InvoiceDemo = () => {
  const [items, setItems] = useState([
    { desc: "Software Development", qty: 1, price: 10000 },
  ]);
  const [taxConfig, setTaxConfig] = useState({ isVat: true, isWHT: false });

  // --- Calculation Logic using decimal.js ---

  // 1. คำนวณ Sub-total (ยอดรวมรายการทั้งหมด)
  const subTotal = items.reduce((acc, item) => {
    const itemSum = new Decimal(item.qty || 0).times(item.price || 0);
    return acc.plus(itemSum);
  }, new Decimal(0));

  // 2. คำนวณ VAT 7%
  const vatRate = new Decimal(0.07);
  const vatAmount = taxConfig.isVat
    ? subTotal.times(vatRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    : new Decimal(0);

  // 3. ยอดรวมทั้งสิ้น (Grand Total)
  const grandTotal = subTotal.plus(vatAmount);

  // 4. คำนวณ หัก ณ ที่จ่าย 3% (WHT) - คำนวณจากยอดก่อน VAT (subTotal)
  const whtRate = new Decimal(0.03);
  const whtAmount = taxConfig.isWHT
    ? subTotal.times(whtRate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    : new Decimal(0);

  // 5. ยอดสุทธิที่ต้องชำระจริง (Net Payable)
  const netPayable = grandTotal.minus(whtAmount);

  // --- Handlers ---
  const addItem = () => setItems([...items, { desc: "", qty: 1, price: 0 }]);

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-10 border-t-8 border-blue-600">
        {/* Header Section */}
        <div className="flex justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 tracking-tight">
              INVOICE
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              เลขที่บิล: INV-{new Date().getFullYear()}-001
            </p>
          </div>
          <div className="text-right text-sm">
            <h2 className="font-bold text-base">
              บริษัท ของคุณ จำกัด (สำนักงานใหญ่)
            </h2>
            <p className="text-gray-500">
              เลขประจำตัวผู้เสียภาษี: 1-2345-67890-12-3
            </p>
            <p className="text-gray-500">
              123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กทม. 10110
            </p>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto">
          <table className="w-full text-left mb-6">
            <thead>
              <tr className="border-b-2 border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                <th className="py-3 px-2">รายการสินค้า / รายละเอียด</th>
                <th className="py-3 px-2 w-24 text-center">จำนวน</th>
                <th className="py-3 px-2 w-32 text-right">ราคา/หน่วย</th>
                <th className="py-3 px-2 w-32 text-right">รวมเงิน</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-50 group">
                  <td className="py-4 px-2">
                    <input
                      className="w-full border-none focus:ring-2 focus:ring-blue-100 rounded p-1 text-gray-700 bg-transparent"
                      placeholder="เช่น ค่าบริการพัฒนาซอฟต์แวร์..."
                      value={item.desc}
                      onChange={(e) => updateItem(idx, "desc", e.target.value)}
                    />
                  </td>
                  <td className="py-4 px-2 text-center">
                    <input
                      type="number"
                      className="w-16 text-center border border-gray-200 rounded-md p-1"
                      value={item.qty}
                      onChange={(e) => updateItem(idx, "qty", e.target.value)}
                    />
                  </td>
                  <td className="py-4 px-2 text-right">
                    <input
                      type="number"
                      className="w-28 text-right border border-gray-200 rounded-md p-1"
                      value={item.price}
                      onChange={(e) => updateItem(idx, "price", e.target.value)}
                    />
                  </td>
                  <td className="py-4 px-2 text-right font-semibold text-gray-700">
                    {new Decimal(item.qty || 0)
                      .times(item.price || 0)
                      .toNumber()
                      .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addItem}
          className="flex items-center text-blue-600 font-semibold text-sm hover:text-blue-800 transition-colors mb-8"
        >
          <span className="mr-1 text-lg">+</span> เพิ่มรายการใหม่
        </button>

        <hr className="border-gray-100 mb-8" />

        {/* Calculation Summary */}
        <div className="flex justify-end">
          <div className="w-full md:w-80 space-y-3 text-sm">
            <div className="flex justify-between items-center text-gray-600">
              <span>รวมเป็นเงิน (Sub-total)</span>
              <span className="font-medium text-gray-900">
                {subTotal
                  .toNumber()
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* VAT Config */}
            <div className="flex justify-between items-center">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={taxConfig.isVat}
                  onChange={(e) =>
                    setTaxConfig({ ...taxConfig, isVat: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-gray-600 group-hover:text-blue-600">
                  ภาษีมูลค่าเพิ่ม 7%
                </span>
              </label>
              <span className="text-gray-900">
                {vatAmount
                  .toNumber()
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-gray-100 pt-3">
              <span className="text-base font-bold">จำนวนเงินรวมทั้งสิ้น</span>
              <span className="text-xl font-extrabold text-blue-600">
                {grandTotal
                  .toNumber()
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* WHT Config */}
            <div
              className={`flex justify-between items-center p-3 rounded-lg transition-colors ${taxConfig.isWHT ? "bg-orange-50" : "bg-gray-50"}`}
            >
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxConfig.isWHT}
                  onChange={(e) =>
                    setTaxConfig({ ...taxConfig, isWHT: e.target.checked })
                  }
                  className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="ml-2 text-orange-700 font-medium text-xs">
                  หัก ณ ที่จ่าย (3%)
                </span>
              </label>
              <span className="text-orange-700 font-bold">
                -
                {whtAmount
                  .toNumber()
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-between items-center font-black text-2xl pt-2 text-gray-900 border-t-4 border-double border-gray-200">
              <span className="text-sm uppercase tracking-widest text-gray-400">
                Net Paid
              </span>
              <span className="underline decoration-blue-500 decoration-2 underline-offset-4">
                {netPayable
                  .toNumber()
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-16 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-xs text-blue-700 leading-relaxed">
            * โปรดตรวจสอบความถูกต้องของรายการก่อนบันทึก <br />*
            ในกรณีที่มีการหัก ณ ที่จ่าย กรุณาแนบใบรับรองการหักภาษี ณ
            ที่จ่ายมาพร้อมกับการชำระเงิน
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
            ยืนยันและออกบิล (PDF)
          </button>
          <button className="flex-1 bg-white text-gray-600 font-bold py-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
            บันทึกเป็นแบบร่าง
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDemo;
