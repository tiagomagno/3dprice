import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  const [printers, filaments, products] = await Promise.all([
    prisma.printer.count({ where: { companyId: user.companyId } }),
    prisma.filament.count({ where: { companyId: user.companyId } }),
    prisma.product.count({ where: { companyId: user.companyId } }),
  ]);

  const cards = [
    { label: "Impressoras cadastradas", value: printers, href: "/impressoras" },
    { label: "Materiais cadastrados", value: filaments, href: "/materiais" },
    { label: "Produtos cadastrados", value: products, href: "/produtos" },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Painel</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Bem-vindo(a), {user.name}. Comece cadastrando impressoras e materiais antes de
        precificar seus produtos.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-xl border border-neutral-200 bg-white p-5 hover:border-neutral-300"
          >
            <p className="text-2xl font-semibold text-neutral-900">{card.value}</p>
            <p className="mt-1 text-sm text-neutral-500">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
