import { OrganData } from "./AnatomyData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Activity, TrendingUp, Clock, DollarSign, Building2 } from "lucide-react";

interface OperatorAnatomyTooltipProps {
  data: OrganData;
  position: { x: number; y: number };
}

export const OperatorAnatomyTooltip = ({ data, position }: OperatorAnatomyTooltipProps) => {
  const tooltipWidth = 320;
  const tooltipHeight = 420;
  const padding = 16;

  // Posição próxima ao cursor, com limites da viewport
  let left = position.x + 20;
  let top = position.y - tooltipHeight / 2;
  if (left + tooltipWidth > window.innerWidth - padding) left = position.x - tooltipWidth - 20;
  if (left < padding) left = padding;
  if (top < padding) top = padding;
  if (top + tooltipHeight > window.innerHeight - padding) top = window.innerHeight - tooltipHeight - padding;

  // KPIs específicos para operadora (mock com base nos dados disponíveis)
  const denialRate = Math.max(3, Math.min(35, Math.round((data.patients % 17) + 8))); // %
  const avgApprovalTime = Math.max(12, Math.min(96, (data.patients % 72) + 18)); // horas
  const avgCost = Math.max(1500, Math.min(12000, (data.patients % 8000) + 2500)); // R$

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
              {data.cids.slice(0, 6).map((cid, index) => (
                <Badge key={index} variant="secondary" className="text-[11px] px-2 py-0.5">
                  {cid}
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
              {data.protocols.slice(0, 3).map((p, i) => (
                <div key={i} className="text-xs bg-muted/50 px-2 py-1 rounded-md border border-muted-foreground/10 truncate">{p}</div>
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

