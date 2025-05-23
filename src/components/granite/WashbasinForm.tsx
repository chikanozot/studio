
"use client";

import type { FC } from 'react';
import { useState, useMemo, useEffect } from 'react';
import type { CalculationResults, CalculationResultItem, WashbasinItem as WashbasinItemType } from '@/types';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Plus } from "lucide-react";
import ResultsDisplay from '../shared/ResultsDisplay';
import WashbasinItem from './WashbasinItem';
import NumberInputStepper from '../shared/NumberInputStepper';

const SCULPTED_SINK_LABOR_COST = 400;
const SCULPTED_SINK_MATERIAL_METERS = 0.5; // This is now a factor, not a direct linear meterage of stone
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
  const [washbasinItems, setWashbasinItems] = useState<WashbasinItemType[]>([defaultWashbasinItem()]);
  const [stonePrice, setStonePrice] = useState<number | null>(null); // Unified stone price

  const [globalFinishPriceOption, setGlobalFinishPriceOption] = useState<string>("80");
  const [customGlobalFinishPrice, setCustomGlobalFinishPrice] = useState<number | null>(null);

  const [results, setResults] = useState<CalculationResults | null>(null);
  
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
      if (newItems.length === 0) {
        return [defaultWashbasinItem()]; // Always keep at least one item
      }
      return newItems;
    });
    setResults(null);
  };


  const handleCalculation = () => {
    const isAnyItemConfigured = washbasinItems.some(
      item => item.length !== null || item.width !== null || item.skirtHeight !== null ||
              item.topMoldingWidth !== null || item.bottomMoldingWidth !== null ||
              item.finishedSides.length > 0 || item.hasWallSupport
    );

    if (washbasinItems.length === 0 || !isAnyItemConfigured) {
      alert('Adicione e configure pelo menos um lavatório para calcular o orçamento.');
      setResults(null);
      return;
    }

    const currentStonePriceVal = stonePrice === null ? 0 : stonePrice;

    if (currentStonePriceVal <= 0 ) {
      alert('Informe o valor da pedra para continuar.');
      setResults(null);
      return;
    }
    if (derivedGlobalFinishPrice <= 0 && washbasinItems.some(item => item.finishedSides.length > 0)) {
        alert('Informe o valor do acabamento da bancada (na seção Configurações Globais), pois há lados de bancada selecionados para acabamento.');
        setResults(null);
        return;
    }

    const allResultItems: CalculationResultItem[] = [];
    let grandTotalCost = 0;

    washbasinItems.forEach((item, index) => {
      const currentItemDetailedCosts: CalculationResultItem[] = [];
      let itemTotalCost = 0;

      const itemLength = item.length === null ? 0 : item.length;
      const itemWidth = item.width === null ? 0 : item.width;
      const itemSkirtHeight = item.skirtHeight === null ? 0 : item.skirtHeight;
      const itemTopMoldingWidth = item.topMoldingWidth === null ? 0 : item.topMoldingWidth;
      const itemBottomMoldingWidth = item.bottomMoldingWidth === null ? 0 : item.bottomMoldingWidth;

      const lengthM = itemLength / 100;
      const widthM = itemWidth / 100;
      const currentItemFinishPrice = derivedGlobalFinishPrice;

      let itemTypeDescription = '';
      switch (item.calculationType) {
        case 'sem_cuba': itemTypeDescription = 'Sem Cuba'; break;
        case 'cuba_esculpida': itemTypeDescription = 'Cuba Esculpida'; break;
        case 'cuba_embutida': itemTypeDescription = 'Cuba Embutida'; break;
      }
      const itemLabelPrefix = `Lavatório ${index + 1} (${itemTypeDescription})`;

      // Bancada Cost
      if (item.calculationType === 'sem_cuba') {
        if (lengthM > 0 && widthM > 0) {
            const countertopArea = lengthM * widthM;
            const countertopStoneCost = countertopArea * currentStonePriceVal; // Use M2 price
            currentItemDetailedCosts.push({ label: 'Pedra (Bancada)', value: countertopStoneCost, details: `${countertopArea.toFixed(3)}m² (R$ ${currentStonePriceVal.toFixed(2)}/m²)` });
            itemTotalCost += countertopStoneCost;
        }
      } else { // Cuba Esculpida ou Embutida (cálculo linear para bancada)
        if (lengthM > 0) {
            const countertopLinearCost = lengthM * currentStonePriceVal; // Use Linear price (which is the same as M2 for this logic)
            currentItemDetailedCosts.push({ label: 'Pedra (Bancada)', value: countertopLinearCost, details: `${lengthM.toFixed(2)}m linear (R$ ${currentStonePriceVal.toFixed(2)}/m linear)` });
            itemTotalCost += countertopLinearCost;
        }

        if (item.calculationType === 'cuba_esculpida') {
          currentItemDetailedCosts.push({ label: 'Mão de Obra Cuba Esculpida', value: SCULPTED_SINK_LABOR_COST });
          itemTotalCost += SCULPTED_SINK_LABOR_COST;

          // Material adicional da cuba esculpida é 0.5 * VALOR DA PEDRA (que é R$/m² ou R$/m linear, interpretado como por unidade de pedra)
          const sinkMaterialCost = SCULPTED_SINK_MATERIAL_METERS * currentStonePriceVal;
          currentItemDetailedCosts.push({ label: 'Material Adicional Cuba Esculpida', value: sinkMaterialCost, details: `${SCULPTED_SINK_MATERIAL_METERS} x Preço Base da Pedra (R$ ${currentStonePriceVal.toFixed(2)})` });
          itemTotalCost += sinkMaterialCost;

        } else { // 'cuba_embutida'
          currentItemDetailedCosts.push({ label: 'Cuba Embutida (Peça)', value: BUILT_IN_SINK_COST });
          itemTotalCost += BUILT_IN_SINK_COST;
        }
      }

      // Acabamento da Bancada (todos os tipos)
      let totalFinishLengthMeters = 0;
      item.finishedSides.forEach(side => {
        const sideLength = (side === 'top' || side === 'bottom') ? itemLength : itemWidth;
        if (sideLength > 0) {
          totalFinishLengthMeters += sideLength / 100;
        }
      });

      if (totalFinishLengthMeters > 0 && currentItemFinishPrice > 0) {
        const currentFinishCost = totalFinishLengthMeters * currentItemFinishPrice;
        currentItemDetailedCosts.push({ label: 'Acabamento da Bancada', value: currentFinishCost, details: `${totalFinishLengthMeters.toFixed(2)}m linear (R$ ${currentItemFinishPrice.toFixed(2)}/m)` });
        itemTotalCost += currentFinishCost;
      } else if (totalFinishLengthMeters > 0 && currentItemFinishPrice <= 0 ) {
         alert(`Para o ${itemLabelPrefix}, informe o valor do acabamento da bancada (Config. Globais), pois há lados selecionados.`);
         setResults(null); return;
      }

      // Saia (todos os tipos) - calculada por m² usando currentStonePriceVal
      if (itemSkirtHeight > 0) {
        let skirtBaseLengthMeters = 0;
        if (totalFinishLengthMeters > 0) { // Use finished sides if available
            skirtBaseLengthMeters = totalFinishLengthMeters;
        } else if (lengthM > 0 || widthM > 0) { // Fallback to perimeter if no finished sides, but dimensions exist
            if (lengthM > 0 && widthM > 0) skirtBaseLengthMeters = 2 * (lengthM + widthM); // Full perimeter
            else if (lengthM > 0) skirtBaseLengthMeters = 2 * lengthM; // Assume front and back if only length
            else if (widthM > 0) skirtBaseLengthMeters = 2 * widthM; // Assume two sides if only width
        }

        if (skirtBaseLengthMeters > 0) {
          const skirtArea = (itemSkirtHeight / 100) * skirtBaseLengthMeters;
          const currentSkirtCost = skirtArea * currentStonePriceVal; // Use M2 price
          currentItemDetailedCosts.push({ label: 'Saia', value: currentSkirtCost, details: `${itemSkirtHeight}cm altura, ${skirtBaseLengthMeters.toFixed(2)}m comp., ${skirtArea.toFixed(3)}m² (R$ ${currentStonePriceVal.toFixed(2)}/m²)` });
          itemTotalCost += currentSkirtCost;
        } else if (itemSkirtHeight > 0) {
             alert(`Para o ${itemLabelPrefix}, com saia de ${itemSkirtHeight}cm, defina dimensões da bancada ou selecione lados com acabamento para basear o comprimento da saia.`);
             setResults(null); return;
        }
      }

      // Rodapés (todos os tipos) - calculados por m² usando currentStonePriceVal
      let topMoldingLengthForCalc = 0;
      let bottomMoldingLengthForCalc = 0;
      const allPossibleSides: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];

      allPossibleSides.forEach(side => {
        const sideDimension = (side === 'top' || side === 'bottom') ? itemLength : itemWidth;
        const sideDimensionM = sideDimension / 100;
        if (sideDimensionM > 0) {
          if (item.finishedSides.includes(side)) {
            bottomMoldingLengthForCalc += sideDimensionM;
          } else {
            topMoldingLengthForCalc += sideDimensionM;
          }
        }
      });

      let itemMoldingCost = 0;
      const moldingDetailsParts: string[] = [];
      if (itemTopMoldingWidth > 0 && topMoldingLengthForCalc > 0) {
        const topMoldingArea = (itemTopMoldingWidth / 100) * topMoldingLengthForCalc;
        const topMoldingCost = topMoldingArea * currentStonePriceVal; // Use M2 price
        itemMoldingCost += topMoldingCost;
        moldingDetailsParts.push(`Superior ${itemTopMoldingWidth}cm (${topMoldingLengthForCalc.toFixed(2)}m s/ acab. bancada, ${topMoldingArea.toFixed(3)}m² a R$ ${currentStonePriceVal.toFixed(2)}/m²)`);
      } else if (itemTopMoldingWidth > 0 && topMoldingLengthForCalc === 0 && (itemLength > 0 || itemWidth > 0) && item.finishedSides.length === allPossibleSides.filter(s => ((s === 'top' || s === 'bottom') ? itemLength : itemWidth) > 0).length ) {
          alert(`Para o ${itemLabelPrefix}, com rodapé superior de ${itemTopMoldingWidth}cm, é necessário que haja pelo menos um lado da bancada *sem* acabamento para aplicar o rodapé.`);
          setResults(null); return;
      }

      if (itemBottomMoldingWidth > 0 && bottomMoldingLengthForCalc > 0) {
        const bottomMoldingArea = (itemBottomMoldingWidth / 100) * bottomMoldingLengthForCalc;
        const bottomMoldingBaseCost = bottomMoldingArea * currentStonePriceVal; // Use M2 price
        const bottomMoldingFinalCost = bottomMoldingBaseCost * 1.30; // 30% surcharge
        itemMoldingCost += bottomMoldingFinalCost;
        moldingDetailsParts.push(`Inferior ${itemBottomMoldingWidth}cm (${bottomMoldingLengthForCalc.toFixed(2)}m c/ acab. bancada, ${bottomMoldingArea.toFixed(3)}m² a R$ ${currentStonePriceVal.toFixed(2)}/m², acréscimo 30%)`);
      } else if (itemBottomMoldingWidth > 0 && bottomMoldingLengthForCalc === 0 && (itemLength > 0 || itemWidth > 0) && item.finishedSides.length === 0 && allPossibleSides.some(s => ((s === 'top' || s === 'bottom') ? itemLength : itemWidth) > 0)) {
          alert(`Para o ${itemLabelPrefix}, com rodapé inferior de ${itemBottomMoldingWidth}cm, é necessário que haja pelo menos um lado da bancada *com* acabamento para aplicar o rodapé.`);
          setResults(null); return;
      }

      if (itemMoldingCost > 0) {
        currentItemDetailedCosts.push({ label: 'Rodapés', value: itemMoldingCost, details: moldingDetailsParts.join('; ') });
        itemTotalCost += itemMoldingCost;
      }

      let currentWallSupportCost = 0;
      if (item.hasWallSupport) {
        currentWallSupportCost = WALL_SUPPORT_PRICE;
        currentItemDetailedCosts.push({ label: 'Suporte de Parede', value: currentWallSupportCost, details: `R$ ${WALL_SUPPORT_PRICE.toFixed(2)}` });
        itemTotalCost += currentWallSupportCost;
      }
      
      // Add detailed costs for the current item, prefixed
      allResultItems.push(...currentItemDetailedCosts.map(res => ({ ...res, label: `${itemLabelPrefix}: ${res.label}` })));
      
      // Add subtotal for the current item if it has a cost
      if (itemTotalCost > 0 || isAnyItemConfigured) { // Show subtotal even if 0 but configured
          allResultItems.push({
            label: `Subtotal ${itemLabelPrefix}`,
            value: itemTotalCost,
            isTotal: false, // Not the grand total
            details: `Custo total para este lavatório`
          });
      }

      grandTotalCost += itemTotalCost;
    });

    if (allResultItems.length > 0 || isAnyItemConfigured) {
      allResultItems.push({ label: 'Total Geral', value: grandTotalCost, isTotal: true });
    }

    setResults({ items: allResultItems, summary: undefined }); // Summary is not used for washbasins
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
              <div id="washbasin-items-container" className="space-y-3 max-h-[calc(100vh-450px)] md:max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
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
                id="lavatorio-stone-price"
                label="Valor da Pedra (R$)"
                unit="R$"
                value={stonePrice}
                onValueChange={(val) => {setStonePrice(val); setResults(null);}}
                min={0}
                step={0.01}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Este valor será usado como base para cálculos por metro quadrado (m²) e por metro linear, conforme o contexto de cada item.
              </p>

               <div>
                <Label htmlFor="lavatorio-global-finish-price-option" className="text-sm font-medium">Valor do acabamento da bancada (R$/metro linear)</Label>
                 <Select value={globalFinishPriceOption} onValueChange={(value) => {setGlobalFinishPriceOption(value); setCustomGlobalFinishPrice(null); setResults(null);}}>
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
