
"use client";

import type { FC } from 'react';
import { useState }from 'react';
import type { SoleiraItem, CalculationResults, CalculationResultItem } from '@/types';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calculator } from "lucide-react";
import ThresholdItem from './ThresholdItem';
import ResultsDisplay from '../shared/ResultsDisplay';
import NumberInputStepper from '../shared/NumberInputStepper';

const generateId = () => crypto.randomUUID();

const ThresholdForm: FC = () => {
  const [items, setItems] = useState<SoleiraItem[]>([]);
  const [stonePrice, setStonePrice] = useState<number | null>(null); // R$/m² for stone
  const [results, setResults] = useState<CalculationResults | null>(null);

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
    const currentStonePrice = stonePrice === null ? 0 : stonePrice;
    if (currentStonePrice <= 0) {
      alert('Informe o valor da pedra (R$/m²) para continuar.');
      return;
    }

    let totalStoneArea = 0;
    let totalFinishCostItems = 0;
    const summaryItems: CalculationResultItem[] = [];

    items.forEach((item, index) => {
      const itemLength = item.length === null ? 0 : item.length;
      const itemWidth = item.width === null ? 0 : item.width;

      // Stone calculation
      const effectiveWidthForStone = item.type === 'pingadeira' ? itemWidth + 2 : itemWidth;
      const stoneAreaForItem = (itemLength / 100) * (effectiveWidthForStone / 100); // in m²
      totalStoneArea += stoneAreaForItem;
      
      // Finish calculation
      let itemFinishLinearMeters = 0;
      if (item.finishType === 'one_side') {
        itemFinishLinearMeters = itemLength / 100; // meters
      } else if (item.finishType === 'two_sides') {
        itemFinishLinearMeters = (itemLength / 100) * 2; // meters
      }

      const finishPricePerLinearMeter = item.type === 'soleira' ? 8 : 10; // R$8/m for soleira, R$10/m for pingadeira
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

    const totalStoneMaterialCost = totalStoneArea * currentStonePrice;
    const finalTotalCost = totalStoneMaterialCost + totalFinishCostItems;

    const resultItems: CalculationResultItem[] = [
      { label: 'Pedra (Material)', value: totalStoneMaterialCost, details: `${totalStoneArea.toFixed(3)} m² (R$ ${currentStonePrice}/m²)` },
    ];

    if (totalFinishCostItems > 0) {
        resultItems.push({ label: 'Acabamento', value: totalFinishCostItems, details: `Soleira: R$8/m, Pingadeira: R$10/m` });
    }
    
    resultItems.push({ label: 'Valor Total', value: finalTotalCost, isTotal: true });
    
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
              <NumberInputStepper
                  id="soleira-stone-price"
                  label="Valor da pedra (R$/metro quadrado)"
                  unit="R$"
                  value={stonePrice}
                  onValueChange={(val) => {setStonePrice(val); setResults(null);}}
                  min={0}
                  step={0.01}
                />
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
