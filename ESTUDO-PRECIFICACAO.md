# Estudo das planilhas de precificação 3D

Documento de referência para o desenvolvimento do sistema web/app de precificação de peças impressas em 3D. Consolida a lógica de duas planilhas-fonte.

## Fontes

1. **Google Sheets "PRECIFICAÇÃO 3D CAMADA 2026"** (abas: PRECIFICAÇÃO, MATERIAIS, CATEGORIZAÇÃO, CONSULTA, MODELO)
2. **Planilha-Calculo-do-Preco-de-Vendas-de-Pecas-Impressas-3D v1.3** (modelo público estilo SEBRAE/Promakers; abas: APRESENTAÇÃO, IMPRESSORAS, MATERIAIS, CUSTO DE IMPRESSÃO 3D, DESPESAS (FIXO), CUSTO HORA DE TRABALHO, TOTAL CUSTO HORAS TRABALHADAS, PREÇO DE VENDA)

---

## 1. Planilha "CAMADA 2026" — modelo orientado a produto/catálogo

Foco: cadastrar um produto (com imagem, categoria, cor, tamanho) e simular preço de venda em 4 níveis de markup.

### Cadastros auxiliares
- **MATERIAIS**: lista de filamentos (nome, preço/kg, descrição) — ~31 tipos de PLA catalogados. Lista separada de "materiais complementares" (argola chaveiro prata/dourada, saquinho) com valor unitário.
- **CATEGORIZAÇÃO**: cadastro de categoria/subcategoria (estrutura vazia, a preencher).
- **CONSULTA**: base de referência manual (não conectada a fórmulas) sobre taxas de marketplace estilo Shopee — tipos de anúncio (Grátis/Clássico/Premium), tarifas 10-19%, regra de custo fixo escalonado para produtos abaixo de R$79 (R$6,25 / R$6,50 / R$6,75 ou metade do preço se <R$12,50), peso volumétrico para frete, comissão de afiliados (15-20%), Shopee ADS.

### Cálculo por produto (aba PRECIFICAÇÃO)
Inputs por produto: qtd. de peças por bandeja (n), consumo de filamento por bandeja (g), filamento usado (lookup em MATERIAIS → preço/kg), tempo de impressão da bandeja (min), custo elétrico/dia (R$, valor fixo informado manualmente, ex. R$2,50).

```
custoFilamentoBandeja = (precoKg * consumoG) / 1000
custoFilamentoUnit    = custoFilamentoBandeja / n

custoEnergiaBandeja   = (custoEletricoDia / 1440) * tempoImpressaoMin   // rateio simples do "orçamento elétrico diário" pelos minutos usados
custoEnergiaUnit      = custoEnergiaBandeja / n

custoMaoDeObraUnit    = (tempoMin * 0.28) / n     // R$0,28/min fixo e hardcoded (~R$16,80/h)
custoMaoDeObraBandeja = custoMaoDeObraUnit * n

custoComplementaresBandeja = Σ(valorUnitario_i * n)   // cinta, saquinho, +3 slots livres
custoComplementaresUnit    = custoComplementaresBandeja / n

custoTotalBandeja  = custoFilamentoBandeja + custoMaoDeObraBandeja + custoComplementaresBandeja
custoTotalUnitario = custoFilamentoUnit + custoMaoDeObraUnit + custoComplementaresUnit
```

Tabela de simulação (4 linhas fixas, markup 3x/4x/5x/6x):
```
precoVenda        = custoTotalUnitario * markup + custoTotalUnitario   // = custo*(1+markup)
custoProdEncargos = custoTotalUnitario + 0.20 * precoVenda             // "encargos" fixo de 20% sobre o preço de venda
lucroLiquidoUnit  = precoVenda - custoProdEncargos
margemLiquida%    = lucroLiquidoUnit / precoVenda
lucroBandejaPorHora = (lucroLiquidoUnit * n) / (tempoImpressaoMin / 60)
```

### Pontos fracos deste modelo
- Custo de mão de obra é uma taxa fixa arbitrária (R$0,28/min), não calculada a partir de despesas reais do negócio.
- Custo de energia é um rateio simplificado de um "orçamento diário", não baseado em consumo real (kW) do equipamento.
- Não considera depreciação real da impressora, taxa de falha de impressão, nem despesas fixas do negócio (aluguel, funcionários etc.).
- "Encargos" de 20% é um valor fixo único — não modela taxas de marketplace variáveis (a aba CONSULTA é só referência manual, não integrada).
- Há inconsistência entre a aba PRECIFICAÇÃO (F10 = input fixo 2,5) e a aba MODELO (F10 = fórmula `(2.5/1440)*D10`, que duplica o cálculo de D15) — parece erro de cópia de fórmula no template.

