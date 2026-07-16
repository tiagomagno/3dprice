import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import {
  upsertLaborConfig,
  createProcessStep,
  updateProcessStep,
  deleteProcessStep,
} from "@/app/actions/labor";
import { computeLaborHourCost } from "@/lib/pricing-engine";

export default async function LaborPage() {
  const session = await verifySession();
  const [laborConfig, expenses, assets, steps] = await Promise.all([
    prisma.laborConfig.findUnique({ where: { companyId: session.companyId } }),
    prisma.fixedExpense.findMany({ where: { companyId: session.companyId } }),
    prisma.asset.findMany({ where: { companyId: session.companyId } }),
    prisma.processStep.findMany({ where: { companyId: session.companyId }, orderBy: { createdAt: "asc" } }),
  ]);

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

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Mão de obra</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Custo-hora calculado ={" "}
          <span className="font-medium text-neutral-900">R$ {laborHourCost.toFixed(2)}</span> a
          partir das despesas fixas + depreciação de imobilizado (
          <a href="/despesas-fixas" className="underline">
            editar
          </a>
          ) divididas pelas horas produtivas do mês.
        </p>

        <form
          action={upsertLaborConfig}
          className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-5"
        >
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Nº de pessoas
            <input
              name="numPeople"
              type="number"
              step="1"
              defaultValue={laborConfig?.numPeople ?? 1}
              required
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Horas/dia
            <input
              name="dailyHours"
              type="number"
              step="0.5"
              defaultValue={laborConfig?.dailyHours.toString() ?? "8"}
              required
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Dias úteis/mês
            <input
              name="workDaysPerMonth"
              type="number"
              step="1"
              defaultValue={laborConfig?.workDaysPerMonth.toString() ?? "22"}
              required
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Produtividade (%)
            <input
              name="productivityPct"
              type="number"
              step="1"
              min="0"
              max="100"
              defaultValue={laborConfig ? (Number(laborConfig.productivityPct) * 100).toString() : "85"}
              required
              className="input"
            />
          </label>
          <button type="submit" className="btn-primary self-end">
            Salvar
          </button>
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Etapas do processo</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Catálogo reaproveitável de etapas (download, fatiamento, acabamento...) com tempo
          padrão em minutos, usado para calcular o custo de mão de obra de cada produto.
        </p>

        <form
          action={createProcessStep}
          className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-3"
        >
          <input name="name" placeholder="Nome da etapa" required className="input" />
          <input name="defaultMinutes" type="number" step="0.5" placeholder="Minutos padrão" required className="input" />
          <button type="submit" className="btn-primary">
            Adicionar etapa
          </button>
        </form>

        <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-3 py-2">Etapa</th>
                <th className="px-3 py-2">Minutos padrão</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => (
                <tr key={step.id} className="border-b border-neutral-100 last:border-0">
                  <td colSpan={3} className="px-3 py-2">
                    <form
                      action={updateProcessStep}
                      className="grid grid-cols-2 items-center gap-2 sm:grid-cols-3"
                    >
                      <input type="hidden" name="id" value={step.id} />
                      <input name="name" defaultValue={step.name} className="input" />
                      <input
                        name="defaultMinutes"
                        type="number"
                        step="0.5"
                        defaultValue={step.defaultMinutes.toString()}
                        className="input"
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="btn-secondary">
                          Salvar
                        </button>
                        <button type="submit" formAction={deleteProcessStep} className="btn-danger">
                          Excluir
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ))}
              {steps.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-neutral-400">
                    Nenhuma etapa cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
