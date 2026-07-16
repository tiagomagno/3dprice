import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { computeLaborHourCost } from "@/lib/pricing-engine";
import { PricingSimulator } from "@/components/PricingSimulator";

export default async function ProductPricingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await verifySession();

  const [product, expenses, assets, laborConfig, salesChannels] = await Promise.all([
    prisma.product.findFirst({
      where: { id, companyId: session.companyId },
      include: {
        filament: true,
        printer: true,
        components: { include: { component: true } },
        processSteps: { include: { processStep: true } },
      },
    }),
    prisma.fixedExpense.findMany({ where: { companyId: session.companyId } }),
    prisma.asset.findMany({ where: { companyId: session.companyId } }),
    prisma.laborConfig.findUnique({ where: { companyId: session.companyId } }),
    prisma.salesChannel.findMany({ where: { companyId: session.companyId } }),
  ]);

  if (!product) notFound();

  const expensesTotal = expenses.reduce((sum, e) => sum + Number(e.monthlyValue), 0);
  const laborHourCost = laborConfig
    ? computeLaborHourCost(
        expensesTotal,
        assets.map((a) => ({ value: Number(a.value), usefulLifeYears: Number(a.usefulLifeYears) })),
        {
          numPeople: laborConfig.numPeople,
          dailyHours: Number(laborConfig.dailyHours),
          workDaysPerMonth: Number(laborConfig.workDaysPerMonth),
          productivityPct: Number(laborConfig.productivityPct),
        }
      )
    : 0;

  const componentsCost = product.components.reduce(
    (sum, pc) => sum + Number(pc.component.unitCost) * Number(pc.quantity),
    0
  );
  const processMinutesTotal = product.processSteps.reduce(
    (sum, ps) => sum + Number(ps.minutesOverride ?? ps.processStep.defaultMinutes),
    0
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/produtos/${product.id}`} className="text-sm text-neutral-500 hover:underline">
            ← {product.name}
          </Link>
          <h1 className="text-xl font-semibold text-neutral-900">Simulação de preço</h1>
        </div>
      </div>

      {!laborConfig && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Configure a <Link href="/mao-de-obra" className="underline">mão de obra</Link> da empresa para um
          cálculo de custo mais preciso (custo-hora atual: R$ 0,00).
        </p>
      )}

      <div className="mt-6">
        <PricingSimulator
          productId={product.id}
          weightG={Number(product.weightG)}
          printTimeMin={Number(product.printTimeMin)}
          piecesPerPlate={product.piecesPerPlate}
          filament={{
            spoolCost: Number(product.filament.spoolCost),
            spoolWeightKg: Number(product.filament.spoolWeightKg),
          }}
          printer={{
            price: Number(product.printer.price),
            maintenanceCost: Number(product.printer.maintenanceCost),
            usefulLifeHours: Number(product.printer.usefulLifeHours),
            powerConsumptionKw: Number(product.printer.powerConsumptionKw),
          }}
          componentsCost={componentsCost}
          processMinutesTotal={processMinutesTotal}
          laborHourCost={laborHourCost}
          salesChannels={salesChannels.map((c) => ({
            id: c.id,
            name: c.name,
            feePercentage: Number(c.feePercentage),
          }))}
        />
      </div>
    </div>
  );
}
