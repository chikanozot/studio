
"use client";

import type { FC } from 'react';
import { useState }from 'react';
import type { SoleiraItem, CalculationResults, CalculationResultItem } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calculator } from "lucide-react";
import ThresholdItem from './ThresholdItem';
import ResultsDisplay from '../shared/ResultsDisplay';

const generateId = () => crypto.randomUUID();

const ThresholdForm: FC = () => {
  const [items, setItems] = useState<SoleiraItem[]>([]);
  const [stonePrice, setStonePrice] = useState<number>(300); // R$/m² for stone
  const [results, setResults] = useState<CalculationResults | null>(null);

  const addItem = (type: 'soleira' | 'pingadeira') => {
    setItems(prev => [...prev, { id: generateId(), type, length: 100, width: 10, finishType: 'none' }]);
  };

  const updateItem = (id: string, updates: Partial<SoleiraItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };
  
  const handleCalculation = () => {
    if (items.length === 0) {
      alert('Adicione pelo menos um item para calcular o orçamento.');
      return;
    }
    if (stonePrice <= 0) {
      alert('Informe o valor da pedra (R$/m²) para continuar.');
      return;
    }

    let totalStoneArea = 0;
    let totalFinishCostItems = 0;
    const summaryItems: CalculationResultItem[] = [];

    items.forEach((item, index) => {
      // Stone calculation
      const effectiveWidthForStone = item.type === 'pingadeira' ? item.width + 2 : item.width;
      const stoneAreaForItem = (item.length / 100) * (effectiveWidthForStone / 100); // in m²
      totalStoneArea += stoneAreaForItem;
      
      // Finish calculation
      let itemFinishLinearMeters = 0;
      if (item.finishType === 'one_side') {
        itemFinishLinearMeters = item.length / 100; // meters
      } else if (item.finishType === 'two_sides') {
        itemFinishLinearMeters = (item.length / 100) * 2; // meters
      }

      const finishPricePerLinearMeter = item.type === 'soleira' ? 8 : 10; // R$8/m for soleira, R$10/m for pingadeira
      const currentItemFinishCost = itemFinishLinearMeters * finishPricePerLinearMeter;
      totalFinishCostItems += currentItemFinishCost;

      let finishDescription = "Sem acabamento";
      if (item.finishType === 'one_side') {
        finishDescription = `1 lado maior (${item.length}cm)`;
      } else if (item.finishType === 'two_sides') {
        finishDescription = `2 lados maiores (${item.length}cm)`;
      }
      
      summaryItems.push({
        label: `${item.type === 'soleira' ? 'Soleira' : 'Pingadeira'} ${index + 1}`,
        details: `${item.length}cm x ${item.width}cm. ${item.type === 'pingadeira' ? `Largura efetiva (pedra): ${effectiveWidthForStone}cm. ` : ''}Área pedra: ${stoneAreaForItem.toFixed(3)}m². Acabamento: ${finishDescription} (R$ ${currentItemFinishCost.toFixed(2)})`,
      });
    });

    const totalStoneMaterialCost = totalStoneArea * stonePrice;
    const finalTotalCost = totalStoneMaterialCost + totalFinishCostItems;

    const resultItems: CalculationResultItem[] = [
      { label: 'Pedra (Material)', value: totalStoneMaterialCost, details: `${totalStoneArea.toFixed(3)} m² (R$ ${stonePrice}/m²)` },
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
              <div>
                <Label htmlFor="soleira-stone-price" className="text-sm font-medium">Valor da pedra (R$/metro quadrado)</Label>
                <Input
                  id="soleira-stone-price"
                  type="number"
                  value={stonePrice}
                  onChange={(e) => setStonePrice(parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 300.00"
                  step="0.01"
                  min="0"
                  className="mt-1"
                />
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


    