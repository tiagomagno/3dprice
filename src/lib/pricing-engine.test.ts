import { describe, expect, it } from "vitest";
import {
  computeMaterialCost,
  computePrinterDepreciationCost,
  computeElectricityCost,
  computeLaborHourCost,
  computeLaborCost,
  computeProductionCost,
  computeSellingPriceMarkupDivisor,
  computeFixedMarkupTable,
  computeProfitPerPlateHour,
  filamentCostPerKg,
  printerDepreciationPerHour,
} from "./pricing-engine";

// Cenário de referência: exemplo "1x Benchy" da planilha
// "Planilha-Calculo-do-Preco-de-Vendas-de-Pecas-Impressas-3D v1.3", que documenta
// os valores esperados célula a célula (ver ESTUDO-PRECIFICACAO.md).
const benchyPrinter = {
  price: 3800,
  maintenanceCost: 950,
  usefulLifeHours: 5000,
  powerConsumptionKw: 0.3,
};

const benchyFilament = {
  spoolCost: 120,
  spoolWeightKg: 1,
};

const benchyHours = 11 / 60 + 1; // 0 dias, 1 hora, 11 min

describe("filamentCostPerKg / printerDepreciationPerHour", () => {
  it("calcula custo/kg do filamento (planilha MATERIAIS)", () => {
    expect(filamentCostPerKg(benchyFilament)).toBeCloseTo(120, 6);
  });

  it("calcula depreciação/h da impressora (planilha IMPRESSORAS)", () => {
    expect(printerDepreciationPerHour(benchyPrinter)).toBeCloseTo(0.95, 6);
  });
});

describe("custos de impressão (planilha CUSTO DE IMPRESSÃO 3D)", () => {
  it("custo de material = (peso/1000) * custoPorKg", () => {
    expect(computeMaterialCost(14, benchyFilament)).toBeCloseTo(1.68, 6);
  });

  it("custo de depreciação da máquina", () => {
    expect(computePrinterDepreciationCost(benchyHours, benchyPrinter)).toBeCloseTo(
      1.1241666666666665,
      6
    );
  });

  it("custo de eletricidade", () => {
    expect(computeElectricityCost(benchyHours, 0.95, benchyPrinter)).toBeCloseTo(
      0.33724999999999994,
      6
    );
  });
});

describe("custo-hora de mão de obra (planilha CUSTO HORA DE TRABALHO)", () => {
  it("calcula o custo-hora a partir de despesas fixas + depreciação de imobilizado", () => {
    const fixedExpensesExcludingDepreciation = 4157.9;
    const assets = [
      { value: 8000, usefulLifeYears: 5 }, // computador
      { value: 2000, usefulLifeYears: 5 }, // monitor
      { value: 687, usefulLifeYears: 5 }, // mesa
      { value: 20, usefulLifeYears: 1 }, // alicate
      { value: 687, usefulLifeYears: 5 }, // bancada
    ];
    const labor = {
      numPeople: 1,
      dailyHours: 8,
      workDaysPerMonth: 22,
      productivityPct: 0.85,
    };

    const hourCost = computeLaborHourCost(fixedExpensesExcludingDepreciation, assets, labor);
    expect(hourCost).toBeCloseTo(29.07174688057041, 4);
  });

  it("calcula o custo de mão de obra a partir das etapas do processo", () => {
    const steps = [
      { minutes: 2 }, // download
      { minutes: 0 }, // preparação
      { minutes: 2 }, // fatiamento
      { minutes: 5 }, // troca de material
      { minutes: 7 }, // transferência
      { minutes: 1 }, // remoção da peça
    ];
    const laborCost = computeLaborCost(steps, 29.07174688057041);
    expect(laborCost).toBeCloseTo(8.23699494949495, 4);
  });
});

describe("computeProductionCost — integração completa (exemplo Benchy)", () => {
  it("reproduz o TOTAL CUSTO IMPRESSÃO 3D (C14 da aba PREÇO DE VENDA) = 11.93277926322044", () => {
    const breakdown = computeProductionCost({
      weightG: 14,
      printTimeHours: benchyHours,
      filament: benchyFilament,
      printer: benchyPrinter,
      kwhCost: 0.95,
      failureRatePct: 0.15,
      consumablesCost: 0,
      components: [],
      processSteps: [{ minutes: 17 }], // soma das etapas do exemplo = 17 min
      laborHourCost: 29.07174688057041,
      piecesPerPlate: 1,
    });

    expect(breakdown.materialCost).toBeCloseTo(1.68, 4);
    expect(breakdown.printerDepreciationCost).toBeCloseTo(1.1241666666666665, 4);
    expect(breakdown.electricityCost).toBeCloseTo(0.33724999999999994, 4);
    expect(breakdown.failureSurchargeCost).toBeCloseTo(0.5543676470588235, 3);
    expect(breakdown.laborCost).toBeCloseTo(8.23699494949495, 3);
    expect(breakdown.totalPlateCost).toBeCloseTo(11.93277926322044, 2);
    expect(breakdown.totalUnitCost).toBeCloseTo(11.93277926322044, 2);
  });
});

describe("computeSellingPriceMarkupDivisor (planilha PREÇO DE VENDA)", () => {
  it("reproduz o preço de venda à vista = 23.86555852644088 com lucro desejado de 50%", () => {
    const result = computeSellingPriceMarkupDivisor(11.93277926322044, {
      taxPct: 0,
      salesChannelFeePct: 0,
      cardFeePct: 0,
      otherFeesPct: 0,
      desiredProfitPct: 0.5,
    });

    expect(result.markupMultiplier).toBeCloseTo(2, 6);
    expect(result.sellingPrice).toBeCloseTo(23.86555852644088, 2);
  });

  it("lança erro se a soma dos índices for >= 100%", () => {
    expect(() =>
      computeSellingPriceMarkupDivisor(10, {
        taxPct: 0.5,
        salesChannelFeePct: 0.3,
        cardFeePct: 0.1,
        otherFeesPct: 0.05,
        desiredProfitPct: 0.1,
      })
    ).toThrow();
  });
});

describe("computeFixedMarkupTable (planilha CAMADA 2026)", () => {
  it("replica a tabela de markup 3x-6x com encargos de 20% sobre o preço de venda", () => {
    const rows = computeFixedMarkupTable(10, [3, 4, 5, 6], 0.2);

    // markup 3x: preço = 10*(1+3) = 40; encargos = 10 + 0.2*40 = 18; lucro = 22; margem = 0.55
    expect(rows[0]).toMatchObject({ markup: 3 });
    expect(rows[0].sellingPrice).toBeCloseTo(40, 6);
    expect(rows[0].costPlusCharges).toBeCloseTo(18, 6);
    expect(rows[0].netProfit).toBeCloseTo(22, 6);
    expect(rows[0].netMarginPct).toBeCloseTo(0.55, 6);
  });
});

describe("computeProfitPerPlateHour", () => {
  it("calcula lucro por hora de bandeja", () => {
    // lucro unitário 5, 4 peças por bandeja, 30 minutos de impressão -> 2h de lucro-bandeja em 0.5h = 40/h
    expect(computeProfitPerPlateHour(5, 4, 30)).toBeCloseTo(40, 6);
  });
});
