export type BudgetItem = {
  id: string;
  categoryId: string;
  categoryName: string;
  planned: number;
  spent: number;
  percentage: number;
  projected: number;
  projectedPercentage: number;
  status: "safe" | "warning" | "exceeded";
};

export type BudgetSnapshot = {
  income: number;
  expenses: number;
  remaining: number;
  savingRate: number;
  dayOfMonth: number;
  daysInMonth: number;
  daysRemaining: number;
  dailySpend: number;
  projectedExpenses: number;
  monthlySavingsTarget: number;
  safeToSpend: number;
  safeToSpendDaily: number;
  safeToSpendWeekly: number;
  categories: Array<{ name: string; amount: number }>;
  budgets: BudgetItem[];
};

type Transaction = {
  amount: number | string;
  type: "income" | "expense" | string;
  category_id?: string | null;
  categories?: { name?: string | null } | { name?: string | null }[] | null;
};

type Budget = {
  id: string;
  category_id: string;
  planned_amount: number | string;
  categories?: { name?: string | null } | { name?: string | null }[] | null;
};

function categoryName(
  value: Transaction["categories"] | Budget["categories"]
) {
  const category = Array.isArray(value) ? value[0] : value;
  return category?.name || "Autre";
}

export function buildBudgetSnapshot({
  transactions,
  budgets,
  now = new Date(),
  alertThreshold = 80,
  monthlySavingsTarget = 0
}: {
  transactions: Transaction[];
  budgets: Budget[];
  now?: Date;
  alertThreshold?: number;
  monthlySavingsTarget?: number;
}): BudgetSnapshot {
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0);
  const expenseTransactions = transactions.filter(
    (transaction) => transaction.type === "expense"
  );
  const expenses = expenseTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  );
  const remaining = income - expenses;
  const dayOfMonth = Math.max(1, now.getDate());
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const dailySpend = expenses / dayOfMonth;
  const projectedExpenses = dailySpend * daysInMonth;
  const daysRemaining = Math.max(1, daysInMonth - dayOfMonth + 1);
  const safeToSpend =
    income > 0 ? Math.max(0, income - expenses - monthlySavingsTarget) : 0;
  const safeToSpendDaily = safeToSpend / daysRemaining;

  const categoryTotals = new Map<string, number>();
  const categoryLabels = new Map<string, string>();

  for (const transaction of expenseTransactions) {
    const key = transaction.category_id || "uncategorized";
    categoryTotals.set(
      key,
      (categoryTotals.get(key) || 0) + Number(transaction.amount)
    );
    categoryLabels.set(key, categoryName(transaction.categories));
  }

  const budgetItems = budgets
    .map((budget) => {
      const planned = Number(budget.planned_amount);
      const spent = categoryTotals.get(budget.category_id) || 0;
      const percentage = planned > 0 ? (spent / planned) * 100 : 0;
      const projected = (spent / dayOfMonth) * daysInMonth;
      const projectedPercentage =
        planned > 0 ? (projected / planned) * 100 : 0;

      return {
        id: budget.id,
        categoryId: budget.category_id,
        categoryName: categoryName(budget.categories),
        planned,
        spent,
        percentage,
        projected,
        projectedPercentage,
        status:
          percentage >= 100
            ? ("exceeded" as const)
            : percentage >= alertThreshold
              ? ("warning" as const)
              : ("safe" as const)
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  const categories = [...categoryTotals.entries()]
    .map(([key, amount]) => ({
      name: categoryLabels.get(key) || "Autre",
      amount
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    income,
    expenses,
    remaining,
    savingRate: income > 0 ? Math.max(0, (remaining / income) * 100) : 0,
    dayOfMonth,
    daysInMonth,
    daysRemaining,
    dailySpend,
    projectedExpenses,
    monthlySavingsTarget,
    safeToSpend,
    safeToSpendDaily,
    safeToSpendWeekly: safeToSpendDaily * 7,
    categories,
    budgets: budgetItems
  };
}

const categoryAdvice: Record<string, string> = {
  restaurants:
    "Prépare 2 repas de plus à la maison cette semaine et fixe une enveloppe restaurant.",
  abonnements:
    "Vérifie les abonnements peu utilisés : en suspendre un crée une économie immédiate.",
  courses:
    "Fais une liste avant les courses et compare le prix au kilo pour éviter les achats impulsifs.",
  carburant:
    "Regroupe tes déplacements et vérifie la pression des pneus pour réduire le carburant.",
  voiture:
    "Compare le coût réel voiture, parking et carburant avec le covoiturage sur tes jours bureau.",
  énergie:
    "Décale lave-linge et lave-vaisselle en heures creuses si ton contrat les prévoit.",
  shopping:
    "Applique une attente de 48 h avant tout achat shopping non prévu.",
  téléphone:
    "Compare ton forfait à ta consommation réelle de data avant le prochain renouvellement.",
  voyage:
    "Crée une enveloppe voyage séparée pour protéger ton budget courant.",
  logement:
    "Passe en revue assurance, énergie et internet : ce sont les postes logement les plus négociables."
};

export function buildLocalInsights(snapshot: BudgetSnapshot): string[] {
  const tips: string[] = [];
  const riskyBudget = snapshot.budgets.find(
    (budget) => budget.status !== "safe" || budget.projectedPercentage >= 100
  );

  if (riskyBudget) {
    const verb =
      riskyBudget.status === "exceeded" ? "a dépassé" : "approche";
    tips.push(
      `Le budget ${riskyBudget.categoryName} ${verb} sa limite : ${Math.round(riskyBudget.percentage)} % consommé.`
    );
  }

  if (snapshot.income > 0 && snapshot.projectedExpenses > snapshot.income) {
    tips.push(
      `À ce rythme, tes dépenses atteindraient ${Math.round(snapshot.projectedExpenses)} € avant la fin du mois.`
    );
  } else if (snapshot.income > 0 && snapshot.savingRate >= 15) {
    tips.push(
      `Bon rythme : ${snapshot.savingRate.toFixed(0)} % de tes revenus restent disponibles ce mois-ci.`
    );
  }

  if (snapshot.safeToSpendDaily > 0) {
    tips.push(
      `Pour protéger ${Math.round(snapshot.monthlySavingsTarget)} € d’épargne, reste autour de ${Math.round(snapshot.safeToSpendDaily)} € par jour.`
    );
  }

  const topCategory = snapshot.categories[0];
  if (topCategory) {
    const specific = categoryAdvice[topCategory.name.toLocaleLowerCase("fr")];
    tips.push(
      specific ||
        `${topCategory.name} est ton premier poste de dépense : fixe-lui un plafond simple pour la semaine.`
    );
  }

  if (!snapshot.budgets.length) {
    tips.push(
      "Ajoute un budget aux 3 catégories les plus importantes pour recevoir des alertes utiles."
    );
  }

  if (!snapshot.categories.length && tips.length === 0) {
    tips.push("Ajoute tes premières dépenses pour obtenir une analyse personnalisée.");
  }

  return tips.slice(0, 3);
}

export type FinancialHealth = {
  score: number;
  label: string;
  summary: string;
  signals: Array<{ label: string; positive: boolean }>;
};

export function calculateFinancialHealth(
  snapshot: BudgetSnapshot
): FinancialHealth {
  let score = 35;
  const signals: Array<{ label: string; positive: boolean }> = [];

  if (snapshot.income > 0) {
    score += 15;
    signals.push({ label: "Revenus renseignés", positive: true });
  } else {
    signals.push({ label: "Ajoute ton revenu mensuel", positive: false });
  }

  if (snapshot.savingRate >= 20) {
    score += 20;
    signals.push({ label: "Excellent potentiel d’épargne", positive: true });
  } else if (snapshot.savingRate >= 10) {
    score += 12;
    signals.push({ label: "Épargne en bonne voie", positive: true });
  } else if (snapshot.savingRate > 0) {
    score += 5;
    signals.push({ label: "Marge d’épargne à renforcer", positive: false });
  } else if (snapshot.expenses > 0) {
    score -= 10;
    signals.push({ label: "Dépenses supérieures aux revenus", positive: false });
  }

  if (snapshot.budgets.length >= 3) {
    score += 15;
    signals.push({ label: "Budgets bien structurés", positive: true });
  } else if (snapshot.budgets.length > 0) {
    score += 8;
    signals.push({ label: "Ajoute encore quelques plafonds", positive: false });
  } else {
    signals.push({ label: "Aucun plafond défini", positive: false });
  }

  const exceeded = snapshot.budgets.some((budget) => budget.status === "exceeded");
  const warning = snapshot.budgets.some((budget) => budget.status === "warning");
  if (exceeded) {
    score -= 15;
    signals.push({ label: "Un budget est dépassé", positive: false });
  } else if (warning) {
    score -= 5;
    signals.push({ label: "Un budget approche sa limite", positive: false });
  } else if (snapshot.budgets.length) {
    score += 10;
    signals.push({ label: "Plafonds sous contrôle", positive: true });
  }

  if (
    snapshot.income > 0 &&
    snapshot.projectedExpenses <=
      Math.max(0, snapshot.income - snapshot.monthlySavingsTarget)
  ) {
    score += 15;
    signals.push({ label: "Projection compatible avec ton objectif", positive: true });
  } else if (snapshot.income > 0 && snapshot.projectedExpenses > snapshot.income) {
    score -= 10;
    signals.push({ label: "Rythme de dépense trop élevé", positive: false });
  }

  score = Math.max(0, Math.min(100, score));
  const label =
    score >= 80 ? "Excellent" : score >= 65 ? "Solide" : score >= 45 ? "À équilibrer" : "À reprendre";
  const summary =
    score >= 80
      ? "Ton budget est bien maîtrisé. Garde ce rythme."
      : score >= 65
        ? "Ta base est saine, quelques ajustements peuvent encore aider."
        : score >= 45
          ? "Tu as une bonne visibilité, mais ta marge reste fragile."
          : "Commence par fixer trois plafonds simples et ton objectif d’épargne.";

  return { score, label, summary, signals: signals.slice(-4) };
}
