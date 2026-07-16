"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const PrinterSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  price: z.coerce.number().min(0),
  maintenanceCost: z.coerce.number().min(0),
  usefulLifeHours: z.coerce.number().positive("Deve ser maior que zero."),
  powerConsumptionKw: z.coerce.number().min(0),
});

export async function createPrinter(formData: FormData) {
  const session = await verifySession();
  const data = PrinterSchema.parse(Object.fromEntries(formData));
  await prisma.printer.create({ data: { ...data, companyId: session.companyId } });
  revalidatePath("/impressoras");
}

export async function updatePrinter(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  const data = PrinterSchema.parse(Object.fromEntries(formData));
  await prisma.printer.updateMany({ where: { id, companyId: session.companyId }, data });
  revalidatePath("/impressoras");
}

export async function deletePrinter(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  await prisma.printer.deleteMany({ where: { id, companyId: session.companyId } });
  revalidatePath("/impressoras");
}
