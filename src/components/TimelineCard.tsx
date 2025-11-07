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
  // Helpers para lidar com timestamps do MySQL (sem fuso) sem aplicar deslocamento indevido
  const parseNaiveParts = (value?: string | null) => {
    if (typeof value !== 'string') return null;
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!m) return null;
    const [, y, mo, d, h, mi, s] = m;
    return {
      year: Number(y),
      month: Number(mo),
      day: Number(d),
      hour: Number(h),
      minute: Number(mi),
      second: Number(s || '0'),
    };
  };

  const isZoned = (value?: string | null) => typeof value === 'string' && /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);

  const makeDateForDisplay = (value?: string | null): Date => {
    if (!value) return new Date();
    if (isZoned(value)) return new Date(value);
    const parts = parseNaiveParts(value);
    if (parts) {
      return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second));
    }
    return new Date(value);
  };

  const formatNaiveTime = (value?: string | null): string | null => {
    if (isZoned(value)) {
      return null;
    }
    const p = parseNaiveParts(value);
    if (!p) return null;
    const naiveUtc = new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second));
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Sao_Paulo',
    }).format(naiveUtc);
  };

  // Agrupar itens por data (dia)
  const itemsByDate = items.reduce((acc, item: any) => {
    const raw = item?.data ?? item?.created_at ?? null;
    const date = makeDateForDisplay(raw);
    const dateKey = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    }).format(date);

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
    <div className="relative pt-16 pb-8">
      {/* Linha central */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-border to-transparent -translate-x-1/2" />

      {/* Itens agrupados por data */}
      {dateKeys.map((dateKey, dateIndex) => {
        const itemsForDate = itemsByDate[dateKey];
        const firstItem = itemsForDate[0];
        const date = new Date(firstItem.data);

        return (
          <div key={dateKey} className="relative mb-10">
            {/* Badge de data centralizado na linha */}
            <div className="absolute left-1/2 -translate-x-1/2 z-20 -top-4">
              <Badge className="px-3 py-1 font-semibold text-xs rounded-md shadow-md border bg-primary/15 border-primary/30 text-foreground backdrop-blur-sm">
                {dateKey}
              </Badge>
            </div>

            {/* Espaçador para evitar sobreposição do badge com o primeiro item */}
            <div className="h-4" />

            {/* Items da data */}
            <div className="mt-8 space-y-8">
              {itemsForDate.map((item, itemIndex) => {
                const config = getStatusConfig(item.status);
                const isActive = globalItemIndex === items.length - 1;
                const isLeft = globalItemIndex % 2 === 0;
                const currentIndex = globalItemIndex++;

                return (
                  <div
                    key={`${dateKey}-${itemIndex}`}
                    className="relative flex items-center min-h-[120px]"
                  >
                    {isLeft ? (
                      <>
                        {/* Lado esquerdo - Conteúdo */}
                        <div className="w-1/2 pr-6 text-right">
                          <Card className="inline-block text-left bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="p-1.5 rounded-md bg-muted">
                                {config.icon}
                              </div>
                              <h3 className="font-semibold text-foreground">
                                {config.label}
                              </h3>
                            </div>
                            {(item.observacao || config.description) && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {item.observacao || config.description}
                              </p>
                            )}
                          </Card>
                        </div>

                        {/* Centro - Nó circular */}
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-primary border-[6px] border-background shadow-lg" />

                        {/* Lado direito - Data/Hora */}
                        <div className="w-1/2 pl-6">
                          <div className="inline-flex items-center gap-2 bg-muted/40 rounded-md px-3 py-1.5 border border-border shadow-sm">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs text-muted-foreground font-mono tracking-tight">
                              {formatNaiveTime(item?.data ?? item?.created_at) ?? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).format(makeDateForDisplay(item?.data ?? item?.created_at))}
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Lado esquerdo - Data/Hora */}
                        <div className="w-1/2 pr-6 text-right">
                          <div className="inline-flex items-center gap-2 bg-muted/40 rounded-md px-3 py-1.5 border border-border shadow-sm">
                            <Clock className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs text-muted-foreground font-mono tracking-tight">
                              {formatNaiveTime(item?.data ?? item?.created_at) ?? new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Sao_Paulo' }).format(makeDateForDisplay(item?.data ?? item?.created_at))}
                            </span>
                          </div>
                        </div>

                        {/* Centro - Nó circular */}
                        <div className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-primary border-[6px] border-background shadow-lg" />

                        {/* Lado direito - Conteúdo */}
                        <div className="w-1/2 pl-6">
                          <Card className="inline-block bg-card border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="p-1.5 rounded-md bg-muted">
                                {config.icon}
                              </div>
                              <h3 className="font-semibold text-foreground">
                                {config.label}
                              </h3>
                            </div>
                            {(item.observacao || config.description) && (
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {item.observacao || config.description}
                              </p>
                            )}
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
