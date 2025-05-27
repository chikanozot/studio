
"use client";

import type { FC } from 'react';
import { useState, useMemo } from 'react';
import type { CalculationResults, CalculationResultItem, WashbasinItem as WashbasinItemType } from '@/types';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Plus } from "lucide-react";
import ResultsDisplay from '../shared/ResultsDisplay';
import WashbasinItem from './WashbasinItem';
import NumberInputStepper from '../shared/NumberInputStepper';
import { stoneOptions } from '@/data/stoneOptions';

const SCULPTED_SINK_LABOR_COST = 400;
const SCULPTED_SINK_MATERIAL_METERS = 0.5;
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
  
  const [selectedStoneValue, setSelectedStoneValue] = useState<string>("");
  const [customStonePriceInput, setCustomStonePriceInput] = useState<number | null>(null);

  const [globalFinishPriceOption, setGlobalFinishPriceOption] = useState<string>("80");
  const [customGlobalFinishPrice, setCustomGlobalFinishPrice] = useState<number | null>(null);

  const [results, setResults] = useState<CalculationResults | null>(null);
  
  const actualStonePrice = useMemo(() => {
    if (selectedStoneValue === 'other') {
      return customStonePriceInput === null ? 0 : customStonePriceInput;
    }
    return selectedStoneValue ? parseFloat(selectedStoneValue) : 0;
  }, [selectedStoneValue, customStonePriceInput]);

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
        return [defaultWashbasinItem()]; 
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

    if (washbasinItems.length === 0 || (washbasinItems.length === 1 && !isAnyItemConfigured && washbasinItems[0].length === null) ) { // Check if the single default item is unconfigured
      alert('Adicione e configure pelo menos um lavatório para calcular o orçamento.');
      setResults(null);
      return;
    }

    if (actualStonePrice <= 0 ) {
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

      if (item.calculationType === 'sem_cuba') {
        if (lengthM > 0 && widthM > 0) {
            const countertopArea = lengthM * widthM;
            const countertopStoneCost = countertopArea * actualStonePrice;
            currentItemDetailedCosts.push({ label: 'Pedra (Bancada)', value: countertopStoneCost, details: `${countertopArea.toFixed(3)}m² (R$ ${actualStonePrice.toFixed(2)}/m²)` });
            itemTotalCost += countertopStoneCost;
        }
      } else { 
        if (lengthM > 0) {
            const countertopLinearCost = lengthM * actualStonePrice; 
            currentItemDetailedCosts.push({ label: 'Pedra (Bancada)', value: countertopLinearCost, details: `${lengthM.toFixed(2)}m linear (R$ ${actualStonePrice.toFixed(2)}/m linear)` });
            itemTotalCost += countertopLinearCost;
        }

        if (item.calculationType === 'cuba_esculpida') {
          currentItemDetailedCosts.push({ label: 'Mão de Obra Cuba Esculpida', value: SCULPTED_SINK_LABOR_COST });
          itemTotalCost += SCULPTED_SINK_LABOR_COST;
          
          const sinkMaterialCost = SCULPTED_SINK_MATERIAL_METERS * actualStonePrice;
          currentItemDetailedCosts.push({ label: 'Material Adicional Cuba Esculpida', value: sinkMaterialCost, details: `${SCULPTED_SINK_MATERIAL_METERS} x Preço Base da Pedra (R$ ${actualStonePrice.toFixed(2)}/m²)` });
          itemTotalCost += sinkMaterialCost;

        } else { 
          currentItemDetailedCosts.push({ label: 'Cuba Embutida (Peça)', value: BUILT_IN_SINK_COST });
          itemTotalCost += BUILT_IN_SINK_COST;
        }
      }

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

      if (itemSkirtHeight > 0) {
        let skirtBaseLengthMeters = 0;
        if (totalFinishLengthMeters > 0) { 
            skirtBaseLengthMeters = totalFinishLengthMeters;
        } else if (lengthM > 0 || widthM > 0) { 
            if (lengthM > 0 && widthM > 0) skirtBaseLengthMeters = 2 * (lengthM + widthM); 
            else if (lengthM > 0) skirtBaseLengthMeters = 2 * lengthM; 
            else if (widthM > 0) skirtBaseLengthMeters = 2 * widthM; 
        }

        if (skirtBaseLengthMeters > 0) {
          const skirtArea = (itemSkirtHeight / 100) * skirtBaseLengthMeters;
          const currentSkirtCost = skirtArea * actualStonePrice; 
          currentItemDetailedCosts.push({ label: 'Saia', value: currentSkirtCost, details: `${itemSkirtHeight}cm altura, ${skirtBaseLengthMeters.toFixed(2)}m comp., ${skirtArea.toFixed(3)}m² (R$ ${actualStonePrice.toFixed(2)}/m²)` });
          itemTotalCost += currentSkirtCost;
        } else if (itemSkirtHeight > 0) {
             alert(`Para o ${itemLabelPrefix}, com saia de ${itemSkirtHeight}cm, defina dimensões da bancada ou selecione lados com acabamento para basear o comprimento da saia.`);
             setResults(null); return;
        }
      }

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
        const topMoldingCost = topMoldingArea * actualStonePrice; 
        itemMoldingCost += topMoldingCost;
        moldingDetailsParts.push(`Superior ${itemTopMoldingWidth}cm (${topMoldingLengthForCalc.toFixed(2)}m s/ acab. bancada, ${topMoldingArea.toFixed(3)}m² a R$ ${actualStonePrice.toFixed(2)}/m²)`);
      } else if (itemTopMoldingWidth > 0 && topMoldingLengthForCalc === 0 && (itemLength > 0 || itemWidth > 0) && item.finishedSides.length === allPossibleSides.filter(s => ((s === 'top' || s === 'bottom') ? itemLength : itemWidth) > 0).length ) {
          alert(`Para o ${itemLabelPrefix}, com rodapé superior de ${itemTopMoldingWidth}cm, é necessário que haja pelo menos um lado da bancada *sem* acabamento para aplicar o rodapé.`);
          setResults(null); return;
      }

      if (itemBottomMoldingWidth > 0 && bottomMoldingLengthForCalc > 0) {
        const bottomMoldingArea = (itemBottomMoldingWidth / 100) * bottomMoldingLengthForCalc;
        const bottomMoldingBaseCost = bottomMoldingArea * actualStonePrice; 
        const bottomMoldingFinalCost = bottomMoldingBaseCost * 1.30; 
        itemMoldingCost += bottomMoldingFinalCost;
        moldingDetailsParts.push(`Inferior ${itemBottomMoldingWidth}cm (${bottomMoldingLengthForCalc.toFixed(2)}m c/ acab. bancada, ${bottomMoldingArea.toFixed(3)}m² a R$ ${actualStonePrice.toFixed(2)}/m², acréscimo 30%)`);
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
      
      allResultItems.push(...currentItemDetailedCosts.map(res => ({ ...res, label: `${itemLabelPrefix}: ${res.label}` })));
      
      if (itemTotalCost > 0 || (isAnyItemConfigured && washbasinItems.length === 1 && washbasinItems[0].id === item.id) || washbasinItems.length > 1) {
          allResultItems.push({
            label: `Subtotal ${itemLabelPrefix}`,
            value: itemTotalCost,
            isTotal: false, 
            details: `Custo total para este lavatório`
          });
      }

      grandTotalCost += itemTotalCost;
    });
    
    const configuredItemsExist = washbasinItems.some(item => item.length !== null || item.width !== null || item.skirtHeight !== null || item.topMoldingWidth !== null || item.bottomMoldingWidth !== null || item.finishedSides.length > 0 || item.hasWallSupport || item.calculationType !== 'sem_cuba');


    if (allResultItems.length > 0 || configuredItemsExist) {
      allResultItems.push({ label: 'Total Geral', value: grandTotalCost, isTotal: true });
    }
    
    const selectedStoneName = stoneOptions.find(opt => String(opt.price) === selectedStoneValue)?.name || (selectedStoneValue === 'other' ? 'Personalizado' : 'Não selecionada');
    const summaryDetails = washbasinItems.map((item, index) => {
        let typeDesc = '';
        switch (item.calculationType) {
            case 'sem_cuba': typeDesc = 'Sem Cuba'; break;
            case 'cuba_esculpida': typeDesc = 'Cuba Esculpida'; break;
            case 'cuba_embutida': typeDesc = 'Cuba Embutida'; break;
        }
        return `Lavatório ${index + 1} (${typeDesc}): ${item.length || 0}cm x ${item.width || 0}cm`;
    }).join('; ');

    const summary: CalculationResultItem[] = [
        {label: "Pedra Selecionada", details: `${selectedStoneName} (R$ ${actualStonePrice.toFixed(2)})`},
        {label: "Configuração Lavatórios", details: summaryDetails}
    ];


    setResults({ items: allResultItems, summary });
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
              <div id="washbasin-items-container" className="space-y-3 max-h-[calc(100vh-450px)] md:max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
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
              <div>
                <Label htmlFor="lavatorio-stone-select" className="text-sm font-medium">Valor da Pedra (R$)</Label>
                <Select
                  value={selectedStoneValue}
                  onValueChange={(value) => {
                    setSelectedStoneValue(value);
                    setResults(null);
                    if (value !== 'other') {
                      setCustomStonePriceInput(null);
                    }
                  }}
                >
                  <SelectTrigger id="lavatorio-stone-select" className="w-full mt-1">
                    <SelectValue placeholder="Selecione a pedra" />
                  </SelectTrigger>
                  <SelectContent>
                    {stoneOptions.map(option => (
                      <SelectItem key={option.name} value={String(option.price)}>
                        {option.name} – R$ {option.price.toFixed(2)}
                      </SelectItem>
                    ))}
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
                {selectedStoneValue === 'other' && (
                  <div className="mt-2">
                    <NumberInputStepper
                      id="lavatorio-custom-stone-price"
                      label="Valor personalizado da pedra"
                      unit="R$"
                      value={customStonePriceInput}
                      onValueChange={(val) => { setCustomStonePriceInput(val); setResults(null); }}
                      min={0}
                      step={0.01}
                    />
                  </div>
                )}
                 <p className="text-xs text-muted-foreground mt-1">
                  Este valor será usado como base para cálculos por metro quadrado (m²) e por metro linear, conforme o contexto de cada item.
                </p>
              </div>

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
