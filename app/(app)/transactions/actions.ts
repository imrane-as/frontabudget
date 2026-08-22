"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { normalizeMerchantDomain } from "@/lib/transaction-categorizer";

const optionalSourceUrl = z
  .string()
  .url()
  .max(500)
  .refine((value) => value.startsWith("https://"))
  .nullable();

const transactionSchema = z.object({
  name: z.string().trim().min(1).max(120),
  amount: z.number().finite().positive().max(1_000_000_000),
  type: z.enum(["income", "expense"]),
  categoryId: z.string().uuid().nullable(),
  merchantName: z.string().trim().min(1).max(80).nullable(),
  merchantDomain: z
    .string()
    .max(253)
    .nullable()
    .transform((value) => normalizeMerchantDomain(value)),
  categorizationSource: z.enum(["local", "ai", "fallback"]).nullable(),
  categorizationUrl: optionalSourceUrl,
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

function isMissingMerchantSchema(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST204" ||
    /merchant_name|merchant_domain|categorization_source|categorization_url/i.test(
      error.message || ""
    )
  );
}

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

  const baseTransaction = {
    user_id: user.id,
    category_id: categoryId,
    name: parsed.data.name,
    amount: parsed.data.amount,
    type,
    transaction_date: parsed.data.date
  };

  let { error } = await supabase.from("transactions").insert({
    ...baseTransaction,
    merchant_name: parsed.data.merchantName,
    merchant_domain: parsed.data.merchantDomain,
    categorization_source: parsed.data.categorizationSource,
    categorization_url: parsed.data.categorizationUrl
  });

  if (error && isMissingMerchantSchema(error)) {
    const fallbackInsert = await supabase
      .from("transactions")
      .insert(baseTransaction);
    error = fallbackInsert.error;
  }

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
