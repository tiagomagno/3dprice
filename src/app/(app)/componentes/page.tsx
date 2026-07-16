import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { createComponent, updateComponent, deleteComponent } from "@/app/actions/components";

export default async function ComponentsPage() {
  const session = await verifySession();
  const components = await prisma.component.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Componentes / materiais complementares</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Ex.: argolas, saquinhos, embalagens — itens usados por unidade de produto.
      </p>

      <form
        action={createComponent}
        className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-4"
      >
        <input name="name" placeholder="Nome" required className="input" />
        <input name="category" placeholder="Categoria" className="input" />
        <input name="unitCost" type="number" step="0.0001" placeholder="Valor unitário (R$)" required className="input" />
        <button type="submit" className="btn-primary col-span-2 sm:col-span-1">
          Adicionar
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Valor unitário</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {components.map((component) => (
              <tr key={component.id} className="border-b border-neutral-100 last:border-0">
                <td colSpan={4} className="px-3 py-2">
                  <form
                    action={updateComponent}
                    className="grid grid-cols-2 items-center gap-2 sm:grid-cols-4"
                  >
                    <input type="hidden" name="id" value={component.id} />
                    <input name="name" defaultValue={component.name} className="input" />
                    <input name="category" defaultValue={component.category ?? ""} className="input" />
                    <input
                      name="unitCost"
                      type="number"
                      step="0.0001"
                      defaultValue={component.unitCost.toString()}
                      className="input"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="btn-secondary">
                        Salvar
                      </button>
                      <button type="submit" formAction={deleteComponent} className="btn-danger">
                        Excluir
                      </button>
                    </div>
                  </form>
                </td>
              </tr>
            ))}
            {components.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-neutral-400">
                  Nenhum componente cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
