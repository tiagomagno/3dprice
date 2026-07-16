"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

const ProductSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  category: z.string().optional().transform((v) => v || undefined),
  subcategory: z.string().optional().transform((v) => v || undefined),
  size: z.string().optional().transform((v) => v || undefined),
  color: z.string().optional().transform((v) => v || undefined),
  imageUrl: z.string().optional().transform((v) => v || undefined),
  weightG: z.coerce.number().min(0),
  printTimeMin: z.coerce.number().min(0),
  piecesPerPlate: z.coerce.number().int().positive(),
  filamentId: z.string().min(1, "Selecione um material."),
  printerId: z.string().min(1, "Selecione uma impressora."),
});

export async function createProduct(formData: FormData) {
  const session = await verifySession();
  const data = ProductSchema.parse(Object.fromEntries(formData));
  const product = await prisma.product.create({ data: { ...data, companyId: session.companyId } });
  revalidatePath("/produtos");
  redirect(`/produtos/${product.id}`);
}

export async function updateProduct(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  const data = ProductSchema.parse(Object.fromEntries(formData));
  await prisma.product.updateMany({ where: { id, companyId: session.companyId }, data });
  revalidatePath(`/produtos/${id}`);
  revalidatePath("/produtos");
}

export async function deleteProduct(formData: FormData) {
  const session = await verifySession();
  const id = String(formData.get("id"));
  await prisma.product.deleteMany({ where: { id, companyId: session.companyId } });
  revalidatePath("/produtos");
  redirect("/produtos");
}

export async function setProductComponents(formData: FormData) {
  const session = await verifySession();
  const productId = String(formData.get("productId"));

  const product = await prisma.product.findFirst({
    where: { id: productId, companyId: session.companyId },
  });
  if (!product) throw new Error("Produto não encontrado.");

  const componentIds = formData.getAll("componentId").map(String);
  const rows = componentIds
    .map((componentId) => {
      const quantity = Number(formData.get(`quantity-${componentId}`) ?? 0);
      return { componentId, quantity };
    })
    .filter((row) => row.quantity > 0);

  await prisma.$transaction([
    prisma.productComponent.deleteMany({ where: { productId } }),
    ...rows.map((row) =>
      prisma.productComponent.create({
        data: { productId, componentId: row.componentId, quantity: row.quantity },
      })
    ),
  ]);

  revalidatePath(`/produtos/${productId}`);
}

export async function setProductProcessSteps(formData: FormData) {
  const session = await verifySession();
  const productId = String(formData.get("productId"));

  const product = await prisma.product.findFirst({
    where: { id: productId, companyId: session.companyId },
  });
  if (!product) throw new Error("Produto não encontrado.");

  const stepIds = formData.getAll("processStepId").map(String);
  const rows = stepIds
    .map((processStepId) => {
      const raw = formData.get(`minutes-${processStepId}`);
      const minutesOverride = raw !== null && raw !== "" ? Number(raw) : null;
      return { processStepId, minutesOverride };
    });

  await prisma.$transaction([
    prisma.productProcessStep.deleteMany({ where: { productId } }),
    ...rows.map((row) =>
      prisma.productProcessStep.create({
        data: {
          productId,
          processStepId: row.processStepId,
          minutesOverride: row.minutesOverride,
        },
      })
    ),
  ]);

  revalidatePath(`/produtos/${productId}`);
}
