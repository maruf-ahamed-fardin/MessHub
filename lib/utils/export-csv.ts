/**
 * CSV and Tabular Data Exporter for MessHub
 * Includes UTF-8 BOM to ensure flawless Bengali and English rendering in Excel & Google Sheets.
 */

export function downloadCsv(filename: string, csvContent: string) {
  // Prepend UTF-8 BOM so Excel opens Bengali characters properly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function generateSettlementCsv(params: {
  messName: string;
  monthName: string;
  year: number;
  currency: string;
  summary: {
    mealRate: number;
    totalFoodExpense: number;
    totalNormalMeals: number;
    totalGuestMeals: number;
    totalUtility: number;
    totalOtherExpense: number;
    memberSummaries: Array<{
      memberName: string;
      totalMeals: number;
      foodCost: number;
      guestMealCost: number;
      utilityCost: number;
      seatRent: number;
      otherCost: number;
      totalCost: number;
      totalPaid: number;
      balance: number;
    }>;
  };
}): string {
  const { messName, monthName, year, currency, summary } = params;

  const lines: string[] = [];

  // Title rows
  lines.push([escapeCsvCell(messName), escapeCsvCell(`Monthly Settlement Report - ${monthName} ${year}`)].join(","));
  lines.push([escapeCsvCell("Generated Date"), escapeCsvCell(new Date().toLocaleDateString())].join(","));
  lines.push("");

  // Mess Overview Summary
  lines.push([escapeCsvCell("Summary Metric"), escapeCsvCell("Amount / Value")].join(","));
  lines.push([escapeCsvCell("Meal Rate"), escapeCsvCell(`${currency}${summary.mealRate.toFixed(2)}`)].join(","));
  lines.push([escapeCsvCell("Total Food Expense"), escapeCsvCell(`${currency}${Number(summary.totalFoodExpense).toFixed(2)}`)].join(","));
  lines.push([escapeCsvCell("Total Normal Meals"), escapeCsvCell(summary.totalNormalMeals)].join(","));
  lines.push([escapeCsvCell("Total Utility Bills"), escapeCsvCell(`${currency}${Number(summary.totalUtility).toFixed(2)}`)].join(","));
  lines.push([escapeCsvCell("Total Other Expenses"), escapeCsvCell(`${currency}${Number(summary.totalOtherExpense).toFixed(2)}`)].join(","));
  lines.push("");

  // Member Table Header
  const headers = [
    "SL",
    "Member Name",
    "Total Meals",
    `Meal Cost (${currency})`,
    `Guest Meal Cost (${currency})`,
    `Utility Share (${currency})`,
    `Seat Rent (${currency})`,
    `Other Shared (${currency})`,
    `Total Cost (${currency})`,
    `Total Paid (${currency})`,
    `Net Balance (${currency})`,
    "Status",
  ];
  lines.push(headers.map(escapeCsvCell).join(","));

  // Member Rows
  let totalMealsAll = 0;
  let totalFoodCostAll = 0;
  let totalCostAll = 0;
  let totalPaidAll = 0;
  let totalNetBalanceAll = 0;

  summary.memberSummaries.forEach((m, idx) => {
    totalMealsAll += m.totalMeals;
    totalFoodCostAll += m.foodCost;
    totalCostAll += m.totalCost;
    totalPaidAll += m.totalPaid;
    totalNetBalanceAll += m.balance;

    const status = m.balance > 0 ? "REFUND" : m.balance < 0 ? "DUE" : "SETTLED";

    const row = [
      idx + 1,
      m.memberName,
      m.totalMeals,
      m.foodCost.toFixed(2),
      m.guestMealCost.toFixed(2),
      m.utilityCost.toFixed(2),
      m.seatRent.toFixed(2),
      m.otherCost.toFixed(2),
      m.totalCost.toFixed(2),
      m.totalPaid.toFixed(2),
      m.balance.toFixed(2),
      status,
    ];
    lines.push(row.map(escapeCsvCell).join(","));
  });

  // Totals Row
  lines.push("");
  const totalsRow = [
    "TOTAL",
    "",
    totalMealsAll,
    totalFoodCostAll.toFixed(2),
    "",
    "",
    "",
    "",
    totalCostAll.toFixed(2),
    totalPaidAll.toFixed(2),
    totalNetBalanceAll.toFixed(2),
    "",
  ];
  lines.push(totalsRow.map(escapeCsvCell).join(","));

  return lines.join("\r\n");
}


export function generateBazarCsv(params: {
  messName: string;
  monthName: string;
  year: number;
  currency: string;
  bazars: Array<{
    date: Date | string;
    buyerMember?: { user?: { name?: string | null } };
    totalAmount: number;
    note?: string | null;
    items?: Array<{
      productName: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      totalPrice: number;
    }>;
  }>;
}): string {
  const { messName, monthName, year, currency, bazars } = params;
  const lines: string[] = [];

  // Title rows
  lines.push([escapeCsvCell(messName), escapeCsvCell(`Monthly Bazar Breakdown - ${monthName} ${year}`)].join(","));
  lines.push([escapeCsvCell("Generated Date"), escapeCsvCell(new Date().toLocaleDateString())].join(","));
  lines.push("");

  // Headers
  const headers = [
    "Date",
    "Buyer Name",
    "Items Breakdown",
    `Total Amount (${currency})`,
    "Notes",
  ];
  lines.push(headers.map(escapeCsvCell).join(","));

  let grandTotal = 0;

  bazars.forEach((b) => {
    grandTotal += Number(b.totalAmount) || 0;
    const dateStr = new Date(b.date).toLocaleDateString();
    const buyerName = b.buyerMember?.user?.name || "Member";
    const itemsStr = (b.items || [])
      .map((it) => `${it.productName} (${it.quantity}${it.unit} @${currency}${it.unitPrice})`)
      .join("; ");

    const row = [
      dateStr,
      buyerName,
      itemsStr || "General Groceries",
      Number(b.totalAmount).toFixed(2),
      b.note || "",
    ];
    lines.push(row.map(escapeCsvCell).join(","));
  });

  lines.push("");
  lines.push(["GRAND TOTAL", "", "", grandTotal.toFixed(2), ""].map(escapeCsvCell).join(","));

  return lines.join("\r\n");
}

