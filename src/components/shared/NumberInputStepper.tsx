
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface NumberInputStepperProps {
  id: string;
  label: string;
  value: number | null; // Allow null for empty state
  onValueChange: (value: number | null) => void; // Allow null for empty state
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
  min = 0, // Default min to 0, adjust as needed per usage
  max,
  step = 1,
  unit,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState<string>(value === null ? "" : String(value));

  useEffect(() => {
    // This effect synchronizes the input field when the `value` prop changes externally.
    if (value === null) {
      if (inputValue !== "") { // Only update if inputValue isn't already empty
        setInputValue("");
      }
    } else {
      const currentNumericInputValue = parseFloat(inputValue);
      // Update inputValue if the numeric value of the input doesn't match the prop value,
      // or if the input is not a number (e.g., was just cleared by user).
      if (value !== currentNumericInputValue || isNaN(currentNumericInputValue)) {
        setInputValue(String(value));
      }
    }
  }, [value]); // Only react to external `value` prop changes.

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value); // Allow any string input temporarily
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const trimmedValue = inputValue.trim();

    if (trimmedValue === '') {
      setInputValue(""); 
      onValueChange(null); 
      return;
    }

    let numericValue = parseFloat(trimmedValue);

    if (isNaN(numericValue)) {
      setInputValue(""); 
      onValueChange(null);
      return;
    }

    // Apply min/max clamping
    if (min !== undefined && numericValue < min) numericValue = min;
    if (max !== undefined && numericValue > max) numericValue = max;
    
    // Optional: step validation (rounding to nearest step)
    // if (step) numericValue = Math.round(numericValue / step) * step;

    setInputValue(String(numericValue));
    onValueChange(numericValue);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {unit && `(${unit})`}
      </Label>
      <Input
        id={id}
        type="number"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        // Do not pass step to native input if we handle it manually, or pass if desired
        // step={step} // Browser might interfere with manual step logic on blur
        className="w-full h-10"
        disabled={disabled}
        aria-label={label}
        placeholder={min !== undefined ? `Mín: ${min}${max !== undefined ? ', Máx: ' + max : ''}` : ''}
      />
    </div>
  );
};

export default NumberInputStepper;
