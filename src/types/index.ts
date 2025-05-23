
export interface Countertop {
  id: string; // Changed to string for easier unique ID generation e.g. uuid or timestamp
  length: number;
  width: number;
  finishedSides: ('top' | 'bottom' | 'left' | 'right')[];
}

export interface Cuba {
  id:string;
  type: 'pequena' | 'media' | 'grande';
  price: number;
  name: string;
}

export interface SoleiraItem {
  id: string;
  type: 'soleira' | 'pingadeira';
  length: number;
  width: number;
  finishType: 'none' | 'one_side' | 'two_sides';
}

export type WashbasinCalculationType = 'sem_cuba' | 'cuba_esculpida' | 'cuba_embutida';

export type FinishedSide = 'top' | 'bottom' | 'left' | 'right';

export interface WashbasinFormData {
  calculationType: WashbasinCalculationType;
  length: number;
  width: number;
  stonePrice: number; // Can be per m² or per linear meter depending on calculationType
  
  // Specific to "Sem Cuba"
  skirtHeight?: number;
  topMoldingWidth?: number;
  bottomMoldingWidth?: number;
  finishedSides?: FinishedSide[];
  finishPrice?: number; // Price per linear meter for finish

  // Specific to "Cuba Esculpida" & "Cuba Embutida"
  // No extra fields needed beyond type differentiation, constants will be used.
}

export interface CalculationResultItem {
  label: string;
  value: string | number;
  isTotal?: boolean;
  details?: string;
}

export interface CalculationResults {
  items: CalculationResultItem[];
  summary?: CalculationResultItem[];
}
