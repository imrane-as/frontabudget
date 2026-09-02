export const MAX_PAYSLIP_SIZE = 12 * 1024 * 1024;

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre"
] as const;

const MONTH_ALIASES: Record<string, number> = {
  janvier: 1,
  janv: 1,
  fevrier: 2,
  fevr: 2,
  mars: 3,
  avril: 4,
  avr: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  juil: 7,
  aout: 8,
  septembre: 9,
  sept: 9,
  octobre: 10,
  oct: 10,
  novembre: 11,
  nov: 11,
  decembre: 12,
  dec: 12
};

const SALARY_LABELS = [
  { pattern: /a\s+verser/i, priority: 130 },
  {
    pattern: /net\s+a\s+payer\s+avant\s+impot(?:\s+sur\s+le\s+revenu)?/i,
    priority: 125
  },
  { pattern: /net\s+paye/i, priority: 120 },
  { pattern: /net\s+a\s+payer/i, priority: 115 },
  { pattern: /net\s+verse/i, priority: 110 },
  { pattern: /montant\s+net\s+social/i, priority: 90 }
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFrenchAmount(raw: string) {
  const compact = raw.replace(/[\s\u00a0\u202f€]/g, "");
  const lastComma = compact.lastIndexOf(",");
  const lastDot = compact.lastIndexOf(".");
  let normalized = compact;

  if (lastComma >= 0 && lastDot >= 0) {
    normalized = lastComma > lastDot
      ? compact.replace(/\./g, "").replace(",", ".")
      : compact.replace(/,/g, "");
  } else if (lastComma >= 0) {
    normalized = compact.length - lastComma - 1 === 2
      ? compact.replace(/,/g, ".")
      : compact.replace(/,/g, "");
  } else if (lastDot >= 0 && compact.length - lastDot - 1 !== 2) {
    normalized = compact.replace(/\./g, "");
  }

  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 && value <= 1_000_000_000
    ? Math.round(value * 100) / 100
    : null;
}

function amountsIn(value: string) {
  const matches =
    value.match(
      /(?:\d{1,3}(?:[ .,\u00a0\u202f]\d{3})+|\d+)(?:[,.]\d{2})/g
    ) || [];
  return matches
    .map(parseFrenchAmount)
    .filter((amount): amount is number => amount !== null);
}

export function detectNetSalary(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalize(line))
    .filter(Boolean);

  const candidates: Array<{ amount: number; score: number }> = [];

  for (const label of SALARY_LABELS) {
    for (let index = 0; index < lines.length; index += 1) {
      if (!label.pattern.test(lines[index])) continue;

      const cumulativeContext = lines
        .slice(Math.max(0, index - 12), index)
        .some((line) => /cumuls?|year\s+to\s+date/i.test(line));
      const locations = [
        { value: lines[index], proximity: 9 },
        { value: lines[index + 1] || "", proximity: 12 },
        { value: lines[index + 2] || "", proximity: 4 }
      ];

      for (const location of locations) {
        const values = amountsIn(location.value);
        for (const amount of values) {
          candidates.push({
            amount,
            score:
              label.priority +
              location.proximity -
              (cumulativeContext ? 100 : 0)
          });
        }
      }
    }
  }

  candidates.sort((left, right) => right.score - left.score);
  return candidates[0]?.amount || null;
}

export function detectEmployerName(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const legalForm =
    /\b(S\.?A\.?R\.?L\.?|SARL-S|S\.?A\.?S\.?U?\.?|S\.?A\.?|GMBH|LTD|LIMITED)\b/i;

  for (const line of lines) {
    if (!legalForm.test(line)) continue;

    const company = line.split(/\s+[-–—]\s+/)[0].trim();
    if (company.length >= 2 && company.length <= 120) return company;
  }

  return null;
}

export function detectPayslipPeriod(text: string) {
  const normalized = normalize(text).toLowerCase();
  const numericPeriod = normalized.match(
    /periode\s+du.{0,100}?(\d{1,2})[/.\-](\d{1,2})[/.\-](20\d{2})/i
  );

  if (numericPeriod) {
    const month = Number(numericPeriod[2]);
    const year = Number(numericPeriod[3]);
    if (month >= 1 && month <= 12) return { month, year };
  }

  const monthNames = Object.keys(MONTH_ALIASES).join("|");
  const prioritized = new RegExp(
    `(?:periode|mois|bulletin)[^\\n]{0,40}?(${monthNames})\\.?\\s+(20\\d{2})`,
    "i"
  );
  const generic = new RegExp(`\\b(${monthNames})\\.?\\s+(20\\d{2})\\b`, "i");
  const match = normalized.match(prioritized) || normalized.match(generic);

  if (!match) return null;

  return {
    month: MONTH_ALIASES[match[1].toLowerCase()],
    year: Number(match[2])
  };
}

export function formatPayslipPeriod(year: number, month: number) {
  return `${MONTHS[month - 1] || "Mois"} ${year}`;
}

export function formatFileSize(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} Ko`;
  return `${(size / (1024 * 1024)).toLocaleString("fr-FR", {
    maximumFractionDigits: 1
  })} Mo`;
}
