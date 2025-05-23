
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import type { Countertop, Cuba, CalculationResults, CalculationResultItem } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Calculator, Archive } from "lucide-react";
import CountertopItem from './CountertopItem';
import ResultsDisplay from '../shared/ResultsDisplay';
import NumberInputStepper from '../shared/NumberInputStepper';

const cubaOptions: Omit<Cuba, 'id'>[] = [
  { type: 'pequena', name: 'Pequena', price: 230 },
  { type: 'media', name: 'Média', price: 240 },
  { type: 'grande', name: 'Grande', price: 240 },
];

const generateId = () => Date.now().toString();

const KitchenForm: FC = () => {
  const [countertops, setCountertops] = useState<Countertop[]>([]);
  const [cubas, setCubas] = useState<Cuba[]>([]);
  
  const [stonePrice, setStonePrice] = useState<number>(150);
  const [skirtHeight, setSkirtHeight] = useState<number>(10);
  const [finishType, setFinishType] = useState<string>("80"); // finishPrice
  const [topMoldingWidth, setTopMoldingWidth] = useState<number>(5);
  const [bottomMoldingWidth, setBottomMoldingWidth] = useState<number>(5);

  const [results, setResults] = useState<CalculationResults | null>(null);

  useEffect(() => {
    // Add one countertop by default on mount
    if (countertops.length === 0) {
      addCountertop();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const addCountertop = () => {
    setCountertops(prev => [...prev, { id: generateId(), length: 100, width: 50, finishedSides: [] }]);
  };

  const updateCountertop = (id: string, updates: Partial<Countertop>) => {
    setCountertops(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeCountertop = (id: string) => {
    setCountertops(prev => prev.filter(c => c.id !== id));
  };

  const addCuba = (type: 'pequena' | 'media' | 'grande') => {
    const cubaOption = cubaOptions.find(c => c.type === type);
    if (cubaOption) {
      setCubas(prev => [...prev, { ...cubaOption, id: generateId() }]);
    }
  };

  const removeCuba = (id: string) => {
    setCubas(prev => prev.filter(c => c.id !== id));
  };

  const handleCalculation = () => {
    if (countertops.length === 0) {
      alert('Adicione pelo menos um balcão para calcular o orçamento.');
      return;
    }
    if (stonePrice <= 0) {
      alert('Informe o valor da pedra para continuar.');
      return;
    }

    const finishPriceValue = parseFloat(finishType) || 0;

    let totalStoneLinearLength = 0;
    countertops.forEach(c => {
      totalStoneLinearLength += c.length / 100; // For main stone calculation (front edges)
    });
    const stoneCost = totalStoneLinearLength * stonePrice;

    let totalFinishLength = 0;
    countertops.forEach(c => {
      if (c.finishedSides.includes('top')) totalFinishLength += c.length / 100;
      if (c.finishedSides.includes('bottom')) totalFinishLength += c.length / 100;
      if (c.finishedSides.includes('left')) totalFinishLength += c.width / 100;
      if (c.finishedSides.includes('right')) totalFinishLength += c.width / 100;
    });
    const finishCost = totalFinishLength * finishPriceValue;
    
    const skirtCost = skirtHeight > 0 ? (skirtHeight / 100) * totalFinishLength * stonePrice : 0;

    let moldingCost = 0;
    let topMoldingLengthForCalc = 0; 
    let bottomMoldingLengthForCalc = 0;
    let bottomMoldingSurcharge = 1.3; // 30% surcharge

    // Calculate top molding length (sides WITHOUT finish)
    if (topMoldingWidth > 0) {
      countertops.forEach(c => {
        const allSides: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
        allSides.forEach(side => {
          if (!c.finishedSides.includes(side)) {
            if (side === 'top' || side === 'bottom') {
              topMoldingLengthForCalc += c.length / 100; // meters
            } else { // 'left' or 'right'
              topMoldingLengthForCalc += c.width / 100; // meters
            }
          }
        });
      });
      const topMoldingArea = topMoldingLengthForCalc * (topMoldingWidth / 100); // m²
      moldingCost += topMoldingArea * stonePrice;
    }
    
    // Calculate bottom molding length (sides WITH finish)
    if (bottomMoldingWidth > 0) {
      countertops.forEach(c => {
        c.finishedSides.forEach(side => {
          if (side === 'top' || side === 'bottom') {
            bottomMoldingLengthForCalc += c.length / 100; // meters
          } else { // 'left' or 'right'
            bottomMoldingLengthForCalc += c.width / 100; // meters
          }
        });
      });
      const bottomMoldingArea = bottomMoldingLengthForCalc * (bottomMoldingWidth / 100); // m²
      moldingCost += (bottomMoldingArea * stonePrice) * bottomMoldingSurcharge;
    }

    const cubasCost = cubas.reduce((acc, cuba) => acc + cuba.price, 0);
    const totalCost = stoneCost + finishCost + skirtCost + moldingCost + cubasCost;

    const resultItems: CalculationResultItem[] = [];
    resultItems.push({ label: 'Pedra', value: stoneCost, details: `${totalStoneLinearLength.toFixed(2)}m linear` });
    resultItems.push({ label: 'Acabamento', value: finishCost, details: `${totalFinishLength.toFixed(2)}m linear (R$ ${finishPriceValue}/m)` });
    if (skirtHeight > 0) {
      resultItems.push({ label: 'Saia', value: skirtCost, details: `${skirtHeight}cm altura` });
    }
    
    const moldingDetailsParts: string[] = [];
    if (topMoldingWidth > 0) {
      moldingDetailsParts.push(`Superior ${topMoldingWidth}cm (${topMoldingLengthForCalc.toFixed(2)}m s/ acab.)`);
    }
    if (bottomMoldingWidth > 0) {
      moldingDetailsParts.push(`Inferior ${bottomMoldingWidth}cm (${bottomMoldingLengthForCalc.toFixed(2)}m c/ acab., acréscimo 30%)`);
    }
    if (moldingDetailsParts.length > 0) {
      resultItems.push({ label: 'Rodapés', value: moldingCost, details: moldingDetailsParts.join('; ') });
    }

    if (cubas.length > 0) {
      resultItems.push({ label: `Cubas (${cubas.length})`, value: cubasCost });
    }
    resultItems.push({ label: 'Total', value: totalCost, isTotal: true });

    const summaryItems: CalculationResultItem[] = countertops.map((c, i) => ({
      label: `Balcão ${i + 1}`,
      details: `${c.length}cm x ${c.width}cm. Acabamento: ${c.finishedSides.length > 0 ? c.finishedSides.map(s => {
        if (s === 'top' || s === 'bottom') return `${c.length}cm (${s})`;
        return `${c.width}cm (${s})`;
      }).join(', ') : 'Nenhum'}`,
    }));
    
    setResults({ items: resultItems, summary: summaryItems });
  };


  return (
    <div className="space-y-8 fade-in-animation">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Countertops & Sinks */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Configuração do Balcão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">Balcões</h3>
                <div id="countertops-container" className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {countertops.map((countertop, index) => (
                    <CountertopItem
                      key={countertop.id}
                      countertop={countertop}
                      index={index}
                      onUpdate={updateCountertop}
                      onRemove={removeCountertop}
                    />
                  ))}
                </div>
                <Button onClick={addCountertop} variant="outline" className="mt-4 w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Adicionar Balcão
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3 text-foreground">Cubas (Opcional)</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {cubaOptions.map(cuba => (
                    <Button key={cuba.type} onClick={() => addCuba(cuba.type)} variant="secondary" size="sm">
                       <Archive className="mr-2 h-4 w-4" /> {cuba.name} (R$ {cuba.price})
                    </Button>
                  ))}
                </div>
                <div id="cubas-list" className="space-y-2">
                  {cubas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma cuba adicionada.</p>}
                  {cubas.map(cuba => (
                    <div key={cuba.id} className="flex justify-between items-center bg-secondary/50 p-2 rounded-md text-sm">
                      <span><Archive className="inline mr-1 h-4 w-4" />Cuba {cuba.name} - R$ {cuba.price.toFixed(2)}</span>
                      <Button variant="ghost" size="icon" onClick={() => removeCuba(cuba.id)} className="h-6 w-6 text-destructive hover:text-destructive/80">
                        <Trash2 className="h-3 w-3" />
                         <span className="sr-only">Remover Cuba</span>
                      </Button>
                    </div>
                  ))}
                </div>
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
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stone-price" className="text-sm font-medium">Valor da pedra (R$/metro linear)</Label>
                <Input 
                  id="stone-price" 
                  type="number" 
                  value={stonePrice} 
                  onChange={(e) => setStonePrice(parseFloat(e.target.value) || 0)} 
                  placeholder="Ex: 150.00" 
                  step="0.01"
                  className="mt-1"
                />
              </div>
               <div>
                <Label htmlFor="finish-price" className="text-sm font-medium">Valor do acabamento por metro linear</Label>
                <Select value={finishType} onValueChange={setFinishType}>
                  <SelectTrigger id="finish-price" className="w-full mt-1">
                    <SelectValue placeholder="Selecione o valor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80">R$ 80,00</SelectItem>
                    <SelectItem value="40">R$ 40,00</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <NumberInputStepper
                id="skirt-height"
                label="Altura da saia"
                unit="cm"
                value={skirtHeight}
                onValueChange={setSkirtHeight}
                min={0}
              />
              <h3 className="text-lg font-medium pt-2 text-foreground">Rodapés (Opcional)</h3>
              <NumberInputStepper
                id="top-molding-width"
                label="Rodapé em cima do balcão (largura)"
                unit="cm"
                value={topMoldingWidth}
                onValueChange={setTopMoldingWidth}
                min={0}
              />
              <NumberInputStepper
                id="bottom-molding-width"
                label="Rodapé embaixo do móvel (largura)"
                unit="cm"
                value={bottomMoldingWidth}
                onValueChange={setBottomMoldingWidth}
                min={0}
              />
            </CardContent>
          </Card>
          <Button onClick={handleCalculation} size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Calculator className="mr-2 h-5 w-5" /> Calcular Orçamento
          </Button>
        </div>
      </div>

      {results && (
        <ResultsDisplay title="Resultado do Orçamento da Cozinha" results={results} />
      )}
    </div>
  );
};

export default KitchenForm;

