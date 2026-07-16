"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const SaveSimulationSchema = z.object({
  productId: z.string().min(1),
  salesChannelId: z.string().optional().transform((v) => v || undefined),
  mode: z.enum(["MARKUP_DIVISOR", "FIXED_MARKUP_TABLE"]),
  failureRatePct: z.coerce.number().min(0).max(0.9999),
  shippingCost: z.coerce.number().min(0),
  kwhCost: z.coerce.number().min(0),
  taxPct: z.coerce.number().min(0).max(1).optional(),
  cardFeePct: z.coerce.number().min(0).max(1).optional(),
  otherFeePct: z.coerce.number().min(0).max(1).optional(),
  profitPct: z.coerce.number().min(0).max(1).optional(),
  resultSnapshotJson: z.string().min(1),
});

export async function saveSimulation(formData: FormData) {
  const session = await verifySession();
  const parsed = SaveSimulationSchema.parse(Object.fromEntries(formData));

  const product = await prisma.product.findFirst({
    where: { id: parsed.productId, companyId: session.companyId },
  });
  if (!product) throw new Error("Produto não encontrado.");

  await prisma.pricingSimulation.create({
    data: {
      productId: parsed.productId,
      salesChannelId: parsed.salesChannelId,
      mode: parsed.mode,
      failureRatePct: parsed.failureRatePct,
      shippingCost: parsed.shippingCost,
      kwhCost: parsed.kwhCost,
      taxPct: parsed.taxPct,
      cardFeePct: parsed.cardFeePct,
      otherFeePct: parsed.otherFeePct,
      profitPct: parsed.profitPct,
      resultSnapshotJson: JSON.parse(parsed.resultSnapshotJson),
    },
  });

  revalidatePath(`/produtos/${parsed.productId}/precificacao`);
}
