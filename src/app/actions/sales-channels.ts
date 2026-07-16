"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const SalesChannelSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  // recebido como percentual (0-100), convertido para fração 0-1
  feePercentage: z.coerce.number().min(0).max(100).transform((v) => v / 100),
});

export async function createSalesChannel(formData: FormData) {
  const session = await verifySession();
  const data = SalesChannelSchema.parse(Object.fromEntries(formData));
  await prisma.salesChannel.create({ data: { ...data, companyId: session.companyId } });
  revalidatePath("/canais-venda");
}

export async function updateSalesChannel(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  const data = SalesChannelSchema.parse(Object.fromEntries(formData));
  await prisma.salesChannel.updateMany({ where: { id, companyId: session.companyId }, data });
  revalidatePath("/canais-venda");
}

export async function deleteSalesChannel(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  await prisma.salesChannel.deleteMany({ where: { id, companyId: session.companyId } });
  revalidatePath("/canais-venda");
}
