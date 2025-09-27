"use client";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Download, ThumbsUp, ThumbsDown } from "lucide-react";

export const CardHoverEffect = ({
  items,
  className,
  onViewPDF,
  onDownloadPDF,
  loadingPDF,
  downloadingPDF,
  onApprove,
  onReject,
}: {
  items: {
    id: number;
    title: string;
    description: string;
    link: string;
    usage?: number;
    protocols?: string[];
    percentage?: number;
    status?: string;
    cicloAtual?: number;
    data?: any;
  }[];
  className?: string;
  onViewPDF?: (item: any) => void;
  onDownloadPDF?: (id: number) => void;
  loadingPDF?: number | null;
  downloadingPDF?: number | null;
  onApprove?: (id: number) => void;
  onReject?: (id: number) => void;
}) => {
  let [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-3 gap-6",
        className
      )}
    >
      {items.map((item, idx) => (
        <div
          key={item?.id}
          id={`auth-${item?.id}`}
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="relative group block p-2 h-full w-full"
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className="absolute inset-0 h-full w-full bg-primary/5 block rounded-xl"
                layoutId="hoverBackground"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: { duration: 0.15 },
                }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.15, delay: 0.2 },
                }}
              />
            )}
          </AnimatePresence>
          <Card
            className={cn(
              "border-l-4",
              (item as any).status === 'aprovada' && "border-l-green-500",
              (item as any).status === 'rejeitada' && "border-l-red-500",
              (item as any).status === 'em_analise' && "border-l-yellow-500",
              ((item as any).status === 'pendente' || !(item as any).status) && "border-l-blue-500",
            )}
          >
            {/* Overlay de Loading */}
            {(loadingPDF === item.id || downloadingPDF === item.id) && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                  <span className="text-sm text-muted-foreground">
                    {loadingPDF === item.id ? 'Carregando PDF...' : 'Baixando PDF...'}
                  </span>
                </div>
              </div>
            )}
            
            {/* ID da Solicitação com cor por status */}
            {item.id && (
              <div className="absolute top-4 right-4">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white",
                    (item as any).status === 'aprovada' && "bg-green-500",
                    (item as any).status === 'rejeitada' && "bg-red-500",
                    (item as any).status === 'em_analise' && "bg-yellow-500 text-black",
                    ((item as any).status === 'pendente' || !(item as any).status) && "bg-blue-500",
                  )}
                >
                  #{item.id}
                </div>
              </div>
            )}
            
            {/* Title - Melhorado para destacar o nome do paciente */}
            <CardTitle className="pr-12">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">Solicitação #{item.id}</div>
                <div className="text-base font-semibold text-foreground">
                  {item.data?.cliente_nome || 'Paciente não identificado'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.data?.hospital_nome}
                </div>
              </div>
            </CardTitle>
            
            {/* Status Principal */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  (item as any).status === 'aprovada' ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" :
                  (item as any).status === 'rejeitada' ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300" :
                  (item as any).status === 'em_analise' ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300" :
                  "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                )}>
                  {(item as any).status === 'aprovada' ? 'Aprovada' :
                   (item as any).status === 'rejeitada' ? 'Rejeitada' :
                   (item as any).status === 'em_analise' ? 'Em Análise' :
                   'Pendente'}
                </span>
              </div>
            </div>

            {/* Metadados principais (Lista -> Grade) */}
            {item.data && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <div className="text-sm font-medium text-foreground">
                    {formatDate(item.data?.data_solicitacao)}
                  </div>
                  <div className="text-xs text-muted-foreground">Data</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/30">
                  <div className="text-sm font-medium text-foreground">
                    {item.data?.finalidade || '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">Finalidade</div>
                </div>
              </div>
            )}
            
            {/* Stats Grid - Substituindo Superfície Corporal por Peso/Altura */}
            {item.usage && item.data && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <div className="text-lg font-bold text-foreground">
                    {item.cicloAtual || 0}/{item.usage || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ciclo Atual/Previsto
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <div className="text-lg font-bold text-foreground">
                    {item.data?.peso ? `${item.data.peso}kg` : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Peso do Paciente
                  </div>
                </div>
              </div>
            )}
            
            {/* Informações Adicionais do Paciente */}
            {item.data && (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-2 rounded-lg bg-primary/5">
                  <div className="text-sm font-medium text-foreground">
                    {item.data?.idade ? `${item.data.idade} anos` : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Idade
                  </div>
                </div>
                <div className="text-center p-2 rounded-lg bg-primary/5">
                  <div className="text-sm font-medium text-foreground">
                    {item.data?.sexo === 'M' ? 'Masculino' : item.data?.sexo === 'F' ? 'Feminino' : 'N/A'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Sexo
                  </div>
                </div>
              </div>
            )}
            
            {/* Diagnóstico */}
            {item.protocols && item.protocols.length > 0 && (
              <div className="space-y-2 mb-3">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Diagnóstico
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.protocols.slice(0, 2).map((protocol, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary"
                    >
                      {protocol}
                    </span>
                  ))}
                  {item.protocols.length > 2 && (
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground">
                      +{item.protocols.length - 2}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            <CardDescription className="text-xs opacity-75 mt-3">
              {item.description}
            </CardDescription>
            
            {/* Botões de ação - Visualizar e Baixar */}
            {onViewPDF && onDownloadPDF && (
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewPDF(item.data)}
                  disabled={loadingPDF === item.id || downloadingPDF === item.id}
                  className="flex-1 h-8 text-xs"
                >
                  {loadingPDF === item.id ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      <Eye className="h-3 w-3 mr-1" />
                      Visualizar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownloadPDF(item.id)}
                  disabled={loadingPDF === item.id || downloadingPDF === item.id}
                  className="flex-1 h-8 text-xs"
                >
                  {downloadingPDF === item.id ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1" />
                      Baixando...
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3 mr-1" />
                      Baixar
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Botões de ação - Aprovar/Rejeitar (apenas pendente) */}
            {onApprove && onReject && (item as any).status === 'pendente' && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onApprove(item.id)}
                  className="flex-1 h-8 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <ThumbsUp className="h-3 w-3 mr-1" /> Aprovar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReject(item.id)}
                  className="flex-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <ThumbsDown className="h-3 w-3 mr-1" /> Rejeitar
                </Button>
              </div>
            )}
            {onApprove && onReject && (item as any).status !== 'pendente' && (
              // Espaço reservado para manter a mesma altura dos cards não pendentes
              <div className="mt-2 h-8" />
            )}
          </Card>
        </div>
      ))}
    </div>
  );
};

export const Card = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card relative z-20 transition-shadow",
        "group-hover:shadow-lg group-hover:shadow-primary/10",
        className
      )}
    >
      <div className="relative z-50">
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};
export const CardTitle = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <h4 className={cn("text-foreground font-semibold text-base mb-4", className)}>
      {children}
    </h4>
  );
};
export const CardDescription = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <p
      className={cn(
        "text-muted-foreground text-sm leading-relaxed",
        className
      )}
    >
      {children}
    </p>
  );
}; 