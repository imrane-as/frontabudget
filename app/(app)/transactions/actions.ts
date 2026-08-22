"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

const transactionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  amount: z.number().finite().positive().max(1_000_000_000),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().uuid().nullable(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
    })
});

export type SaveTransactionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function saveTransaction(
  input: unknown
): Promise<SaveTransactionResult> {
  const parsed = transactionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Les informations de la transaction sont invalides." };
  }

  const { supabase, user } = await requireUser();
  const { categoryId, type } = parsed.data;

  if (categoryId) {
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .eq("user_id", user.id)
      .eq("type", type)
      .maybeSingle();

    if (categoryError || !category) {
      return { ok: false, message: "Cette catégorie ne correspond pas à la transaction." };
    }
  }

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    category_id: categoryId,
    name: parsed.data.name,
    amount: parsed.data.amount,
    type,
    transaction_date: parsed.data.date
  });

  if (error) {
    return {
      ok: false,
      message: "La transaction n’a pas été enregistrée. Réessaie dans un instant."
    };
  }

  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");

  return { ok: true, message: "Transaction ajoutée et budget actualisé." };
}
