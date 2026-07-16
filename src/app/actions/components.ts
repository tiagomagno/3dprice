"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const ComponentSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  category: z.string().optional().transform((v) => v || undefined),
  unitCost: z.coerce.number().min(0),
});

export async function createComponent(formData: FormData) {
  const session = await verifySession();
  const data = ComponentSchema.parse(Object.fromEntries(formData));
  await prisma.component.create({ data: { ...data, companyId: session.companyId } });
  revalidatePath("/componentes");
}

export async function updateComponent(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  const data = ComponentSchema.parse(Object.fromEntries(formData));
  await prisma.component.updateMany({ where: { id, companyId: session.companyId }, data });
  revalidatePath("/componentes");
}

export async function deleteComponent(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  await prisma.component.deleteMany({ where: { id, companyId: session.companyId } });
  revalidatePath("/componentes");
}
