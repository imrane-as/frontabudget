export type TransactionType = "income" | "expense";

export const EXPENSE_CATEGORY_NAMES = [
  "Logement",
  "Voiture",
  "Carburant",
  "Courses",
  "Restaurants",
  "Énergie",
  "Téléphone",
  "Assurances",
  "Abonnements",
  "Sport",
  "Shopping",
  "Voyage",
  "Autre"
] as const;

export const INCOME_CATEGORY_NAMES = ["Salaire", "Prime"] as const;

export type ExpenseCategoryName = (typeof EXPENSE_CATEGORY_NAMES)[number];
export type IncomeCategoryName = (typeof INCOME_CATEGORY_NAMES)[number];
export type TransactionCategoryName = ExpenseCategoryName | IncomeCategoryName;
export type CategorizationSource = "local" | "ai" | "fallback";

export type MerchantPresentation = {
  displayName: string;
  logoText: string;
  accent: string;
  foreground: string;
  wide?: boolean;
};

export type CategorizationSuggestion = MerchantPresentation & {
  categoryName: TransactionCategoryName;
  icon: string;
  confidence: number;
  source: CategorizationSource;
};

type MerchantRule = MerchantPresentation & {
  categoryName: TransactionCategoryName;
  confidence: number;
  pattern: RegExp;
  type?: TransactionType;
};

export const CATEGORY_ICONS: Record<TransactionCategoryName, string> = {
  Salaire: "💰",
  Prime: "🎁",
  Logement: "🏠",
  Voiture: "🚗",
  Carburant: "⛽",
  Courses: "🛒",
  Restaurants: "🍽️",
  Énergie: "⚡",
  Téléphone: "📱",
  Assurances: "🛡️",
  Abonnements: "📺",
  Sport: "🏋️",
  Shopping: "🛍️",
  Voyage: "✈️",
  Autre: "📦"
};

const CATEGORY_COLORS: Record<TransactionCategoryName, string> = {
  Salaire: "#059669",
  Prime: "#7c3aed",
  Logement: "#2563eb",
  Voiture: "#475569",
  Carburant: "#ea580c",
  Courses: "#16a34a",
  Restaurants: "#dc2626",
  Énergie: "#ca8a04",
  Téléphone: "#0891b2",
  Assurances: "#4f46e5",
  Abonnements: "#7c3aed",
  Sport: "#059669",
  Shopping: "#db2777",
  Voyage: "#0284c7",
  Autre: "#475569"
};

