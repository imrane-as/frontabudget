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
  /net\s+a\s+payer\s+avant\s+impot(?:\s+sur\s+le\s+revenu)?/i,
  /net\s+paye/i,
  /net\s+a\s+payer/i,
  /net\s+verse/i,
  /montant\s+net\s+social/i
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
  const normalized = compact.includes(",")
    ? compact.replace(/\./g, "").replace(",", ".")
    : compact;
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 && value <= 1_000_000_000
    ? Math.round(value * 100) / 100
    : null;
}

function amountsIn(value: string) {
  const matches = value.match(/(?:\d{1,3}(?:[ .\u00a0\u202f]\d{3})+|\d+)[,.]\d{2}/g) || [];
  return matches
    .map(parseFrenchAmount)
    .filter((amount): amount is number => amount !== null);
}

export function detectNetSalary(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalize(line))
    .filter(Boolean);

  for (const label of SALARY_LABELS) {
    for (let index = 0; index < lines.length; index += 1) {
      if (!label.test(lines[index])) continue;

      const nearby = lines.slice(index, index + 3).join(" ");
      const values = amountsIn(nearby);
      if (values.length) return values.at(-1) || null;
    }
  }

  return null;
}

export function detectPayslipPeriod(text: string) {
  const normalized = normalize(text).toLowerCase();
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

