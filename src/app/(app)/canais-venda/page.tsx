import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { createSalesChannel, updateSalesChannel, deleteSalesChannel } from "@/app/actions/sales-channels";

export default async function SalesChannelsPage() {
  const session = await verifySession();
  const channels = await prisma.salesChannel.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Canais de venda</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Taxa percentual cobrada pelo canal (ex.: Shopee Clássico 12%, Loja própria 0%),
        usada como um dos índices de comercialização na simulação de preço.
      </p>

      <form
        action={createSalesChannel}
        className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-3"
      >
        <input name="name" placeholder="Nome (ex: Shopee Clássico)" required className="input" />
        <input name="feePercentage" type="number" step="0.01" placeholder="Taxa (%)" required className="input" />
        <button type="submit" className="btn-primary">
          Adicionar canal
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Taxa (%)</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.id} className="border-b border-neutral-100 last:border-0">
                <td colSpan={3} className="px-3 py-2">
                  <form
                    action={updateSalesChannel}
                    className="grid grid-cols-2 items-center gap-2 sm:grid-cols-3"
                  >
                    <input type="hidden" name="id" value={channel.id} />
                    <input name="name" defaultValue={channel.name} className="input" />
                    <input
                      name="feePercentage"
                      type="number"
                      step="0.01"
                      defaultValue={(Number(channel.feePercentage) * 100).toString()}
                      className="input"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="btn-secondary">
                        Salvar
                      </button>
                      <button type="submit" formAction={deleteSalesChannel} className="btn-danger">
                        Excluir
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            ))}
            {channels.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-neutral-400">
                  Nenhum canal de venda cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
