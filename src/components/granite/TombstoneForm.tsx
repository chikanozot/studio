
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import type { CalculationResults, CalculationResultItem } from '@/types';
import { Button } from "@/components/ui/button";
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
  { value: 'none', label: 'Sem Acabamento', pricePerMeter: 0 },
  { value: 'meia_cana_abonado', label: 'Meia Cana Abonado', pricePerMeter: 80 },
];

const HANDLE_PRICE = 100;

const TombstoneForm: FC = () => {
  const [length, setLength] = useState<number | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [finishTypeValue, setFinishTypeValue] = useState<string>('meia_cana_abonado');
  const [stonePrice, setStonePrice] = useState<number | null>(null);
  const [numberOfHandles, setNumberOfHandles] = useState<number | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);

  const handleCalculation = () => {
    const currentLength = length === null ? 0 : length;
    const currentWidth = width === null ? 0 : width;
    const currentHeight = height === null ? 0 : height;
    const currentStonePriceVal = stonePrice === null ? 0 : stonePrice;
    const currentNumberOfHandles = numberOfHandles === null ? 0 : numberOfHandles;

    if (currentLength <= 0 || currentWidth <= 0 || currentHeight <= 0) {
      alert('Informe todas as medidas do túmulo para continuar.');
      setResults(null);
      return;
    }
    if (currentStonePriceVal <= 0) {
      alert('Informe o valor da pedra para continuar.');
      setResults(null);
      return;
    }

    const lengthM = currentLength / 100;
    const widthM = currentWidth / 100;
    const heightM = currentHeight / 100;

    const topArea = lengthM * widthM;
    const frontBackArea = 2 * lengthM * heightM;
    const sideArea = 2 * widthM * heightM;
    const totalStoneArea = topArea + frontBackArea + sideArea;
    const currentStoneCost = totalStoneArea * currentStonePriceVal;

    const selectedFinish = finishTypes.find(f => f.value === finishTypeValue);
    const finishPricePerMeter = selectedFinish ? selectedFinish.pricePerMeter : 0;
    const finishName = selectedFinish ? selectedFinish.label : 'N/A';
    
    const perimeter = 2 * (lengthM + widthM); // Perimeter of the top for finishing edges
    const currentFinishCost = perimeter * finishPricePerMeter;

    const handlesCost = currentNumberOfHandles * HANDLE_PRICE;

    const totalCost = currentStoneCost + currentFinishCost + handlesCost;

    const summaryItems: CalculationResultItem[] = [
        { label: "Medidas", details: `${currentLength}cm (C) x ${currentWidth}cm (L) x ${currentHeight}cm (A)`},
        { label: "Área da Pedra", 
          details: `Topo: ${topArea.toFixed(2)}m², Frente/Trás: ${frontBackArea.toFixed(2)}m², Lados: ${sideArea.toFixed(2)}m². Total: ${totalStoneArea.toFixed(2)}m²`
        },
        { label: "Acabamento", details: `${finishName} (Perímetro: ${perimeter.toFixed(2)}m)`}
    ];
    if (currentNumberOfHandles > 0) {
        summaryItems.push({ label: "Puxadores", details: `${currentNumberOfHandles} unidade(s)`});
    }


    const resultItems: CalculationResultItem[] = [
      { label: 'Pedra', value: currentStoneCost, details: `${totalStoneArea.toFixed(2)}m² (R$ ${currentStonePriceVal.toFixed(2)}/m²)` },
    ];

    if (finishPricePerMeter > 0 || finishTypeValue === 'none') {
         resultItems.push({ label: `Acabamento ${finishName}`, value: currentFinishCost, details: `${perimeter.toFixed(2)}m lineares (R$ ${finishPricePerMeter.toFixed(2)}/m)` });
    }

    if (handlesCost > 0) {
      resultItems.push({ label: 'Puxadores', value: handlesCost, details: `${currentNumberOfHandles} unidade(s) (R$ ${HANDLE_PRICE.toFixed(2)}/unid.)` });
    }
    
    resultItems.push({ label: 'Total', value: totalCost, isTotal: true });
    
    setResults({ items: resultItems, summary: summaryItems });
  };

  return (
    <div className="space-y-8 fade-in-animation">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Dimensions & Configuration */}
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
                onValueChange={(val) => {setLength(val); setResults(null);}}
                min={10}
              />
              <NumberInputStepper
                id="tumulo-width"
                label="Largura"
                unit="cm"
                value={width}
                onValueChange={(val) => {setWidth(val); setResults(null);}}
                min={10}
              />
              <NumberInputStepper
                id="tumulo-height"
                label="Altura"
                unit="cm"
                value={height}
                onValueChange={(val) => {setHeight(val); setResults(null);}}
                min={10}
              />
              <div>
                <Label htmlFor="tumulo-finish" className="text-sm font-medium">Tipo de Acabamento</Label>
                <Select value={finishTypeValue} onValueChange={(val) => {setFinishTypeValue(val); setResults(null);}}>
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
              <NumberInputStepper
                id="tumulo-handles"
                label="Número de Puxadores (Opcional)"
                unit="unid."
                value={numberOfHandles}
                onValueChange={(val) => {setNumberOfHandles(val); setResults(null);}}
                min={0}
                step={1}
              />
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
                  id="tumulo-stone-price"
                  label="Valor da pedra (R$/metro quadrado)"
                  unit="R$"
                  value={stonePrice}
                  onValueChange={(val) => {setStonePrice(val); setResults(null);}}
                  step="0.01"
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
        <ResultsDisplay title="Resultado do Orçamento do Túmulo" results={results} />
      )}
    </div>
  );
};

export default TombstoneForm;

