
"use client";

import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import type { CalculationResults, CalculationResultItem, WashbasinItem as WashbasinItemType, FinishedSide } from '@/types';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Plus } from "lucide-react";
import ResultsDisplay from '../shared/ResultsDisplay';
import WashbasinItem from './WashbasinItem';
import NumberInputStepper from '../shared/NumberInputStepper';

const SCULPTED_SINK_LABOR_COST = 400;
const SCULPTED_SINK_MATERIAL_METERS = 0.5; // This is a factor, not a direct length/area. Treated as 0.5 "units" of stone material based on m2 price.
const BUILT_IN_SINK_COST = 130;
const WALL_SUPPORT_PRICE = 70;

const generateId = () => crypto.randomUUID();

const defaultWashbasinItem: () => WashbasinItemType = () => ({
  id: generateId(),
  calculationType: 'sem_cuba',
  length: null,
  width: null,
  skirtHeight: null,
  topMoldingWidth: null,
  bottomMoldingWidth: null,
  finishedSides: [],
  hasWallSupport: false,
});

const WashbasinForm: FC = () => {
  const [washbasinItems, setWashbasinItems] = useState<WashbasinItemType[]>([]);
  const [stonePriceM2, setStonePriceM2] = useState<number | null>(null);
  const [stonePriceLinear, setStonePriceLinear] = useState<number | null>(null);
  
  const [globalFinishPriceOption, setGlobalFinishPriceOption] = useState<string>("80"); 
  const [customGlobalFinishPrice, setCustomGlobalFinishPrice] = useState<number | null>(null);

  const [results, setResults] = useState<CalculationResults | null>(null);

  useEffect(() => {
    if (washbasinItems.length === 0) {
      addWashbasinItem();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const derivedGlobalFinishPrice = useMemo(() => {
    if (globalFinishPriceOption === 'other') {
      return customGlobalFinishPrice === null ? 0 : customGlobalFinishPrice;
    }
    return parseFloat(globalFinishPriceOption) || 0;
  }, [globalFinishPriceOption, customGlobalFinishPrice]);


  const addWashbasinItem = () => {
    setWashbasinItems(prev => [...prev, defaultWashbasinItem()]);
    setResults(null);
  };

  const updateWashbasinItem = (id: string, updates: Partial<WashbasinItemType>) => {
    setWashbasinItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    }));
    setResults(null);
  };

  const removeWashbasinItem = (id: string) => {
    setWashbasinItems(prev => {
      const newItems = prev.filter(item => item.id !== id);
      return newItems;
    });
    setResults(null);
  };
  

  const handleCalculation = () => {
    if (washbasinItems.length === 0) {
      alert('Adicione pelo menos um lavatório para calcular o orçamento.');
      return;
    }
    const currentStonePriceM2 = stonePriceM2 === null ? 0 : stonePriceM2;
    const currentStonePriceLinear = stonePriceLinear === null ? 0 : stonePriceLinear;

    if (currentStonePriceM2 <= 0 ) {
      alert('Informe o valor da pedra (R$/m²) para continuar.');
      return;
    }
     if (currentStonePriceLinear <= 0 && washbasinItems.some(item => item.calculationType !== 'sem_cuba') ) {
      alert('Informe o valor da pedra (R$/metro linear) para os cálculos de bancada com cuba esculpida/embutida.');
      return;
    }
    if (derivedGlobalFinishPrice <= 0 && washbasinItems.some(item => item.finishedSides.length > 0)) {
        alert('Informe o valor do acabamento da bancada (na seção Configurações Globais), pois há lados de bancada selecionados para acabamento.');
        return;
    }


    const allResultItems: CalculationResultItem[] = [];
    const allSummaryItems: CalculationResultItem[] = [];
    let grandTotalCost = 0;
    
    washbasinItems.forEach((item, index) => {
      const itemResultItems: CalculationResultItem[] = [];
      const itemSummaryItems: CalculationResultItem[] = [];
      let itemTotalCost = 0;

      const itemLength = item.length === null ? 0 : item.length;
      const itemWidth = item.width === null ? 0 : item.width;
      const itemSkirtHeight = item.skirtHeight === null ? 0 : item.skirtHeight;
      const itemTopMoldingWidth = item.topMoldingWidth === null ? 0 : item.topMoldingWidth;
      const itemBottomMoldingWidth = item.bottomMoldingWidth === null ? 0 : item.bottomMoldingWidth;

      const lengthM = itemLength / 100;
      const widthM = itemWidth / 100;
      const currentItemFinishPrice = derivedGlobalFinishPrice;


      const itemLabelPrefix = `Lavatório ${index + 1}`;
      itemSummaryItems.push({ label: `${itemLabelPrefix} - Tipo`, details: item.calculationType === 'sem_cuba' ? 'Sem Cuba' : item.calculationType === 'cuba_esculpida' ? 'Cuba Esculpida' : 'Cuba Embutida'});
      itemSummaryItems.push({ label: `${itemLabelPrefix} - Bancada (LxW)`, details: `${itemLength}cm x ${itemWidth}cm`});

      // Bancada Cost
      if (item.calculationType === 'sem_cuba') {
        const countertopArea = lengthM * widthM;
        const countertopStoneCost = countertopArea * currentStonePriceM2;
        itemResultItems.push({ label: 'Pedra (Bancada)', value: countertopStoneCost, details: `${countertopArea.toFixed(3)}m² (R$ ${currentStonePriceM2.toFixed(2)}/m²)` });
        itemTotalCost += countertopStoneCost;
      } else { // 'cuba_esculpida' or 'cuba_embutida'
        const countertopLinearCost = lengthM * currentStonePriceLinear;
        itemResultItems.push({ label: 'Pedra (Bancada)', value: countertopLinearCost, details: `${lengthM.toFixed(2)}m linear (R$ ${currentStonePriceLinear.toFixed(2)}/m linear)` });
        itemTotalCost += countertopLinearCost;

        if (item.calculationType === 'cuba_esculpida') {
          itemResultItems.push({ label: 'Mão de Obra Cuba Esculpida', value: SCULPTED_SINK_LABOR_COST });
          itemTotalCost += SCULPTED_SINK_LABOR_COST;
          itemSummaryItems.push({ label: `${itemLabelPrefix} - Cuba Esculpida (M.O.)`, details: `R$ ${SCULPTED_SINK_LABOR_COST.toFixed(2)}`});

          // Material adicional da cuba esculpida é por m²
          const sinkMaterialCost = SCULPTED_SINK_MATERIAL_METERS * currentStonePriceM2; 
          itemResultItems.push({ label: 'Material Adicional Cuba Esculpida', value: sinkMaterialCost, details: `${SCULPTED_SINK_MATERIAL_METERS}m de material (custo por m²: R$ ${currentStonePriceM2.toFixed(2)})` });
          itemTotalCost += sinkMaterialCost;
          itemSummaryItems.push({ label: `${itemLabelPrefix} - Cuba Esculpida (Material)`, details: `${SCULPTED_SINK_MATERIAL_METERS}m de pedra (base m²)`});

        } else { // 'cuba_embutida'
          itemResultItems.push({ label: 'Cuba Embutida (Peça)', value: BUILT_IN_SINK_COST });
          itemTotalCost += BUILT_IN_SINK_COST;
          itemSummaryItems.push({ label: `${itemLabelPrefix} - Cuba Embutida (Peça)`, details: `R$ ${BUILT_IN_SINK_COST.toFixed(2)}`});
        }
      }

      // Acabamento da Bancada (todos os tipos)
      let totalFinishLengthMeters = 0;
      const finishedSidesSummary: string[] = [];
      item.finishedSides.forEach(side => {
        const sideLength = (side === 'top' || side === 'bottom') ? itemLength : itemWidth;
        totalFinishLengthMeters += sideLength / 100;
        finishedSidesSummary.push(`${sideLength}cm (${side})`);
      });

      if (totalFinishLengthMeters > 0 && currentItemFinishPrice > 0) {
        const currentFinishCost = totalFinishLengthMeters * currentItemFinishPrice;
        itemResultItems.push({ label: 'Acabamento da Bancada', value: currentFinishCost, details: `${totalFinishLengthMeters.toFixed(2)}m linear (R$ ${currentItemFinishPrice.toFixed(2)}/m)` });
        itemTotalCost += currentFinishCost;
        itemSummaryItems.push({ label: `${itemLabelPrefix} - Acabamento Bancada`, details: `Lados: ${finishedSidesSummary.join(', ')} (${totalFinishLengthMeters.toFixed(2)}m)`});
      } else if (totalFinishLengthMeters > 0 && currentItemFinishPrice <= 0) {
         alert(`Para o Lavatório ${index + 1}, informe o valor do acabamento da bancada (na seção Configurações Globais), pois há lados selecionados.`);
         // Consider stopping calculation or returning early if this is critical
      }


      // Saia (todos os tipos)
      if (itemSkirtHeight > 0) {
        let skirtBaseLengthMeters = totalFinishLengthMeters; 
        if (skirtBaseLengthMeters === 0 && item.finishedSides.length === 0 && (lengthM > 0 || widthM > 0)) { 
            skirtBaseLengthMeters = (2 * lengthM) + (2 * widthM); 
        }
         if (skirtBaseLengthMeters === 0 && (lengthM > 0 || widthM > 0)) { // Only alert if dimensions exist but no base for skirt
            alert(`Para o Lavatório ${index + 1}, com saia de ${itemSkirtHeight}cm, selecione lados com acabamento na bancada ou defina dimensões para basear o comprimento da saia.`);
            // Consider stopping or returning
        }

        if (skirtBaseLengthMeters > 0) {
          const skirtArea = (itemSkirtHeight / 100) * skirtBaseLengthMeters;
          const currentSkirtCost = skirtArea * currentStonePriceM2; // Saia sempre m²
          itemResultItems.push({ label: 'Saia', value: currentSkirtCost, details: `${itemSkirtHeight}cm altura, ${skirtBaseLengthMeters.toFixed(2)}m comp., ${skirtArea.toFixed(3)}m² (R$ ${currentStonePriceM2.toFixed(2)}/m²)` });
          itemTotalCost += currentSkirtCost;
          itemSummaryItems.push({ label: `${itemLabelPrefix} - Saia`, details: `${itemSkirtHeight}cm altura, ${skirtBaseLengthMeters.toFixed(2)}m comp.`});
        }
      }

      // Rodapés (todos os tipos)
      let topMoldingLengthForCalc = 0;
      let bottomMoldingLengthForCalc = 0;
      const allPossibleSides: FinishedSide[] = ['top', 'bottom', 'left', 'right'];

      allPossibleSides.forEach(side => {
        const sideLengthM = ((side === 'top' || side === 'bottom') ? lengthM : widthM);
        if (item.finishedSides.includes(side)) {
          bottomMoldingLengthForCalc += sideLengthM;
        } else {
          topMoldingLengthForCalc += sideLengthM;
        }
      });

      let itemMoldingCost = 0;
      const moldingDetailsParts: string[] = [];
      if (itemTopMoldingWidth > 0 && topMoldingLengthForCalc > 0) {
        const topMoldingArea = (itemTopMoldingWidth / 100) * topMoldingLengthForCalc;
        const topMoldingCost = topMoldingArea * currentStonePriceM2; // Rodapé sempre m²
        itemMoldingCost += topMoldingCost;
        moldingDetailsParts.push(`Superior ${itemTopMoldingWidth}cm (${topMoldingLengthForCalc.toFixed(2)}m s/ acab. bancada, ${topMoldingArea.toFixed(3)}m² a R$ ${currentStonePriceM2.toFixed(2)}/m²)`);
      }
      if (itemBottomMoldingWidth > 0 && bottomMoldingLengthForCalc > 0) {
        const bottomMoldingArea = (itemBottomMoldingWidth / 100) * bottomMoldingLengthForCalc;
        const bottomMoldingBaseCost = bottomMoldingArea * currentStonePriceM2; // Rodapé sempre m²
        const bottomMoldingFinalCost = bottomMoldingBaseCost * 1.30; // Acréscimo 30%
        itemMoldingCost += bottomMoldingFinalCost;
        moldingDetailsParts.push(`Inferior ${itemBottomMoldingWidth}cm (${bottomMoldingLengthForCalc.toFixed(2)}m c/ acab. bancada, ${bottomMoldingArea.toFixed(3)}m² a R$ ${currentStonePriceM2.toFixed(2)}/m², acréscimo 30%)`);
      }

      if (itemMoldingCost > 0) {
        itemResultItems.push({ label: 'Rodapés', value: itemMoldingCost, details: moldingDetailsParts.join('; ') });
        itemTotalCost += itemMoldingCost;
        itemSummaryItems.push({ label: `${itemLabelPrefix} - Rodapés`, details: moldingDetailsParts.join('; ')});
      }
      
      let currentWallSupportCost = 0;
      if (item.hasWallSupport) {
        currentWallSupportCost = WALL_SUPPORT_PRICE;
        itemResultItems.push({ label: 'Suporte de Parede', value: currentWallSupportCost, details: `R$ ${WALL_SUPPORT_PRICE.toFixed(2)}` });
        itemTotalCost += currentWallSupportCost;
        itemSummaryItems.push({ label: `${itemLabelPrefix} - Suporte`, details: `Com suporte de parede (R$ ${WALL_SUPPORT_PRICE.toFixed(2)})` });
      }

      allResultItems.push(...itemResultItems.map(res => ({ ...res, label: `${itemLabelPrefix}: ${res.label}` })));
      allSummaryItems.push(...itemSummaryItems);
      grandTotalCost += itemTotalCost;
    });

    allResultItems.push({ label: 'Total Geral', value: grandTotalCost, isTotal: true });
    setResults({ items: allResultItems, summary: allSummaryItems.length > 0 ? allSummaryItems : undefined });
  };

  return (
    <div className="space-y-8 fade-in-animation">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
           <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Itens do Lavatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div id="washbasin-items-container" className="space-y-3 max-h-[calc(100vh-450px)] overflow-y-auto pr-2">
                {washbasinItems.length === 0 && <p className="text-sm text-muted-foreground">Nenhum lavatório adicionado. Clique em "Adicionar Lavatório" para começar.</p>}
                {washbasinItems.map((item, index) => (
                  <WashbasinItem
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={updateWashbasinItem}
                    onRemove={removeWashbasinItem}
                    finishPrice={derivedGlobalFinishPrice} 
                  />
                ))}
              </div>
              <Button onClick={addWashbasinItem} variant="outline" className="mt-4 w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Lavatório
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Configurações Globais de Preço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NumberInputStepper
                id="lavatorio-stone-price-m2"
                label="Valor da pedra (R$/metro quadrado)"
                unit="R$"
                value={stonePriceM2}
                onValueChange={(val) => {setStonePriceM2(val); setResults(null);}}
                min={0}
                step={0.01}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usado para bancada "Sem Cuba", saias, rodapés e material da cuba esculpida.
              </p>
              <NumberInputStepper
                id="lavatorio-stone-price-linear"
                label="Valor da pedra (R$/metro linear)"
                unit="R$"
                value={stonePriceLinear}
                onValueChange={(val) => {setStonePriceLinear(val); setResults(null);}}
                min={0}
                step={0.01}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Usado para bancada "Cuba Esculpida/Embutida".
              </p>
               <div>
                <Label htmlFor="lavatorio-global-finish-price-option" className="text-sm font-medium">Valor do acabamento da bancada (R$/metro linear)</Label>
                 <Select value={globalFinishPriceOption} onValueChange={(value) => {setGlobalFinishPriceOption(value); setResults(null);}}>
                  <SelectTrigger id="lavatorio-global-finish-price-option" className="w-full mt-1">
                    <SelectValue placeholder="Selecione o valor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80">R$ 80,00</SelectItem>
                    <SelectItem value="40">R$ 40,00</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
                {globalFinishPriceOption === 'other' && (
                  <div className="mt-2">
                    <NumberInputStepper
                      id="lavatorio-custom-global-finish-price"
                      label="Valor personalizado do acabamento"
                      unit="R$"
                      value={customGlobalFinishPrice}
                      onValueChange={(val) => {setCustomGlobalFinishPrice(val); setResults(null);}}
                      min={0}
                      step={0.01}
                    />
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Aplicável a todos os tipos de lavatório com lados de bancada marcados para acabamento.
                </p>
              </div>
            </CardContent>
          </Card>
          <Button onClick={handleCalculation} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Calculator className="mr-2 h-5 w-5" /> Calcular Orçamento
          </Button>
        </div>
      </div>

      {results && (
        <ResultsDisplay title="Resultado do Orçamento do Lavatório" results={results} />
      )}
    </div>
  );
};

export default WashbasinForm;
