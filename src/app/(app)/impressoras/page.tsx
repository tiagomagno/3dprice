import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { createPrinter, updatePrinter, deletePrinter } from "@/app/actions/printers";

export default async function PrintersPage() {
  const session = await verifySession();
  const printers = await prisma.printer.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Impressoras</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Cadastre suas impressoras para calcular depreciação (R$/h) e consumo elétrico.
      </p>

      <form
        action={createPrinter}
        className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-5"
      >
        <input name="name" placeholder="Nome" required className="input" />
        <input name="price" type="number" step="0.01" placeholder="Preço (R$)" required className="input" />
        <input
          name="maintenanceCost"
          type="number"
          step="0.01"
          placeholder="Manutenção (R$, sug. 25% do preço)"
          required
          className="input"
        />
        <input
          name="usefulLifeHours"
          type="number"
          step="1"
          placeholder="Vida útil (h)"
          required
          className="input"
        />
        <input
          name="powerConsumptionKw"
          type="number"
          step="0.01"
          placeholder="Consumo (kW)"
          required
          className="input"
        />
        <button type="submit" className="btn-primary col-span-2 sm:col-span-5">
          Adicionar impressora
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Preço</th>
              <th className="px-3 py-2">Manutenção</th>
              <th className="px-3 py-2">Vida útil (h)</th>
              <th className="px-3 py-2">Consumo (kW)</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {printers.map((printer) => (
              <tr key={printer.id} className="border-b border-neutral-100 last:border-0">
                <td colSpan={6} className="px-3 py-2">
                  <form action={updatePrinter} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-6">
                    <input type="hidden" name="id" value={printer.id} />
                    <input name="name" defaultValue={printer.name} className="input" />
                    <input
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={printer.price.toString()}
                      className="input"
                    />
                    <input
                      name="maintenanceCost"
                      type="number"
                      step="0.01"
                      defaultValue={printer.maintenanceCost.toString()}
                      className="input"
                    />
                    <input
                      name="usefulLifeHours"
                      type="number"
                      step="1"
                      defaultValue={printer.usefulLifeHours.toString()}
                      className="input"
                    />
                    <input
                      name="powerConsumptionKw"
                      type="number"
                      step="0.01"
                      defaultValue={printer.powerConsumptionKw.toString()}
                      className="input"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="btn-secondary">
                        Salvar
                      </button>
                      <button type="submit" formAction={deletePrinter} className="btn-danger">
                        Excluir
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            ))}
            {printers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-neutral-400">
                  Nenhuma impressora cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
