"use client";

import { useMemo, useState } from "react";
import {
  computeProductionCost,
  computeSellingPriceMarkupDivisor,
  computeFixedMarkupTable,
  computeProfitPerPlateHour,
  type ProductionCostBreakdown,
} from "@/lib/pricing-engine";
import { saveSimulation } from "@/app/actions/simulations";

interface SalesChannelOption {
  id: string;
  name: string;
  feePercentage: number; // fração 0-1
}

interface Props {
  productId: string;
  weightG: number;
  printTimeMin: number;
  piecesPerPlate: number;
  filament: { spoolCost: number; spoolWeightKg: number };
  printer: { price: number; maintenanceCost: number; usefulLifeHours: number; powerConsumptionKw: number };
  componentsCost: number;
  processMinutesTotal: number;
  laborHourCost: number;
  salesChannels: SalesChannelOption[];
}

const FIXED_MARKUPS = [3, 4, 5, 6];

export function PricingSimulator({
  productId,
  weightG,
  printTimeMin,
  piecesPerPlate,
  filament,
  printer,
  componentsCost,
  processMinutesTotal,
  laborHourCost,
  salesChannels,
}: Props) {
  const [mode, setMode] = useState<"MARKUP_DIVISOR" | "FIXED_MARKUP_TABLE">("MARKUP_DIVISOR");
  const [kwhCost, setKwhCost] = useState(0.95);
  const [failureRatePctInput, setFailureRatePctInput] = useState(15); // %
  const [consumablesCost, setConsumablesCost] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  const [salesChannelId, setSalesChannelId] = useState("");

  const [taxPctInput, setTaxPctInput] = useState(0);
  const [cardFeePctInput, setCardFeePctInput] = useState(0);
  const [otherFeesPctInput, setOtherFeesPctInput] = useState(0);
  const [profitPctInput, setProfitPctInput] = useState(30);

  const [chargesPctInput, setChargesPctInput] = useState(20); // modo B

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const selectedChannel = salesChannels.find((c) => c.id === salesChannelId);
  const salesChannelFeePct = selectedChannel ? Number(selectedChannel.feePercentage) : 0;

  const printTimeHours = printTimeMin / 60;
  const failureRatePct = failureRatePctInput / 100;

  const breakdown: ProductionCostBreakdown = useMemo(() => {
    return computeProductionCost({
      weightG,
      printTimeHours,
      filament,
      printer,
      kwhCost,
      failureRatePct,
      consumablesCost,
      components: [{ unitCost: componentsCost, quantity: 1 }],
      processSteps: [{ minutes: processMinutesTotal }],
      laborHourCost,
      piecesPerPlate,
    });
  }, [
    weightG,
    printTimeHours,
    filament,
    printer,
    kwhCost,
    failureRatePct,
    consumablesCost,
    componentsCost,
    processMinutesTotal,
    laborHourCost,
    piecesPerPlate,
  ]);

  const indices = {
    taxPct: taxPctInput / 100,
    salesChannelFeePct,
    cardFeePct: cardFeePctInput / 100,
    otherFeesPct: otherFeesPctInput / 100,
    desiredProfitPct: profitPctInput / 100,
  };

  let markupDivisorResult: ReturnType<typeof computeSellingPriceMarkupDivisor> | null = null;
  let markupDivisorError: string | null = null;
  try {
    markupDivisorResult = computeSellingPriceMarkupDivisor(breakdown.totalUnitCost, indices, shippingCost);
  } catch (e) {
    markupDivisorError = e instanceof Error ? e.message : "Erro ao calcular.";
  }

  const fixedMarkupRows = computeFixedMarkupTable(breakdown.totalUnitCost, FIXED_MARKUPS, chargesPctInput / 100);

  const resultSnapshot = {
    breakdown,
    mode,
    markupDivisorResult,
    fixedMarkupRows,
    inputs: {
      kwhCost,
      failureRatePct,
      consumablesCost,
      shippingCost,
      salesChannelId: salesChannelId || null,
      indices,
      chargesPct: chargesPctInput / 100,
    },
  };

  async function handleSave() {
    setSaveMessage(null);
    const formData = new FormData();
    formData.set("productId", productId);
    if (salesChannelId) formData.set("salesChannelId", salesChannelId);
    formData.set("mode", mode);
    formData.set("failureRatePct", String(failureRatePct));
    formData.set("shippingCost", String(shippingCost));
    formData.set("kwhCost", String(kwhCost));
    formData.set("taxPct", String(indices.taxPct));
    formData.set("cardFeePct", String(indices.cardFeePct));
    formData.set("otherFeePct", String(indices.otherFeesPct));
    formData.set("profitPct", String(indices.desiredProfitPct));
    formData.set("resultSnapshotJson", JSON.stringify(resultSnapshot));

    await saveSimulation(formData);
    setSaveMessage("Simulação salva.");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Parâmetros de produção</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Custo do kWh (R$)
            <input
              type="number"
              step="0.01"
              value={kwhCost}
              onChange={(e) => setKwhCost(Number(e.target.value))}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Taxa de falhas (%)
            <input
              type="number"
              step="1"
              value={failureRatePctInput}
              onChange={(e) => setFailureRatePctInput(Number(e.target.value))}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Consumíveis (R$)
            <input
              type="number"
              step="0.01"
              value={consumablesCost}
              onChange={(e) => setConsumablesCost(Number(e.target.value))}
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Frete (R$)
            <input
              type="number"
              step="0.01"
              value={shippingCost}
              onChange={(e) => setShippingCost(Number(e.target.value))}
              className="input"
            />
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-neutral-900">Custo de produção (calculado)</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <Row label="Material" value={breakdown.materialCost} />
          <Row label="Depreciação impressora" value={breakdown.printerDepreciationCost} />
          <Row label="Eletricidade" value={breakdown.electricityCost} />
          <Row label="Adicional por falhas" value={breakdown.failureSurchargeCost} />
          <Row label="Consumíveis" value={breakdown.consumablesCost} />
          <Row label="Componentes" value={breakdown.componentsCost} />
          <Row label="Mão de obra" value={breakdown.laborCost} />
          <Row label="Custo total (bandeja)" value={breakdown.totalPlateCost} bold />
          <Row label="Custo total (unitário)" value={breakdown.totalUnitCost} bold />
        </dl>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-900">Simulação de preço de venda</h2>
          <div className="flex gap-1 rounded-md bg-neutral-100 p-1 text-xs">
            <button
              type="button"
              onClick={() => setMode("MARKUP_DIVISOR")}
              className={`rounded px-2 py-1 ${mode === "MARKUP_DIVISOR" ? "bg-white shadow-sm" : "text-neutral-500"}`}
            >
              Markup divisor
            </button>
            <button
              type="button"
              onClick={() => setMode("FIXED_MARKUP_TABLE")}
              className={`rounded px-2 py-1 ${mode === "FIXED_MARKUP_TABLE" ? "bg-white shadow-sm" : "text-neutral-500"}`}
            >
              Tabela de markup
            </button>
          </div>
        </div>

        {mode === "MARKUP_DIVISOR" && (
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Canal de venda
                <select
                  value={salesChannelId}
                  onChange={(e) => setSalesChannelId(e.target.value)}
                  className="input"
                >
                  <option value="">Nenhum</option>
                  {salesChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({(Number(c.feePercentage) * 100).toFixed(1)}%)
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Impostos (%)
                <input
                  type="number"
                  step="1"
                  value={taxPctInput}
                  onChange={(e) => setTaxPctInput(Number(e.target.value))}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Taxa de cartão (%)
                <input
                  type="number"
                  step="1"
                  value={cardFeePctInput}
                  onChange={(e) => setCardFeePctInput(Number(e.target.value))}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Outras taxas (%)
                <input
                  type="number"
                  step="1"
                  value={otherFeesPctInput}
                  onChange={(e) => setOtherFeesPctInput(Number(e.target.value))}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Lucro desejado (%)
                <input
                  type="number"
                  step="1"
                  value={profitPctInput}
                  onChange={(e) => setProfitPctInput(Number(e.target.value))}
                  className="input"
                />
              </label>
            </div>

            {markupDivisorError && (
              <p className="mt-3 text-sm text-red-600">{markupDivisorError}</p>
            )}

            {markupDivisorResult && (
              <div className="mt-4 rounded-lg bg-neutral-50 p-4">
                <p className="text-xs text-neutral-500">
                  Markup multiplicador: {markupDivisorResult.markupMultiplier.toFixed(3)}x (Σ índices ={" "}
                  {(markupDivisorResult.indicesSum * 100).toFixed(1)}%)
                </p>
                <p className="mt-1 text-2xl font-semibold text-neutral-900">
                  R$ {markupDivisorResult.sellingPriceWithShipping.toFixed(2)}
                </p>
                <p className="text-xs text-neutral-500">preço de venda à vista (com frete)</p>
              </div>
            )}
          </div>
        )}

        {mode === "FIXED_MARKUP_TABLE" && (
          <div className="mt-4">
            <label className="flex max-w-xs flex-col gap-1 text-xs text-neutral-500">
              Encargos sobre o preço de venda (%)
              <input
                type="number"
                step="1"
                value={chargesPctInput}
                onChange={(e) => setChargesPctInput(Number(e.target.value))}
                className="input"
              />
            </label>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-neutral-500">
                    <th className="px-2 py-1">Markup</th>
                    <th className="px-2 py-1">Preço de venda</th>
                    <th className="px-2 py-1">Custo + encargos</th>
                    <th className="px-2 py-1">Lucro líquido</th>
                    <th className="px-2 py-1">Margem líquida</th>
                    <th className="px-2 py-1">Lucro/h de bandeja</th>
                  </tr>
                </thead>
                <tbody>
                  {fixedMarkupRows.map((row) => (
                    <tr key={row.markup} className="border-b border-neutral-100 last:border-0">
                      <td className="px-2 py-1">{row.markup}x</td>
                      <td className="px-2 py-1">R$ {row.sellingPrice.toFixed(2)}</td>
                      <td className="px-2 py-1">R$ {row.costPlusCharges.toFixed(2)}</td>
                      <td className="px-2 py-1">R$ {row.netProfit.toFixed(2)}</td>
                      <td className="px-2 py-1">{(row.netMarginPct * 100).toFixed(1)}%</td>
                      <td className="px-2 py-1">
                        R${" "}
                        {computeProfitPerPlateHour(row.netProfit, piecesPerPlate, printTimeMin).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-3">
          <button type="button" onClick={handleSave} className="btn-primary">
            Salvar simulação
          </button>
          {saveMessage && <span className="text-sm text-green-700">{saveMessage}</span>}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-neutral-500">{label}</dt>
      <dd className={bold ? "font-semibold text-neutral-900" : "text-neutral-700"}>
        R$ {value.toFixed(2)}
      </dd>
    </div>
  );
}
