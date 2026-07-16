/**
 * Motor de cálculo de precificação de peças 3D.
 *
 * Consolida a lógica das duas planilhas fonte (ver ESTUDO-PRECIFICACAO.md):
 * - "CAMADA 2026": cadastro de produto + simulação de markup fixo (3x-6x).
 * - "Promakers/SEBRAE v1.3": custeio profissional com depreciação real,
 *   eletricidade, taxa de falha, despesas fixas rateadas por hora produtiva
 *   e markup pela fórmula divisora (1/(1-Σ%)).
 *
 * Todas as funções são puras (sem I/O) para facilitar testes e reuso.
 */

export interface PrinterInput {
  price: number;
  maintenanceCost: number;
  usefulLifeHours: number;
  powerConsumptionKw: number;
}

export interface FilamentInput {
  spoolCost: number;
  spoolWeightKg: number;
}

export interface ComponentUsage {
  unitCost: number;
  quantity: number;
}

export interface ProcessStepUsage {
  minutes: number;
}

export interface LaborConfigInput {
  numPeople: number;
  dailyHours: number;
  workDaysPerMonth: number;
  productivityPct: number; // fração 0-1
}

export interface AssetInput {
  value: number;
  usefulLifeYears: number;
}

/** custo por kg = custo do rolo / peso do rolo (kg). Planilha 2, aba MATERIAIS. */
export function filamentCostPerKg(filament: FilamentInput): number {
  if (filament.spoolWeightKg <= 0) return 0;
  return filament.spoolCost / filament.spoolWeightKg;
}

/** custoMaterial = (peso_g/1000) * custoPorKg. Planilha 2, aba CUSTO DE IMPRESSÃO 3D (coluna J). */
export function computeMaterialCost(weightG: number, filament: FilamentInput): number {
  return (weightG / 1000) * filamentCostPerKg(filament);
}

/** depreciação R$/h = (preço + manutenção) / vida útil em horas. Planilha 2, aba IMPRESSORAS (coluna G). */
export function printerDepreciationPerHour(printer: PrinterInput): number {
  if (printer.usefulLifeHours <= 0) return 0;
  return (printer.price + printer.maintenanceCost) / printer.usefulLifeHours;
}

/** custoMáquina = horas * depreciação/h. Planilha 2, aba CUSTO DE IMPRESSÃO 3D (coluna K). */
export function computePrinterDepreciationCost(hours: number, printer: PrinterInput): number {
  return hours * printerDepreciationPerHour(printer);
}

/** custoEletricidade = horas * custoKwh * consumoKw. Planilha 2, aba CUSTO DE IMPRESSÃO 3D (coluna L). */
export function computeElectricityCost(hours: number, kwhCost: number, printer: PrinterInput): number {
  return hours * kwhCost * printer.powerConsumptionKw;
}

/** soma valorUnitario * quantidade de cada componente/material complementar usado no produto. */
export function computeComponentsCost(components: ComponentUsage[]): number {
  return components.reduce((sum, c) => sum + c.unitCost * c.quantity, 0);
}

/** depreciação mensal de um item de imobilizado = valor / (vidaUtilAnos * 12). Planilha 2, aba DESPESAS (FIXO). */
export function assetMonthlyDepreciation(asset: AssetInput): number {
  if (asset.usefulLifeYears <= 0) return 0;
  return asset.value / (asset.usefulLifeYears * 12);
}

/**
 * custo-hora de mão de obra = despesa fixa mensal total / horas produtivas disponíveis no mês.
 * Planilha 2, aba CUSTO HORA DE TRABALHO.
 */
export function computeLaborHourCost(
  fixedExpensesMonthlyTotal: number,
  assets: AssetInput[],
  labor: LaborConfigInput
): number {
  const depreciationTotal = assets.reduce((sum, a) => sum + assetMonthlyDepreciation(a), 0);
  const totalFixedExpenses = fixedExpensesMonthlyTotal + depreciationTotal;

  const productiveHoursPerMonth =
    labor.numPeople * labor.dailyHours * labor.workDaysPerMonth * labor.productivityPct;

  if (productiveHoursPerMonth <= 0) return 0;
  return totalFixedExpenses / productiveHoursPerMonth;
}

/**
 * custo de mão de obra do produto = (Σ minutos das etapas / 60) * custo-hora.
 * Planilha 2, aba TOTAL CUSTO HORAS TRABALHADAS.
 */
export function computeLaborCost(steps: ProcessStepUsage[], laborHourCost: number): number {
  const totalHours = steps.reduce((sum, s) => sum + s.minutes, 0) / 60;
  return totalHours * laborHourCost;
}

export interface ProductionCostInput {
  weightG: number;
  printTimeHours: number;
  filament: FilamentInput;
  printer: PrinterInput;
  kwhCost: number;
  failureRatePct: number; // fração 0-1
  consumablesCost: number;
  components: ComponentUsage[];
  processSteps: ProcessStepUsage[];
  laborHourCost: number;
  piecesPerPlate: number;
}

