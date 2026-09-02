type MoneyRow = {
  name: string;
  amount: number;
};

type BudgetRow = {
  name: string;
  planned: number;
  spent: number;
};

type TransactionRow = {
  date: string;
  name: string;
  category: string;
  type: "income" | "expense";
  amount: number;
};

export type MonthlyReportData = {
  periodLabel: string;
  generatedLabel: string;
  ownerName: string;
  income: number;
  salaryIncome: number;
  expenses: number;
  savings: number;
  savingRate: number;
  categories: MoneyRow[];
  budgets: BudgetRow[];
  transactions: TransactionRow[];
  logoJpeg: Buffer;
};

type Color = [number, number, number];

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const NAVY: Color = [17, 43, 70];
const DARK: Color = [26, 48, 71];
const MUTED: Color = [91, 111, 132];
const GREEN: Color = [18, 163, 98];
const LIGHT_GREEN: Color = [232, 248, 240];
const LIGHT_BLUE: Color = [235, 243, 251];
const LIGHT_ROSE: Color = [253, 238, 241];
const ROSE: Color = [204, 66, 91];
const LINE: Color = [219, 228, 236];
const WHITE: Color = [255, 255, 255];

function rgb(color: Color) {
  return color.map((value) => (value / 255).toFixed(3)).join(" ");
}

function winAnsiBytes(value: string) {
  const replacements: Record<number, number> = {
    0x20ac: 0x80,
    0x201a: 0x82,
    0x0192: 0x83,
    0x201e: 0x84,
    0x2026: 0x85,
    0x2020: 0x86,
    0x2021: 0x87,
    0x02c6: 0x88,
    0x2030: 0x89,
    0x0160: 0x8a,
    0x2039: 0x8b,
    0x0152: 0x8c,
    0x017d: 0x8e,
    0x2018: 0x91,
    0x2019: 0x92,
    0x201c: 0x93,
    0x201d: 0x94,
    0x2022: 0x95,
    0x2013: 0x96,
    0x2014: 0x97,
    0x02dc: 0x98,
    0x2122: 0x99,
    0x0161: 0x9a,
    0x203a: 0x9b,
    0x0153: 0x9c,
    0x017e: 0x9e,
    0x0178: 0x9f
  };
  const bytes: number[] = [];

  for (const character of value) {
    const code = character.codePointAt(0) || 63;
    if (code === 0x00a0 || code === 0x202f) bytes.push(0x20);
    else if (code <= 0xff) bytes.push(code);
    else bytes.push(replacements[code] ?? 63);
  }

  return Buffer.from(bytes);
}

function hexText(value: string) {
  return `<${winAnsiBytes(value).toString("hex").toUpperCase()}>`;
}

function estimateTextWidth(value: string, size: number, bold = false) {
  return [...value].reduce((total, character) => {
    if (" ilI1.,:'".includes(character)) return total + size * 0.27;
    if ("MW@%".includes(character)) return total + size * 0.82;
    return total + size * (bold ? 0.57 : 0.52);
  }, 0);
}

