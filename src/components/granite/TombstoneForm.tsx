"use client";

import type { FC } from 'react';
import { useState } from 'react';
import type { CalculationResults, CalculationResultItem } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from "lucide-react";
import ResultsDisplay from '../shared/ResultsDisplay';
import NumberInputStepper from '../shared/NumberInputStepper';

interface FinishTypeOption {
  value: string;
  label: string;
  pricePerMeter: number;
}

const finishTypes: FinishTypeOption[] = [
  { value: 'simples', label: 'Simples', pricePerMeter: 100 },
  { value: 'padrao', label: 'Padrão', pricePerMeter: 150 },
  { value: 'luxo', label: 'Luxo', pricePerMeter: 250 },
];

const TombstoneForm: FC = () => {
  const [length, setLength] = useState<number>(200);
  const [width, setWidth] = useState<number>(100);
  const [height, setHeight] = useState<number>(80);
  const [finishTypeValue, setFinishTypeValue] = useState<string>('padrao');
  const [stonePrice, setStonePrice] = useState<number>(400);
  const [results, setResults] = useState<CalculationResults | null>(null);

  const handleCalculation = () => {
    if (length <= 0 || width <= 0 || height <= 0) {
      alert('Informe todas as medidas do túmulo para continuar.');
      return;
    }
    if (stonePrice <= 0) {
      alert('Informe o valor da pedra para continuar.');
      return;
    }

    const lengthM = length / 100;
    const widthM = width / 100;
    const heightM = height / 100;

    const topArea = lengthM * widthM;
    const frontBackArea = 2 * lengthM * heightM;
    const sideArea = 2 * widthM * heightM;
    const totalStoneArea = topArea + frontBackArea + sideArea;
    const currentStoneCost = totalStoneArea * stonePrice;

    const selectedFinish = finishTypes.find(f => f.value === finishTypeValue);
    const finishPricePerMeter = selectedFinish ? selectedFinish.pricePerMeter : 0;
    const finishName = selectedFinish ? selectedFinish.label : 'N/A';
    
    const perimeter = 2 * (lengthM + widthM); // Perimeter of the top for finishing edges
    const currentFinishCost = perimeter * finishPricePerMeter;

    const totalCost = currentStoneCost + currentFinishCost;

    const summaryItems: CalculationResultItem[] = [
        { label: "Medidas", details: `${length}cm (C) x ${width}cm (L) x ${height}cm (A)`},
        { label: "Área da Pedra", 
          details: `Topo: ${topArea.toFixed(2)}m², Frente/Trás: ${frontBackArea.toFixed(2)}m², Lados: ${sideArea.toFixed(2)}m². Total: ${totalStoneArea.toFixed(2)}m²`
        },
        { label: "Acabamento", details: `${finishName} (Perímetro: ${perimeter.toFixed(2)}m)`}
    ];

    const resultItems: CalculationResultItem[] = [
      { label: 'Pedra', value: currentStoneCost, details: `${totalStoneArea.toFixed(2)}m²` },
      { label: `Acabamento ${finishName}`, value: currentFinishCost, details: `${perimeter.toFixed(2)}m lineares` },
      { label: 'Total', value: totalCost, isTotal: true },
    ];
    
    setResults({ items: resultItems, summary: summaryItems });
  };

  return (
    <div className="space-y-8 fade-in-animation">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Dimensions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Configuração do Túmulo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NumberInputStepper
                id="tumulo-length"
                label="Comprimento"
                unit="cm"
                value={length}
                onValueChange={setLength}
                min={10}
              />
              <NumberInputStepper
                id="tumulo-width"
                label="Largura"
                unit="cm"
                value={width}
                onValueChange={setWidth}
                min={10}
              />
              <NumberInputStepper
                id="tumulo-height"
                label="Altura"
                unit="cm"
                value={height}
                onValueChange={setHeight}
                min={10}
              />
              <div>
                <Label htmlFor="tumulo-finish" className="text-sm font-medium">Tipo de Acabamento</Label>
                <Select value={finishTypeValue} onValueChange={setFinishTypeValue}>
                  <SelectTrigger id="tumulo-finish" className="w-full mt-1">
                    <SelectValue placeholder="Selecione o tipo de acabamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {finishTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} (R$ {type.pricePerMeter.toFixed(2)}/m linear)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label htmlFor="tumulo-stone-price" className="text-sm font-medium">Valor da pedra (R$/metro quadrado)</Label>
                <Input
                  id="tumulo-stone-price"
                  type="number"
                  value={stonePrice}
                  onChange={(e) => setStonePrice(parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 400.00"
                  step="0.01"
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
        <ResultsDisplay title="Resultado do Orçamento do Túmulo" results={results} />
      )}
    </div>
  );
};

export default TombstoneForm;
