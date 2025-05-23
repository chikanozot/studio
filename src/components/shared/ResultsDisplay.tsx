"use client";

import type { FC } from 'react';
import type { CalculationResults, CalculationResultItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ResultsDisplayProps {
  title: string;
  results: CalculationResults | null;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const ResultItem: FC<{ item: CalculationResultItem }> = ({ item }) => (
  <div className={`flex justify-between py-2 ${item.isTotal ? 'border-t pt-3 mt-2' : ''}`}>
    <span className={item.isTotal ? 'font-semibold text-lg' : 'text-sm'}>
      {item.label}
      {item.details && <span className="text-xs text-muted-foreground ml-1">{item.details}</span>}
    </span>
    <span className={item.isTotal ? 'font-bold text-lg text-primary' : 'font-medium text-sm'}>
      {typeof item.value === 'number' ? formatCurrency(item.value) : item.value}
    </span>
  </div>
);

const ResultsDisplay: FC<ResultsDisplayProps> = ({ title, results }) => {
  if (!results) {
    return null;
  }

  return (
    <Card className="mt-8 shadow-md fade-in-animation">
      <CardHeader>
        <CardTitle className="text-xl text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.summary && results.summary.length > 0 && (
          <div className="border-b pb-4 mb-4">
            <h3 className="font-semibold text-md mb-2 text-foreground/80">Detalhes dos Itens</h3>
            {results.summary.map((item, index) => (
              <div key={index} className="mb-2 text-sm">
                <p><span className="font-medium">{item.label}:</span> {item.details}</p>
              </div>
            ))}
          </div>
        )}
        {results.items.map((item, index) => (
          <ResultItem key={index} item={item} />
        ))}
      </CardContent>
    </Card>
  );
};

export default ResultsDisplay;
