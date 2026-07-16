import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { createProduct } from "@/app/actions/products";

export default async function ProductsPage() {
  const session = await verifySession();
  const [products, filaments, printers] = await Promise.all([
    prisma.product.findMany({
      where: { companyId: session.companyId },
      orderBy: { createdAt: "desc" },
      include: { filament: true, printer: true },
    }),
    prisma.filament.findMany({ where: { companyId: session.companyId } }),
    prisma.printer.findMany({ where: { companyId: session.companyId } }),
  ]);

  const canCreate = filaments.length > 0 && printers.length > 0;

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Produtos</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Cadastre seus produtos para gerar simulações de preço de venda.
      </p>

      {!canCreate && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Cadastre pelo menos uma <Link href="/impressoras" className="underline">impressora</Link>{" "}
          e um <Link href="/materiais" className="underline">material</Link> antes de criar um produto.
        </p>
      )}

      {canCreate && (
        <form
          action={createProduct}
          className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-4"
        >
          <input name="name" placeholder="Nome do produto" required className="input" />
          <input name="category" placeholder="Categoria" className="input" />
          <input name="subcategory" placeholder="Subcategoria" className="input" />
          <input name="size" placeholder="Tamanho" className="input" />
          <input name="color" placeholder="Cor" className="input" />
          <input name="imageUrl" placeholder="URL da imagem" className="input" />
          <input name="weightG" type="number" step="0.1" placeholder="Peso (g)" required className="input" />
          <input
            name="printTimeMin"
            type="number"
            step="1"
            placeholder="Tempo de impressão (min)"
            required
            className="input"
          />
          <input
            name="piecesPerPlate"
            type="number"
            step="1"
            placeholder="Peças por bandeja"
            defaultValue={1}
            required
            className="input"
          />
          <select name="filamentId" required className="input">
            <option value="">Material</option>
            {filaments.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <select name="printerId" required className="input">
            <option value="">Impressora</option>
            {printers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-primary col-span-2 sm:col-span-4">
            Criar produto
          </button>
        </form>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/produtos/${product.id}`}
            className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300"
          >
            <p className="font-medium text-neutral-900">{product.name}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {[product.category, product.subcategory, product.size, product.color]
                .filter(Boolean)
                .join(" · ") || "Sem categorização"}
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              {product.filament.name} · {product.printer.name}
            </p>
          </Link>
        ))}
        {products.length === 0 && (
          <p className="text-sm text-neutral-400">Nenhum produto cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}
