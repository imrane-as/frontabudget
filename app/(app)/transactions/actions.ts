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

const transactionIdSchema = z.string().uuid();

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

async function categoryBelongsToUser(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  categoryId: string | null,
  type: "income" | "expense"
) {
  if (!categoryId) return true;

  const { data: category, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .eq("type", type)
    .maybeSingle();

  return !error && Boolean(category);
}

function revalidateTransactionViews() {
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");
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

  if (!(await categoryBelongsToUser(supabase, user.id, categoryId, type))) {
    return { ok: false, message: "Cette catégorie ne correspond pas à la transaction." };
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

  revalidateTransactionViews();

  return { ok: true, message: "Transaction ajoutée et budget actualisé." };
}

export async function updateTransaction(
  input: unknown
): Promise<SaveTransactionResult> {
  const parsed = transactionSchema.extend({ id: transactionIdSchema }).safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Les informations de la transaction sont invalides." };
  }

  const { supabase, user } = await requireUser();
  const { id, categoryId, type } = parsed.data;

  if (!(await categoryBelongsToUser(supabase, user.id, categoryId, type))) {
    return { ok: false, message: "Cette catégorie ne correspond pas à la transaction." };
  }

  const baseTransaction = {
    category_id: categoryId,
    name: parsed.data.name,
    amount: parsed.data.amount,
    type,
    transaction_date: parsed.data.date
  };

  let updateResult = await supabase
    .from("transactions")
    .update({
      ...baseTransaction,
      merchant_name: parsed.data.merchantName,
      merchant_domain: parsed.data.merchantDomain,
      categorization_source: parsed.data.categorizationSource,
      categorization_url: parsed.data.categorizationUrl
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (updateResult.error && isMissingMerchantSchema(updateResult.error)) {
    updateResult = await supabase
      .from("transactions")
      .update(baseTransaction)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();
  }

  if (updateResult.error) {
    return {
      ok: false,
      message: "La transaction n’a pas été modifiée. Réessaie dans un instant."
    };
  }

  if (!updateResult.data) {
    return { ok: false, message: "Cette transaction est introuvable ou inaccessible." };
  }

  revalidateTransactionViews();
  return { ok: true, message: "Transaction modifiée et budget actualisé." };
}

export async function deleteTransaction(
  input: unknown
): Promise<SaveTransactionResult> {
  const parsedId = transactionIdSchema.safeParse(input);

  if (!parsedId.success) {
    return { ok: false, message: "Cette transaction est invalide." };
  }

  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", parsedId.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      message: "La transaction n’a pas été supprimée. Réessaie dans un instant."
    };
  }

  if (!data) {
    return { ok: false, message: "Cette transaction est introuvable ou inaccessible." };
  }

  revalidateTransactionViews();
  return { ok: true, message: "Transaction supprimée et budget actualisé." };
}
