import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <h1 className="text-3xl font-semibold text-neutral-900">Preços 3D</h1>
        <p className="mt-2 max-w-md text-neutral-500">
          Sistema de precificação de peças impressas em 3D: cadastre impressoras,
          materiais, despesas fixas e simule o preço de venda dos seus produtos.
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Entrar
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
        >
          Criar empresa
        </Link>
      </div>
    </div>
  );
}
