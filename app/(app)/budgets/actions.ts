"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

const budgetSchema = z.object({
  categoryId: z.string().uuid(),
  amount: z.number().finite().min(0).max(1_000_000_000),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100)
});

export type SaveBudgetResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function saveBudget(input: unknown): Promise<SaveBudgetResult> {
  const parsed = budgetSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Les informations du budget sont invalides." };
  }

  const { supabase, user } = await requireUser();
  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id,name")
    .eq("id", parsed.data.categoryId)
    .eq("user_id", user.id)
    .eq("type", "expense")
    .maybeSingle();

  if (categoryError || !category) {
    return { ok: false, message: "Cette catégorie de dépense est invalide." };
  }

  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: user.id,
      category_id: category.id,
      month: parsed.data.month,
      year: parsed.data.year,
      planned_amount: parsed.data.amount
    },
    { onConflict: "user_id,category_id,month,year" }
  );

  if (error) {
    return {
      ok: false,
      message: "La modification n’a pas été enregistrée. Réessaie dans un instant."
    };
  }

  revalidatePath("/budgets");
  revalidatePath("/dashboard");

  return {
    ok: true,
    message: `Budget ${category.name} enregistré pour ${parsed.data.month}/${parsed.data.year}.`
  };
}
