"use client";

import type { FC } from 'react';
import type { SoleiraItem } from '@/types';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import NumberInputStepper from "@/components/shared/NumberInputStepper";

interface ThresholdItemProps {
  item: SoleiraItem;
  index: number;
  onUpdate: (id: string, updates: Partial<SoleiraItem>) => void;
  onRemove: (id: string) => void;
}

const ThresholdItem: FC<ThresholdItemProps> = ({ item, index, onUpdate, onRemove }) => {
  const handleDimensionChange = (field: 'length' | 'width', value: number) => {
    onUpdate(item.id, { [field]: value });
  };

  const itemTypeName = item.type === 'soleira' ? 'Soleira' : 'Pingadeira';

  return (
    <Card className="mb-4 bg-secondary/30 shadow-sm fade-in-animation">
      <CardHeader className="py-3 px-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium text-primary">{itemTypeName} {index + 1}</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)} className="text-destructive hover:text-destructive/80">
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Remover Item</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <NumberInputStepper
            id={`threshold-${item.id}-length`}
            label="Comprimento"
            unit="cm"
            value={item.length}
            onValueChange={(val) => handleDimensionChange('length', val)}
            min={1}
          />
          <NumberInputStepper
            id={`threshold-${item.id}-width`}
            label="Largura"
            unit="cm"
            value={item.width}
            onValueChange={(val) => handleDimensionChange('width', val)}
            min={1}
          />
        </div>
         {item.type === 'pingadeira' && (
            <p className="text-xs text-muted-foreground">Largura efetiva para cálculo: {item.width + 2}cm (inclui 2cm para pingadeira)</p>
          )}
      </CardContent>
    </Card>
  );
};

export default ThresholdItem;