const merchantRules: MerchantRule[] = [
  {
    pattern: /\bnetflix\b/,
    displayName: "Netflix",
    logoText: "N",
    accent: "#e50914",
    foreground: "#ffffff",
    categoryName: "Abonnements",
    confidence: 0.99
  },
  {
    pattern: /(?:\bdisney\s*\+|\bdisneyplus\b)/,
    displayName: "Disney+",
    logoText: "D+",
    accent: "#113ccf",
    foreground: "#ffffff",
    categoryName: "Abonnements",
    confidence: 0.99
  },
  {
    pattern: /\b(prime video|amazon prime)\b/,
    displayName: "Prime Video",
    logoText: "▶",
    accent: "#00a8e1",
    foreground: "#031b2d",
    categoryName: "Abonnements",
    confidence: 0.98
  },
  {
    pattern: /\bspotify\b/,
    displayName: "Spotify",
    logoText: "S",
    accent: "#1ed760",
    foreground: "#07150c",
    categoryName: "Abonnements",
    confidence: 0.99
  },
  {
    pattern: /\b(deezer|apple music|youtube premium|canal\s*\+|paramount\s*\+|max hbo|hbo max)\b/,
    displayName: "Streaming",
    logoText: "▶",
    accent: "#7c3aed",
    foreground: "#ffffff",
    categoryName: "Abonnements",
    confidence: 0.94
  },
  {
    pattern: /\bsosh\b/,
    displayName: "Sosh",
    logoText: "sosh",
    accent: "#d6f000",
    foreground: "#111827",
    wide: true,
    categoryName: "Téléphone",
    confidence: 0.99
  },
  {
    pattern: /\b(orange mobile|orange telecom|orange fr)\b/,
    displayName: "Orange",
    logoText: "O",
    accent: "#ff7900",
    foreground: "#111111",
    categoryName: "Téléphone",
    confidence: 0.96
  },
  {
    pattern: /\b(free mobile|free telecom|sfr|red by sfr|bouygues telecom|b\s*(?:&|and)\s*you|nrj mobile|lycamobile)\b/,
    displayName: "Opérateur mobile",
    logoText: "SIM",
    accent: "#0891b2",
    foreground: "#ffffff",
    categoryName: "Téléphone",
    confidence: 0.94
  },
  {
    pattern: /\b(credit|financement|mensualite|echeance)\b.*\biphone\b|\biphone\b.*\b(credit|financement|mensualite|echeance)\b/,
    displayName: "Crédit iPhone",
    logoText: "iP",
    accent: "#e5e7eb",
    foreground: "#111827",
    categoryName: "Téléphone",
    confidence: 0.98
  },
  {
    pattern: /\b(iphone|forfait mobile|telephone mobile|facture telephone)\b/,
    displayName: "Téléphone",
    logoText: "TEL",
    accent: "#0891b2",
    foreground: "#ffffff",
    categoryName: "Téléphone",
    confidence: 0.9
  },
  {
    pattern: /\b(edf|engie|enedis|totalenergies electricite|ekwateur|ilek)\b/,
    displayName: "Énergie",
    logoText: "⚡",
    accent: "#facc15",
    foreground: "#422006",
    categoryName: "Énergie",
    confidence: 0.96
  },
  {
    pattern: /\b(carrefour|auchan|lidl|aldi|e\.?\s*leclerc|intermarche|monoprix|franprix|casino supermarche|super u|match)\b/,
    displayName: "Supermarché",
    logoText: "🛒",
    accent: "#16a34a",
    foreground: "#ffffff",
    categoryName: "Courses",
    confidence: 0.95
  },
  {
    pattern: /\b(uber eats|ubereats|deliveroo|just eat|mcdonalds|mcdo|burger king|kfc|subway|starbucks|restaurant|brasserie|boulangerie)\b/,
    displayName: "Restaurant",
    logoText: "🍽",
    accent: "#dc2626",
    foreground: "#ffffff",
    categoryName: "Restaurants",
    confidence: 0.92
  },
  {
    pattern: /\b(total access|station total|esso|shell|bp station|avia|e10|sp95|sp98|gazole|diesel|carburant)\b/,
    displayName: "Carburant",
    logoText: "⛽",
    accent: "#ea580c",
    foreground: "#ffffff",
    categoryName: "Carburant",
    confidence: 0.94
  },
  {
    pattern: /\b(loyer|bailleur|credit immobilier|pret immobilier|hypotheque|copropriete)\b/,
    displayName: "Logement",
    logoText: "⌂",
    accent: "#2563eb",
    foreground: "#ffffff",
    categoryName: "Logement",
    confidence: 0.93
  },
  {
    pattern: /\b(maif|macif|mma|axa|allianz|groupama|assurance|mutuelle)\b/,
    displayName: "Assurance",
    logoText: "✓",
    accent: "#4f46e5",
    foreground: "#ffffff",
    categoryName: "Assurances",
    confidence: 0.92
  },
  {
    pattern: /\b(decathlon|basic fit|basicfit|fitness park|keep cool|salle de sport|abonnement sport)\b/,
    displayName: "Sport",
    logoText: "SP",
    accent: "#059669",
    foreground: "#ffffff",
    categoryName: "Sport",
    confidence: 0.92
  },
  {
    pattern: /\b(amazon(?! prime)|zalando|shein|h\s*&\s*m|zara|uniqlo|cdiscount|fnac|darty|boulanger)\b/,
    displayName: "Shopping",
    logoText: "SHOP",
    accent: "#db2777",
    foreground: "#ffffff",
    wide: true,
    categoryName: "Shopping",
    confidence: 0.9
  },
  {
    pattern: /\b(air france|ryanair|easyjet|booking|airbnb|hotel|voyage|vacances)\b/,
    displayName: "Voyage",
    logoText: "✈",
    accent: "#0284c7",
    foreground: "#ffffff",
    categoryName: "Voyage",
    confidence: 0.92
  },
  {
    pattern: /\b(autoroute|peage|parking|garage|controle technique|reparation auto|leasing auto|credit auto)\b/,
    displayName: "Voiture",
    logoText: "AUTO",
    accent: "#475569",
    foreground: "#ffffff",
    wide: true,
    categoryName: "Voiture",
    confidence: 0.9
  },
  {
    pattern: /\b(salaire|paie|payroll|virement employeur)\b/,
    displayName: "Salaire",
    logoText: "€",
    accent: "#059669",
    foreground: "#ffffff",
    categoryName: "Salaire",
    confidence: 0.96,
    type: "income"
  },
  {
    pattern: /\b(prime|bonus|interessement|participation)\b/,
    displayName: "Prime",
    logoText: "+",
    accent: "#7c3aed",
    foreground: "#ffffff",
    categoryName: "Prime",
    confidence: 0.94,
    type: "income"
  }
];

