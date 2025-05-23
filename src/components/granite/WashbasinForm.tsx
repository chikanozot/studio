
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import type { CalculationResults, CalculationResultItem, WashbasinCalculationType, FinishedSide } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from "lucide-react";
import ResultsDisplay from '../shared/ResultsDisplay';
import NumberInputStepper from '../shared/NumberInputStepper';
import { cn } from '@/lib/utils';

const SCULPTED_SINK_LABOR_COST = 400;
const SCULPTED_SINK_MATERIAL_METERS = 0.5; // 0.5 linear meters of stone
const BUILT_IN_SINK_COST = 130;

const SideButton: FC<{
  label: string;
  dimension: number;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  orientation: 'horizontal' | 'vertical';
  disabled?: boolean;
}> = ({ label, dimension, isSelected, onClick, className, orientation, disabled }) => (
  <Button
    variant={isSelected ? "default" : "outline"}
    onClick={onClick}
    className={cn(
      "text-xs h-auto p-1",
      orientation === 'horizontal' ? 'min-w-[60px]' : 'min-h-[40px] w-full',
      className
    )}
    aria-pressed={isSelected}
    aria-label={`Selecionar lado ${label.toLowerCase()}`}
    disabled={disabled}
  >
    {dimension} cm
  </Button>
);


