
"use client";

import type { FC } from 'react';
import { useState, useMemo } from 'react';
import type { CalculationResults, CalculationResultItem } from '@/types';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator } from "lucide-react";
import ResultsDisplay from '../shared/ResultsDisplay';
import NumberInputStepper from '../shared/NumberInputStepper';
import { Checkbox } from '@/components/ui/checkbox';
import { stoneOptions } from '@/data/stoneOptions';

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
const VELEIRO_PRICE = 250;
const VASO_PRICE = 250;
const CARNEIRA_PRICE = 1200;

const BASE_TOMB_LENGTH_CM = 260;
const BASE_TOMB_WIDTH_CM = 130;
const MIN_PAVING_AREA_M2_FOR_STANDARD_SIZE = 2;

const CAPELA_GLASS_PRICE = 600;
const CAPELA_STRUCTURE_BASE_PRICE_STONE_UP_TO_400 = 1300; // (1900 total - 600 glass)
const CAPELA_STONE_PRICE_THRESHOLD_FOR_BASE = 400;

type TombStructureType = 'none' | 'cabeceira' | 'capela';

const TombstoneForm: FC = () => {
  const [length, setLength] = useState<number | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [finishTypeValue, setFinishTypeValue] = useState<string>('meia_cana_abonado');
  
  const [selectedStoneValue, setSelectedStoneValue] = useState<string>("");
  const [customStonePriceInput, setCustomStonePriceInput] = useState<number | null>(null);

  const [numberOfHandles, setNumberOfHandles] = useState<number | null>(null);
  const [hasVeleiro, setHasVeleiro] = useState<boolean>(false);
  const [hasVaso, setHasVaso] = useState<boolean>(false);
  const [numberOfCarneiras, setNumberOfCarneiras] = useState<number | null>(null);
  const [tombType, setTombType] = useState<TombStructureType>('none');
  const [results, setResults] = useState<CalculationResults | null>(null);

  const actualStonePrice = useMemo(() => {
    if (selectedStoneValue === 'other') {
      return customStonePriceInput === null ? 0 : customStonePriceInput;
    }
    return selectedStoneValue ? parseFloat(selectedStoneValue) : 0;
  }, [selectedStoneValue, customStonePriceInput]);

  const handleCalculation = () => {
    const currentLength = length === null ? 0 : length;
    const currentWidth = width === null ? 0 : width;
    const currentHeight = height === null ? 0 : height;
    const currentNumberOfHandles = numberOfHandles === null ? 0 : numberOfHandles;
    const currentNumberOfCarneiras = numberOfCarneiras === null ? 0 : numberOfCarneiras;

    if (currentLength <= 0 || currentWidth <= 0 || currentHeight <= 0) {
      alert('Informe todas as medidas do túmulo para continuar.');
      setResults(null);
      return;
    }
    if (actualStonePrice <= 0) {
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
    let totalTombStructureStoneArea = topArea + frontBackArea + sideArea;
    
    let pavingStoneAreaM2 = 0;
    if (currentLength > 0 && currentWidth > 0) {
      const actualTombFootprintM2 = (currentLength / 100) * (currentWidth / 100);
      const referenceTombFootprintM2 = (BASE_TOMB_LENGTH_CM / 100) * (BASE_TOMB_WIDTH_CM / 100); 

      if (currentLength <= BASE_TOMB_LENGTH_CM && currentWidth <= BASE_TOMB_WIDTH_CM) {
        pavingStoneAreaM2 = MIN_PAVING_AREA_M2_FOR_STANDARD_SIZE;
      } else {
        if (referenceTombFootprintM2 > 0) {
             pavingStoneAreaM2 = (actualTombFootprintM2 / referenceTombFootprintM2) * MIN_PAVING_AREA_M2_FOR_STANDARD_SIZE;
        } else {
            pavingStoneAreaM2 = MIN_PAVING_AREA_M2_FOR_STANDARD_SIZE; 
        }
      }
    }
    const pavingStoneCost = pavingStoneAreaM2 * actualStonePrice;

    let cabeceiraStoneCost = 0;
    if (tombType === 'cabeceira') {
      totalTombStructureStoneArea += 1; 
      cabeceiraStoneCost = 1 * actualStonePrice;
    }
    const tombStructureStoneCost = totalTombStructureStoneArea * actualStonePrice;


    const selectedFinish = finishTypes.find(f => f.value === finishTypeValue);
    const finishPricePerMeter = selectedFinish ? selectedFinish.pricePerMeter : 0;
    const finishName = selectedFinish ? selectedFinish.label : 'N/A';
    
    const perimeter = 2 * (lengthM + widthM);
    const currentFinishCost = perimeter * finishPricePerMeter;

    const handlesCost = currentNumberOfHandles * HANDLE_PRICE;
    const veleiroCost = hasVeleiro ? VELEIRO_PRICE : 0;
    const vasoCost = hasVaso ? VASO_PRICE : 0;
    const carneirasCost = currentNumberOfCarneiras * CARNEIRA_PRICE;

    let capelaTotalCost = 0;
    let capelaGlassCost = 0;
    let capelaStructureCost = 0;
    if (tombType === 'capela') {
      capelaGlassCost = CAPELA_GLASS_PRICE;
      if (actualStonePrice <= CAPELA_STONE_PRICE_THRESHOLD_FOR_BASE) {
        capelaStructureCost = CAPELA_STRUCTURE_BASE_PRICE_STONE_UP_TO_400;
      } else {
        capelaStructureCost = (actualStonePrice / CAPELA_STONE_PRICE_THRESHOLD_FOR_BASE) * CAPELA_STRUCTURE_BASE_PRICE_STONE_UP_TO_400;
      }
      capelaTotalCost = capelaGlassCost + capelaStructureCost;
    }

    const totalCost = tombStructureStoneCost + pavingStoneCost + currentFinishCost + handlesCost + veleiroCost + vasoCost + carneirasCost + capelaTotalCost;
    
    const selectedStoneName = stoneOptions.find(opt => String(opt.price) === selectedStoneValue)?.name || (selectedStoneValue === 'other' ? 'Personalizado' : 'Não selecionada');

    const summaryItems: CalculationResultItem[] = [
        { label: "Pedra Selecionada", details: `${selectedStoneName} (R$ ${actualStonePrice.toFixed(2)}/m²)`},
        { label: "Medidas Túmulo", details: `${currentLength}cm (C) x ${currentWidth}cm (L) x ${currentHeight}cm (A)`},
    ];
    if (tombType === 'cabeceira') {
        summaryItems.push({ label: "Estrutura Adicional", details: `Cabeceira (1m² de pedra adicional para a estrutura)`});
    } else if (tombType === 'capela') {
        const capelaStructureDetails = actualStonePrice <= CAPELA_STONE_PRICE_THRESHOLD_FOR_BASE
        ? `Estrutura com pedra até R$ ${CAPELA_STONE_PRICE_THRESHOLD_FOR_BASE.toFixed(2)}/m²`
        : `Estrutura proporcional com pedra a R$ ${actualStonePrice.toFixed(2)}/m²`;
        summaryItems.push({ label: "Estrutura Adicional", details: `Capela. Vidro: R$ ${capelaGlassCost.toFixed(2)}. Estrutura: R$ ${capelaStructureCost.toFixed(2)} (${capelaStructureDetails})`});
    }
    
    summaryItems.push(
        { label: "Área da Pedra (Túmulo)", 
          details: `Topo: ${topArea.toFixed(2)}m², Frente/Trás: ${frontBackArea.toFixed(2)}m², Lados: ${sideArea.toFixed(2)}m². ${tombType === 'cabeceira' ? 'Cabeceira: 1.00m². ' : ''}Total Estrutura: ${totalTombStructureStoneArea.toFixed(2)}m²`
        },
        { label: "Calçada", details: `Área da pedra para calçada: ${pavingStoneAreaM2.toFixed(2)}m². Regra: até ${BASE_TOMB_LENGTH_CM}x${BASE_TOMB_WIDTH_CM}cm = ${MIN_PAVING_AREA_M2_FOR_STANDARD_SIZE}m², maior aumenta proporcionalmente.`},
        { label: "Acabamento", details: `${finishName} (Perímetro: ${perimeter.toFixed(2)}m)`}
    );

    if (currentNumberOfHandles > 0) {
        summaryItems.push({ label: "Puxadores", details: `${currentNumberOfHandles} unidade(s)`});
    }
    if (hasVeleiro) {
        summaryItems.push({ label: "Veleiro", details: `Sim (R$ ${VELEIRO_PRICE.toFixed(2)})`});
    }
    if (hasVaso) {
        summaryItems.push({ label: "Vaso", details: `Sim (R$ ${VASO_PRICE.toFixed(2)})`});
    }
    if (currentNumberOfCarneiras > 0) {
        summaryItems.push({ label: "Carneiras", details: `${currentNumberOfCarneiras} unidade(s)`});
    }


    const resultItems: CalculationResultItem[] = [
      { label: 'Pedra (Estrutura Túmulo)', value: tombStructureStoneCost, details: `${totalTombStructureStoneArea.toFixed(2)}m² (R$ ${actualStonePrice.toFixed(2)}/m²)${tombType === 'cabeceira' ? ' (inclui 1m² da cabeceira)' : ''}` },
    ];

    if (pavingStoneAreaM2 > 0) {
        resultItems.push({ label: 'Pedra (Calçada)', value: pavingStoneCost, details: `${pavingStoneAreaM2.toFixed(2)}m² (R$ ${actualStonePrice.toFixed(2)}/m²)` });
    }

    if (finishPricePerMeter > 0 || finishTypeValue === 'none') {
         resultItems.push({ label: `Acabamento ${finishName}`, value: currentFinishCost, details: `${perimeter.toFixed(2)}m lineares (R$ ${finishPricePerMeter.toFixed(2)}/m)` });
    }

    if (handlesCost > 0) {
      resultItems.push({ label: 'Puxadores', value: handlesCost, details: `${currentNumberOfHandles} unidade(s) (R$ ${HANDLE_PRICE.toFixed(2)}/unid.)` });
    }
    if (veleiroCost > 0) {
      resultItems.push({ label: 'Veleiro', value: veleiroCost, details: `R$ ${VELEIRO_PRICE.toFixed(2)}` });
    }
    if (vasoCost > 0) {
      resultItems.push({ label: 'Vaso', value: vasoCost, details: `R$ ${VASO_PRICE.toFixed(2)}` });
    }
    if (carneirasCost > 0) {
      resultItems.push({ label: 'Carneiras', value: carneirasCost, details: `${currentNumberOfCarneiras} unidade(s) (R$ ${CARNEIRA_PRICE.toFixed(2)}/unid.)` });
    }

    if (tombType === 'capela') {
      const capelaStructureDetails = actualStonePrice <= CAPELA_STONE_PRICE_THRESHOLD_FOR_BASE
        ? `Estrutura com pedra até R$ ${CAPELA_STONE_PRICE_THRESHOLD_FOR_BASE.toFixed(2)}/m²`
        : `Estrutura proporcional com pedra a R$ ${actualStonePrice.toFixed(2)}/m²`;
      resultItems.push({ label: 'Capela (Estrutura)', value: capelaStructureCost, details: capelaStructureDetails });
      resultItems.push({ label: 'Capela (Vidro)', value: capelaGlassCost, details: 'Valor fixo' });
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
                <Label htmlFor="tumulo-tomb-type" className="text-sm font-medium">Tipo de Estrutura Adicional</Label>
                <Select value={tombType} onValueChange={(val) => {setTombType(val as TombStructureType); setResults(null);}}>
                  <SelectTrigger id="tumulo-tomb-type" className="w-full mt-1">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="cabeceira">Cabeceira (adiciona 1m² de pedra)</SelectItem>
                    <SelectItem value="capela">Capela</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <NumberInputStepper
                id="tumulo-carneiras"
                label="Número de Carneiras (Opcional)"
                unit="unid."
                value={numberOfCarneiras}
                onValueChange={(val) => {setNumberOfCarneiras(val); setResults(null);}}
                min={0}
                step={1}
              />
              <div className="space-y-2 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tumulo-veleiro"
                    checked={hasVeleiro}
                    onCheckedChange={(checked) => {
                      setHasVeleiro(!!checked);
                      setResults(null);
                    }}
                  />
                  <Label htmlFor="tumulo-veleiro" className="text-sm font-medium text-foreground">
                    Adicionar Veleiro (R$ {VELEIRO_PRICE.toFixed(2)})
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tumulo-vaso"
                    checked={hasVaso}
                    onCheckedChange={(checked) => {
                      setHasVaso(!!checked);
                      setResults(null);
                    }}
                  />
                  <Label htmlFor="tumulo-vaso" className="text-sm font-medium text-foreground">
                    Adicionar Vaso (R$ {VASO_PRICE.toFixed(2)})
                  </Label>
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
            <CardContent>
               <div>
                <Label htmlFor="tumulo-stone-select" className="text-sm font-medium">Valor da pedra (R$/metro quadrado)</Label>
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
                  <SelectTrigger id="tumulo-stone-select" className="w-full mt-1">
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
                      id="tumulo-custom-stone-price"
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
        <ResultsDisplay title="Resultado do Orçamento do Túmulo" results={results} />
      )}
    </div>
  );
};

export default TombstoneForm;
