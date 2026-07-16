import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Filamentos PLA da aba MATERIAIS da planilha "CAMADA 2026".
// Só os 6 primeiros têm preço informado na planilha original; o restante fica
// com custo do rolo em R$0 para o usuário completar.
const PLA_FILAMENTS: { name: string; spoolCost: number; description: string }[] = [
  { name: "PLA Normal / Basic", spoolCost: 90, description: "PLA comum, acabamento fosco ou levemente brilhante" },
  { name: "PLA Silk", spoolCost: 65.11, description: "Muito brilhante, aparência “metalizada”" },
  { name: "PLA Silk Dual Color", spoolCost: 72.77, description: "Duas cores que aparecem dependendo do ângulo" },
  { name: "PLA Silk Tri Color", spoolCost: 74.62, description: "Três cores no mesmo filamento" },
  { name: "PLA Silk Rainbow", spoolCost: 74.64, description: "Troca gradual de cores com efeito brilhante" },
  { name: "PLA Rainbow", spoolCost: 72.0, description: "Transição gradual de várias cores" },
  { name: "PLA Gradient - Masterprint", spoolCost: 0, description: "Gradiente de cores ao longo do filamento" },
  { name: "PLA Dual Color", spoolCost: 0, description: "Duas cores visíveis dependendo do ângulo" },
  { name: "PLA Tri Color", spoolCost: 0, description: "Três cores visíveis dependendo do ângulo" },
  { name: "PLA Glitter", spoolCost: 0, description: "Contém partículas brilhantes" },
  { name: "PLA Galaxy", spoolCost: 0, description: "Glitter mais fino, efeito “céu estrelado”" },
  { name: "PLA Shiny / Glossy", spoolCost: 0, description: "Brilho alto, mas menos metálico que o silk" },
  { name: "PLA Matte", spoolCost: 0, description: "Acabamento fosco" },
  { name: "PLA Velvet", spoolCost: 0, description: "Fosco com textura aveludada" },
  { name: "PLA Soft Touch", spoolCost: 0, description: "Sensação de toque macio" },
  { name: "PLA Wood", spoolCost: 0, description: "Contém partículas de madeira" },
  { name: "PLA Marble", spoolCost: 0, description: "Aparência de mármore" },
  { name: "PLA Stone", spoolCost: 0, description: "Aparência de pedra" },
  { name: "PLA Concrete", spoolCost: 0, description: "Aparência de concreto" },
  { name: "PLA Metal Fill", spoolCost: 0, description: "Contém partículas metálicas como bronze ou cobre" },
  { name: "PLA+ (PLA Plus)", spoolCost: 0, description: "Versão mais resistente do PLA comum" },
  { name: "PLA Pro", spoolCost: 0, description: "PLA aprimorado com maior resistência" },
  { name: "PLA Tough", spoolCost: 0, description: "Maior resistência a impacto" },
  { name: "PLA High Speed", spoolCost: 0, description: "Desenvolvido para impressão em alta velocidade" },
  { name: "PLA HT", spoolCost: 0, description: "Suporta temperaturas mais altas que o PLA comum" },
  { name: "PLA LW (Lightweight)", spoolCost: 0, description: "Expande durante a impressão e fica mais leve" },
  { name: "PLA Glow in the Dark", spoolCost: 0, description: "Brilha no escuro após exposição à luz" },
  { name: "PLA UV Color Change", spoolCost: 0, description: "Muda de cor quando exposto à luz UV" },
  { name: "PLA Thermochromic", spoolCost: 0, description: "Muda de cor conforme a temperatura" },
  { name: "PLA Transparent / Crystal", spoolCost: 0, description: "Aparência translúcida" },
  { name: "PLA Fluorescent", spoolCost: 0, description: "Cores neon bem vibrantes" },
];

async function main() {
  const company = await prisma.company.upsert({
    where: { id: "seed-company" },
    update: {},
    create: { id: "seed-company", name: "Minha Oficina 3D" },
  });

  await prisma.filament.createMany({
    data: PLA_FILAMENTS.map((f) => ({
      companyId: company.id,
      name: f.name,
      brand: "Genérico",
      type: "PLA",
      description: f.description,
      spoolCost: f.spoolCost,
      spoolWeightKg: 1,
    })),
    skipDuplicates: true,
  });

  await prisma.component.createMany({
    data: [
      { companyId: company.id, name: "Argola Chaveiro Prata", category: "Chaveiro", unitCost: 0.165 },
      { companyId: company.id, name: "Argola Chaveiro Dourado", category: "Chaveiro", unitCost: 0.185 },
      { companyId: company.id, name: "Saquinho", category: "Embalagem", unitCost: 0.028 },
    ],
    skipDuplicates: true,
  });

  // Impressoras da planilha "Promakers/SEBRAE v1.3", aba IMPRESSORAS.
  await prisma.printer.createMany({
    data: [
      {
        companyId: company.id,
        name: "Carbon i3",
        price: 2000,
        maintenanceCost: 500, // 25% do preço
        usefulLifeHours: 5000,
        powerConsumptionKw: 0.15,
      },
      {
        companyId: company.id,
        name: "Ender 3 S1 Plus",
        price: 3800,
        maintenanceCost: 950, // 25% do preço
        usefulLifeHours: 5000,
        powerConsumptionKw: 0.3,
      },
    ],
    skipDuplicates: true,
  });

  // Etapas de processo da planilha "Promakers/SEBRAE v1.3", aba TOTAL CUSTO HORAS TRABALHADAS.
  await prisma.processStep.createMany({
    data: [
      { companyId: company.id, name: "Download do modelo", defaultMinutes: 2 },
      { companyId: company.id, name: "Preparação do modelo (ajustes, CAD...)", defaultMinutes: 0 },
      { companyId: company.id, name: "Fatiamento (suportes, parâmetros...)", defaultMinutes: 2 },
      { companyId: company.id, name: "Troca de material", defaultMinutes: 5 },
      { companyId: company.id, name: "Transferência e início", defaultMinutes: 7 },
      { companyId: company.id, name: "Remoção da peça da mesa", defaultMinutes: 1 },
      { companyId: company.id, name: "Remoção do suporte", defaultMinutes: 0 },
      { companyId: company.id, name: "Acabamento (lixamento, rebarbação...)", defaultMinutes: 0 },
    ],
    skipDuplicates: true,
  });

  // Regras de taxa da aba CONSULTA da planilha "CAMADA 2026" (referência Shopee).
  await prisma.salesChannel.createMany({
    data: [
      {
        companyId: company.id,
        name: "Shopee Clássico",
        feePercentage: 0.12, // 10-14% conforme categoria
        fixedFeeRulesJson: {
          descricao: "Custo fixo adicional para produtos abaixo de R$79,00",
          faixas: [
            { ateReais: 12.5, regra: "metade do preço do produto por unidade vendida" },
            { deReais: 12.5, ateReais: 29, custoFixoReais: 6.25 },
            { deReais: 29, ateReais: 50, custoFixoReais: 6.5 },
            { deReais: 50, ateReais: 79, custoFixoReais: 6.75 },
          ],
        },
      },
      {
        companyId: company.id,
        name: "Shopee Premium",
        feePercentage: 0.17, // 15-19% conforme categoria
        fixedFeeRulesJson: {
          descricao: "Mesmas regras de custo fixo do Clássico + parcelamento",
        },
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Seed concluído para a empresa "${company.name}" (id: ${company.id}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
