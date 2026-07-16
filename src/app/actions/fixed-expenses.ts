"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const FixedExpenseSchema = z.object({
  category: z.string().min(1, "Informe a categoria."),
  monthlyValue: z.coerce.number().min(0),
});

export async function createFixedExpense(formData: FormData) {
  const session = await verifySession();
  const data = FixedExpenseSchema.parse(Object.fromEntries(formData));
  await prisma.fixedExpense.create({ data: { ...data, companyId: session.companyId } });
  revalidatePath("/despesas-fixas");
}

export async function updateFixedExpense(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  const data = FixedExpenseSchema.parse(Object.fromEntries(formData));
  await prisma.fixedExpense.updateMany({ where: { id, companyId: session.companyId }, data });
  revalidatePath("/despesas-fixas");
}

export async function deleteFixedExpense(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  await prisma.fixedExpense.deleteMany({ where: { id, companyId: session.companyId } });
  revalidatePath("/despesas-fixas");
}

const AssetSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  value: z.coerce.number().min(0),
  usefulLifeYears: z.coerce.number().positive("Deve ser maior que zero."),
});

export async function createAsset(formData: FormData) {
  const session = await verifySession();
  const data = AssetSchema.parse(Object.fromEntries(formData));
  await prisma.asset.create({ data: { ...data, companyId: session.companyId } });
  revalidatePath("/despesas-fixas");
}

export async function updateAsset(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  const data = AssetSchema.parse(Object.fromEntries(formData));
  await prisma.asset.updateMany({ where: { id, companyId: session.companyId }, data });
  revalidatePath("/despesas-fixas");
}

export async function deleteAsset(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  await prisma.asset.deleteMany({ where: { id, companyId: session.companyId } });
  revalidatePath("/despesas-fixas");
}
