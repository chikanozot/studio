
"use client";

import type { FC } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumberInputStepperProps {
  id: string;
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number; // Step remains for potential direct input validation or future use if buttons are re-added
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
  step = 1, // Keep step for consistency and potential direct input validation
  unit,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let numericValue = parseFloat(e.target.value);
    if (isNaN(numericValue)) {
      // If input is not a number, or empty, reset to min or 0 if min is not defined
      numericValue = min; 
    }
    // Apply min/max constraints
    if (max !== undefined && numericValue > max) numericValue = max;
    if (numericValue < min) numericValue = min;
    
    onValueChange(numericValue);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Ensure that on blur, if the field is empty or invalid, it resets to a valid number (e.g., min)
    let numericValue = parseFloat(e.target.value);
    if (isNaN(numericValue) || e.target.value === '') {
      onValueChange(min);
    } else {
      // Re-apply constraints on blur in case something bypassed onChange
      if (max !== undefined && numericValue > max) numericValue = max;
      if (numericValue < min) numericValue = min;
      onValueChange(numericValue);
    }
  };


  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {unit && `(${unit})`}
      </Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur} // Add onBlur to handle empty or invalid states
        min={min}
        max={max}
        step={step} // step attribute can help with browser's native number input behavior
        className="w-full h-10" // Removed text-center as it's less relevant without buttons
        disabled={disabled}
        aria-label={label}
        placeholder={`Min: ${min}${max !== undefined ? ', Max: ' + max : ''}`}
      />
    </div>
  );
};

export default NumberInputStepper;
