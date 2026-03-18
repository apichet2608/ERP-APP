import { useState } from "react";
import { Decimal } from "decimal.js";

const InvoiceDemo = () => {
  const [items, setItems] = useState([
    {
      desc: "Software Development",
      qty: 1,
      price: 10000,
      discType: "fixed",
      discValue: 0,
    },
    {
      desc: "Hardware",
      qty: 1,
      price: 30000,
      discType: "percent",
      discValue: 10,
    },
  ]);

  const [globalDiscount, setGlobalDiscount] = useState({
    type: "fixed",
    value: 0,
  });
  const [taxConfig, setTaxConfig] = useState({ isVat: true, isWHT: false });

  // --- 🧮 Calculation Logic with Decimal.js ---

  // 1. คำนวณยอดรวมรายรายการ (Line Items Calculation)
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

  // 2. ยอดรวมก่อนหักส่วนลดท้ายบิล (Total After Line Discounts)
  const totalAfterLineDiscounts = calculatedItems.reduce(
    (acc, item) => acc.plus(item.rowTotal),
    new Decimal(0),
  );

  // 3. คำนวณส่วนลดท้ายบิล (Global Discount)
  let finalGlobalDiscount = new Decimal(0);
  const gDiscValue = new Decimal(globalDiscount.value || 0);
  if (globalDiscount.type === "percent") {
    finalGlobalDiscount = totalAfterLineDiscounts.times(
      gDiscValue.dividedBy(100),
    );
  } else {
    finalGlobalDiscount = gDiscValue;
  }

  // 4. ยอดก่อนภาษี (Sub-total)
  const subTotal = totalAfterLineDiscounts
    .minus(finalGlobalDiscount)
    .greaterThan(0)
    ? totalAfterLineDiscounts.minus(finalGlobalDiscount)
    : new Decimal(0);

  // 5. ภาษีและยอดสุทธิ
  const vatAmount = taxConfig.isVat
    ? subTotal.times(0.07).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    : new Decimal(0);
  const grandTotal = subTotal.plus(vatAmount);
  const whtAmount = taxConfig.isWHT
    ? subTotal.times(0.03).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
    : new Decimal(0);
  const netPayable = grandTotal.minus(whtAmount);

  // --- 🖱️ Handlers ---
  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans text-gray-800">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-lg p-10 border-t-8 border-blue-600">
        {/* Table Section */}
        <table className="w-full text-left mb-6">
          <thead>
            <tr className="border-b-2 border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
              <th className="py-3 px-2">รายละเอียด</th>
              <th className="py-3 px-2 w-20 text-center">จำนวน</th>
              <th className="py-3 px-2 w-28 text-right">ราคา/หน่วย</th>
              <th className="py-3 px-2 w-48 text-center">ส่วนลดสินค้า</th>
              <th className="py-3 px-2 w-32 text-right">รวมเงิน</th>
            </tr>
          </thead>
          <tbody>
            {calculatedItems.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-50">
                <td className="py-4 px-2">
                  <input
                    className="w-full bg-transparent focus:ring-0"
                    value={item.desc}
                    onChange={(e) => updateItem(idx, "desc", e.target.value)}
                  />
                </td>
                <td className="py-4 px-2 text-center">
                  <input
                    type="number"
                    className="w-16 border rounded p-1 text-center"
                    value={item.qty}
                    onChange={(e) => updateItem(idx, "qty", e.target.value)}
                  />
                </td>
                <td className="py-4 px-2 text-right">
                  <input
                    type="number"
                    className="w-24 border rounded p-1 text-right"
                    value={item.price}
                    onChange={(e) => updateItem(idx, "price", e.target.value)}
                  />
                </td>
                <td className="py-4 px-2">
                  <div className="flex items-center space-x-1 justify-center">
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
                </td>
                <td className="py-4 px-2 text-right font-semibold">
                  {item.rowTotal
                    .toNumber()
                    .toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          onClick={() =>
            setItems([
              ...items,
              { desc: "", qty: 1, price: 0, discType: "fixed", discValue: 0 },
            ])
          }
          className="text-blue-600 text-sm font-bold mb-10"
        >
          + เพิ่มรายการ
        </button>

        {/* Summary */}
        <div className="flex justify-end border-t pt-6">
          <div className="w-80 space-y-4">
            <div className="flex justify-between text-gray-500">
              <span>รวมเงิน (Gross)</span>
              <span>
                {totalAfterLineDiscounts
                  .toNumber()
                  .toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Global Discount */}
            <div className="flex justify-between items-center bg-red-50 p-2 rounded-md">
              <div className="flex items-center space-x-2">
                <span className="text-red-600 font-bold text-xs uppercase">
                  ส่วนลดท้ายบิล
                </span>
                <select
                  className="text-xs border-none bg-transparent p-0 text-red-600"
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
                className="w-20 text-right bg-transparent border-b border-red-200 text-red-600"
                value={globalDiscount.value}
                onChange={(e) =>
                  setGlobalDiscount({
                    ...globalDiscount,
                    value: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex justify-between font-bold text-gray-900">
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
                  className="mr-2"
                />{" "}
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
                  className="mr-2"
                />{" "}
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
      </div>
    </div>
  );
};

export default InvoiceDemo;
