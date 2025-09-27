import { OrganData } from "./AnatomyData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Activity, TrendingUp, Clock, DollarSign, Building2 } from "lucide-react";

interface OperatorAnatomyTooltipProps {
  data: OrganData;
  position: { x: number; y: number };
  hasSelection?: boolean;
}

export const OperatorAnatomyTooltip = ({ data, position, hasSelection = false }: OperatorAnatomyTooltipProps) => {
  // Dimensões diferentes baseadas na seleção
  const tooltipWidth = hasSelection ? 220 : 320;
  const tooltipHeight = hasSelection ? 120 : 420;
  const padding = 16;

  // Posição próxima ao cursor, com limites da viewport
  let left = position.x - 450; // Reduzido de 20 para 10
  let top = position.y - tooltipHeight / 2;
  if (left + tooltipWidth > window.innerWidth - padding) left = position.x - tooltipWidth - 10; // Reduzido de 20 para 10
  if (left < padding) left = padding;
  if (top < padding) top = padding;
  if (top + tooltipHeight > window.innerHeight - padding) top = window.innerHeight - tooltipHeight - padding;

  // Card simples quando há seleção
  if (hasSelection) {
    return (
      <Card 
        className="absolute z-40 border-0 bg-gradient-to-br from-card/98 to-card/95 backdrop-blur-md shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200 overflow-hidden"
        style={{ 
          left, 
          top, 
          width: tooltipWidth, 
          maxHeight: tooltipHeight, 
          boxShadow: '0 12px 40px -8px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
        }}
      >
        <div className="relative p-4 text-center">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-highlight-peach/5 rounded-lg" />
          
          {/* Content */}
          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div 
                className="w-4 h-4 rounded-full shadow-lg ring-2 ring-white/20" 
                style={{ backgroundColor: `hsl(var(--medical-${data.color}))` }} 
              />
              <h3 className="text-base font-bold text-foreground/95 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {data.name}
              </h3>
            </div>
            <div className="px-3 py-2 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-sm font-bold text-primary">{data.patients.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground/80 ml-1">pacientes</span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // KPIs específicos para operadora - sem mock: exibir placeholders neutros quando não houver dados reais
  const denialRate = 0; // percentual real virá de endpoints específicos no futuro
  const avgApprovalTime = 0; // horas
  const avgCost = 0; // R$

  // Card completo quando não há seleção
  return (
    <Card 
      className="absolute z-50 border-0 bg-gradient-to-br from-card/98 to-card/95 backdrop-blur-xl shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300 overflow-hidden"
      style={{ left, top, width: tooltipWidth, maxHeight: tooltipHeight, boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)' }}
    >
      {/* Header */}
      <div className="relative p-4 pb-3">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-t-lg" />
        <div className="relative flex items-center gap-3">
          <div className="w-3 h-8 rounded-full shadow-lg" style={{ backgroundColor: `hsl(var(--medical-${data.color}))` }} />
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">{data.name}</h3>
            <p className="text-xs text-muted-foreground/80 font-medium">Visão de Operadora</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-3">
        {/* Pacientes e Clínicas */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Pacientes</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-xl font-bold text-primary tabular-nums">{data.patients.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-xl bg-highlight-peach/10 border border-highlight-peach/20">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">Clínicas</span>
              <Building2 className="w-4 h-4 text-highlight-peach" />
            </div>
            <div className="text-xl font-bold text-highlight-peach tabular-nums">{Math.max(1, Math.round(data.patients / 18))}</div>
          </div>
        </div>

        {/* KPIs de Operadora */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-muted/40 border border-muted-foreground/10 text-center">
            <div className="text-[10px] uppercase text-muted-foreground mb-1">Negativa</div>
            <div className="text-sm font-semibold text-destructive">{denialRate}%</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 border border-muted-foreground/10 text-center">
            <div className="text-[10px] uppercase text-muted-foreground mb-1">Tempo Médio</div>
            <div className="text-sm font-semibold text-foreground">{avgApprovalTime}h</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 border border-muted-foreground/10 text-center">
            <div className="text-[10px] uppercase text-muted-foreground mb-1">Custo Médio</div>
            <div className="text-sm font-semibold text-support-green">R$ {avgCost.toLocaleString()}</div>
          </div>
        </div>

        {/* CIDs e Protocolos */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-medical-blue" />
              <span className="text-xs font-semibold text-foreground/90">CIDs Principais</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.cids.slice(0, 6).map((cidData: any, index: number) => (
                <Badge key={index} variant="secondary" className="text-[11px] px-2 py-0.5">
                  {typeof cidData === 'string' ? cidData : (cidData?.cid ?? '')}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-medical-teal" />
              <span className="text-xs font-semibold text-foreground/90">Protocolos</span>
            </div>
            <div className="space-y-1.5">
              {data.protocols.slice(0, 3).map((protocolData: any, i: number) => (
                <div key={i} className="text-xs bg-muted/50 px-2 py-1 rounded-md border border-muted-foreground/10 truncate">
                  {typeof protocolData === 'string' ? protocolData : (protocolData?.protocol ?? '')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tendências */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-primary/5 border border-primary/10 text-center">
            <div className="text-[10px] uppercase text-muted-foreground mb-1">Tendência</div>
            <div className="flex items-center justify-center gap-1 text-primary text-sm font-semibold"><TrendingUp className="w-4 h-4" /> Alta</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 border border-muted-foreground/10 text-center">
            <div className="text-[10px] uppercase text-muted-foreground mb-1">SLA</div>
            <div className="text-sm font-semibold">{Math.max(65, 95 - denialRate)}%</div>
          </div>
          <div className="p-2 rounded-lg bg-support-green/10 border border-support-green/20 text-center">
            <div className="text-[10px] uppercase text-muted-foreground mb-1">Economia</div>
            <div className="flex items-center justify-center gap-1 text-support-green text-sm font-semibold"><DollarSign className="w-4 h-4" />{Math.round(avgCost * 0.15).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default OperatorAnatomyTooltip;