function truncate(value: string, maxWidth: number, size: number, bold = false) {
  if (estimateTextWidth(value, size, bold) <= maxWidth) return value;
  let result = value;
  while (result.length && estimateTextWidth(`${result}...`, size, bold) > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result.trim()}...`;
}

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function percent(value: number) {
  return `${Math.round(value)} %`;
}

class PdfCanvas {
  private commands: string[] = [];

  rect(x: number, y: number, width: number, height: number, fill: Color, stroke?: Color) {
    this.commands.push(
      `${rgb(fill)} rg${stroke ? ` ${rgb(stroke)} RG 0.7 w` : ""} ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re ${stroke ? "B" : "f"}`
    );
  }

  line(x1: number, y1: number, x2: number, y2: number, color: Color, width = 1) {
    this.commands.push(
      `${rgb(color)} RG ${width.toFixed(2)} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`
    );
  }

  text(
    value: string,
    x: number,
    y: number,
    size: number,
    color: Color = DARK,
    options: { bold?: boolean; align?: "left" | "center" | "right"; maxWidth?: number } = {}
  ) {
    const bold = Boolean(options.bold);
    const rendered = options.maxWidth
      ? truncate(value, options.maxWidth, size, bold)
      : value;
    const width = estimateTextWidth(rendered, size, bold);
    const drawX = options.align === "right"
      ? x - width
      : options.align === "center"
        ? x - width / 2
        : x;
    this.commands.push(
      `BT /${bold ? "F2" : "F1"} ${size.toFixed(2)} Tf ${rgb(color)} rg 1 0 0 1 ${drawX.toFixed(2)} ${y.toFixed(2)} Tm ${hexText(rendered)} Tj ET`
    );
  }

  image(x: number, y: number, width: number, height: number) {
    this.commands.push(
      `q ${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`
    );
  }

  output() {
    return Buffer.from(this.commands.join("\n"), "latin1");
  }
}

class PdfDocument {
  private objects: Array<Buffer | null> = [null];

  reserve() {
    this.objects.push(null);
    return this.objects.length - 1;
  }

  set(id: number, content: Buffer | string) {
    this.objects[id] = Buffer.isBuffer(content) ? content : Buffer.from(content, "latin1");
  }

  stream(dictionary: string, content: Buffer) {
    return Buffer.concat([
      Buffer.from(`<< ${dictionary} /Length ${content.length} >>\nstream\n`, "latin1"),
      content,
      Buffer.from("\nendstream", "latin1")
    ]);
  }

  build(rootId: number) {
    const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "latin1")];
    const offsets = [0];
    let offset = chunks[0].length;

    for (let id = 1; id < this.objects.length; id++) {
      const object = this.objects[id];
      if (!object) throw new Error(`PDF object ${id} is missing.`);
      offsets[id] = offset;
      const chunk = Buffer.concat([
        Buffer.from(`${id} 0 obj\n`, "latin1"),
        object,
        Buffer.from("\nendobj\n", "latin1")
      ]);
      chunks.push(chunk);
      offset += chunk.length;
    }

    const xrefOffset = offset;
    const xref = [
      `xref\n0 ${this.objects.length}\n`,
      "0000000000 65535 f \n",
      ...offsets.slice(1).map((value) => `${String(value).padStart(10, "0")} 00000 n \n`),
      `trailer\n<< /Size ${this.objects.length} /Root ${rootId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
    ].join("");
    chunks.push(Buffer.from(xref, "latin1"));
    return Buffer.concat(chunks);
  }
}

function summarySentence(data: MonthlyReportData) {
  if (data.income <= 0 && data.expenses <= 0) {
    return "Aucune opération n'a encore été enregistrée pour cette période.";
  }
  if (data.income <= 0) {
    return "Des dépenses sont présentes, mais aucun revenu n'a été enregistré pour ce mois.";
  }
  if (data.savings < 0) {
    return `Les dépenses dépassent les revenus de ${money(Math.abs(data.savings))}. Un ajustement est recommandé.`;
  }
  if (data.savingRate >= 20) {
    return `Très bon mois : ${percent(data.savingRate)} des revenus restent disponibles, soit ${money(data.savings)}.`;
  }
  return `Le mois se termine avec ${money(data.savings)} disponibles, soit un taux d'épargne de ${percent(data.savingRate)}.`;
}

function pageFooter(canvas: PdfCanvas, page: number, totalPages: number) {
  canvas.line(38, 42, PAGE_WIDTH - 38, 42, LINE, 0.7);
  canvas.text("FrontaBudget - Rapport personnel et confidentiel", 38, 25, 8, MUTED);
  canvas.text(`Page ${page} / ${totalPages}`, PAGE_WIDTH - 38, 25, 8, MUTED, { align: "right" });
}

