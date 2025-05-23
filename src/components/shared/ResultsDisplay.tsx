
"use client";

import type { FC } from 'react';
import { useRef } from 'react';
import type { CalculationResults, CalculationResultItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

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
      {item.details && <span className="text-xs text-muted-foreground ml-1" data-result-detail="true">{item.details}</span>}
    </span>
    <span className={item.isTotal ? 'font-bold text-lg text-primary' : 'font-medium text-sm'}>
      {typeof item.value === 'number' ? formatCurrency(item.value) : item.value}
    </span>
  </div>
);

const ResultsDisplay: FC<ResultsDisplayProps> = ({ title, results }) => {
  const resultsCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  if (!results) {
    return null;
  }

  const handleSaveAsImage = async () => {
    if (!resultsCardRef.current) {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar Imagem",
        description: "Não foi possível encontrar a área do orçamento para salvar.",
      });
      return;
    }

    try {
      resultsCardRef.current.scrollIntoView({ behavior: 'instant', block: 'nearest' });
      await new Promise(resolve => setTimeout(resolve, 300)); 

      const canvas = await html2canvas(resultsCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#FFFFFF', 
        logging: true,
        onclone: (documentClone) => {
          const cardToClone = documentClone.querySelector('[data-testid="results-card-for-capture"]');
          if (cardToClone && cardToClone instanceof HTMLElement) {
            cardToClone.classList.remove('fade-in-animation');
            cardToClone.style.backgroundColor = 'white';

            const elementsToColor = cardToClone.querySelectorAll('span, p, div, h3, h5, strong, b, svg, button > svg');
            elementsToColor.forEach(el => {
              if (el instanceof HTMLElement) {
                if (['SPAN', 'P', 'DIV', 'H3', 'H5', 'STRONG', 'B'].includes(el.tagName)) {
                   el.style.setProperty('color', 'black', 'important');
                   el.style.webkitTextFillColor = 'black'; 
                }
              }
              if (el instanceof SVGElement) {
                el.style.setProperty('fill', 'black', 'important');
                el.style.setProperty('stroke', 'black', 'important'); 

                el.querySelectorAll('*').forEach(svgChild => {
                    if (svgChild instanceof SVGElement) {
                        svgChild.style.setProperty('fill', 'black', 'important');
                        svgChild.style.setProperty('stroke', 'black', 'important');
                    }
                });
              }
            });

            // Hide specific detail spans in the cloned document
            const detailSpans = cardToClone.querySelectorAll('[data-result-detail="true"]');
            detailSpans.forEach(span => {
              if (span instanceof HTMLElement) {
                span.style.display = 'none';
              }
            });
          }

          const clonedSaveButton = documentClone.querySelector('[data-save-button="true"]');
          if (clonedSaveButton && clonedSaveButton instanceof HTMLElement) {
            clonedSaveButton.style.display = 'none';
          }
        }
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      
      const date = new Date().toISOString().split('T')[0]; 
      const safeTitle = title.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/_$/, '');
      link.download = `orcamento_${safeTitle}_${date}.png`;
      
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Orçamento Salvo!",
        description: "A imagem do orçamento foi baixada.",
      });
    } catch (error) {
      console.error("Erro ao salvar imagem do orçamento:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Salvar Imagem",
        description: "Ocorreu um problema ao tentar gerar a imagem do orçamento. Verifique o console para detalhes.",
      });
    }
  };

  return (
    <Card 
      className="mt-8 shadow-md fade-in-animation" 
      ref={resultsCardRef} 
      data-testid="results-card-for-capture"
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl text-primary">{title}</CardTitle>
        <Button variant="outline" size="sm" onClick={handleSaveAsImage} data-save-button="true">
          <Download className="mr-2 h-4 w-4" />
          Salvar como Imagem
        </Button>
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
