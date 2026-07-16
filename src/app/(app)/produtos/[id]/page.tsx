import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import {
  updateProduct,
  deleteProduct,
  setProductComponents,
  setProductProcessSteps,
} from "@/app/actions/products";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await verifySession();

  const [product, filaments, printers, components, steps] = await Promise.all([
    prisma.product.findFirst({
      where: { id, companyId: session.companyId },
      include: { components: true, processSteps: true },
    }),
    prisma.filament.findMany({ where: { companyId: session.companyId } }),
    prisma.printer.findMany({ where: { companyId: session.companyId } }),
    prisma.component.findMany({ where: { companyId: session.companyId } }),
    prisma.processStep.findMany({ where: { companyId: session.companyId } }),
  ]);

  if (!product) notFound();

  const selectedComponentIds = new Set(product.components.map((c) => c.componentId));
  const selectedStepIds = new Set(product.processSteps.map((s) => s.processStepId));

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">{product.name}</h1>
        <Link href={`/produtos/${product.id}/precificacao`} className="btn-primary">
          Simular preço →
        </Link>
      </div>

      <form
        action={updateProduct}
        className="grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-4"
      >
        <input type="hidden" name="id" value={product.id} />
        <input name="name" defaultValue={product.name} placeholder="Nome" required className="input" />
        <input name="category" defaultValue={product.category ?? ""} placeholder="Categoria" className="input" />
        <input
          name="subcategory"
          defaultValue={product.subcategory ?? ""}
          placeholder="Subcategoria"
          className="input"
        />
        <input name="size" defaultValue={product.size ?? ""} placeholder="Tamanho" className="input" />
        <input name="color" defaultValue={product.color ?? ""} placeholder="Cor" className="input" />
        <input
          name="imageUrl"
          defaultValue={product.imageUrl ?? ""}
          placeholder="URL da imagem"
          className="input"
        />
        <input
          name="weightG"
          type="number"
          step="0.1"
          defaultValue={product.weightG.toString()}
          placeholder="Peso (g)"
          required
          className="input"
        />
        <input
          name="printTimeMin"
          type="number"
          step="1"
          defaultValue={product.printTimeMin.toString()}
          placeholder="Tempo de impressão (min)"
          required
          className="input"
        />
        <input
          name="piecesPerPlate"
          type="number"
          step="1"
          defaultValue={product.piecesPerPlate}
          placeholder="Peças por bandeja"
          required
          className="input"
        />
        <select name="filamentId" defaultValue={product.filamentId} required className="input">
          {filaments.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <select name="printerId" defaultValue={product.printerId} required className="input">
          {printers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="col-span-2 flex gap-2 sm:col-span-4">
          <button type="submit" className="btn-secondary">
            Salvar alterações
          </button>
          <button type="submit" formAction={deleteProduct} className="btn-danger">
            Excluir produto
          </button>
        </div>
      </form>

      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Componentes usados</h2>
        <form action={setProductComponents} className="mt-3 space-y-2 rounded-xl border border-neutral-200 bg-white p-4">
          <input type="hidden" name="productId" value={product.id} />
          {components.map((component) => {
            const existing = product.components.find((c) => c.componentId === component.id);
            return (
              <div key={component.id} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name="componentId"
                  value={component.id}
                  defaultChecked={selectedComponentIds.has(component.id)}
                />
                <span className="w-48 text-neutral-700">{component.name}</span>
                <input
                  type="number"
                  step="1"
                  min="0"
                  name={`quantity-${component.id}`}
                  defaultValue={existing ? existing.quantity.toString() : "1"}
                  className="input w-24"
                  placeholder="Qtd."
                />
              </div>
            );
          })}
          {components.length === 0 && (
            <p className="text-sm text-neutral-400">
              Nenhum componente cadastrado. <Link href="/componentes" className="underline">Cadastrar</Link>
            </p>
          )}
          {components.length > 0 && (
            <button type="submit" className="btn-secondary">
              Salvar componentes
            </button>
          )}
        </form>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-neutral-900">Etapas de mão de obra</h2>
        <form
          action={setProductProcessSteps}
          className="mt-3 space-y-2 rounded-xl border border-neutral-200 bg-white p-4"
        >
          <input type="hidden" name="productId" value={product.id} />
          {steps.map((step) => {
            const existing = product.processSteps.find((s) => s.processStepId === step.id);
            return (
              <div key={step.id} className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name="processStepId"
                  value={step.id}
                  defaultChecked={selectedStepIds.has(step.id)}
                />
                <span className="w-48 text-neutral-700">
                  {step.name} (padrão: {step.defaultMinutes.toString()} min)
                </span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  name={`minutes-${step.id}`}
                  defaultValue={existing?.minutesOverride?.toString() ?? ""}
                  placeholder="Sobrescrever min."
                  className="input w-32"
                />
              </div>
            );
          })}
          {steps.length === 0 && (
            <p className="text-sm text-neutral-400">
              Nenhuma etapa cadastrada. <Link href="/mao-de-obra" className="underline">Cadastrar</Link>
            </p>
          )}
          {steps.length > 0 && (
            <button type="submit" className="btn-secondary">
              Salvar etapas
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