const WashbasinForm: FC = () => {
  const [calculationType, setCalculationType] = useState<WashbasinCalculationType>('sem_cuba');
  
  const [length, setLength] = useState<number>(120);
  const [width, setWidth] = useState<number>(60);
  const [stonePrice, setStonePrice] = useState<number>(350);
  
  // "Sem Cuba" specific states
  const [skirtHeight, setSkirtHeight] = useState<number>(0);
  const [topMoldingWidth, setTopMoldingWidth] = useState<number>(0);
  const [bottomMoldingWidth, setBottomMoldingWidth] = useState<number>(0);
  const [finishedSides, setFinishedSides] = useState<FinishedSide[]>([]);
  const [finishPrice, setFinishPrice] = useState<number>(80); // Default finish price per linear meter

  const [results, setResults] = useState<CalculationResults | null>(null);

  const toggleSide = (side: FinishedSide) => {
    if (calculationType !== 'sem_cuba') return;
    const newFinishedSides = finishedSides.includes(side)
      ? finishedSides.filter(s => s !== side)
      : [...finishedSides, side];
    setFinishedSides(newFinishedSides);
  };

  const getStonePriceLabel = () => {
    if (calculationType === 'sem_cuba') {
      return "Valor da pedra (R$/metro quadrado)";
    }
    return "Valor da pedra (R$/metro linear)";
  };

  const handleCalculation = () => {
    if (length <= 0 || width <= 0) {
      alert('Informe o comprimento e a largura da bancada para continuar.');
      return;
    }
    if (stonePrice <= 0) {
      alert('Informe o valor da pedra para continuar.');
      return;
    }

    const resultItems: CalculationResultItem[] = [];
    const summaryItems: CalculationResultItem[] = [];
    let totalCost = 0;

    const lengthM = length / 100;
    const widthM = width / 100;

    summaryItems.push({ label: "Tipo de Cálculo", details: calculationType === 'sem_cuba' ? 'Sem Cuba (m²)' : calculationType === 'cuba_esculpida' ? 'Cuba Esculpida (Linear)' : 'Cuba Embutida (Linear)'});
    summaryItems.push({ label: "Bancada", details: `${length}cm (C) x ${width}cm (L)`});


    if (calculationType === 'sem_cuba') {
      if (finishPrice <= 0 && finishedSides.length > 0) {
        alert('Informe o valor do acabamento para lados selecionados.');
        return;
      }

      // 1. Stone for Countertop
      const countertopArea = lengthM * widthM;
      const countertopStoneCost = countertopArea * stonePrice;
      resultItems.push({ label: 'Pedra (Bancada)', value: countertopStoneCost, details: `${countertopArea.toFixed(3)}m² (R$ ${stonePrice}/m²)` });
      totalCost += countertopStoneCost;

      // 2. Finish Cost
      let totalFinishLengthMeters = 0;
      finishedSides.forEach(side => {
        if (side === 'top' || side === 'bottom') totalFinishLengthMeters += lengthM;
        else totalFinishLengthMeters += widthM;
      });
      const currentFinishCost = totalFinishLengthMeters * finishPrice;
      if (totalFinishLengthMeters > 0) {
        resultItems.push({ label: 'Acabamento da Bancada', value: currentFinishCost, details: `${totalFinishLengthMeters.toFixed(2)}m linear (R$ ${finishPrice}/m)` });
        totalCost += currentFinishCost;
        summaryItems.push({ label: "Acabamento", details: `Lados: ${finishedSides.join(', ')} (${totalFinishLengthMeters.toFixed(2)}m)`});
      }


      // 3. Skirt Cost (Saia)
      if (skirtHeight > 0) {
        const skirtArea = (skirtHeight / 100) * totalFinishLengthMeters; // Uses finished length as base for skirt placement
        const currentSkirtCost = skirtArea * stonePrice;
        resultItems.push({ label: 'Saia', value: currentSkirtCost, details: `${skirtHeight}cm altura, ${skirtArea.toFixed(3)}m²` });
        totalCost += currentSkirtCost;
        summaryItems.push({ label: "Saia", details: `${skirtHeight}cm altura`});
      }

      // 4. Moldings (Rodapés)
      let topMoldingLengthForCalc = 0;
      let bottomMoldingLengthForCalc = 0;
      const allSides: FinishedSide[] = ['top', 'bottom', 'left', 'right'];

      allSides.forEach(side => {
        const sideLengthM = (side === 'top' || side === 'bottom') ? lengthM : widthM;
        if (finishedSides.includes(side)) {
          bottomMoldingLengthForCalc += sideLengthM;
        } else {
          topMoldingLengthForCalc += sideLengthM;
        }
      });
      
      let totalMoldingCost = 0;
      const moldingDetailsParts: string[] = [];

      if (topMoldingWidth > 0 && topMoldingLengthForCalc > 0) {
        const topMoldingArea = (topMoldingWidth / 100) * topMoldingLengthForCalc;
        const topMoldingCost = topMoldingArea * stonePrice;
        totalMoldingCost += topMoldingCost;
        moldingDetailsParts.push(`Superior ${topMoldingWidth}cm (${topMoldingLengthForCalc.toFixed(2)}m s/ acab., ${topMoldingArea.toFixed(3)}m²)`);
      }

      if (bottomMoldingWidth > 0 && bottomMoldingLengthForCalc > 0) {
        const bottomMoldingArea = (bottomMoldingWidth / 100) * bottomMoldingLengthForCalc;
        const bottomMoldingBaseCost = bottomMoldingArea * stonePrice;
        const bottomMoldingFinalCost = bottomMoldingBaseCost * 1.30; // 30% surcharge
        totalMoldingCost += bottomMoldingFinalCost;
        moldingDetailsParts.push(`Inferior ${bottomMoldingWidth}cm (${bottomMoldingLengthForCalc.toFixed(2)}m c/ acab., ${bottomMoldingArea.toFixed(3)}m², acréscimo 30%)`);
      }
      
      if (totalMoldingCost > 0) {
        resultItems.push({ label: 'Rodapés', value: totalMoldingCost, details: moldingDetailsParts.join('; ') });
        totalCost += totalMoldingCost;
        summaryItems.push({ label: "Rodapés", details: moldingDetailsParts.join('; ')});
      }

    } else if (calculationType === 'cuba_esculpida') {
      // 1. Stone for Countertop (linear)
      const countertopLinearCost = lengthM * stonePrice;
      resultItems.push({ label: 'Pedra (Bancada)', value: countertopLinearCost, details: `${lengthM.toFixed(2)}m linear (R$ ${stonePrice}/m linear)` });
      totalCost += countertopLinearCost;

      // 2. Sculpted Sink Labor
      resultItems.push({ label: 'Mão de Obra Cuba Esculpida', value: SCULPTED_SINK_LABOR_COST });
      totalCost += SCULPTED_SINK_LABOR_COST;
      summaryItems.push({ label: "Cuba Esculpida (Mão de Obra)", details: `R$ ${SCULPTED_SINK_LABOR_COST.toFixed(2)}`});


      // 3. Sculpted Sink Material
      const sinkMaterialCost = SCULPTED_SINK_MATERIAL_METERS * stonePrice;
      resultItems.push({ label: 'Material Adicional Cuba Esculpida', value: sinkMaterialCost, details: `${SCULPTED_SINK_MATERIAL_METERS}m linear` });
      totalCost += sinkMaterialCost;
      summaryItems.push({ label: "Cuba Esculpida (Material)", details: `${SCULPTED_SINK_MATERIAL_METERS}m de pedra`});


    } else if (calculationType === 'cuba_embutida') {
      // 1. Stone for Countertop (linear)
      const countertopLinearCost = lengthM * stonePrice;
      resultItems.push({ label: 'Pedra (Bancada)', value: countertopLinearCost, details: `${lengthM.toFixed(2)}m linear (R$ ${stonePrice}/m linear)` });
      totalCost += countertopLinearCost;

      // 2. Built-in Sink Cost
      resultItems.push({ label: 'Cuba Embutida (Peça)', value: BUILT_IN_SINK_COST });
      totalCost += BUILT_IN_SINK_COST;
      summaryItems.push({ label: "Cuba Embutida (Peça)", details: `R$ ${BUILT_IN_SINK_COST.toFixed(2)}`});
    }

    resultItems.push({ label: 'Total', value: totalCost, isTotal: true });
    setResults({ items: resultItems, summary: summaryItems.length > 0 ? summaryItems : undefined });
  };

  return (
    <div className="space-y-8 fade-in-animation">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Configuration */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Configuração do Lavatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="lavatorio-calculation-type" className="text-sm font-medium">Tipo de Cálculo</Label>
                <Select value={calculationType} onValueChange={(value) => {
                  setCalculationType(value as WashbasinCalculationType);
                  // Reset related fields if needed, or adjust stonePrice label/value context
                  setResults(null); // Clear previous results on type change
                  if (value === 'sem_cuba') {
                     setStonePrice(350); // Example default for m²
                  } else {
                     setStonePrice(150); // Example default for linear meter
                  }
                  setFinishedSides([]); // Reset finished sides on type change
                }}>
                  <SelectTrigger id="lavatorio-calculation-type" className="w-full mt-1">
                    <SelectValue placeholder="Selecione o tipo de cálculo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sem_cuba">Sem Cuba (Cálculo por m²)</SelectItem>
                    <SelectItem value="cuba_esculpida">Cuba Esculpida (Cálculo Linear)</SelectItem>
                    <SelectItem value="cuba_embutida">Cuba Embutida (Cálculo Linear)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              {calculationType === 'sem_cuba' && (
                <>
                  <NumberInputStepper
                    id="lavatorio-skirt-height"
                    label="Altura da saia (Opcional)"
                    unit="cm"
                    value={skirtHeight}
                    onValueChange={setSkirtHeight}
                    min={0}
                  />
                  <div>
                    <p className="text-sm font-medium mb-2 text-foreground">Lados da bancada com acabamento:</p>
                    <p className="text-xs text-muted-foreground mb-2">Usado para calcular rodapés e saia.</p>
                    <div className="flex justify-center">
                      <div className="grid grid-cols-3 grid-rows-3 gap-1 w-[180px] h-[120px]">
                        <div /> 
                        <SideButton 
                          label="Superior" 
                          dimension={length} 
                          isSelected={finishedSides.includes('top')} 
                          onClick={() => toggleSide('top')}
                          orientation="horizontal"
                          className="col-span-1 row-start-1 col-start-2"
                        />
                        <div />
                        <SideButton 
                          label="Esquerdo" 
                          dimension={width} 
                          isSelected={finishedSides.includes('left')} 
                          onClick={() => toggleSide('left')}
                          orientation="vertical"
                          className="row-start-2 col-start-1"
                        />
                        <div className="flex items-center justify-center border border-muted rounded-md bg-background text-xs text-muted-foreground row-start-2 col-start-2">
                          Bancada
                        </div>
                        <SideButton 
                          label="Direito" 
                          dimension={width} 
                          isSelected={finishedSides.includes('right')} 
                          onClick={() => toggleSide('right')}
                          orientation="vertical"
                          className="row-start-2 col-start-3"
                        />
                        <div />
                        <SideButton 
                          label="Inferior" 
                          dimension={length} 
                          isSelected={finishedSides.includes('bottom')} 
                          onClick={() => toggleSide('bottom')}
                          orientation="horizontal"
                          className="col-span-1 row-start-3 col-start-2"
                        />
                        <div />
                      </div>
                    </div>
                  </div>
                   <div>
                    <Label htmlFor="lavatorio-finish-price" className="text-sm font-medium">Valor do acabamento da bancada (R$/metro linear)</Label>
                    <Input 
                      id="lavatorio-finish-price" 
                      type="number" 
                      value={finishPrice} 
                      onChange={(e) => setFinishPrice(parseFloat(e.target.value) || 0)} 
                      placeholder="Ex: 80.00" 
                      step="0.01"
                      min="0"
                      className="mt-1"
                      disabled={finishedSides.length === 0}
                    />
                  </div>
                  <h3 className="text-lg font-medium pt-2 text-foreground">Rodapés (Opcional)</h3>
                  <NumberInputStepper
                    id="lavatorio-top-molding-width"
                    label="Rodapé em cima da bancada (largura)"
                    unit="cm"
                    value={topMoldingWidth}
                    onValueChange={setTopMoldingWidth}
                    min={0}
                  />
                  <NumberInputStepper
                    id="lavatorio-bottom-molding-width"
                    label="Rodapé embaixo do móvel (largura)"
                    unit="cm"
                    value={bottomMoldingWidth}
                    onValueChange={setBottomMoldingWidth}
                    min={0}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: General Settings & Calculate Button */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-primary">Configurações de Preço</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="lavatorio-stone-price" className="text-sm font-medium">{getStonePriceLabel()}</Label>
                <Input
                  id="lavatorio-stone-price"
                  type="number"
                  value={stonePrice}
                  onChange={(e) => setStonePrice(parseFloat(e.target.value) || 0)}
                  placeholder={calculationType === 'sem_cuba' ? "Ex: 350.00" : "Ex: 150.00"}
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
        <ResultsDisplay title="Resultado do Orçamento do Lavatório" results={results} />
      )}
    </div>
  );
};

export default WashbasinForm;
