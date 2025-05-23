

export interface Countertop {
  id: string;
  length: number | null;
  width: number | null;
  finishedSides: ('top' | 'bottom' | 'left' | 'right')[];
  hasWallSupport?: boolean;
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
  length: number | null;
  width: number | null;
  finishType: 'none' | 'one_side' | 'two_sides';
}

export type WashbasinCalculationType = 'sem_cuba' | 'cuba_esculpida' | 'cuba_embutida';

export type FinishedSide = 'top' | 'bottom' | 'left' | 'right';

export interface WashbasinItem {
  id: string;
  calculationType: WashbasinCalculationType;
  length: number | null;
  width: number | null;
  skirtHeight: number | null;
  topMoldingWidth: number | null;
  bottomMoldingWidth: number | null;
  finishedSides: FinishedSide[];
  hasWallSupport: boolean;
}

// This FormData might be less used directly if all global settings are in WashbasinForm state
export interface WashbasinFormData {
  items: WashbasinItem[];
  stonePrice: number | null; // Can be per m² or per linear meter depending on calculationType
  finishPrice: number | null; // Price per linear meter for finish (relevant for "Sem Cuba")
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

