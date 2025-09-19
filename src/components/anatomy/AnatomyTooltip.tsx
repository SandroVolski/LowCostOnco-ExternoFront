import { OrganData } from "./AnatomyData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, Activity, Calendar, User, Pill } from "lucide-react";

interface AnatomyTooltipProps {
  data: OrganData;
  position: { x: number; y: number };
}

export const AnatomyTooltip = ({ data, position }: AnatomyTooltipProps) => {
  // Calculate tooltip position to stay close to body but within viewport
  const tooltipWidth = 280;
  const tooltipHeight = 400;
  const padding = 16;
  
  // Preferir dados reais vindos das solicitações quando disponíveis
  const getTopByFrequency = (items: string[], limit: number): string[] => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      if (!item) continue;
      counts[item] = (counts[item] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key]) => key);
  };

  const cidsFromSolicitacoes: string[] = Array.isArray(data.solicitacoes)
    ? data.solicitacoes
        .map((s: any) => s?.diagnostico_cid)
        .filter((v: any): v is string => typeof v === 'string' && v.trim().length > 0)
    : [];
  const topCids = cidsFromSolicitacoes.length > 0
    ? getTopByFrequency(cidsFromSolicitacoes, 6)
    : data.cids;

  const protocolCandidates: string[] = Array.isArray(data.solicitacoes)
    ? data.solicitacoes.flatMap((s: any) => {
        const list: string[] = [];
        if (s?.finalidade && typeof s.finalidade === 'string') list.push(s.finalidade);
        if (s?.medicamentos_antineoplasticos && typeof s.medicamentos_antineoplasticos === 'string') {
          // dividir por vírgula se vier uma lista
          const parts = s.medicamentos_antineoplasticos.split(',').map((t: string) => t.trim()).filter(Boolean);
          list.push(...parts);
        }
        return list;
      })
      .filter((v: any): v is string => typeof v === 'string' && v.trim().length > 0)
    : [];
  const topProtocols = protocolCandidates.length > 0
    ? getTopByFrequency(protocolCandidates, 4)
    : data.protocols.slice(0, 4);
  
  // Position tooltip very close to the mouse position
  let left = position.x - 400; // 20px to the right of mouse
  let top = position.y - tooltipHeight / 2; // Centered vertically with mouse
  
  // If tooltip would go off screen to the right, position it to the left
  if (left + tooltipWidth > window.innerWidth - padding) {
    left = position.x - tooltipWidth - 20; // 20px to the left of mouse
  }
  
  // If tooltip would go off screen to the left, position it to the right
  if (left < padding) {
    left = position.x + 20;
  }
  
  // Ensure tooltip stays within viewport
  if (left + tooltipWidth > window.innerWidth - padding) {
    left = window.innerWidth - tooltipWidth - padding;
  }
  if (left < padding) {
    left = padding;
  }
  if (top < padding) {
    top = padding;
  }
  if (top + tooltipHeight > window.innerHeight - padding) {
    top = window.innerHeight - tooltipHeight - padding;
  }

  return (
    <Card 
      className="absolute z-50 border-0 bg-gradient-to-br from-card/98 to-card/95 backdrop-blur-xl shadow-2xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300 overflow-hidden"
      style={{
        left,
        top,
        width: tooltipWidth,
        maxHeight: tooltipHeight,
        boxShadow: '0 32px 64px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Header moderno */}
      <div className="relative p-4 pb-3">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-t-lg" />
        <div className="relative flex items-center gap-3">
          <div 
            className="w-3 h-8 rounded-full shadow-lg"
            style={{ backgroundColor: `hsl(var(--medical-${data.color}))` }}
          />
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              {data.name}
            </h3>
            <p className="text-xs text-muted-foreground/80 font-medium">Sistema Corporal</p>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="px-4 pb-4">
        {/* Estatísticas em cards modernos */}
        <div className="space-y-3">
          {/* Espaço entre header e pacientes ativos */}
          <div className="h-1"></div>
          
          {/* Pacientes Ativos */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/8 via-primary/4 to-transparent p-3 border border-primary/10 transition-all duration-300 hover:border-primary/20 hover:bg-primary/5">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">
                  Pacientes Ativos
                </p>
                <p className="text-xl font-bold text-primary tabular-nums">{data.patients.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Solicitações Recentes */}
          {data.solicitacoes && data.solicitacoes.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  Solicitações Recentes
                </span>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {data.solicitacoes.slice(0, 3).map((solicitacao, index) => (
                  <div key={index} className="p-2 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground truncate">
                        {solicitacao.cliente_nome}
                      </span>
                      <Badge 
                        variant={solicitacao.status === 'aprovada' ? 'default' : 
                                solicitacao.status === 'rejeitada' ? 'destructive' : 'secondary'}
                        className="text-xs px-1.5 py-0.5"
                      >
                        {solicitacao.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 mb-1">
                        <Pill className="w-3 h-3" />
                        <span className="truncate">{solicitacao.medicamentos_antineoplasticos}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(solicitacao.data_solicitacao).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CIDs Principais */
          }
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-medical-blue" />
              <span className="text-xs font-semibold text-foreground/90">CIDs Principais</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {topCids.map((cid, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-xs font-medium px-2 py-1 bg-muted/70 hover:bg-muted transition-colors duration-200 border border-muted-foreground/10"
                >
                  {cid}
                </Badge>
              ))}
            </div>
          </div>
          
          {/* Protocolos Ativos */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-medical-teal" />
              <span className="text-xs font-semibold text-foreground/90">Protocolos Ativos</span>
            </div>
            <div className="space-y-1.5">
              {topProtocols.slice(0, 2).map((protocol, index) => (
                <div 
                  key={index} 
                  className="text-xs font-medium text-muted-foreground/80 bg-muted/40 px-3 py-2 rounded-lg border border-muted-foreground/5 hover:bg-muted/60 transition-colors duration-200"
                >
                  {protocol}
                </div>
              ))}
              {topProtocols.length > 2 && (
                <div className="text-xs text-muted-foreground/60 px-3 py-1 text-center">
                  +{topProtocols.length - 2} mais protocolos
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
