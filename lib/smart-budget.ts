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
  dailySpend: number;
  projectedExpenses: number;
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
  alertThreshold = 80
}: {
  transactions: Transaction[];
  budgets: Budget[];
  now?: Date;
  alertThreshold?: number;
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
    dailySpend,
    projectedExpenses,
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