export interface ProductionCostBreakdown {
  materialCost: number;
  printerDepreciationCost: number;
  electricityCost: number;
  /** custo adicional gerado pela taxa de falha de impressão (peças perdidas). */
  failureSurchargeCost: number;
  consumablesCost: number;
  componentsCost: number;
  laborCost: number;
  /** custo total de produção da bandeja/prato inteiro. */
  totalPlateCost: number;
  /** custo total de produção por unidade (totalPlateCost / piecesPerPlate). */
  totalUnitCost: number;
}

/**
 * custoTotalProducao: combina material, depreciação, eletricidade, taxa de falha,
 * consumíveis, componentes e mão de obra.
 *
 * A taxa de falha é aplicada sobre material+máquina (como na planilha 2:
 * total = (material+subtotalMaquina)/(1-falha%) + consumíveis), e o resultado
 * é reportado como "failureSurchargeCost" = o adicional gerado pela taxa.
 */
export function computeProductionCost(input: ProductionCostInput): ProductionCostBreakdown {
  const materialCost = computeMaterialCost(input.weightG, input.filament);
  const printerDepreciationCost = computePrinterDepreciationCost(input.printTimeHours, input.printer);
  const electricityCost = computeElectricityCost(input.printTimeHours, input.kwhCost, input.printer);
  const componentsCost = computeComponentsCost(input.components);
  const laborCost = computeLaborCost(input.processSteps, input.laborHourCost);

  const baseBeforeFailure = materialCost + printerDepreciationCost + electricityCost;
  const failureRate = Math.min(Math.max(input.failureRatePct, 0), 0.9999);
  const baseWithFailure = baseBeforeFailure / (1 - failureRate);
  const failureSurchargeCost = baseWithFailure - baseBeforeFailure;

  const totalPlateCost =
    baseWithFailure + input.consumablesCost + componentsCost + laborCost;
  const piecesPerPlate = Math.max(input.piecesPerPlate, 1);

  return {
    materialCost,
    printerDepreciationCost,
    electricityCost,
    failureSurchargeCost,
    consumablesCost: input.consumablesCost,
    componentsCost,
    laborCost,
    totalPlateCost,
    totalUnitCost: totalPlateCost / piecesPerPlate,
  };
}

// ---------------------------------------------------------------------------
// Modo A — markup divisor (Planilha 2, aba PREÇO DE VENDA)
// ---------------------------------------------------------------------------

export interface CommercialIndices {
  /** todas as frações são 0-1 e representam % sobre o PREÇO DE VENDA final. */
  taxPct: number;
  salesChannelFeePct: number;
  cardFeePct: number;
  otherFeesPct: number;
  desiredProfitPct: number;
}

export interface MarkupDivisorResult {
  indicesSum: number;
  markupMultiplier: number;
  sellingPrice: number;
  sellingPriceWithShipping: number;
}

/**
 * markup = 1 / (1 - Σ índices); preço = custo * markup + frete.
 * Evita o erro clássico de aplicar % sobre o custo em vez de sobre o preço final.
 */
export function computeSellingPriceMarkupDivisor(
  unitCost: number,
  indices: CommercialIndices,
  shippingCost = 0
): MarkupDivisorResult {
  const indicesSum =
    indices.taxPct +
    indices.salesChannelFeePct +
    indices.cardFeePct +
    indices.otherFeesPct +
    indices.desiredProfitPct;

  if (indicesSum >= 1) {
    throw new Error(
      "A soma dos índices de comercialização deve ser menor que 100% (1.0)."
    );
  }

  const markupMultiplier = 1 / (1 - indicesSum);
  const sellingPrice = unitCost * markupMultiplier;

  return {
    indicesSum,
    markupMultiplier,
    sellingPrice,
    sellingPriceWithShipping: sellingPrice + shippingCost,
  };
}

// ---------------------------------------------------------------------------
// Modo B — tabela de markup fixo (Planilha 1, aba PRECIFICAÇÃO)
// ---------------------------------------------------------------------------

export interface FixedMarkupRow {
  markup: number;
  sellingPrice: number;
  costPlusCharges: number;
  netProfit: number;
  netMarginPct: number;
}

/**
 * Réplica da tabela de simulação da planilha 1: para cada markup, calcula
 * preço = custo*(1+markup); "encargos" = custo + encargosPct*preço;
 * lucro = preço - encargos; margem = lucro/preço.
 */
export function computeFixedMarkupTable(
  unitCost: number,
  markups: number[],
  chargesPct: number
): FixedMarkupRow[] {
  return markups.map((markup) => {
    const sellingPrice = unitCost * (1 + markup);
    const costPlusCharges = unitCost + chargesPct * sellingPrice;
    const netProfit = sellingPrice - costPlusCharges;
    const netMarginPct = sellingPrice > 0 ? netProfit / sellingPrice : 0;

    return { markup, sellingPrice, costPlusCharges, netProfit, netMarginPct };
  });
}

/** lucro por hora de bandeja = (lucroUnitario * pecasPorBandeja) / (tempoImpressaoMin/60). Planilha 1. */
export function computeProfitPerPlateHour(
  unitProfit: number,
  piecesPerPlate: number,
  printTimeMin: number
): number {
  if (printTimeMin <= 0) return 0;
  return (unitProfit * piecesPerPlate) / (printTimeMin / 60);
}
