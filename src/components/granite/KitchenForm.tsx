
"use client";

import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';

const cubaOptions: Omit<Cuba, 'id'>[] = [
  { type: 'pequena', name: 'Pequena', price: 230 },
  { type: 'media', name: 'Média', price: 240 },
  { type: 'grande', name: 'Grande', price: 240 },
];

const generateId = () => crypto.randomUUID();
const WALL_SUPPORT_PRICE = 70;
const REBAIXO_ITALIANO_PRICE_PER_METER = 1200;

const KitchenForm: FC = () => {
  const [countertops, setCountertops] = useState<Countertop[]>([]);
  const [cubas, setCubas] = useState<Cuba[]>([]);

  const [stonePrice, setStonePrice] = useState<number | null>(null);
  const [skirtHeight, setSkirtHeight] = useState<number | null>(null);
  const [finishPriceOption, setFinishPriceOption] = useState<string>("80");
  const [customFinishPrice, setCustomFinishPrice] = useState<number | null>(null);
  const [topMoldingWidth, setTopMoldingWidth] = useState<number | null>(null);
  const [bottomMoldingWidth, setBottomMoldingWidth] = useState<number | null>(null);
  const [additionalBottomMoldingLength, setAdditionalBottomMoldingLength] = useState<number | null>(null);

  const [hasRebaixoItaliano, setHasRebaixoItaliano] = useState<boolean>(false);
  const [rebaixoItalianoLength, setRebaixoItalianoLength] = useState<number | null>(null);

  const [results, setResults] = useState<CalculationResults | null>(null);

  useEffect(() => {
    if (countertops.length === 0) {
      addCountertop();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const derivedFinishPrice = useMemo(() => {
    if (finishPriceOption === 'other') {
      return customFinishPrice === null ? 0 : customFinishPrice;
    }
    return parseFloat(finishPriceOption) || 0;
  }, [finishPriceOption, customFinishPrice]);

  const addCountertop = () => {
    setCountertops(prev => [...prev, { id: generateId(), length: null, width: null, finishedSides: [], hasWallSupport: false }]);
    setResults(null);
  };

  const updateCountertop = (id: string, updates: Partial<Countertop>) => {
    setCountertops(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    setResults(null);
  };

  const removeCountertop = (id: string) => {
    setCountertops(prev => prev.filter(c => c.id !== id));
    setResults(null);
  };

  const addCuba = (type: 'pequena' | 'media' | 'grande') => {
    const cubaOption = cubaOptions.find(c => c.type === type);
    if (cubaOption) {
      setCubas(prev => [...prev, { ...cubaOption, id: generateId() }]);
    }
    setResults(null);
  };

  const removeCuba = (id: string) => {
    setCubas(prev => prev.filter(c => c.id !== id));
    setResults(null);
  };

  const handleCalculation = () => {
    if (countertops.length === 0) {
      alert('Adicione pelo menos um balcão para calcular o orçamento.');
      return;
    }
    const currentStonePrice = stonePrice === null ? 0 : stonePrice;
    if (currentStonePrice <= 0) {
      alert('Informe o valor da pedra para continuar.');
      return;
    }
    if (derivedFinishPrice <= 0 && countertops.some(c => c.finishedSides.length > 0) ) {
      alert('Informe o valor do acabamento, pois há lados com acabamento selecionados.');
      return;
    }

    const finishPriceValue = derivedFinishPrice;
    const currentSkirtHeight = skirtHeight === null ? 0 : skirtHeight;
    const currentTopMoldingWidth = topMoldingWidth === null ? 0 : topMoldingWidth;
    const currentBottomMoldingWidth = bottomMoldingWidth === null ? 0 : bottomMoldingWidth;
    const currentRebaixoLength = rebaixoItalianoLength === null ? 0 : rebaixoItalianoLength;
    const currentAdditionalBottomMoldingLength = additionalBottomMoldingLength === null ? 0 : additionalBottomMoldingLength;

    let totalStoneLinearLength = 0;
    countertops.forEach(c => {
      totalStoneLinearLength += (c.length === null ? 0 : c.length / 100);
    });
    const stoneCost = totalStoneLinearLength * currentStonePrice;

    let totalFinishLength = 0;
    countertops.forEach(c => {
      const cLength = c.length === null ? 0 : c.length / 100;
      const cWidth = c.width === null ? 0 : c.width / 100;
      if (c.finishedSides.includes('top')) totalFinishLength += cLength;
      if (c.finishedSides.includes('bottom')) totalFinishLength += cLength;
      if (c.finishedSides.includes('left')) totalFinishLength += cWidth;
      if (c.finishedSides.includes('right')) totalFinishLength += cWidth;
    });
    const finishCost = totalFinishLength * finishPriceValue;

    const skirtCost = currentSkirtHeight > 0 ? (currentSkirtHeight / 100) * totalFinishLength * currentStonePrice : 0;

    let moldingCost = 0;
    let topMoldingLengthForCalc = 0;
    let bottomMoldingLengthForCalc = 0;
    let bottomMoldingSurcharge = 1.3; // 30% surcharge

    if (currentTopMoldingWidth > 0) {
      countertops.forEach(c => {
        const cLength = c.length === null ? 0 : c.length / 100;
        const cWidth = c.width === null ? 0 : c.width / 100;
        const allSides: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
        allSides.forEach(side => {
          if (!c.finishedSides.includes(side)) { // Rodapé superior em lados SEM acabamento
            if (side === 'top' || side === 'bottom') {
              if (cLength > 0) topMoldingLengthForCalc += cLength;
            } else {
              if (cWidth > 0) topMoldingLengthForCalc += cWidth;
            }
          }
        });
      });
      if (topMoldingLengthForCalc > 0) {
        const topMoldingArea = topMoldingLengthForCalc * (currentTopMoldingWidth / 100);
        moldingCost += topMoldingArea * currentStonePrice;
      }
    }

    let baseBottomMoldingArea = 0;
    let baseBottomMoldingCost = 0;
    if (currentBottomMoldingWidth > 0) {
      countertops.forEach(c => {
        const cLength = c.length === null ? 0 : c.length / 100;
        const cWidth = c.width === null ? 0 : c.width / 100;
        c.finishedSides.forEach(side => { // Rodapé inferior em lados COM acabamento
          if (side === 'top' || side === 'bottom') {
            if (cLength > 0) bottomMoldingLengthForCalc += cLength;
          } else {
            if (cWidth > 0) bottomMoldingLengthForCalc += cWidth;
          }
        });
      });
      if (bottomMoldingLengthForCalc > 0) {
        baseBottomMoldingArea = bottomMoldingLengthForCalc * (currentBottomMoldingWidth / 100);
        baseBottomMoldingCost = (baseBottomMoldingArea * currentStonePrice) * bottomMoldingSurcharge;
        moldingCost += baseBottomMoldingCost;
      }
    }

    let additionalBottomMoldingCost = 0;
    let additionalBottomMoldingArea = 0;
    if (currentBottomMoldingWidth > 0 && currentAdditionalBottomMoldingLength > 0) {
      additionalBottomMoldingArea = (currentAdditionalBottomMoldingLength / 100) * (currentBottomMoldingWidth / 100);
      additionalBottomMoldingCost = (additionalBottomMoldingArea * currentStonePrice) * bottomMoldingSurcharge;
      moldingCost += additionalBottomMoldingCost;
    }

    const cubasCost = cubas.reduce((acc, cuba) => acc + cuba.price, 0);

    let wallSupportCost = 0;
    let supportedCountertopsCount = 0;
    countertops.forEach(c => {
      if (c.hasWallSupport) {
        wallSupportCost += WALL_SUPPORT_PRICE;
        supportedCountertopsCount++;
      }
    });

    let rebaixoItalianoCost = 0;
    if (hasRebaixoItaliano && currentRebaixoLength > 0) {
      rebaixoItalianoCost = currentRebaixoLength * REBAIXO_ITALIANO_PRICE_PER_METER;
    }

    const totalCost = stoneCost + finishCost + skirtCost + moldingCost + cubasCost + wallSupportCost + rebaixoItalianoCost;

    const resultItems: CalculationResultItem[] = [];
    resultItems.push({ label: 'Pedra', value: stoneCost, details: `${totalStoneLinearLength.toFixed(2)}m linear` });
    if (totalFinishLength > 0) {
        resultItems.push({ label: 'Acabamento', value: finishCost, details: `${totalFinishLength.toFixed(2)}m linear (R$ ${finishPriceValue.toFixed(2)}/m)` });
    }
    if (currentSkirtHeight > 0 && totalFinishLength > 0) {
      resultItems.push({ label: 'Saia', value: skirtCost, details: `${currentSkirtHeight}cm altura, ${totalFinishLength.toFixed(2)}m comp.` });
    }

    const moldingDetailsParts: string[] = [];
    if (currentTopMoldingWidth > 0 && topMoldingLengthForCalc > 0) {
      moldingDetailsParts.push(`Superior ${currentTopMoldingWidth}cm (${topMoldingLengthForCalc.toFixed(2)}m s/ acab.)`);
    }
    if (currentBottomMoldingWidth > 0 && bottomMoldingLengthForCalc > 0) {
      moldingDetailsParts.push(`Inferior ${currentBottomMoldingWidth}cm (${bottomMoldingLengthForCalc.toFixed(2)}m c/ acab., área ${baseBottomMoldingArea.toFixed(3)}m², custo R$ ${baseBottomMoldingCost.toFixed(2)}, acréscimo 30%)`);
    }
    if (currentBottomMoldingWidth > 0 && currentAdditionalBottomMoldingLength > 0 && additionalBottomMoldingArea > 0) {
        moldingDetailsParts.push(`Adicional Rodapé Inferior: ${currentAdditionalBottomMoldingLength}cm comp. (largura ${currentBottomMoldingWidth}cm, área ${additionalBottomMoldingArea.toFixed(3)}m², custo R$ ${additionalBottomMoldingCost.toFixed(2)}, acréscimo 30%)`);
    }

    if (moldingDetailsParts.length > 0) {
      resultItems.push({ label: 'Rodapés', value: moldingCost, details: moldingDetailsParts.join('; ') });
    }

    if (cubas.length > 0) {
      resultItems.push({ label: `Cubas (${cubas.length})`, value: cubasCost });
    }

    if (wallSupportCost > 0) {
      resultItems.push({ label: 'Suportes de Parede', value: wallSupportCost, details: `${supportedCountertopsCount} balcão(ões)` });
    }

    if (rebaixoItalianoCost > 0) {
      resultItems.push({ label: 'Rebaixo Italiano', value: rebaixoItalianoCost, details: `${currentRebaixoLength.toFixed(2)}m linear (R$ ${REBAIXO_ITALIANO_PRICE_PER_METER.toFixed(2)}/m)` });
    }

    resultItems.push({ label: 'Total', value: totalCost, isTotal: true });

    const summaryItems: CalculationResultItem[] = countertops.map((c, i) => {
      const cLength = c.length === null ? 0 : c.length;
      const cWidth = c.width === null ? 0 : c.width;
      const finishDetails = c.finishedSides.length > 0 ? c.finishedSides.map(s => {
        if (s === 'top' || s === 'bottom') return `${cLength}cm (${s})`;
        return `${cWidth}cm (${s})`;
      }).join(', ') : 'Nenhum';
      const supportDetail = c.hasWallSupport ? 'Com suporte.' : 'Sem suporte.';
      return {
        label: `Balcão ${i + 1}`,
        details: `${cLength}cm x ${cWidth}cm. Acabamento: ${finishDetails}. ${supportDetail}`,
      }
    });
    if (hasRebaixoItaliano && currentRebaixoLength > 0) {
      summaryItems.push({ label: 'Rebaixo Italiano', details: `${currentRebaixoLength.toFixed(2)}m linear` });
    }


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
               <NumberInputStepper
                id="stone-price"
                label="Valor da pedra (R$/metro linear)"
                unit="R$"
                value={stonePrice}
                onValueChange={(val) => {setStonePrice(val); setResults(null);}}
                min={0}
                step={0.01}
              />
               <div>
                <Label htmlFor="finish-price-option" className="text-sm font-medium">Valor do acabamento por metro linear</Label>
                <Select value={finishPriceOption} onValueChange={(value) => {setFinishPriceOption(value); setCustomFinishPrice(null); setResults(null);}}>
                  <SelectTrigger id="finish-price-option" className="w-full mt-1">
                    <SelectValue placeholder="Selecione o valor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="80">R$ 80,00</SelectItem>
                    <SelectItem value="40">R$ 40,00</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
                {finishPriceOption === 'other' && (
                  <div className="mt-2">
                    <NumberInputStepper
                        id="custom-finish-price"
                        label="Valor personalizado do acabamento"
                        unit="R$"
                        value={customFinishPrice}
                        onValueChange={(val) => {setCustomFinishPrice(val); setResults(null);}}
                        min={0}
                        step={0.01}
                    />
                  </div>
                )}
              </div>
              <NumberInputStepper
                id="skirt-height"
                label="Altura da saia"
                unit="cm"
                value={skirtHeight}
                onValueChange={(val) => {setSkirtHeight(val); setResults(null);}}
                min={0}
              />
              <h3 className="text-lg font-medium pt-2 text-foreground">Rodapés (Opcional)</h3>
              <NumberInputStepper
                id="top-molding-width"
                label="Rodapé em cima do balcão (largura)"
                unit="cm"
                value={topMoldingWidth}
                onValueChange={(val) => {setTopMoldingWidth(val); setResults(null);}}
                min={0}
              />
              <NumberInputStepper
                id="bottom-molding-width"
                label="Rodapé embaixo do móvel (largura)"
                unit="cm"
                value={bottomMoldingWidth}
                onValueChange={(val) => {setBottomMoldingWidth(val); setResults(null);}}
                min={0}
              />
              {bottomMoldingWidth !== null && bottomMoldingWidth > 0 && (
                <NumberInputStepper
                  id="additional-bottom-molding-length"
                  label="Comprimento Adicional Rodapé Embaixo do Móvel"
                  unit="cm"
                  value={additionalBottomMoldingLength}
                  onValueChange={(val) => {setAdditionalBottomMoldingLength(val); setResults(null);}}
                  min={0}
                />
              )}
              <div className="pt-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rebaixo-italiano-checkbox"
                    checked={hasRebaixoItaliano}
                    onCheckedChange={(checked) => {
                      const isChecked = typeof checked === 'boolean' ? checked : false;
                      setHasRebaixoItaliano(isChecked);
                      if (!isChecked) {
                        setRebaixoItalianoLength(null);
                      }
                      setResults(null);
                    }}
                  />
                  <Label htmlFor="rebaixo-italiano-checkbox" className="text-sm font-medium text-foreground">
                    Incluir Rebaixo Italiano (R$ {REBAIXO_ITALIANO_PRICE_PER_METER.toFixed(2)}/m linear)
                  </Label>
                </div>
                {hasRebaixoItaliano && (
                  <NumberInputStepper
                    id="rebaixo-italiano-length"
                    label="Comprimento do Rebaixo Italiano"
                    unit="m"
                    value={rebaixoItalianoLength}
                    onValueChange={(val) => {setRebaixoItalianoLength(val); setResults(null);}}
                    min={0.01}
                    step={0.01}
                  />
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
        <ResultsDisplay title="Resultado do Orçamento da Cozinha" results={results} />
      )}
    </div>
  );
};

export default KitchenForm;