### Pontos fortes
- Modelo simples e rápido de usar por produto/SKU, com campos de catálogo (imagem, categoria, tamanho, cor) prontos para uma vitrine.
- Tabela comparativa de múltiplos markups de uma vez (decisão rápida de preço).
- Métrica "lucro por hora de bandeja" é útil para priorizar quais peças imprimir.

---

## 2. Planilha "v1.3 (Promakers/SEBRAE)" — modelo de custeio profissional

Foco: metodologia de precificação completa de negócio, com despesas fixas reais, custo-hora de mão de obra calculado, depreciação real de equipamento e markup pela fórmula de margem sobre o preço de venda (divisor).

### Cadastros auxiliares
- **IMPRESSORAS**: nome, preço, manutenção (25% do preço por padrão, editável), vida útil (horas), consumo (kW).
  `depreciacaoPorHora = (preco + manutencao) / vidaUtilHoras`
- **MATERIAIS**: marca, custo/rolo, peso/rolo (kg).
  `custoPorKg = custoRolo / pesoRolo`

### Custo de impressão por peça/prato (aba CUSTO DE IMPRESSÃO 3D)
Cada linha = uma peça na mesa de impressão: peso (g), material (lookup), impressora (lookup), tempo (dias+horas+min → total em horas).
```
tempoHoras       = dias*24 + horas + min/60
custoMaterial    = (peso/1000) * custoPorKg(material)
custoMaquina     = tempoHoras * depreciacaoPorHora(impressora)
custoEletricidade= tempoHoras * custoKwh * consumoKw(impressora)
subtotal         = custoMaquina + custoEletricidade
```
Totais da mesa (soma de todas as peças): horas totais, material total, máquina total, eletricidade total, subtotal total.

Parâmetros gerais: **custo do kWh** (ex. R$0,95), **taxa de falhas de impressão %** (ex. 15%), **consumíveis** (lixa, tinta etc., soma livre).
```
totalComFalhasEConsumiveis = (materialTotal + subtotalTotal) / (1 - taxaFalhas%) + consumiveis
```

### Despesas fixas do negócio (aba DESPESAS (FIXO))
Lista extensa de despesas mensais (água, aluguel, funcionários — salário/FGTS/INSS/férias/13º, internet, pró-labore, DAS, etc.) + depreciação de imobilizado (computador, monitor, mesa, alicate, bancada — cada um com valor e vida útil em anos, amortizado em `valor/(vidaUtilAnos*12)`).
```
despesaFixaMensalTotal = Σ(despesasVariaveis) + Σ(depreciacaoImobilizado)
```

### Custo-hora de mão de obra (aba CUSTO HORA DE TRABALHO)
```
horasProdutivasMes = numPessoas * horasDiariasProdutivas * diasTrabalhadosMes * %produtividade
custoHoraTrabalho  = despesaFixaMensalTotal / horasProdutivasMes
```
No exemplo: 1 pessoa, 8h/dia, 22 dias, 85% produtividade → 149,6h produtivas/mês; custo-hora ≈ R$29,07.

### Tempo de mão de obra por etapa (aba TOTAL CUSTO HORAS TRABALHADAS)
Checklist de etapas do processo, cada uma em minutos: download do modelo, preparação/CAD, fatiamento, troca de material, transferência/início de impressão, remoção da peça, remoção de suporte, acabamento (lixamento etc.).
```
tempoTotalHoras   = Σ(minutosPorEtapa) / 60
custoMaoDeObra    = tempoTotalHoras * custoHoraTrabalho
```

### Preço de venda final (aba PREÇO DE VENDA)
```
custoTotalImpressao = custoMaterial + custoDepreciacaoMaquina + custoEletricidade
                     + custoConsumiveis + custoAdicionalPorFalhas + custoMaoDeObra

// Índices de comercialização — todos definidos como % do PREÇO DE VENDA FINAL, não do custo:
//   impostos%, taxaVendaOnline%, taxaCartao%, reservado1%, reservado2%, lucroDesejado%
somaIndices%        = impostos% + taxaVendaOnline% + taxaCartao% + reservado1% + reservado2% + lucro%
markupMultiplicador = 1 / (1 - somaIndices%)          // "markup divisor"

precoVendaAVista    = custoTotalImpressao * markupMultiplicador
precoFinalComFrete  = precoVendaAVista + frete
```

Esse é o método de **markup divisor** (markup sobre o preço de venda, não sobre o custo): tecnicamente mais correto que multiplicar o custo por um fator arbitrário, porque garante que impostos/taxas percentuais sobre a venda sejam de fato cobertos pelo preço final — evita o erro comum de subprecificar ao aplicar % de taxas sobre o custo em vez de sobre o preço de venda.

