
"use client";

import type { FC } from 'react';
import type { WashbasinItem as WashbasinItemType, WashbasinCalculationType, FinishedSide } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, GripVertical } from "lucide-react";
import NumberInputStepper from "@/components/shared/NumberInputStepper";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Input } from '@/components/ui/input'; // Not needed here anymore for finish price
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface WashbasinItemProps {
  item: WashbasinItemType;
  index: number;
  onUpdate: (id: string, updates: Partial<WashbasinItemType>) => void;
  onRemove: (id: string) => void;
  finishPrice: number; // Receives the derived global finish price
  // onFinishPriceChange prop is removed as the logic is now global in WashbasinForm
}

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

const WashbasinItem: FC<WashbasinItemProps> = ({
  item,
  index,
  onUpdate,
  onRemove,
  finishPrice, // Consumes the globally determined finish price
}) => {

  const handleDimensionChange = (field: 'length' | 'width', value: number) => {
    onUpdate(item.id, { [field]: value });
  };

  const handleCalculationTypeChange = (value: WashbasinCalculationType) => {
    onUpdate(item.id, {
      calculationType: value,
    });
  };

  const toggleSide = (side: FinishedSide) => {
    const newFinishedSides = item.finishedSides.includes(side)
      ? item.finishedSides.filter(s => s !== side)
      : [...item.finishedSides, side];
    onUpdate(item.id, { finishedSides: newFinishedSides });
  };

  const handleWallSupportChange = (checked: boolean) => {
    onUpdate(item.id, { hasWallSupport: checked });
  };

  return (
    <Card className="mb-4 bg-secondary/30 shadow-sm fade-in-animation">
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-primary">
             <GripVertical className="inline h-4 w-4 mr-1 text-muted-foreground" /> Lavatório {index + 1}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)} className="text-destructive hover:text-destructive/80">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remover Lavatório</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div>
          <Label htmlFor={`lavatorio-${item.id}-calculation-type`} className="text-sm font-medium">Tipo de Cálculo</Label>
          <Select
            value={item.calculationType}
            onValueChange={handleCalculationTypeChange}
          >
            <SelectTrigger id={`lavatorio-${item.id}-calculation-type`} className="w-full mt-1">
              <SelectValue placeholder="Selecione o tipo de cálculo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sem_cuba">Sem Cuba</SelectItem>
              <SelectItem value="cuba_esculpida">Cuba Esculpida</SelectItem>
              <SelectItem value="cuba_embutida">Cuba Embutida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <NumberInputStepper
          id={`lavatorio-${item.id}-length`}
          label="Comprimento da bancada"
          unit="cm"
          value={item.length}
          onValueChange={(val) => handleDimensionChange('length', val)}
          min={10}
        />
        <NumberInputStepper
          id={`lavatorio-${item.id}-width`}
          label="Largura da bancada"
          unit="cm"
          value={item.width}
          onValueChange={(val) => handleDimensionChange('width', val)}
          min={10}
        />

        <>
          <div>
            <p className="text-sm font-medium mb-2 text-foreground">Lados da bancada com acabamento:</p>
            <p className="text-xs text-muted-foreground mb-1">Usado para calcular acabamento da bancada, rodapés e saia.</p>
            <p className="text-xs text-muted-foreground mb-2">O valor do acabamento (R$ {finishPrice.toFixed(2)}/m) é definido nas Configurações Globais.</p>
            <div className="flex justify-center">
              <div className="grid grid-cols-3 grid-rows-3 gap-1 w-[180px] h-[120px]">
                <div />
                <SideButton
                  label="Superior"
                  dimension={item.length}
                  isSelected={item.finishedSides.includes('top')}
                  onClick={() => toggleSide('top')}
                  orientation="horizontal"
                  className="col-span-1 row-start-1 col-start-2"
                />
                <div />
                <SideButton
                  label="Esquerdo"
                  dimension={item.width}
                  isSelected={item.finishedSides.includes('left')}
                  onClick={() => toggleSide('left')}
                  orientation="vertical"
                  className="row-start-2 col-start-1"
                />
                <div className="flex items-center justify-center border border-muted rounded-md bg-background text-xs text-muted-foreground row-start-2 col-start-2">
                  Bancada
                </div>
                <SideButton
                  label="Direito"
                  dimension={item.width}
                  isSelected={item.finishedSides.includes('right')}
                  onClick={() => toggleSide('right')}
                  orientation="vertical"
                  className="row-start-2 col-start-3"
                />
                <div />
                <SideButton
                  label="Inferior"
                  dimension={item.length}
                  isSelected={item.finishedSides.includes('bottom')}
                  onClick={() => toggleSide('bottom')}
                  orientation="horizontal"
                  className="col-span-1 row-start-3 col-start-2"
                />
                <div />
              </div>
            </div>
          </div>

          <NumberInputStepper
            id={`lavatorio-${item.id}-skirt-height`}
            label="Altura da saia (Opcional)"
            unit="cm"
            value={item.skirtHeight}
            onValueChange={(val) => onUpdate(item.id, { skirtHeight: val })}
            min={0}
          />

          <h3 className="text-md font-medium pt-2 text-foreground">Rodapés (Opcional)</h3>
          <NumberInputStepper
            id={`lavatorio-${item.id}-top-molding-width`}
            label="Rodapé em cima da bancada (largura)"
            unit="cm"
            value={item.topMoldingWidth}
            onValueChange={(val) => onUpdate(item.id, { topMoldingWidth: val })}
            min={0}
          />
          <NumberInputStepper
            id={`lavatorio-${item.id}-bottom-molding-width`}
            label="Rodapé embaixo do móvel (largura)"
            unit="cm"
            value={item.bottomMoldingWidth}
            onValueChange={(val) => onUpdate(item.id, { bottomMoldingWidth: val })}
            min={0}
          />
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id={`lavatorio-${item.id}-wall-support`}
              checked={item.hasWallSupport}
              onCheckedChange={handleWallSupportChange}
            />
            <Label htmlFor={`lavatorio-${item.id}-wall-support`} className="text-sm font-medium text-foreground">
              Incluir suporte de parede (R$ 70,00)
            </Label>
          </div>
        </>

      </CardContent>
    </Card>
  );
};

export default WashbasinItem;
