
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import type { CalculationResults, CalculationResultItem, WashbasinItem as WashbasinItemType, FinishedSide } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Plus, Trash2 } from "lucide-react";
import ResultsDisplay from '../shared/ResultsDisplay';
import WashbasinItem from './WashbasinItem'; // New component

const SCULPTED_SINK_LABOR_COST = 400;
const SCULPTED_SINK_MATERIAL_METERS = 0.5; // 0.5 linear meters of stone
const BUILT_IN_SINK_COST = 130;
const WALL_SUPPORT_PRICE = 70;

const generateId = () => Date.now().toString();

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
  const [stonePrice, setStonePrice] = useState<number>(350); // Default for m²
  const [finishPrice, setFinishPrice] = useState<number>(80); // Default finish price for "Sem Cuba"

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
        const updatedItem = { ...item, ...updates };
        // Adjust stonePrice context if calculationType changes
        if (updates.calculationType) {
          if (updates.calculationType === 'sem_cuba') {
            setStonePrice(prevPrice => prevPrice === 150 ? 350 : prevPrice); // common m2 price
          } else { // 'cuba_esculpida' or 'cuba_embutida'
            setStonePrice(prevPrice => prevPrice === 350 ? 150 : prevPrice); // common linear price
          }
        }
        return updatedItem;
      }
      return item;
    }));
    setResults(null); // Clear results on update
  };
  
  const removeWashbasinItem = (id: string) => {
    setWashbasinItems(prev => prev.filter(item => item.id !== id));
    if (washbasinItems.length === 1) { // If removing the last item, add a new default one
        addWashbasinItem();
    }
    setResults(null); // Clear results on remove
  };
  
  const handleGlobalFinishPriceChange = (value: number) => {
    setFinishPrice(value);
    setResults(null);
  };

  const getStonePriceLabel = () => {
    // This becomes tricky with multiple items. Assume homogeneity or use first item's type for label.
    // For simplicity, let's base it on the first item or a general context.
    // If items can have mixed calculation types, this label might need to be more dynamic or generic.
    // Or, each WashbasinItem could handle its own stonePrice if they can vary.
    // For now, assume a global stonePrice whose unit interpretation depends on the item type.
    const firstItemIsLinear = washbasinItems.length > 0 && washbasinItems[0].calculationType !== 'sem_cuba';
    return `Valor da pedra (${firstItemIsLinear ? 'R$/metro linear' : 'R$/metro quadrado'})`;
  };
  
  const isStonePricePerMeterForSpecificItem = (item: WashbasinItemType) => {
    return item.calculationType !== 'sem_cuba';
  }


  const handleCalculation = () => {
    if (washbasinItems.length === 0) {
      alert('Adicione pelo menos um lavatório para calcular o orçamento.');
      return;
    }
    if (stonePrice <= 0) {
      alert('Informe o valor da pedra para continuar.');
      return;
    }

    const allResultItems: CalculationResultItem[] = [];
    const allSummaryItems: CalculationResultItem[] = [];
    let grandTotalCost = 0;
    let totalWallSupportCost = 0;
    let supportedWashbasinsCount = 0;

    washbasinItems.forEach((item, index) => {
      const itemResultItems: CalculationResultItem[] = [];
      const itemSummaryItems: CalculationResultItem[] = [];
      let itemTotalCost = 0;
      
      const lengthM = item.length / 100;
      const widthM = item.width / 100;

      const itemLabelPrefix = `Lavatório ${index + 1}`;
      itemSummaryItems.push({ label: `${itemLabelPrefix} - Tipo`, details: item.calculationType === 'sem_cuba' ? 'Sem Cuba (m²)' : item.calculationType === 'cuba_esculpida' ? 'Cuba Esculpida (Linear)' : 'Cuba Embutida (Linear)'});
      itemSummaryItems.push({ label: `${itemLabelPrefix} - Bancada`, details: `${item.length}cm (C) x ${item.width}cm (L)`});


      if (item.calculationType === 'sem_cuba') {
        if (finishPrice <= 0 && item.finishedSides.length > 0) {
          alert(`Para o Lavatório ${index + 1} (Sem Cuba), informe o valor do acabamento, pois há lados selecionados.`);
          return; // Stop calculation for this item or all? For now, stops all.
        }

        const countertopArea = lengthM * widthM;
        const countertopStoneCost = countertopArea * stonePrice;
        itemResultItems.push({ label: 'Pedra (Bancada)', value: countertopStoneCost, details: `${countertopArea.toFixed(3)}m² (R$ ${stonePrice}/m²)` });
        itemTotalCost += countertopStoneCost;

        let totalFinishLengthMeters = 0;
        item.finishedSides.forEach(side => {
          if (side === 'top' || side === 'bottom') totalFinishLengthMeters += lengthM;
          else totalFinishLengthMeters += widthM;
        });
        const currentFinishCost = totalFinishLengthMeters * finishPrice;
        if (totalFinishLengthMeters > 0) {
          itemResultItems.push({ label: 'Acabamento da Bancada', value: currentFinishCost, details: `${totalFinishLengthMeters.toFixed(2)}m linear (R$ ${finishPrice}/m)` });
          itemTotalCost += currentFinishCost;
          itemSummaryItems.push({ label: `${itemLabelPrefix} - Acabamento`, details: `Lados: ${item.finishedSides.join(', ')} (${totalFinishLengthMeters.toFixed(2)}m)`});
        }

        if (item.skirtHeight > 0) {
          const skirtArea = (item.skirtHeight / 100) * totalFinishLengthMeters;
          const currentSkirtCost = skirtArea * stonePrice;
          itemResultItems.push({ label: 'Saia', value: currentSkirtCost, details: `${item.skirtHeight}cm altura, ${skirtArea.toFixed(3)}m²` });
          itemTotalCost += currentSkirtCost;
          itemSummaryItems.push({ label: `${itemLabelPrefix} - Saia`, details: `${item.skirtHeight}cm altura`});
        }

        let topMoldingLengthForCalc = 0;
        let bottomMoldingLengthForCalc = 0;
        const allSides: FinishedSide[] = ['top', 'bottom', 'left', 'right'];
        allSides.forEach(side => {
          const sideLengthM = (side === 'top' || side === 'bottom') ? lengthM : widthM;
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
          const topMoldingCost = topMoldingArea * stonePrice;
          itemMoldingCost += topMoldingCost;
          moldingDetailsParts.push(`Superior ${item.topMoldingWidth}cm (${topMoldingLengthForCalc.toFixed(2)}m s/ acab., ${topMoldingArea.toFixed(3)}m²)`);
        }
        if (item.bottomMoldingWidth > 0 && bottomMoldingLengthForCalc > 0) {
          const bottomMoldingArea = (item.bottomMoldingWidth / 100) * bottomMoldingLengthForCalc;
          const bottomMoldingBaseCost = bottomMoldingArea * stonePrice;
          const bottomMoldingFinalCost = bottomMoldingBaseCost * 1.30;
          itemMoldingCost += bottomMoldingFinalCost;
          moldingDetailsParts.push(`Inferior ${item.bottomMoldingWidth}cm (${bottomMoldingLengthForCalc.toFixed(2)}m c/ acab., ${bottomMoldingArea.toFixed(3)}m², acréscimo 30%)`);
        }
        if (itemMoldingCost > 0) {
          itemResultItems.push({ label: 'Rodapés', value: itemMoldingCost, details: moldingDetailsParts.join('; ') });
          itemTotalCost += itemMoldingCost;
          itemSummaryItems.push({ label: `${itemLabelPrefix} - Rodapés`, details: moldingDetailsParts.join('; ')});
        }

        if (item.hasWallSupport) {
          totalWallSupportCost += WALL_SUPPORT_PRICE;
          supportedWashbasinsCount++;
          itemSummaryItems.push({ label: `${itemLabelPrefix} - Suporte`, details: `Com suporte de parede (R$ ${WALL_SUPPORT_PRICE.toFixed(2)})` });
        }

      } else if (item.calculationType === 'cuba_esculpida') {
        const countertopLinearCost = lengthM * stonePrice;
        itemResultItems.push({ label: 'Pedra (Bancada)', value: countertopLinearCost, details: `${lengthM.toFixed(2)}m linear (R$ ${stonePrice}/m linear)` });
        itemTotalCost += countertopLinearCost;
        itemResultItems.push({ label: 'Mão de Obra Cuba Esculpida', value: SCULPTED_SINK_LABOR_COST });
        itemTotalCost += SCULPTED_SINK_LABOR_COST;
        itemSummaryItems.push({ label: `${itemLabelPrefix} - Cuba Esculpida (Mão de Obra)`, details: `R$ ${SCULPTED_SINK_LABOR_COST.toFixed(2)}`});
        const sinkMaterialCost = SCULPTED_SINK_MATERIAL_METERS * stonePrice;
        itemResultItems.push({ label: 'Material Adicional Cuba Esculpida', value: sinkMaterialCost, details: `${SCULPTED_SINK_MATERIAL_METERS}m linear` });
        itemTotalCost += sinkMaterialCost;
        itemSummaryItems.push({ label: `${itemLabelPrefix} - Cuba Esculpida (Material)`, details: `${SCULPTED_SINK_MATERIAL_METERS}m de pedra`});

      } else if (item.calculationType === 'cuba_embutida') {
        const countertopLinearCost = lengthM * stonePrice;
        itemResultItems.push({ label: 'Pedra (Bancada)', value: countertopLinearCost, details: `${lengthM.toFixed(2)}m linear (R$ ${stonePrice}/m linear)` });
        itemTotalCost += countertopLinearCost;
        itemResultItems.push({ label: 'Cuba Embutida (Peça)', value: BUILT_IN_SINK_COST });
        itemTotalCost += BUILT_IN_SINK_COST;
        itemSummaryItems.push({ label: `${itemLabelPrefix} - Cuba Embutida (Peça)`, details: `R$ ${BUILT_IN_SINK_COST.toFixed(2)}`});
      }
      
      allResultItems.push(...itemResultItems.map(res => ({ ...res, label: `${itemLabelPrefix}: ${res.label}` })));
      allSummaryItems.push(...itemSummaryItems);
      grandTotalCost += itemTotalCost;
    });

    if (totalWallSupportCost > 0) {
        allResultItems.push({ label: 'Total Suportes de Parede', value: totalWallSupportCost, details: `${supportedWashbasinsCount} lavatório(s)` });
        grandTotalCost += totalWallSupportCost;
    }

    allResultItems.push({ label: 'Total Geral', value: grandTotalCost, isTotal: true });
    setResults({ items: allResultItems, summary: allSummaryItems.length > 0 ? allSummaryItems : undefined });
  };

  return (
    <div className="space-y-8 fade-in-animation">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Configuration */}
        <div className="space-y-6">
           <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Itens do Lavatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div id="washbasin-items-container" className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {washbasinItems.map((item, index) => (
                  <WashbasinItem
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={updateWashbasinItem}
                    onRemove={removeWashbasinItem}
                    stonePriceLabel={getStonePriceLabel()} // Pass for display consistency
                    finishPrice={finishPrice}
                    onFinishPriceChange={handleGlobalFinishPriceChange}
                    isStonePricePerMeter={isStonePricePerMeterForSpecificItem(item)}
                  />
                ))}
              </div>
              <Button onClick={addWashbasinItem} variant="outline" className="mt-4 w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Adicionar Lavatório
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: General Settings & Calculate Button */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Configurações Globais de Preço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="lavatorio-stone-price" className="text-sm font-medium">{getStonePriceLabel()}</Label>
                <Input
                  id="lavatorio-stone-price"
                  type="number"
                  value={stonePrice}
                  onChange={(e) => {
                    setStonePrice(parseFloat(e.target.value) || 0);
                    setResults(null);
                  }}
                  placeholder={washbasinItems.length > 0 && washbasinItems[0].calculationType === 'sem_cuba' ? "Ex: 350.00" : "Ex: 150.00"}
                  step="0.01"
                  min="0"
                  className="mt-1"
                />
                 <p className="text-xs text-muted-foreground mt-1">
                  Este valor será usado como R$/m² para itens "Sem Cuba" e R$/m linear para "Cuba Esculpida/Embutida".
                </p>
              </div>
              {/* Finish price is now handled within WashbasinItem for 'sem_cuba' types if it needs to be per-item, or remains global here.
                  For simplicity, kept global finish price controlled from the first item, or make it a global setting here explicitly.
                  Let's make it a global setting here, and pass it down.
              */}
               <div>
                <Label htmlFor="lavatorio-global-finish-price" className="text-sm font-medium">Valor do acabamento (R$/metro linear)</Label>
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
                  Aplicável a itens "Sem Cuba" com lados de bancada marcados para acabamento.
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

