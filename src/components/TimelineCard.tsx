import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Eye, XCircle, ArrowLeft, AlertTriangle } from 'lucide-react';

interface TimelineItem {
  status: string;
  data: string;
  observacao?: string;
}

interface TimelineCardProps {
  items: TimelineItem[];
  getStatusConfig: (status: string) => any;
}

const TimelineCard: React.FC<TimelineCardProps> = ({ items, getStatusConfig }) => {
  // Agrupar itens por data
  const itemsByDate = items.reduce((acc, item) => {
    const date = new Date(item.data);
    const dateKey = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, TimelineItem[]>);

  const dateKeys = Object.keys(itemsByDate);

  // Contador global de itens para alternar lado
  let globalItemIndex = 0;

  return (
    <div className="relative py-8">
      {/* Linha central verde */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-green-500 dark:bg-green-600 -translate-x-1/2" />

      {/* Itens agrupados por data */}
      {dateKeys.map((dateKey, dateIndex) => {
        const itemsForDate = itemsByDate[dateKey];
        const firstItem = itemsForDate[0];
        const date = new Date(firstItem.data);

        return (
          <div key={dateKey} className="relative mb-8">
            {/* Badge de data centralizado na linha */}
            <div className="absolute left-1/2 -translate-x-1/2 z-20 -top-4">
              <Badge className="bg-green-600 dark:bg-green-700 text-white px-4 py-1.5 font-semibold text-sm shadow-md">
                {dateKey}
              </Badge>
            </div>

            {/* Items da data */}
            <div className="mt-6 space-y-6">
              {itemsForDate.map((item, itemIndex) => {
                const config = getStatusConfig(item.status);
                const isActive = globalItemIndex === items.length - 1;
                const isLeft = globalItemIndex % 2 === 0;
                const currentIndex = globalItemIndex++;

                return (
                  <div
                    key={`${dateKey}-${itemIndex}`}
                    className="relative flex items-center min-h-[140px]"
                  >
                    {isLeft ? (
                      <>
                        {/* Lado esquerdo - Conteúdo */}
                        <div className="w-1/2 pr-8 text-right">
                          <Card className="inline-block text-left bg-card dark:bg-card border-2 border-border rounded-xl p-5 shadow-md hover:shadow-lg transition-all">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 rounded-lg bg-muted dark:bg-muted/50">
                                {config.icon}
                              </div>
                              <h3 className="font-bold text-foreground dark:text-foreground">
                                {config.label}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {item.observacao || config.description}
                            </p>
                          </Card>
                        </div>

                        {/* Centro - Nó circular */}
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-green-600 dark:bg-green-700 border-4 border-background dark:border-background shadow-lg" />

                        {/* Lado direito - Data/Hora */}
                        <div className="w-1/2 pl-8">
                          <div className="inline-block bg-muted/50 dark:bg-muted/30 rounded-lg px-4 py-2 border border-border">
                            <div className="text-xs text-muted-foreground font-mono">
                              {date.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Lado esquerdo - Data/Hora */}
                        <div className="w-1/2 pr-8 text-right">
                          <div className="inline-block bg-muted/50 dark:bg-muted/30 rounded-lg px-4 py-2 border border-border">
                            <div className="text-xs text-muted-foreground font-mono">
                              {date.toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Centro - Nó circular */}
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-green-600 dark:bg-green-700 border-4 border-background dark:border-background shadow-lg" />

                        {/* Lado direito - Conteúdo */}
                        <div className="w-1/2 pl-8">
                          <Card className="inline-block bg-card dark:bg-card border-2 border-border rounded-xl p-5 shadow-md hover:shadow-lg transition-all">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="p-1.5 rounded-lg bg-muted dark:bg-muted/50">
                                {config.icon}
                              </div>
                              <h3 className="font-bold text-foreground dark:text-foreground">
                                {config.label}
                              </h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {item.observacao || config.description}
                            </p>
                          </Card>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimelineCard;
