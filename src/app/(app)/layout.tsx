import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { logout } from "@/app/actions/auth";

const navItems = [
  { href: "/dashboard", label: "Painel" },
  { href: "/produtos", label: "Produtos" },
  { href: "/impressoras", label: "Impressoras" },
  { href: "/materiais", label: "Materiais" },
  { href: "/componentes", label: "Componentes" },
  { href: "/despesas-fixas", label: "Despesas fixas" },
  { href: "/mao-de-obra", label: "Mão de obra" },
  { href: "/canais-venda", label: "Canais de venda" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-neutral-900">{user.company.name}</p>
            <p className="text-xs text-neutral-500">{user.name}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Sair
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
