
export interface Countertop {
  id: string; // Changed to string for easier unique ID generation e.g. uuid or timestamp
  length: number;
  width: number;
  finishedSides: ('top' | 'bottom' | 'left' | 'right')[];
  hasWallSupport?: boolean; // Added for wall support option
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

export interface WashbasinItem {
  id: string;
  calculationType: WashbasinCalculationType;
  length: number;
  width: number;
  
  // Specific to "Sem Cuba"
  skirtHeight: number; // Made non-optional for "Sem Cuba" context, assuming default 0
  topMoldingWidth: number; // Made non-optional
  bottomMoldingWidth: number; // Made non-optional
  finishedSides: FinishedSide[];
  hasWallSupport: boolean; // Made non-optional
}

// This FormData might be less used directly if all global settings are in WashbasinForm state
export interface WashbasinFormData {
  items: WashbasinItem[];
  stonePrice: number; // Can be per m² or per linear meter depending on calculationType
  finishPrice: number; // Price per linear meter for finish (relevant for "Sem Cuba")
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
