
"use client";

import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [inputValue, setInputValue] = useState<string>(String(value));

  useEffect(() => {
    // Update inputValue if the external value prop changes and differs from
    // what inputValue currently represents or would parse to.
    // This handles external state updates (e.g., form resets).
    const currentNumericInputValue = parseFloat(inputValue);
    if (value !== currentNumericInputValue) {
      // If `value` is different from parsed `inputValue`, or if `inputValue` is not a number
      // (e.g. empty or "abc") and `value` has changed, then update `inputValue`.
      if (isNaN(currentNumericInputValue) || value !== currentNumericInputValue) {
         setInputValue(String(value));
      }
    } else if (inputValue === '' && value === min) {
      // Handles case where input was cleared, blurred, reset to min,
      // and we need to ensure inputValue reflects this min.
      setInputValue(String(value));
    }
  }, [value, min]); // Note: `inputValue` is not in dependency array to avoid loops with internal updates.

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value); // Allow any string input temporarily
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let numericValue = parseFloat(inputValue);

    if (inputValue.trim() === '' || isNaN(numericValue)) {
      numericValue = min; // Reset to min if empty or NaN
    } else {
      if (max !== undefined && numericValue > max) numericValue = max;
      if (numericValue < min) numericValue = min;
    }
    
    // Ensure that the final value is a valid number according to step if necessary
    // For simplicity, we're not enforcing step validation strictly on blur here,
    // but it could be added if required: numericValue = Math.round(numericValue / step) * step;

    onValueChange(numericValue);
    // Update inputValue to reflect the validated and possibly corrected numeric value
    // This ensures the input field shows the canonical value after blur.
    setInputValue(String(numericValue)); 
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label} {unit && `(${unit})`}
      </Label>
      <Input
        id={id}
        type="number" // Keeps numeric keyboard on mobile and basic browser number handling
        value={inputValue} // Bind to local string state
        onChange={handleChange}
        onBlur={handleBlur}
        step={step}
        className="w-full h-10"
        disabled={disabled}
        aria-label={label}
        placeholder={`Min: ${min}${max !== undefined ? ', Max: ' + max : ''}`}
      />
    </div>
  );
};

export default NumberInputStepper;
