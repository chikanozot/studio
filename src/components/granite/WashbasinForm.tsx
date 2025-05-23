
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import type { CalculationResults, CalculationResultItem, WashbasinItem as WashbasinItemType, FinishedSide } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Plus } from "lucide-react";
import ResultsDisplay from '../shared/ResultsDisplay';
import WashbasinItem from './WashbasinItem';

const SCULPTED_SINK_LABOR_COST = 400;
const SCULPTED_SINK_MATERIAL_METERS = 0.5; 
const BUILT_IN_SINK_COST = 130;
const WALL_SUPPORT_PRICE = 70;

const generateId = () => crypto.randomUUID();

const defaultWashbasinItem: () => WashbasinItemType = () => ({
  id: generateId(),
  calculationType: 'sem_cuba',
  length: 120,
  width: 60,
  skirtHeight: 0,
  topMoldingWidth: 0,
  bottomMoldingWidth: 0,
  finishedSides: [],
  hasWallSupport: false,
});

const WashbasinForm: FC = () => {
  const [washbasinItems, setWashbasinItems] = useState<WashbasinItemType[]>([]);
  const [stonePriceM2, setStonePriceM2] = useState<number>(350); 
  const [stonePriceLinear, setStonePriceLinear] = useState<number>(150); 
  const [finishPrice, setFinishPrice] = useState<number>(80); 

  const [results, setResults] = useState<CalculationResults | null>(null);

  useEffect(() => {
    if (washbasinItems.length === 0) {
      addWashbasinItem();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addWashbasinItem = () => {
    setWashbasinItems(prev => [...prev, defaultWashbasinItem()]);
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
      if (newItems.length === 0) { 
         return [defaultWashbasinItem()];
      }
      return newItems;
    });
    setResults(null); 
  };
  
  const handleGlobalFinishPriceChange = (value: number) => {
    setFinishPrice(value);
    setResults(null);
  };

  const handleCalculation = () => {
    if (washbasinItems.length === 0) {
      alert('Adicione pelo menos um lavatório para calcular o orçamento.');
      return;
    }
    if (stonePriceM2 <= 0 ) {
      alert('Informe o valor da pedra (R$/m²) para continuar.');
      return;
    }
    if (stonePriceLinear <= 0 && washbasinItems.some(item => item.calculationType !== 'sem_cuba') ) {
      alert('Informe o valor da pedra (R$/metro linear) para os cálculos de cuba esculpida/embutida.');
      return;
    }


    const allResultItems: CalculationResultItem[] = [];
    const allSummaryItems: CalculationResultItem[] = [];
    let grandTotalCost = 0;
    let totalWallSupportCostCalculation = 0;
    let supportedWashbasinsCount = 0;

    washbasinItems.forEach((item, index) => {
      const itemResultItems: CalculationResultItem[] = [];
      const itemSummaryItems: CalculationResultItem[] = [];
      let itemTotalCost = 0;
      
      const lengthM = item.length / 100;
      const widthM = item.width / 100;

      const itemLabelPrefix = `Lavatório ${index + 1}`;
      itemSummaryItems.push({ label: `${itemLabelPrefix} - Tipo`, details: item.calculationType === 'sem_cuba' ? 'Sem Cuba' : item.calculationType === 'cuba_esculpida' ? 'Cuba Esculpida' : 'Cuba Embutida'});
      itemSummaryItems.push({ label: `${itemLabelPrefix} - Bancada (LxW)`, details: `${item.length}cm x ${item.width}cm`});

      // Bancada Cost
      if (item.calculationType === 'sem_cuba') {
        const countertopArea = lengthM * widthM;
        const countertopStoneCost = countertopArea * stonePriceM2;
        itemResultItems.push({ label: 'Pedra (Bancada)', value: countertopStoneCost, details: `${countertopArea.toFixed(3)}m² (R$ ${stonePriceM2}/m²)` });
        itemTotalCost += countertopStoneCost;
      } else { 
        const countertopLinearCost = lengthM * stonePriceLinear;
        itemResultItems.push({ label: 'Pedra (Bancada)', value: countertopLinearCost, details: `${lengthM.toFixed(2)}m linear (R$ ${stonePriceLinear}/m linear)` });
        itemTotalCost += countertopLinearCost;

        if (item.calculationType === 'cuba_esculpida') {
          itemResultItems.push({ label: 'Mão de Obra Cuba Esculpida', value: SCULPTED_SINK_LABOR_COST });
          itemTotalCost += SCULPTED_SINK_LABOR_COST;
          itemSummaryItems.push({ label: `${itemLabelPrefix} - Cuba Esculpida (M.O.)`, details: `R$ ${SCULPTED_SINK_LABOR_COST.toFixed(2)}`});
          
          const sinkMaterialCost = SCULPTED_SINK_MATERIAL_METERS * stonePriceM2; 
          itemResultItems.push({ label: 'Material Adicional Cuba Esculpida', value: sinkMaterialCost, details: `${SCULPTED_SINK_MATERIAL_METERS}m de material (custo por m²: R$ ${stonePriceM2})` });
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
        const sideLength = (side === 'top' || side === 'bottom') ? item.length : item.width;
        totalFinishLengthMeters += sideLength / 100;
        finishedSidesSummary.push(`${sideLength}cm (${side})`);
      });

      if (totalFinishLengthMeters > 0 && finishPrice > 0) {
        const currentFinishCost = totalFinishLengthMeters * finishPrice;
        itemResultItems.push({ label: 'Acabamento da Bancada', value: currentFinishCost, details: `${totalFinishLengthMeters.toFixed(2)}m linear (R$ ${finishPrice}/m)` });
        itemTotalCost += currentFinishCost;
        itemSummaryItems.push({ label: `${itemLabelPrefix} - Acabamento Bancada`, details: `Lados: ${finishedSidesSummary.join(', ')} (${totalFinishLengthMeters.toFixed(2)}m)`});
      } else if (totalFinishLengthMeters > 0 && finishPrice <= 0) {
         alert(`Para o Lavatório ${index + 1}, informe o valor do acabamento da bancada, pois há lados selecionados.`);
         return; 
      }


      // Saia (todos os tipos) 
      if (item.skirtHeight > 0) {
        if (totalFinishLengthMeters === 0 && item.finishedSides.length === 0) {
           alert(`Para o Lavatório ${index + 1}, com saia de ${item.skirtHeight}cm, selecione pelo menos um lado com acabamento na bancada para basear o comprimento da saia.`);
           return;
        }
        
        const skirtBaseLengthMeters = totalFinishLengthMeters > 0 ? totalFinishLengthMeters : (item.finishedSides.reduce((acc, side) => acc + ((side === 'top' || side === 'bottom') ? lengthM : widthM),0));

        const skirtArea = (item.skirtHeight / 100) * skirtBaseLengthMeters; 
        const currentSkirtCost = skirtArea * stonePriceM2;
        itemResultItems.push({ label: 'Saia', value: currentSkirtCost, details: `${item.skirtHeight}cm altura, ${skirtBaseLengthMeters.toFixed(2)}m comp., ${skirtArea.toFixed(3)}m² (R$ ${stonePriceM2}/m²)` });
        itemTotalCost += currentSkirtCost;
        itemSummaryItems.push({ label: `${itemLabelPrefix} - Saia`, details: `${item.skirtHeight}cm altura, ${skirtBaseLengthMeters.toFixed(2)}m comp.`});
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
      if (item.topMoldingWidth > 0 && topMoldingLengthForCalc > 0) {
        const topMoldingArea = (item.topMoldingWidth / 100) * topMoldingLengthForCalc;
        const topMoldingCost = topMoldingArea * stonePriceM2;
        itemMoldingCost += topMoldingCost;
        moldingDetailsParts.push(`Superior ${item.topMoldingWidth}cm (${topMoldingLengthForCalc.toFixed(2)}m s/ acab. bancada, ${topMoldingArea.toFixed(3)}m² a R$ ${stonePriceM2}/m²)`);
      }
      if (item.bottomMoldingWidth > 0 && bottomMoldingLengthForCalc > 0) {
        const bottomMoldingArea = (item.bottomMoldingWidth / 100) * bottomMoldingLengthForCalc;
        const bottomMoldingBaseCost = bottomMoldingArea * stonePriceM2;
        const bottomMoldingFinalCost = bottomMoldingBaseCost * 1.30; 
        itemMoldingCost += bottomMoldingFinalCost;
        moldingDetailsParts.push(`Inferior ${item.bottomMoldingWidth}cm (${bottomMoldingLengthForCalc.toFixed(2)}m c/ acab. bancada, ${bottomMoldingArea.toFixed(3)}m² a R$ ${stonePriceM2}/m², acréscimo 30%)`);
      }

      if (itemMoldingCost > 0) {
        itemResultItems.push({ label: 'Rodapés', value: itemMoldingCost, details: moldingDetailsParts.join('; ') });
        itemTotalCost += itemMoldingCost;
        itemSummaryItems.push({ label: `${itemLabelPrefix} - Rodapés`, details: moldingDetailsParts.join('; ')});
      }

      if (item.hasWallSupport) {
        supportedWashbasinsCount++;
        itemSummaryItems.push({ label: `${itemLabelPrefix} - Suporte`, details: `Com suporte de parede (R$ ${WALL_SUPPORT_PRICE.toFixed(2)})` });
      }
      
      allResultItems.push(...itemResultItems.map(res => ({ ...res, label: `${itemLabelPrefix}: ${res.label}` })));
      allSummaryItems.push(...itemSummaryItems);
      grandTotalCost += itemTotalCost;
    });

    totalWallSupportCostCalculation = supportedWashbasinsCount * WALL_SUPPORT_PRICE;
    if (totalWallSupportCostCalculation > 0) {
        allResultItems.push({ label: 'Total Suportes de Parede', value: totalWallSupportCostCalculation, details: `${supportedWashbasinsCount} lavatório(s)` });
        grandTotalCost += totalWallSupportCostCalculation;
    }

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
              <div id="washbasin-items-container" className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2"> 
                {washbasinItems.map((item, index) => (
                  <WashbasinItem
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={updateWashbasinItem}
                    onRemove={removeWashbasinItem}
                    finishPrice={finishPrice} 
                    onFinishPriceChange={handleGlobalFinishPriceChange} 
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
              <div>
                <Label htmlFor="lavatorio-stone-price-m2" className="text-sm font-medium">Valor da pedra (R$/metro quadrado)</Label>
                <Input
                  id="lavatorio-stone-price-m2"
                  type="number"
                  value={stonePriceM2}
                  onChange={(e) => {
                    setStonePriceM2(parseFloat(e.target.value) || 0);
                    setResults(null);
                  }}
                  placeholder="Ex: 350.00"
                  step="0.01"
                  min="0"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usado para bancada "Sem Cuba", saias, rodapés e material da cuba esculpida.
                </p>
              </div>
              <div>
                <Label htmlFor="lavatorio-stone-price-linear" className="text-sm font-medium">Valor da pedra (R$/metro linear)</Label>
                <Input
                  id="lavatorio-stone-price-linear"
                  type="number"
                  value={stonePriceLinear}
                  onChange={(e) => {
                    setStonePriceLinear(parseFloat(e.target.value) || 0);
                    setResults(null);
                  }}
                  placeholder="Ex: 150.00"
                  step="0.01"
                  min="0"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Usado para bancada "Cuba Esculpida/Embutida".
                </p>
              </div>
               <div>
                <Label htmlFor="lavatorio-global-finish-price" className="text-sm font-medium">Valor do acabamento da bancada (R$/metro linear)</Label>
                <Input 
                  id="lavatorio-global-finish-price" 
                  type="number" 
                  value={finishPrice} 
                  onChange={(e) => handleGlobalFinishPriceChange(parseFloat(e.target.value) || 0)} 
                  placeholder="Ex: 80.00" 
                  step="0.01"
                  min="0"
                  className="mt-1"
                />
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

    

    