function renderSummaryPage(canvas: PdfCanvas, data: MonthlyReportData) {
  canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, WHITE);
  canvas.rect(0, 728, PAGE_WIDTH, 114, NAVY);
  canvas.rect(0, 724, PAGE_WIDTH, 4, GREEN);
  canvas.rect(36, 748, 198, 70, WHITE);
  canvas.image(45, 757, 180, 52);
  canvas.text("RAPPORT MENSUEL", PAGE_WIDTH - 38, 795, 9, [151, 194, 180], { bold: true, align: "right" });
  canvas.text(data.periodLabel, PAGE_WIDTH - 38, 768, 22, WHITE, { bold: true, align: "right" });
  canvas.text(`Préparé pour ${data.ownerName} · Généré le ${data.generatedLabel}`, PAGE_WIDTH - 38, 747, 8.5, [197, 214, 228], { align: "right", maxWidth: 320 });

  const cards = [
    { label: "SALAIRE ET REVENUS", value: money(data.income), fill: LIGHT_GREEN, color: GREEN },
    { label: "DÉPENSES", value: money(data.expenses), fill: LIGHT_ROSE, color: ROSE },
    { label: data.savings >= 0 ? "ÉPARGNE NETTE" : "DÉFICIT", value: money(Math.abs(data.savings)), fill: LIGHT_BLUE, color: data.savings >= 0 ? NAVY : ROSE },
    { label: "TAUX D'ÉPARGNE", value: percent(data.savingRate), fill: [244, 240, 251] as Color, color: [105, 70, 158] as Color }
  ];

  cards.forEach((card, index) => {
    const x = 38 + index * 131;
    canvas.rect(x, 635, 121, 67, card.fill, LINE);
    canvas.text(card.label, x + 10, 680, 7.2, MUTED, { bold: true, maxWidth: 101 });
    canvas.text(card.value, x + 10, 653, 15, card.color, { bold: true, maxWidth: 101 });
  });

  canvas.text("LE MOIS EN UN COUP D'OEIL", 38, 601, 8, GREEN, { bold: true });
  canvas.rect(38, 529, PAGE_WIDTH - 76, 58, LIGHT_BLUE, LINE);
  canvas.text(summarySentence(data), 53, 560, 11, DARK, { bold: true, maxWidth: PAGE_WIDTH - 106 });
  const salaryDetail = data.salaryIncome > 0
    ? `Dont salaire identifié : ${money(data.salaryIncome)}.`
    : "Les revenus comprennent toutes les entrées enregistrées sur la période.";
  canvas.text(salaryDetail, 53, 542, 8.5, MUTED, { maxWidth: PAGE_WIDTH - 106 });

  canvas.text("RÉPARTITION DES DÉPENSES", 38, 496, 9, NAVY, { bold: true });
  canvas.text("BUDGETS", 348, 496, 9, NAVY, { bold: true });
  canvas.line(38, 486, 322, 486, LINE, 0.8);
  canvas.line(348, 486, PAGE_WIDTH - 38, 486, LINE, 0.8);

  const topCategories = data.categories.slice(0, 7);
  const maxCategory = Math.max(1, ...topCategories.map((category) => category.amount));
  if (!topCategories.length) {
    canvas.rect(38, 392, 284, 78, [248, 250, 252], LINE);
    canvas.text("Aucune dépense pour ce mois.", 52, 427, 10, MUTED);
  } else {
    topCategories.forEach((category, index) => {
      const y = 459 - index * 52;
      const share = data.expenses > 0 ? (category.amount / data.expenses) * 100 : 0;
      canvas.text(category.name, 38, y, 9, DARK, { bold: true, maxWidth: 150 });
      canvas.text(`${money(category.amount)}  ·  ${percent(share)}`, 322, y, 8, MUTED, { align: "right" });
      canvas.rect(38, y - 15, 284, 7, [237, 242, 247]);
      canvas.rect(38, y - 15, Math.max(3, 284 * (category.amount / maxCategory)), 7, GREEN);
    });
  }

  const topBudgets = data.budgets.slice(0, 7);
  if (!topBudgets.length) {
    canvas.rect(348, 392, PAGE_WIDTH - 386, 78, [248, 250, 252], LINE);
    canvas.text("Aucun budget défini.", 362, 427, 10, MUTED);
  } else {
    topBudgets.forEach((budget, index) => {
      const y = 459 - index * 52;
      const ratio = budget.planned > 0 ? (budget.spent / budget.planned) * 100 : 0;
      const statusColor = ratio > 100 ? ROSE : ratio >= 80 ? [204, 143, 22] as Color : GREEN;
      canvas.text(budget.name, 348, y, 9, DARK, { bold: true, maxWidth: 125 });
      canvas.text(percent(ratio), PAGE_WIDTH - 38, y, 8, statusColor, { bold: true, align: "right" });
      canvas.text(`${money(budget.spent)} sur ${money(budget.planned)}`, 348, y - 16, 7.7, MUTED, { maxWidth: PAGE_WIDTH - 386 });
      canvas.rect(348, y - 29, PAGE_WIDTH - 386, 6, [237, 242, 247]);
      canvas.rect(348, y - 29, Math.min(PAGE_WIDTH - 386, Math.max(3, (PAGE_WIDTH - 386) * ratio / 100)), 6, statusColor);
    });
  }
}

