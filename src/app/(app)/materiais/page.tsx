import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { createFilament, updateFilament, deleteFilament } from "@/app/actions/filaments";

export default async function FilamentsPage() {
  const session = await verifySession();
  const filaments = await prisma.filament.findMany({
    where: { companyId: session.companyId },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Materiais (filamentos)</h1>
      <p className="mt-1 text-sm text-neutral-500">
        O custo por kg é calculado automaticamente (custo do rolo / peso do rolo).
      </p>

      <form
        action={createFilament}
        className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-6"
      >
        <input name="name" placeholder="Nome" required className="input" />
        <input name="brand" placeholder="Marca" className="input" />
        <input name="type" placeholder="Tipo (PLA, PETG...)" className="input" />
        <input name="spoolCost" type="number" step="0.01" placeholder="Custo do rolo (R$)" required className="input" />
        <input name="spoolWeightKg" type="number" step="0.001" placeholder="Peso do rolo (kg)" required className="input" />
        <input name="description" placeholder="Descrição" className="input" />
        <button type="submit" className="btn-primary col-span-2 sm:col-span-6">
          Adicionar material
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-3 py-2">Nome</th>
              <th className="px-3 py-2">Marca</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Custo rolo</th>
              <th className="px-3 py-2">Peso rolo (kg)</th>
              <th className="px-3 py-2">Custo/kg</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filaments.map((filament) => {
              const costPerKg =
                Number(filament.spoolWeightKg) > 0
                  ? Number(filament.spoolCost) / Number(filament.spoolWeightKg)
                  : 0;
              return (
                <tr key={filament.id} className="border-b border-neutral-100 last:border-0">
                  <td colSpan={7} className="px-3 py-2">
                    <form
                      action={updateFilament}
                      className="grid grid-cols-2 items-center gap-2 sm:grid-cols-7"
                    >
                      <input type="hidden" name="id" value={filament.id} />
                      <input name="name" defaultValue={filament.name} className="input" />
                      <input name="brand" defaultValue={filament.brand ?? ""} className="input" />
                      <input name="type" defaultValue={filament.type ?? ""} className="input" />
                      <input
                        name="spoolCost"
                        type="number"
                        step="0.01"
                        defaultValue={filament.spoolCost.toString()}
                        className="input"
                      />
                      <input
                        name="spoolWeightKg"
                        type="number"
                        step="0.001"
                        defaultValue={filament.spoolWeightKg.toString()}
                        className="input"
                      />
                      <span className="px-2 text-neutral-600">
                        R$ {costPerKg.toFixed(2)}
                      </span>
                      <div className="flex gap-2">
                        <button type="submit" className="btn-secondary">
                          Salvar
                        </button>
                        <button type="submit" formAction={deleteFilament} className="btn-danger">
                          Excluir
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              );
            })}
            {filaments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-neutral-400">
                  Nenhum material cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
