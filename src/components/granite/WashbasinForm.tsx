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

interface SinkTypeOption {
  value: string;
  label: string;
  price: number;
}

const sinkTypes: SinkTypeOption[] = [
  { value: 'padrao', label: 'Padrão', price: 250 },
  { value: 'grande', label: 'Grande', price: 300 },
  { value: 'luxo', label: 'Luxo', price: 400 },
];

const WashbasinForm: FC = () => {
  const [length, setLength] = useState<number>(120);
  const [width, setWidth] = useState<number>(60);
  const [sinkTypeValue, setSinkTypeValue] = useState<string>('padrao');
  const [stonePrice, setStonePrice] = useState<number>(350);
  const [results, setResults] = useState<CalculationResults | null>(null);

  const handleCalculation = () => {
    if (length <= 0 || width <= 0) {
      alert('Informe as medidas da bancada para continuar.');
      return;
    }
    if (stonePrice <= 0) {
      alert('Informe o valor da pedra para continuar.');
      return;
    }

    const area = (length / 100) * (width / 100); // in m²
    const currentStoneCost = area * stonePrice;

    const selectedSink = sinkTypes.find(s => s.value === sinkTypeValue);
    const currentSinkCost = selectedSink ? selectedSink.price : 0;
    const sinkName = selectedSink ? selectedSink.label : 'N/A';

    const totalCost = currentStoneCost + currentSinkCost;

    const summaryItems: CalculationResultItem[] = [
        { label: "Bancada", details: `${length}cm x ${width}cm, Área: ${area.toFixed(3)}m²`},
        { label: "Cuba", details: `${sinkName}, Valor: R$ ${currentSinkCost.toFixed(2)}`}
    ];

    const resultItems: CalculationResultItem[] = [
      { label: 'Pedra', value: currentStoneCost, details: `${area.toFixed(3)}m²` },
      { label: `Cuba ${sinkName}`, value: currentSinkCost },
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
              <CardTitle className="text-xl text-primary">Configuração do Lavatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <NumberInputStepper
                id="lavatorio-length"
                label="Comprimento da bancada"
                unit="cm"
                value={length}
                onValueChange={setLength}
                min={10}
              />
              <NumberInputStepper
                id="lavatorio-width"
                label="Largura da bancada"
                unit="cm"
                value={width}
                onValueChange={setWidth}
                min={10}
              />
              <div>
                <Label htmlFor="lavatorio-sink-type" className="text-sm font-medium">Tipo de Cuba</Label>
                <Select value={sinkTypeValue} onValueChange={setSinkTypeValue}>
                  <SelectTrigger id="lavatorio-sink-type" className="w-full mt-1">
                    <SelectValue placeholder="Selecione o tipo de cuba" />
                  </SelectTrigger>
                  <SelectContent>
                    {sinkTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} (R$ {type.price.toFixed(2)})
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
                <Label htmlFor="lavatorio-stone-price" className="text-sm font-medium">Valor da pedra (R$/metro quadrado)</Label>
                <Input
                  id="lavatorio-stone-price"
                  type="number"
                  value={stonePrice}
                  onChange={(e) => setStonePrice(parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 350.00"
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
        <ResultsDisplay title="Resultado do Orçamento do Lavatório" results={results} />
      )}
    </div>
  );
};

export default WashbasinForm;
