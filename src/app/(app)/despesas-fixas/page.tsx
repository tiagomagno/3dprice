import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import {
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  createAsset,
  updateAsset,
  deleteAsset,
} from "@/app/actions/fixed-expenses";
import { assetMonthlyDepreciation } from "@/lib/pricing-engine";

export default async function FixedExpensesPage() {
  const session = await verifySession();
  const [expenses, assets] = await Promise.all([
    prisma.fixedExpense.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.asset.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const expensesTotal = expenses.reduce((sum, e) => sum + Number(e.monthlyValue), 0);
  const depreciationTotal = assets.reduce(
    (sum, a) => sum + assetMonthlyDepreciation({ value: Number(a.value), usefulLifeYears: Number(a.usefulLifeYears) }),
    0
  );

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Despesas fixas</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Total mensal (despesas + depreciação do imobilizado):{" "}
          <span className="font-medium text-neutral-900">
            R$ {(expensesTotal + depreciationTotal).toFixed(2)}
          </span>{" "}
          — usado para calcular o custo-hora de mão de obra.
        </p>

        <form
          action={createFixedExpense}
          className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-3"
        >
          <input name="category" placeholder="Categoria (ex: Aluguel)" required className="input" />
          <input name="monthlyValue" type="number" step="0.01" placeholder="Valor mensal (R$)" required className="input" />
          <button type="submit" className="btn-primary">
            Adicionar despesa
          </button>
        </form>

        <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-3 py-2">Categoria</th>
                <th className="px-3 py-2">Valor mensal</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-neutral-100 last:border-0">
                  <td colSpan={3} className="px-3 py-2">
                    <form
                      action={updateFixedExpense}
                      className="grid grid-cols-2 items-center gap-2 sm:grid-cols-3"
                    >
                      <input type="hidden" name="id" value={expense.id} />
                      <input name="category" defaultValue={expense.category} className="input" />
                      <input
                        name="monthlyValue"
                        type="number"
                        step="0.01"
                        defaultValue={expense.monthlyValue.toString()}
                        className="input"
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="btn-secondary">
                          Salvar
                        </button>
                        <button type="submit" formAction={deleteFixedExpense} className="btn-danger">
                          Excluir
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-neutral-400">
                    Nenhuma despesa cadastrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Imobilizado (depreciação)</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Ex.: computador, mesa, ferramentas — depreciados em valor/(vida útil em anos × 12).
        </p>

        <form
          action={createAsset}
          className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-4"
        >
          <input name="name" placeholder="Nome" required className="input" />
          <input name="value" type="number" step="0.01" placeholder="Valor (R$)" required className="input" />
          <input name="usefulLifeYears" type="number" step="0.1" placeholder="Vida útil (anos)" required className="input" />
          <button type="submit" className="btn-primary">
            Adicionar item
          </button>
        </form>

        <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-3 py-2">Nome</th>
                <th className="px-3 py-2">Valor</th>
                <th className="px-3 py-2">Vida útil (anos)</th>
                <th className="px-3 py-2">Depreciação/mês</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id} className="border-b border-neutral-100 last:border-0">
                  <td colSpan={5} className="px-3 py-2">
                    <form
                      action={updateAsset}
                      className="grid grid-cols-2 items-center gap-2 sm:grid-cols-5"
                    >
                      <input type="hidden" name="id" value={asset.id} />
                      <input name="name" defaultValue={asset.name} className="input" />
                      <input
                        name="value"
                        type="number"
                        step="0.01"
                        defaultValue={asset.value.toString()}
                        className="input"
                      />
                      <input
                        name="usefulLifeYears"
                        type="number"
                        step="0.1"
                        defaultValue={asset.usefulLifeYears.toString()}
                        className="input"
                      />
                      <span className="px-2 text-neutral-600">
                        R${" "}
                        {assetMonthlyDepreciation({
                          value: Number(asset.value),
                          usefulLifeYears: Number(asset.usefulLifeYears),
                        }).toFixed(2)}
                      </span>
                      <div className="flex gap-2">
                        <button type="submit" className="btn-secondary">
                          Salvar
                        </button>
                        <button type="submit" formAction={deleteAsset} className="btn-danger">
                          Excluir
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ))}
              {assets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-neutral-400">
                    Nenhum item de imobilizado cadastrado.
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