function renderTransactionsPage(
  canvas: PdfCanvas,
  data: MonthlyReportData,
  rows: TransactionRow[],
  page: number,
  totalPages: number
) {
  canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, WHITE);
  canvas.rect(0, 770, PAGE_WIDTH, 72, NAVY);
  canvas.rect(0, 766, PAGE_WIDTH, 4, GREEN);
  canvas.rect(36, 783, 132, 42, WHITE);
  canvas.image(43, 789, 118, 30);
  canvas.text("DÉTAIL DES OPÉRATIONS", PAGE_WIDTH - 38, 806, 13, WHITE, { bold: true, align: "right" });
  canvas.text(data.periodLabel, PAGE_WIDTH - 38, 786, 9, [197, 214, 228], { align: "right" });

  canvas.rect(38, 719, PAGE_WIDTH - 76, 29, LIGHT_BLUE);
  canvas.text("DATE", 47, 730, 7.5, MUTED, { bold: true });
  canvas.text("OPÉRATION", 105, 730, 7.5, MUTED, { bold: true });
  canvas.text("CATÉGORIE", 308, 730, 7.5, MUTED, { bold: true });
  canvas.text("TYPE", 418, 730, 7.5, MUTED, { bold: true });
  canvas.text("MONTANT", PAGE_WIDTH - 47, 730, 7.5, MUTED, { bold: true, align: "right" });

  if (!rows.length) {
    canvas.rect(38, 615, PAGE_WIDTH - 76, 82, [248, 250, 252], LINE);
    canvas.text("Aucune opération enregistrée pour cette période.", PAGE_WIDTH / 2, 651, 11, MUTED, { align: "center" });
  } else {
    rows.forEach((transaction, index) => {
      const y = 693 - index * 29;
      if (index % 2 === 0) canvas.rect(38, y - 9, PAGE_WIDTH - 76, 27, [248, 250, 252]);
      canvas.text(transaction.date, 47, y, 8, MUTED);
      canvas.text(transaction.name, 105, y, 8.5, DARK, { bold: true, maxWidth: 188 });
      canvas.text(transaction.category, 308, y, 8, MUTED, { maxWidth: 96 });
      canvas.text(transaction.type === "income" ? "Revenu" : "Dépense", 418, y, 8, transaction.type === "income" ? GREEN : ROSE, { bold: true });
      canvas.text(`${transaction.type === "income" ? "+" : "-"} ${money(transaction.amount)}`, PAGE_WIDTH - 47, y, 8.5, transaction.type === "income" ? GREEN : DARK, { bold: true, align: "right" });
      canvas.line(38, y - 11, PAGE_WIDTH - 38, y - 11, LINE, 0.35);
    });
  }

  pageFooter(canvas, page, totalPages);
}

export function generateMonthlyReportPdf(data: MonthlyReportData) {
  const rowsPerPage = 20;
  const transactionChunks: TransactionRow[][] = [];
  if (!data.transactions.length) transactionChunks.push([]);
  for (let index = 0; index < data.transactions.length; index += rowsPerPage) {
    transactionChunks.push(data.transactions.slice(index, index + rowsPerPage));
  }
  const totalPages = 1 + transactionChunks.length;
  const document = new PdfDocument();
  const regularFontId = document.reserve();
  const boldFontId = document.reserve();
  const imageId = document.reserve();
  const pagesId = document.reserve();
  const catalogId = document.reserve();
  const pageIds: number[] = [];

  document.set(regularFontId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  document.set(boldFontId, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  document.set(
    imageId,
    document.stream(
      "/Type /XObject /Subtype /Image /Width 838 /Height 320 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode",
      data.logoJpeg
    )
  );

  const canvases = [new PdfCanvas(), ...transactionChunks.map(() => new PdfCanvas())];
  renderSummaryPage(canvases[0], data);
  pageFooter(canvases[0], 1, totalPages);
  transactionChunks.forEach((rows, index) => {
    renderTransactionsPage(canvases[index + 1], data, rows, index + 2, totalPages);
  });

  canvases.forEach((canvas, index) => {
    const contentId = document.reserve();
    const pageId = document.reserve();
    pageIds.push(pageId);
    document.set(contentId, document.stream("", canvas.output()));
    document.set(
      pageId,
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`
    );
  });
  document.set(pagesId, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`);
  document.set(catalogId, `<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  return document.build(catalogId);
}
