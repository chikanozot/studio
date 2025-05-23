
"use client";

import type { FC } from 'react';
import type { Countertop } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Trash2, GripVertical } from "lucide-react";
import NumberInputStepper from "@/components/shared/NumberInputStepper";
import { cn } from '@/lib/utils';

interface CountertopItemProps {
  countertop: Countertop;
  index: number;
  onUpdate: (id: string, updates: Partial<Countertop>) => void;
  onRemove: (id: string) => void;
}

const SideButton: FC<{
  label: string;
  dimension: number | null; // Allow null
  isSelected: boolean;
  onClick: () => void;
  className?: string;
  orientation: 'horizontal' | 'vertical';
}> = ({ label, dimension, isSelected, onClick, className, orientation }) => (
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
  >
    {dimension === null ? "-" : `${dimension} cm`}
  </Button>
);


const CountertopItem: FC<CountertopItemProps> = ({ countertop, index, onUpdate, onRemove }) => {
  const handleDimensionChange = (field: 'length' | 'width', value: number | null) => {
    onUpdate(countertop.id, { [field]: value });
  };

  const toggleSide = (side: 'top' | 'bottom' | 'left' | 'right') => {
    const newFinishedSides = countertop.finishedSides.includes(side)
      ? countertop.finishedSides.filter(s => s !== side)
      : [...countertop.finishedSides, side];
    onUpdate(countertop.id, { finishedSides: newFinishedSides });
  };

  const handleWallSupportChange = (checked: boolean) => {
    onUpdate(countertop.id, { hasWallSupport: checked });
  };

  return (
    <Card className="mb-4 bg-secondary/30 shadow-sm fade-in-animation">
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-primary">
            <GripVertical className="inline h-4 w-4 mr-1 text-muted-foreground" /> Balcão {index + 1}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onRemove(countertop.id)} className="text-destructive hover:text-destructive/80">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remover Balcão</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <NumberInputStepper
            id={`countertop-${countertop.id}-length`}
            label="Comprimento"
            unit="cm"
            value={countertop.length}
            onValueChange={(val) => handleDimensionChange('length', val)}
            min={10}
          />
          <NumberInputStepper
            id={`countertop-${countertop.id}-width`}
            label="Largura"
            unit="cm"
            value={countertop.width}
            onValueChange={(val) => handleDimensionChange('width', val)}
            min={10}
          />
        </div>
        <div>
          <p className="text-sm font-medium mb-2 text-foreground">Lados com acabamento:</p>
          <div className="flex justify-center">
            <div className="grid grid-cols-3 grid-rows-3 gap-1 w-[180px] h-[120px]">
              <div /> 
              <SideButton 
                label="Superior" 
                dimension={countertop.length} 
                isSelected={countertop.finishedSides.includes('top')} 
                onClick={() => toggleSide('top')}
                orientation="horizontal"
                className="col-span-1 row-start-1 col-start-2"
              />
              <div />

              <SideButton 
                label="Esquerdo" 
                dimension={countertop.width} 
                isSelected={countertop.finishedSides.includes('left')} 
                onClick={() => toggleSide('left')}
                orientation="vertical"
                className="row-start-2 col-start-1"
              />
              <div className="flex items-center justify-center border border-muted rounded-md bg-background text-xs text-muted-foreground row-start-2 col-start-2">
                Balcão
              </div>
              <SideButton 
                label="Direito" 
                dimension={countertop.width} 
                isSelected={countertop.finishedSides.includes('right')} 
                onClick={() => toggleSide('right')}
                orientation="vertical"
                className="row-start-2 col-start-3"
              />
              <div />
              <SideButton 
                label="Inferior" 
                dimension={countertop.length} 
                isSelected={countertop.finishedSides.includes('bottom')} 
                onClick={() => toggleSide('bottom')}
                orientation="horizontal"
                className="col-span-1 row-start-3 col-start-2"
              />
              <div />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id={`countertop-${countertop.id}-wall-support`}
            checked={!!countertop.hasWallSupport}
            onCheckedChange={handleWallSupportChange}
          />
          <Label htmlFor={`countertop-${countertop.id}-wall-support`} className="text-sm font-medium text-foreground">
            Incluir suporte de parede (R$ 70,00)
          </Label>
        </div>
      </CardContent>
    </Card>
  );
};

export default CountertopItem;
