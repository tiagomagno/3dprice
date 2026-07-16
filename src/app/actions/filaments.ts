"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const FilamentSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  brand: z.string().optional().transform((v) => v || undefined),
  type: z.string().optional().transform((v) => v || undefined),
  description: z.string().optional().transform((v) => v || undefined),
  spoolCost: z.coerce.number().min(0),
  spoolWeightKg: z.coerce.number().positive("Deve ser maior que zero."),
});

export async function createFilament(formData: FormData) {
  const session = await verifySession();
  const data = FilamentSchema.parse(Object.fromEntries(formData));
  await prisma.filament.create({ data: { ...data, companyId: session.companyId } });
  revalidatePath("/materiais");
}

export async function updateFilament(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  const data = FilamentSchema.parse(Object.fromEntries(formData));
  await prisma.filament.updateMany({ where: { id, companyId: session.companyId }, data });
  revalidatePath("/materiais");
}

export async function deleteFilament(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  await prisma.filament.deleteMany({ where: { id, companyId: session.companyId } });
  revalidatePath("/materiais");
}
