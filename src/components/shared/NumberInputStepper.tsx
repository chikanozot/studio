"use client";

import type { FC } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Minus, Plus } from "lucide-react";

interface NumberInputStepperProps {
  id: string;
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
}

const NumberInputStepper: FC<NumberInputStepperProps> = ({
  id,
  label,
  value,
  onValueChange,
  min = 0,
  max,
  step = 1,
  unit,
  disabled = false,
}) => {
  const handleIncrement = () => {
    const newValue = Math.min(value + step, max === undefined ? Infinity : max);
    onValueChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min);
    onValueChange(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numericValue = parseFloat(e.target.value);
    if (isNaN(numericValue)) {
      numericValue = min;
    }
    if (max !== undefined && numericValue > max) numericValue = max;
    if (numericValue < min) numericValue = min;
    onValueChange(numericValue);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {unit && `(${unit})`}
      </Label>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="h-10 w-10 shrink-0"
          aria-label={`Diminuir ${label}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          id={id}
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="w-full text-center h-10"
          disabled={disabled}
          aria-label={label}
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && value >= max)}
          className="h-10 w-10 shrink-0"
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default NumberInputStepper;
