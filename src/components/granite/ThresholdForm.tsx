
"use client";

import type { FC } from 'react';
import { useState, useMemo }from 'react';
import type { SoleiraItem, CalculationResults, CalculationResultItem } from '@/types';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calculator } from "lucide-react";
import ThresholdItem from './ThresholdItem';
import ResultsDisplay from '../shared/ResultsDisplay';
import NumberInputStepper from '../shared/NumberInputStepper';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { stoneOptions } from '@/data/stoneOptions';

const generateId = () => crypto.randomUUID();

const ThresholdForm: FC = () => {
  const [items, setItems] = useState<SoleiraItem[]>([]);
  
  const [selectedStoneValue, setSelectedStoneValue] = useState<string>("");
  const [customStonePriceInput, setCustomStonePriceInput] = useState<number | null>(null);
  
  const [results, setResults] = useState<CalculationResults | null>(null);

  const actualStonePrice = useMemo(() => {
    if (selectedStoneValue === 'other') {
      return customStonePriceInput === null ? 0 : customStonePriceInput;
    }
    return selectedStoneValue ? parseFloat(selectedStoneValue) : 0;
  }, [selectedStoneValue, customStonePriceInput]);

  const addItem = (type: 'soleira' | 'pingadeira') => {
    setItems(prev => [...prev, { id: generateId(), type, length: null, width: null, finishType: 'none' }]);
    setResults(null);
  };

  const updateItem = (id: string, updates: Partial<SoleiraItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    setResults(null);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
    setResults(null);
  };
  
  const handleCalculation = () => {
    if (items.length === 0) {
      alert('Adicione pelo menos um item para calcular o orçamento.');
      return;
    }
    if (actualStonePrice <= 0) {
      alert('Informe o valor da pedra (R$/m²) para continuar.');
      return;
    }

    let totalStoneArea = 0;
    let totalFinishCostItems = 0;
    const summaryItems: CalculationResultItem[] = [];

    items.forEach((item, index) => {
      const itemLength = item.length === null ? 0 : item.length;
      const itemWidth = item.width === null ? 0 : item.width;

      const effectiveWidthForStone = item.type === 'pingadeira' ? itemWidth + 2 : itemWidth;
      const stoneAreaForItem = (itemLength / 100) * (effectiveWidthForStone / 100); 
      totalStoneArea += stoneAreaForItem;
      
      let itemFinishLinearMeters = 0;
      if (item.finishType === 'one_side') {
        itemFinishLinearMeters = itemLength / 100;
      } else if (item.finishType === 'two_sides') {
        itemFinishLinearMeters = (itemLength / 100) * 2;
      }

      const finishPricePerLinearMeter = item.type === 'soleira' ? 8 : 10;
      const currentItemFinishCost = itemFinishLinearMeters * finishPricePerLinearMeter;
      totalFinishCostItems += currentItemFinishCost;

      let finishDescription = "Sem acabamento";
      if (item.finishType === 'one_side') {
        finishDescription = `1 lado maior (${itemLength}cm)`;
      } else if (item.finishType === 'two_sides') {
        finishDescription = `2 lados maiores (${itemLength}cm)`;
      }
      
      summaryItems.push({
        label: `${item.type === 'soleira' ? 'Soleira' : 'Pingadeira'} ${index + 1}`,
        details: `${itemLength}cm x ${itemWidth}cm. ${item.type === 'pingadeira' ? `Largura efetiva (pedra): ${effectiveWidthForStone}cm. ` : ''}Área pedra: ${stoneAreaForItem.toFixed(3)}m². Acabamento: ${finishDescription} (R$ ${currentItemFinishCost.toFixed(2)})`,
      });
    });

    const totalStoneMaterialCost = totalStoneArea * actualStonePrice;
    const finalTotalCost = totalStoneMaterialCost + totalFinishCostItems;

    const resultItems: CalculationResultItem[] = [
      { label: 'Pedra (Material)', value: totalStoneMaterialCost, details: `${totalStoneArea.toFixed(3)} m² (R$ ${actualStonePrice.toFixed(2)}/m²)` },
    ];

    if (totalFinishCostItems > 0) {
        resultItems.push({ label: 'Acabamento', value: totalFinishCostItems, details: `Soleira: R$8/m, Pingadeira: R$10/m` });
    }
    
    resultItems.push({ label: 'Valor Total', value: finalTotalCost, isTotal: true });
    
    const selectedStoneName = stoneOptions.find(opt => String(opt.price) === selectedStoneValue)?.name || (selectedStoneValue === 'other' ? 'Personalizado' : 'Não selecionada');
    summaryItems.unshift({label: "Pedra Selecionada", details: `${selectedStoneName} (R$ ${actualStonePrice.toFixed(2)}/m²)`})

    setResults({ items: resultItems, summary: summaryItems });
  };

  return (
    <div className="space-y-8 fade-in-animation">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Items */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Itens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 mb-4">
                {items.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>}
                {items.map((item, index) => (
                  <ThresholdItem
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => addItem('soleira')} variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Soleira
                </Button>
                <Button onClick={() => addItem('pingadeira')} variant="outline">
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Pingadeira
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: General Settings & Calculate Button */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Configurações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="soleira-stone-select" className="text-sm font-medium">Valor da pedra (R$/metro quadrado)</Label>
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
                  <SelectTrigger id="soleira-stone-select" className="w-full mt-1">
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
                      id="soleira-custom-stone-price"
                      label="Valor personalizado da pedra"
                      unit="R$"
                      value={customStonePriceInput}
                      onValueChange={(val) => { setCustomStonePriceInput(val); setResults(null); }}
                      min={0}
                      step={0.01}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Button onClick={handleCalculation} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Calculator className="mr-2 h-5 w-5" /> Calcular Orçamento
          </Button>
        </div>
      </div>

      {results && (
        <ResultsDisplay title="Resultado do Orçamento de Soleiras/Pingadeiras" results={results} />
      )}
    </div>
  );
};

export default ThresholdForm;
