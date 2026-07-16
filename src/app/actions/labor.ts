"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const LaborConfigSchema = z.object({
  numPeople: z.coerce.number().int().positive(),
  dailyHours: z.coerce.number().positive(),
  workDaysPerMonth: z.coerce.number().positive(),
  // recebido como percentual (0-100), convertido para fração 0-1
  productivityPct: z.coerce.number().min(0).max(100).transform((v) => v / 100),
});

export async function upsertLaborConfig(formData: FormData) {
  const session = await verifySession();
  const data = LaborConfigSchema.parse(Object.fromEntries(formData));

  await prisma.laborConfig.upsert({
    where: { companyId: session.companyId },
    create: { ...data, companyId: session.companyId },
    update: data,
  });
  revalidatePath("/mao-de-obra");
}

const ProcessStepSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  defaultMinutes: z.coerce.number().min(0),
});

export async function createProcessStep(formData: FormData) {
  const session = await verifySession();
  const data = ProcessStepSchema.parse(Object.fromEntries(formData));
  await prisma.processStep.create({ data: { ...data, companyId: session.companyId } });
  revalidatePath("/mao-de-obra");
}

export async function updateProcessStep(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  const data = ProcessStepSchema.parse(Object.fromEntries(formData));
  await prisma.processStep.updateMany({ where: { id, companyId: session.companyId }, data });
  revalidatePath("/mao-de-obra");
}

export async function deleteProcessStep(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  await prisma.processStep.deleteMany({ where: { id, companyId: session.companyId } });
  revalidatePath("/mao-de-obra");
}