### Pontos fortes
- Modelo de custeio completo e correto: depreciação real de máquina, eletricidade real (kW × R$/kWh), taxa de falha de impressão, despesas fixas do negócio rateadas por hora produtiva, rastreamento granular do tempo de mão de obra.
- Markup calculado pela fórmula divisora — evita erro clássico de subprecificação.
- Suporta múltiplas peças por "mesa"/prato de impressão numa única cotação.

### Pontos fracos / limitações
- Não tem conceito de catálogo de produto (nome, categoria, imagem, cor, tamanho) — é uma calculadora de orçamento avulso, não um cadastro de SKU.
- Não simula múltiplos markups de uma vez (só um cenário por vez).
- Não tem taxas de marketplace pré-configuradas (Shopee, Mercado Livre etc.) — os "índices de comercialização" são preenchidos manualmente.

---

## 3. Proposta de modelo unificado para o sistema

Ideia: usar o **motor de cálculo da Planilha 2** (mais correto tecnicamente) como núcleo, incorporando os **conceitos de catálogo/produto e simulação multi-markup da Planilha 1**, e transformar a aba CONSULTA em dados estruturados de "canais de venda".

### Entidades sugeridas
| Entidade | Campos principais |
|---|---|
| `Printer` (Impressora) | nome, preço, manutenção, vidaUtilHoras, consumoKw |
| `Filament` (Material) | nome/marca, custoRolo, pesoRolo, custoPorKg (ou preço/kg direto), tipo (PLA/PETG/ABS...), descrição |
| `Component` (Material complementar) | nome (argola, saquinho, embalagem...), valorUnitario |
| `FixedExpense` (Despesa fixa) | categoria, valorMensal |
| `Asset` (Imobilizado) | nome, valor, vidaUtilAnos → depreciação mensal |
| `LaborConfig` | numPessoas, horasDiarias, diasMes, produtividade% → custoHora calculado |
| `ProcessStep` (Etapa) | nome, tempoPadraoMin (catálogo reaproveitável: download, fatiamento, acabamento...) |
| `SalesChannel` (Canal de venda) | nome (Shopee Clássico, ML Premium, Loja própria...), taxaPercentual, regrasCustoFixoPorFaixaDePreço[] |
| `Product` (Produto) | nome, categoria, subcategoria, tamanho, cor, imagem, filamentoId, pesoG, tempoImpressaoMin, qtdPorBandeja, etapasUsadas[], componentesUsados[] |
| `PricingSimulation` (Simulação) | productId, printerId, canalVendaId (opcional), taxaFalhas%, frete, markup ou índices de comercialização → resultado (custo unitário, preço sugerido, lucro, margem) |

### Motor de cálculo (núcleo único)
```
custoMaterial        = (pesoG / 1000) * custoPorKg(filamento)
custoDepreciacao     = tempoHoras * ((preco+manutencao)/vidaUtilHoras)(impressora)
custoEletricidade    = tempoHoras * custoKwh * consumoKw(impressora)
custoComponentes     = Σ(valorUnitario_i * qtd_i)
custoConsumiveis     = Σ(itensConsumiveis)
custoBaseComFalhas   = (custoMaterial + custoDepreciacao + custoEletricidade) / (1 - taxaFalhas%) + custoConsumiveis
custoMaoDeObra       = (Σ tempoEtapasMin / 60) * custoHoraTrabalho   // custoHoraTrabalho vem de LaborConfig + despesas fixas
custoTotalProducao   = custoBaseComFalhas + custoComponentes + custoMaoDeObra   // dividido por qtdPorBandeja quando aplicável

// Modo A — markup divisor (recomendado, herda da Planilha 2):
markup = 1 / (1 - (impostos% + taxaCanalVenda% + taxaCartao% + lucroDesejado% + outros%))
precoVenda = custoTotalProducao * markup + frete

// Modo B — simulação multi-markup (herda da Planilha 1, útil para comparar cenários rápidos):
para cada markup em [3,4,5,6]:
  precoVenda = custoTotalProducao * (1+markup)
  lucro = precoVenda - custoTotalProducao - taxasReais(canalVenda, precoVenda)
  margem% = lucro / precoVenda
```

Os dois modos podem coexistir na mesma tela de simulação (o usuário escolhe markup fixo ou índices de comercialização).

---

## 4. Decisões em aberto para o desenvolvimento

- Unificar os dois motores num só (recomendado) ou manter modos separados "simples" (Planilha 1) e "profissional" (Planilha 2)?
- Cadastro de canais de venda: modelar as regras de taxa fixa por faixa de preço da Shopee (aba CONSULTA) como configuração ou deixar só como texto de referência?
- Stack: web (framework?), app mobile nativo ou PWA?
- Necessidade de multiusuário/multiempresa (login, várias "empresas" com despesas fixas diferentes)?
- Persistência: banco de dados (qual?) e se haverá importação das planilhas atuais como dados iniciais (filamentos, impressoras já cadastrados).
