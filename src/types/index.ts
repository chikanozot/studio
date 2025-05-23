
export interface Countertop {
  id: string; // Changed to string for easier unique ID generation e.g. uuid or timestamp
  length: number;
  width: number;
  finishedSides: ('top' | 'bottom' | 'left' | 'right')[];
}

export interface Cuba {
  id: string;
  type: 'pequena' | 'media' | 'grande';
  price: number;
  name: string;
}

export interface SoleiraItem {
  id: string;
  type: 'soleira' | 'pingadeira';
  length: number;
  width: number;
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