export function normalizeTransactionName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9+&.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findRule(name: string, type?: TransactionType) {
  const normalized = normalizeTransactionName(name);

  return merchantRules.find((rule) => {
    if (type && rule.type && rule.type !== type) {
      return false;
    }

    if (type === "income" && !rule.type) {
      return false;
    }

    if (type === "expense" && rule.type === "income") {
      return false;
    }

    return rule.pattern.test(normalized);
  });
}

export function categorizeLocally(
  name: string,
  type: TransactionType
): CategorizationSuggestion | null {
  const rule = findRule(name, type);

  if (!rule) {
    return null;
  }

  return {
    displayName: rule.displayName,
    logoText: rule.logoText,
    accent: rule.accent,
    foreground: rule.foreground,
    wide: rule.wide,
    categoryName: rule.categoryName,
    icon: CATEGORY_ICONS[rule.categoryName],
    confidence: rule.confidence,
    source: "local"
  };
}

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (!words.length) {
    return "€";
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase("fr")
    .slice(0, 2);
}

export function getMerchantPresentation(
  name: string,
  categoryName: TransactionCategoryName | string = "Autre"
): MerchantPresentation {
  const rule = findRule(name);

  if (rule) {
    return {
      displayName: rule.displayName,
      logoText: rule.logoText,
      accent: rule.accent,
      foreground: rule.foreground,
      wide: rule.wide
    };
  }

  const resolvedCategory = Object.prototype.hasOwnProperty.call(
    CATEGORY_COLORS,
    categoryName
  )
    ? (categoryName as TransactionCategoryName)
    : "Autre";

  return {
    displayName: name.trim() || "Transaction",
    logoText: initials(name),
    accent: CATEGORY_COLORS[resolvedCategory],
    foreground: "#ffffff"
  };
}

export function buildFallbackSuggestion(
  name: string,
  type: TransactionType
): CategorizationSuggestion {
  const categoryName: TransactionCategoryName =
    type === "income" ? "Salaire" : "Autre";
  const presentation = getMerchantPresentation(name, categoryName);

  return {
    ...presentation,
    categoryName,
    icon: CATEGORY_ICONS[categoryName],
    confidence: 0.35,
    source: "fallback"
  };
}

export function isCategoryName(
  value: string,
  type: TransactionType
): value is TransactionCategoryName {
  const allowed =
    type === "income" ? INCOME_CATEGORY_NAMES : EXPENSE_CATEGORY_NAMES;

  return (allowed as readonly string[]).includes(value);
}

export function sanitizeMerchantDisplayName(value: string, fallback: string) {
  const cleaned = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  return cleaned || fallback.trim().slice(0, 80) || "Transaction";
}
