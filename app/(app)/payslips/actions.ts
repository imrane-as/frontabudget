"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";

export type DeletePayslipResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function deletePayslip(input: unknown): Promise<DeletePayslipResult> {
  const id = z.string().uuid().safeParse(input);

  if (!id.success) {
    return { ok: false, message: "Cette fiche de paie est invalide." };
  }

  const { supabase, user } = await requireUser();
  const { data: payslip, error: readError } = await supabase
    .from("payslips")
    .select("id,file_path,salary_transaction_id")
    .eq("id", id.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (readError || !payslip) {
    return { ok: false, message: "Cette fiche est introuvable ou inaccessible." };
  }

  const { data: deleted, error: deleteError } = await supabase
    .from("payslips")
    .delete()
    .eq("id", id.data)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (deleteError || !deleted) {
    return { ok: false, message: "La fiche n’a pas pu être supprimée." };
  }

  if (payslip.salary_transaction_id) {
    await supabase
      .from("transactions")
      .delete()
      .eq("id", payslip.salary_transaction_id)
      .eq("user_id", user.id);
  }

  await supabase.storage.from("payslips").remove([payslip.file_path]);

  revalidatePath("/payslips");
  revalidatePath("/transactions");
  revalidatePath("/dashboard");
  revalidatePath("/budgets");

  return {
    ok: true,
    message: "Fiche de paie et revenu associé supprimés."
  };
}

