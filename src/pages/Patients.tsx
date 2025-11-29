import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, User, Calendar as CalendarIcon, Info, Phone, Mail, MapPin, CreditCard, Building2, FlipHorizontal, Edit, Trash2, Filter, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, FileText, Eye, Stethoscope, Activity } from 'lucide-react';
import { usePageNavigation } from '@/components/transitions/PageTransitionContext';
import { useNavigate } from 'react-router-dom';

// CSS como string constante
const patientCardStyles = `
  .perspective-1000 {
    perspective: 1000px;
  }
  .transform-style-preserve-3d {
    transform-style: preserve-3d;
  }
  .backface-hidden {
    backface-visibility: hidden;
  }
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
  
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
  }
  
  /* Esconder scrollbar mas manter funcionalidade */
  .scrollbar-hide {
    -ms-overflow-style: none;  /* Internet Explorer 10+ */
    scrollbar-width: none;  /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;  /* Safari and Chrome */
  }
  
  /* Garantir bordas arredondadas no hover */
  .auth-card-hover {
    border-radius: 0.5rem !important;
  }
  .auth-card-hover:hover {
    border-radius: 0.5rem !important;
  }
  
  /* Scrollbar sutil para autorizações */
  .auth-scroll {
    scrollbar-width: thin;  /* Firefox */
    scrollbar-color: rgba(156, 163, 175, 0.3) transparent;  /* Firefox */
  }
  .auth-scroll::-webkit-scrollbar {
    width: 4px;  /* Safari and Chrome */
  }
  .auth-scroll::-webkit-scrollbar-track {
    background: transparent;  /* Safari and Chrome */
  }
  .auth-scroll::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.3);  /* Safari and Chrome */
    border-radius: 2px;  /* Safari and Chrome */
  }
  .auth-scroll::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.5);  /* Safari and Chrome */
  }
`;

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PacienteService, testarConexaoBackend, testarConexaoBanco, SolicitacaoService, SolicitacaoFromAPI, ProtocoloService } from '@/services/api';
import { CatalogService, type CatalogCidItem } from '@/services/api';
import { OperadoraService } from '@/services/operadoraService';
import { PrestadorService, Prestador } from '@/services/prestadorService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import CIDSelection from '@/components/CIDSelection';



// Interface Authorization
interface Authorization {
  id: number;
  numero_autorizacao: string;
  status: string;
  data_solicitacao: string;
  diagnostico_descricao: string;
  hospital_nome: string;
  ciclo_atual?: number;
  ciclos_previstos?: number;
  medicamentos_antineoplasticos?: string;
  finalidade?: string;
  siglas?: string;
}

// Interface Patient expandida
interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  stage: string;
  treatment: string;
  startDate: string;
  status: string;
  authorizations: Authorization[];
  Paciente_Nome: string;
  cpf: string;
  rg: string;
  Data_Nascimento: string;
  Sexo: string;
  Operadora: string;
  Prestador: string;
  plano_saude: string;
  numero_carteirinha: string;
  Cid_Diagnostico: string | string[];
  Data_Primeira_Solicitacao: string;
  telefone: string;
  email: string;
  endereco: string;
  observacoes: string;
  setor_prestador: string;
  clinica_id?: number;
  // Campos adicionais para o popup
  peso?: string;
  altura?: string;
  contato_emergencia_nome?: string;
  contato_emergencia_telefone?: string;
  medico_assistente_nome?: string;
  medico_assistente_email?: string;
  medico_assistente_telefone?: string;
  medico_assistente_especialidade?: string;
}

interface ModernAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  type: 'delete' | 'success' | 'warning';
  patientName?: string;
}

const ModernAlert = ({ isOpen, onClose, onConfirm, title, description, type, patientName }: ModernAlertProps) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'delete':
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-[#1f4edd]" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getColors = () => {
    switch (type) {
      case 'delete':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          button: 'bg-red-600 hover:bg-red-700 text-white'
        };
      case 'success':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          button: 'bg-[#1f4edd] hover:bg-[#2351c4] text-white'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
        };
    }
  };

  const colors = getColors();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
      <div className={`max-w-md w-full mx-4 rounded-2xl p-6 shadow-2xl border ${colors.bg} ${colors.border} animate-scale-in`}>
        <div className="flex items-center gap-4 mb-4">
          {getIcon()}
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-muted-foreground mb-6">
          {description}
          {patientName && (
            <span className="font-medium text-foreground"> "{patientName}"</span>
          )}
          ?
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button className={colors.button} onClick={onConfirm}>
            {type === 'delete' ? 'Excluir' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Componente PatientCard com efeito de virar APENAS no clique
const PatientCard = ({ patient, onEdit, onDelete, onShowInfo }: {
  patient: Patient;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onShowInfo: (id: string) => void;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [preventFlip, setPreventFlip] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (preventFlip) return;
    setIsFlipped(!isFlipped);
  };

  return (
    <div 
      className="h-[400px] w-full perspective-1000 cursor-pointer select-none"
      onClick={handleCardClick}
    >
      <div className={`relative w-full h-full transition-all duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        {/* Frente do Card */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <Card className="h-full bg-gradient-to-br from-card via-card to-card/90 shadow-lg transition-all duration-300 overflow-hidden border-2 border-border hover:shadow-xl hover:border-primary/30">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold line-clamp-1 text-primary">
                    {patient.name}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    <span className="text-sm">{patient.cpf || 'CPF não informado'}</span>
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowInfo(patient.id);
                    }}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 flex-1">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Idade
                  </span>
                  <span className="font-medium">{patient.age} anos</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Stethoscope className="h-3 w-3" />
                    Diagnóstico
                  </span>
                  <span className="font-medium line-clamp-1 text-right">{patient.diagnosis}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Estágio
                  </span>
                  <Badge variant="outline" className="text-xs">{patient.stage}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Tratamento
                  </span>
                  <span className="font-medium line-clamp-1 text-right text-xs">{patient.treatment}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Operadora/Plano
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-xs">{getOperadoraName(patient.Operadora)}</span>
                    <span>•</span>
                    <span>{patient.plano_saude || '—'}</span>
                  </div>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="flex items-center justify-between mb-4">
                <Badge variant={
                  patient.status === 'Em tratamento' ? 'default' : 
                  patient.status === 'Em remissão' ? 'secondary' : 
                  'outline'
                } className="text-xs">
                  {patient.status}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Início: {patient.startDate}
                </span>
              </div>
              
              <div className="flex gap-2 mt-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(patient.id);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(patient.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Excluir
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-2 animate-pulse">
                <FlipHorizontal className="h-3 w-3" />
                Clique para ver mais detalhes
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verso do Card */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <Card className="h-full bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-lg transition-shadow duration-300 border-2 border-primary/30 flex flex-col">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-primary/20 flex-shrink-0">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold text-primary">
                  Detalhes Completos
                </CardTitle>
                <div className="text-xs text-muted-foreground flex items-center gap-1 px-2 py-1 bg-background/80 rounded-full animate-pulse">
                  <FlipHorizontal className="h-3 w-3" />
                  Clique para voltar
                </div>
              </div>
              <CardDescription className="flex items-center gap-2">
                <Building2 className="h-3 w-3" />
                Operadora: {getOperadoraName(patient.Operadora)} • Plano: {patient.plano_saude || '—'}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col px-4 pt-1 pb-4 overflow-hidden">
              <div className="space-y-2 flex-1 overflow-y-hidden">
              {/* Informações básicas compactas */}
              <div className="space-y-2 text-xs bg-muted/30 rounded-lg p-2.5 border border-border/20">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Médico Assistente:</span>
                    <span className="font-medium text-right break-words">
                      {patient.medico_assistente_nome || 
                       (patient as any).medico_assistente_nome || 
                       patient.Prestador || 
                       'Não informado'}
                    </span>
                  </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">CID/Diagnóstico:</span>
                  <span className="font-medium text-right break-words">
                    {Array.isArray(patient.Cid_Diagnostico) 
                      ? patient.Cid_Diagnostico.join(', ') 
                      : patient.Cid_Diagnostico}
                  </span>
                </div>
              </div>

              {patient.authorizations && patient.authorizations.length > 0 ? (
                <div 
                  className="w-full"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => { e.stopPropagation(); setPreventFlip(true); }}
                  onMouseUp={(e) => { e.stopPropagation(); setPreventFlip(false); }}
                  onPointerDown={(e) => { e.stopPropagation(); setPreventFlip(true); }}
                  onPointerUp={(e) => { e.stopPropagation(); setPreventFlip(false); }}
                  onTouchStart={(e) => { e.stopPropagation(); setPreventFlip(true); }}
                  onTouchEnd={(e) => { e.stopPropagation(); setPreventFlip(false); }}
                >
                  <Tabs defaultValue="autorizacoes" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full mb-2">
                      <TabsTrigger value="autorizacoes">Últimas Autorizações</TabsTrigger>
                      <TabsTrigger value="protocolos">Protocolos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="autorizacoes">
                      <div className="space-y-3 max-h-44 overflow-y-auto overflow-x-hidden auth-scroll pb-10">
                        {patient.authorizations.slice(0, 3).map((auth) => (
                          <div 
                            key={auth.id} 
                            className="group relative bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/30 rounded-lg p-3 cursor-pointer hover:from-background/80 hover:to-background/60 hover:border-border/50 transition-all duration-300 hover:shadow-md hover:scale-[1.02] auth-card-hover"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/historico-solicitacoes', { 
                                state: { 
                                  scrollToAuth: auth.id.toString(),
                                  authId: auth.id 
                                }
                              });
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-primary bg-gradient-to-r from-primary/10 to-primary/5 px-2 py-1 rounded border border-primary/20">
                                  {auth.numero_autorizacao}
                                </span>
                                <Badge 
                                  variant={
                                    auth.status === 'aprovada' ? 'default' : 
                                    auth.status === 'pendente' ? 'secondary' : 
                                    'destructive'
                                  }
                                  className="text-[10px] px-2 py-0.5"
                                >
                                  {auth.status === 'aprovada' ? 'Aprovada' : 
                                   auth.status === 'pendente' ? 'Pendente' : 
                                   'Rejeitada'}
                                </Badge>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <div className="text-xs font-medium line-clamp-1 text-foreground">
                                {auth.diagnostico_descricao}
                              </div>
                              {(auth.ciclo_atual || auth.ciclos_previstos) && (
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-primary shadow-sm"></div>
                                    <span className="font-medium">Ciclo: {auth.ciclo_atual || 0}/{auth.ciclos_previstos || 0}</span>
                                  </div>
                                  {auth.ciclos_previstos && (
                                    <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                                      <div 
                                        className="bg-primary h-full transition-all duration-300"
                                        style={{ width: `${Math.min(100, ((auth.ciclo_atual || 0) / auth.ciclos_previstos) * 100)}%` }}
                                      ></div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {auth.medicamentos_antineoplasticos && (
                                <div className="text-[10px] text-muted-foreground line-clamp-1">
                                  <span className="font-medium">Med:</span> {auth.medicamentos_antineoplasticos}
                                </div>
                              )}
                              {auth.finalidade && (
                                <div className="text-[10px] text-muted-foreground">
                                  <span className="font-medium">Finalidade:</span> {auth.finalidade}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {patient.authorizations.length > 3 && (
                          <div className="text-center mt-4 p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></div>
                              <span className="text-xs text-primary font-medium">
                                +{patient.authorizations.length - 3} autorizações adicionais
                              </span>
                              <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse"></div>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Clique em "Ver Tudo" para visualizar o histórico completo
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent value="protocolos">
                      {(() => {
                        type ProtoAgg = { count: number; pctSum: number };
                        const protocolosMap: Record<string, ProtoAgg> = {};

                        const extractProtocolField = (auth: any): string | undefined => {
                          // Consider multiple possible field names
                          const value = auth?.siglas ?? auth?.Siglas ?? auth?.sigla ?? auth?.Sigla ?? auth?.protocolo ?? auth?.Protocolo ?? auth?.protocolos ?? auth?.Protocolos ?? auth?.medicamentos_antineoplasticos;
                          return typeof value === 'string' ? value : Array.isArray(value) ? value.join(',') : undefined;
                        };

                        (patient.authorizations || []).forEach((a: any) => {
                          const raw = extractProtocolField(a);
                          if (!raw) return;
                          const parts = String(raw)
                            .split(/[;,|\/]+/)
                            .map((s: string) => s.trim())
                            .filter(Boolean);

                          const cicloAtual = Number(a.ciclo_atual ?? a.cicloAtual ?? a.ciclo) || 0;
                          const ciclosPrevistos = Number(a.ciclos_previstos ?? a.ciclosPrevistos ?? a.ciclos) || 0;
                          const pct = ciclosPrevistos > 0 ? Math.max(0, Math.min(100, Math.round((cicloAtual / ciclosPrevistos) * 100))) : 0;

                          parts.forEach((sigla: string) => {
                            const key = sigla.toUpperCase();
                            const prev = protocolosMap[key] || { count: 0, pctSum: 0 };
                            protocolosMap[key] = { count: prev.count + 1, pctSum: prev.pctSum + pct };
                          });
                        });

                        const protocolos = Object.entries(protocolosMap)
                          .map(([sigla, agg]) => ({ sigla, count: agg.count, pct: Math.round(agg.pctSum / Math.max(1, agg.count)) }))
                          .sort((a, b) => b.count - a.count || b.pct - a.pct);

                        if (protocolos.length === 0) {
                          return (
                            <div className="text-center py-6">
                              <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                              <p className="text-xs text-muted-foreground">Nenhuma autorização/protocolo registrado</p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1">Os protocolos são inferidos pelas siglas nas autorizações</p>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3 max-h-44 overflow-y-auto overflow-x-hidden auth-scroll pb-16">
                            {protocolos.map(({ sigla, count, pct }) => (
                              <div
                                key={sigla}
                                className="group rounded-lg p-3 border bg-gradient-to-br from-card/30 via-card/20 to-card/10 border-border/30 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer"
                                onClick={() => navigate(`/protocols?highlight=${encodeURIComponent(sigla)}`)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs px-2 py-0.5">{sigla}</Badge>
                                    <span className="text-[10px] text-muted-foreground">x{count}</span>
                                  </div>
                                  <span
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                                      pct >= 75
                                        ? 'bg-[#65a3ee]/15 text-[#65a3ee] border-[#65a3ee]/30'
                                        : pct >= 50
                                          ? 'bg-support-yellow/15 text-support-yellow border-support-yellow/30'
                                          : 'bg-highlight-red/15 text-highlight-red border-highlight-red/30'
                                    }`}
                                  >
                                    {pct}%
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                  <div
                                    className={
                                      pct >= 75
                                        ? 'h-2 rounded-full bg-[#65a3ee]'
                                        : pct >= 50
                                          ? 'h-2 rounded-full bg-support-yellow'
                                          : 'h-2 rounded-full bg-highlight-red'
                                    }
                                    style={{ width: `${pct}%` }}
                                  ></div>
                                </div>
                                <div className="mt-1 flex items-center justify-between">
                                  <span className="text-[10px] text-muted-foreground">Progresso médio</span>
                                  <span className="text-[10px] text-muted-foreground">de {count} autorização(ões)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="text-center py-6">
                  <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Nenhuma autorização/protocolo registrado</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    Clique em "Ver Tudo" para criar uma nova
                  </p>
                </div>
              )}

              {patient.observacoes && (
                <div className="mb-4">
                  <h5 className="text-xs font-semibold mb-1 text-primary">Observações</h5>
                  <p className="text-xs text-muted-foreground line-clamp-3">{patient.observacoes}</p>
                </div>
              )}

              </div>
              
              <div className="flex gap-2 pt-3 mt-auto flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowInfo(patient.id);
                  }}
                >
                  <Info className="h-3 w-3 mr-1" />
                  Ver Tudo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Seção animada
const AnimatedSection = ({ children, delay = 0, className = "" }: {
  children: React.ReactNode;
  delay?: number;  
  className?: string;
}) => (
  <div 
    className={`animate-fade-in-up ${className}`}
    style={{ animationDelay: `${delay}ms` }}
  >
    {children}
  </div>
);

// Componente de Paginação
const Pagination = ({ currentPage, totalPages, onPageChange }: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => {
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>

      <div className="flex gap-1">
        {getVisiblePages().map((page, index) => (
          <Button
            key={index}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={typeof page !== 'number'}
            className="min-w-[40px]"
          >
            {page}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Próxima
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Funções de formatação
const formatCPF = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedNumbers = numbers.slice(0, 11);
  
  // Aplica a máscara
  if (limitedNumbers.length <= 3) return limitedNumbers;
  if (limitedNumbers.length <= 6) return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3)}`;
  if (limitedNumbers.length <= 9) return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6)}`;
  return `${limitedNumbers.slice(0, 3)}.${limitedNumbers.slice(3, 6)}.${limitedNumbers.slice(6, 9)}-${limitedNumbers.slice(9)}`;
};

const formatRG = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 9 dígitos
  const limitedNumbers = numbers.slice(0, 9);
  
  // Aplica a máscara XX.XXX.XXX-X
  if (limitedNumbers.length <= 2) return limitedNumbers;
  if (limitedNumbers.length <= 5) return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2)}`;
  if (limitedNumbers.length <= 8) return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5)}`;
  return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5, 8)}-${limitedNumbers.slice(8)}`;
};

const formatTelefone = (value: string): string => {
  // Remove tudo que não é número
  const numbers = value.replace(/\D/g, '');
  
  // Limita a 11 dígitos
  const limitedNumbers = numbers.slice(0, 11);
  
  // Aplica a máscara
  if (limitedNumbers.length <= 2) return limitedNumbers;
  if (limitedNumbers.length <= 7) return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
  if (limitedNumbers.length <= 10) return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
  return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
};

const formatDateInput = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
};

const formatCarteirinha = (value: string): string => {
  // Remove caracteres especiais, mantendo apenas números e letras
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

const formatCEP = (value: string): string => {
	const numbers = value.replace(/\D/g, '');
	const limited = numbers.slice(0, 8);
	if (limited.length <= 5) return limited;
	return `${limited.slice(0, 5)}-${limited.slice(5)}`;
};

// Funções de validação
const validateCPF = (cpf: string): boolean => {
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(numbers)) return false;
  
  // Validação do primeiro dígito
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(numbers[i]) * (10 - i);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (parseInt(numbers[9]) !== digit1) return false;
  
  // Validação do segundo dígito
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(numbers[i]) * (11 - i);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  return parseInt(numbers[10]) === digit2;
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateTelefone = (telefone: string): boolean => {
  const numbers = telefone.replace(/\D/g, '');
  return numbers.length >= 10 && numbers.length <= 11;
};

const validateDate = (date: string): boolean => {
  if (!date) return false;
  
  // Se for formato DD/MM/YYYY
  if (date.includes('/')) {
    const [day, month, year] = date.split('/');
    if (!day || !month || !year || year.length !== 4) return false;
    
    const dayNum = parseInt(day);
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (dayNum < 1 || dayNum > 31) return false;
    if (monthNum < 1 || monthNum > 12) return false;
    if (yearNum < 1900 || yearNum > new Date().getFullYear()) return false;
    
    // Verifica se a data existe
    const testDate = new Date(yearNum, monthNum - 1, dayNum);
    return testDate.getFullYear() === yearNum && 
           testDate.getMonth() === monthNum - 1 && 
           testDate.getDate() === dayNum;
  }
  
  return false;
};

const convertToISODate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    if (day && month && year && year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return '';
};

const convertFromISODate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  if (dateStr.includes('/')) {
    return dateStr;
  }
  
  if (dateStr.includes('-')) {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  }
  
  return dateStr;
};

// Helper functions
const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  
  let birth: Date;
  
  // Se for formato brasileiro (DD/MM/AAAA), converter para ISO primeiro
  if (birthDate.includes('/')) {
    const [day, month, year] = birthDate.split('/');
    birth = new Date(`${year}-${month}-${day}`);
  } else {
    // Formato ISO (AAAA-MM-DD)
    birth = new Date(birthDate);
  }
  
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Mock patient data
const initialPatients: Patient[] = [
  {
    id: '1',
    name: 'Maria Silva',
    age: 56,
    gender: 'Feminino',
    diagnosis: 'Câncer de Mama',
    stage: 'II',
    treatment: 'Quimioterapia',
    startDate: '15/01/2024',
    status: 'Em tratamento',
    authorizations: [
      {
        id: 1,
        numero_autorizacao: 'AUTH001',
        status: 'aprovada',
        data_solicitacao: '10/05/2024',
        diagnostico_descricao: 'Solicitação inicial de tratamento',
        hospital_nome: 'Hospital ABC'
      }
    ],
    Paciente_Nome: 'Maria Silva',
    Codigo: 'PAC001',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    Data_Nascimento: '01/01/1968',
    Sexo: 'Feminino',
    Operadora: 'Unimed',
    Prestador: 'Hospital ABC',
    plano_saude: 'Unimed Nacional',
    numero_carteirinha: '123456789',
    Cid_Diagnostico: ['C50', 'C78'],
    Data_Primeira_Solicitacao: '15/01/2024',
    telefone: '(11) 99999-9999',
    email: 'maria.silva@email.com',
    endereco: 'Rua das Flores, 123 - São Paulo, SP',
    observacoes: 'Paciente colaborativa, boa resposta ao tratamento inicial.',
    setor_prestador: 'Agendamento',
    clinica_id: 1,
    // Campos adicionais para o popup
    peso: '65',
    altura: '165',
    contato_emergencia_nome: 'João Silva',
    contato_emergencia_telefone: '(11) 88888-8888',
    medico_assistente_nome: 'Dr. Carlos Santos'
  }
];

// Empty patient
const emptyPatient: Patient = {
  id: '',
  name: '',
  age: 0,
  gender: '',
  diagnosis: '',
  stage: '',
  treatment: '',
  startDate: '',
  status: '',
  authorizations: [],
  Paciente_Nome: '',
  cpf: '',
  rg: '',
  Data_Nascimento: '',
  Sexo: '',
  Operadora: '',
  Prestador: '',
  plano_saude: '',
  numero_carteirinha: '',
  Cid_Diagnostico: [],
  Data_Primeira_Solicitacao: '',
  telefone: '',
  email: '',
  endereco: '',
  observacoes: '',
  setor_prestador: '',
  clinica_id: 1,
  // Campos adicionais para o popup
  peso: '',
  altura: '',
  contato_emergencia_nome: '',
  contato_emergencia_telefone: '',
  medico_assistente_nome: '',
  medico_assistente_email: '',
  medico_assistente_telefone: '',
  medico_assistente_especialidade: ''
};

// Mapeamento de operadoras (nome para ID e vice-versa)
const OPERADORAS_MAP = {
  1: 'Unimed',
  2: 'Amil', 
  3: 'SulAmérica',
  4: 'Bradesco',
  5: 'Porto Seguro'
} as const;

const OPERADORAS_REVERSE_MAP = {
  'Unimed': 1,
  'Amil': 2,
  'SulAmérica': 3, 
  'Bradesco': 4,
  'Porto Seguro': 5
} as const;

// Função para obter o nome da operadora
const getOperadoraName = (operadora: string | number | undefined | null): string => {
  if (operadora === undefined || operadora === null) {
    return '';
  }
  if (typeof operadora === 'number') {
    return OPERADORAS_MAP[operadora as keyof typeof OPERADORAS_MAP] || `Operadora ${operadora}`;
  }
  return operadora || '';
};

// Função para obter o ID da operadora
const getOperadoraId = (operadora: string): number => {
  return OPERADORAS_REVERSE_MAP[operadora as keyof typeof OPERADORAS_REVERSE_MAP] || 1;
};

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoFromAPI[]>([]);
  const [cidOptions, setCidOptions] = useState<CatalogCidItem[]>([]);
  const [cidSearch, setCidSearch] = useState('');
  const [cidTotal, setCidTotal] = useState(0);
  const [cidLimit] = useState(100);
  const [cidOffset, setCidOffset] = useState(0);
  const [cidLoading, setCidLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cidFilter, setCidFilter] = useState('all');
  const [protocoloFilter, setProtocoloFilter] = useState('all');
  const [operadoraFilter, setOperadoraFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient>(emptyPatient);
  const [isEditing, setIsEditing] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [deleteAlert, setDeleteAlert] = useState<{ isOpen: boolean; patient: Patient | null }>({ isOpen: false, patient: null });
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [protocolosOptions, setProtocolosOptions] = useState<Array<{value: string, label: string}>>([]);
  const [operadorasOptions, setOperadorasOptions] = useState<Array<{value: string, label: string}>>([]);
  const [prestadoresOptions, setPrestadoresOptions] = useState<Array<{value: string, label: string, id: number}>>([]);
  const [clinicaOperadoraId, setClinicaOperadoraId] = useState<number | null>(null);
  const [operadoraFilterManual, setOperadoraFilterManual] = useState(false); // Rastrear se operadora foi selecionada manualmente
  const { navigateWithTransition } = usePageNavigation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const itemsPerPage = 50;

  // Adicionar estilos CSS dinamicamente
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = patientCardStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Testar conexão com backend ao carregar
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Carregar protocolos da clínica logada
  useEffect(() => {
    if (backendConnected) {
      loadProtocolosFromAPI();
      loadOperadorasFromAPI();
      loadPrestadoresFromAPI();
    }
  }, [backendConnected]);

  // Pré-selecionar operadora quando o formulário for aberto
  useEffect(() => {
    if (isDialogOpen && !isEditing && operadorasOptions.length > 0 && user) {
      // Se não há operadora selecionada, tentar pré-selecionar
      if (!currentPatient.Operadora) {
        // Primeiro, tentar buscar a operadora específica da clínica
        const clinicaId = user?.clinica_id || user?.id || 1;
        OperadoraService.getOperadoraByClinica(clinicaId).then(operadoraClinica => {
          if (operadoraClinica) {
            setCurrentPatient(prev => ({
              ...prev,
              Operadora: operadoraClinica.nome
            }));
          } else if (operadorasOptions.length > 0) {
            setCurrentPatient(prev => ({
              ...prev,
              Operadora: operadorasOptions[0].value
            }));
          }
        }).catch(error => {
          console.error('❌ Erro ao buscar operadora para pré-seleção:', error);
          if (operadorasOptions.length > 0) {
            setCurrentPatient(prev => ({
              ...prev,
              Operadora: operadorasOptions[0].value
            }));
          }
        });
      }
    }
  }, [isDialogOpen, isEditing, operadorasOptions, user]);

  // Pré-selecionar operadora da clínica no filtro quando carregada
  useEffect(() => {
    // Só pré-selecionar se:
    // 1. As operadoras foram carregadas
    // 2. O usuário está logado
    // 3. O filtro ainda está em 'all'
    // 4. Foi encontrada a operadora da clínica
    if (operadorasOptions.length > 0 && user && operadoraFilter === 'all') {
      const clinicaId = user?.clinica_id || user?.id || 1;
      
      OperadoraService.getOperadoraByClinica(clinicaId)
        .then(operadoraClinica => {
          if (operadoraClinica) {
            setOperadoraFilter(operadoraClinica.nome);
            // NÃO marcar como manual - é pré-seleção automática
            setOperadoraFilterManual(false);
          }
        })
        .catch(error => {
          console.error('❌ Erro ao buscar operadora para filtro:', error);
        });
    }
  }, [operadorasOptions, user]);

  // Recarregar dados quando mudar página, busca ou filtros
  useEffect(() => {
    if (backendConnected) {
      loadPatientsFromAPI();
    }
  }, [currentPage, searchTerm, sortBy, statusFilter, cidFilter, protocoloFilter, operadoraFilter, backendConnected]);

  // Resetar página quando filtros mudarem (exceto busca que já tem reset automático)
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [sortBy, statusFilter, cidFilter, protocoloFilter, operadoraFilter]);

  useEffect(() => {
    if (backendConnected) {
      SolicitacaoService.listarSolicitacoes({ page: 1, limit: 10000 }).then(result => {
        setSolicitacoes(result.data);
      });
    }
  }, [backendConnected]);

  useEffect(() => {
    let active = true;
    (async () => {
      setCidLoading(true);
      const { items, total } = await CatalogService.searchCid10Paged({ search: cidSearch, limit: cidLimit, offset: 0 });
      if (!active) return;
      setCidOptions(items);
      setCidTotal(total);
      setCidOffset(items.length);
      setCidLoading(false);
    })();
    return () => { active = false; };
  }, [cidSearch, cidLimit]);

  const handleLoadMoreCid = async () => {
    if (cidLoading) return;
    if (cidOptions.length >= cidTotal) return;
    setCidLoading(true);
    const { items } = await CatalogService.searchCid10Paged({ search: cidSearch, limit: cidLimit, offset: cidOffset });
    setCidOptions(prev => [...prev, ...items]);
    setCidOffset(prev => prev + items.length);
    setCidLoading(false);
  };

  const checkBackendConnection = async () => {
    const connected = await testarConexaoBackend();
    setBackendConnected(connected);

    if (connected) {
      const dbConnected = await testarConexaoBanco();
      if (dbConnected) {} else {
        toast.warning('Backend conectado, mas banco com problemas');
        setPatients(initialPatients);
        setLoading(false);
      }
    } else {
      toast.error('Backend não está conectado', {
        description: 'Usando dados locais. Inicie o servidor Node.js na porta 3001'
      });
      setPatients(initialPatients);
      setTotalPatients(initialPatients.length);
      setTotalPages(Math.ceil(initialPatients.length / itemsPerPage));
      setLoading(false);
    }
  };

  const loadProtocolosFromAPI = async () => {
    try {
      const result = await ProtocoloService.listarProtocolos({ page: 1, limit: 1000 });

      const protocolos = result.data.map(protocolo => ({
        value: protocolo.nome,
        label: protocolo.nome
      }));

      setProtocolosOptions(protocolos);
    } catch (error) {
      console.error('❌ Erro ao carregar protocolos:', error);
      // Em caso de erro, manter opções padrão
      setProtocolosOptions([
        { value: 'AC-T', label: 'AC-T' },
        { value: 'FEC', label: 'FEC' },
        { value: 'Carboplatina', label: 'Carboplatina' },
        { value: 'Cisplatina', label: 'Cisplatina' },
        { value: 'Paclitaxel', label: 'Paclitaxel' }
      ]);
    }
  };

  // Carregar operadoras do banco de dados
  const loadOperadorasFromAPI = async () => {
    try {
      const clinicaId = user?.clinica_id || user?.id || 1;

      // Buscar todas as operadoras
      const operadoras = await OperadoraService.getAllOperadoras();

      const operadorasOptions = operadoras.map(operadora => ({
        value: operadora.nome,
        label: operadora.nome
      }));

      setOperadorasOptions(operadorasOptions);
      const operadoraClinica = await OperadoraService.getOperadoraByClinica(clinicaId);

      if (operadoraClinica) {
        setClinicaOperadoraId(operadoraClinica.id || 1);

        if (!currentPatient.Operadora && !isEditing) {
          setCurrentPatient(prev => {
            const updated = {
              ...prev,
              Operadora: operadoraClinica.nome
            };
            return updated;
          });
        }
      } else {
        // Fallback: usar a primeira operadora disponível
        if (operadoras.length > 0) {
          setClinicaOperadoraId(operadoras[0].id || 1);
          if (!currentPatient.Operadora && !isEditing) {
            setCurrentPatient(prev => ({
              ...prev,
              Operadora: operadoras[0].nome
            }));
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar operadoras:', error);
      // Em caso de erro, manter opções padrão
      setOperadorasOptions([
        { value: 'Unimed', label: 'Unimed' },
        { value: 'Bradesco Saúde', label: 'Bradesco Saúde' },
        { value: 'SulAmérica', label: 'SulAmérica' },
        { value: 'Amil', label: 'Amil' },
        { value: 'Porto Seguro', label: 'Porto Seguro' }
      ]);
    }
  };

  // Carregar prestadores (médicos) da clínica
  const loadPrestadoresFromAPI = async () => {
    try {
      const clinicaId = user?.clinica_id || user?.id || 1;
      const prestadores = await PrestadorService.getPrestadoresByClinica(clinicaId);

      const prestadoresOptions = prestadores.map(prestador => ({
        value: prestador.id.toString(),
        label: `${prestador.nome}${prestador.especialidade_principal || prestador.especialidade ? ` - ${prestador.especialidade_principal || prestador.especialidade}` : ''}`,
        id: prestador.id
      }));

      setPrestadoresOptions(prestadoresOptions);
    } catch (error) {
      console.error('❌ Erro ao carregar prestadores:', error);
      // Em caso de erro, manter opções padrão
      setPrestadoresOptions([
        { value: 'Dr. Carlos Santos', label: 'Dr. Carlos Santos - Oncologia' },
        { value: 'Dra. Maria Silva', label: 'Dra. Maria Silva - Hematologia' },
        { value: 'Dr. João Oliveira', label: 'Dr. João Oliveira - Oncologia' },
        { value: 'Dra. Ana Costa', label: 'Dra. Ana Costa - Radioterapia' },
        { value: 'Dr. Pedro Lima', label: 'Dr. Pedro Lima - Cirurgia Oncológica' }
      ]);
    }
  };

  const loadPatientsFromAPI = async () => {
    if (!backendConnected) {
      return;
    }

    setLoading(true);
    try {
      const result = await PacienteService.listarPacientes({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        sortBy,
        statusFilter: statusFilter === 'all' ? undefined : statusFilter,
        cidFilter: cidFilter === 'all' ? undefined : cidFilter,
        protocoloFilter: protocoloFilter === 'all' ? undefined : protocoloFilter,
        operadoraFilter: operadoraFilter === 'all' ? undefined : operadoraFilter
      });

      // Debug: Verificar campos do médico assistente
      if (result.data && result.data.length > 0) {
        const firstPatient = result.data[0];
      }

      setPatients(result.data);
      setTotalPatients(result.pagination.total);
      setTotalPages(result.pagination.totalPages);

      if (result.data.length === 0 && (searchTerm || statusFilter !== 'all' || cidFilter !== 'all' || protocoloFilter !== 'all' || (operadoraFilterManual && operadoraFilter !== 'all'))) {
        toast.info('Nenhum paciente encontrado para os filtros aplicados');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar pacientes da API:', error);
      const isServiceUnavailable = (error as any)?.message?.includes('503') || (error as any)?.toString?.().includes('503');
      toast.error(isServiceUnavailable ? 'Serviço temporariamente indisponível' : 'Erro ao carregar pacientes do banco', {
        description: isServiceUnavailable ? 'Mostrando últimos dados disponíveis' : 'Verifique a conexão com o servidor'
      });
      // Em caso de erro: se já temos dados carregados, mantém. Caso contrário, usar dados locais.
      setPatients(prev => (prev && prev.length > 0 ? prev : initialPatients));
      setTotalPatients(prev => (prev && prev > 0 ? prev : initialPatients.length));
      setTotalPages(prev => (prev && prev > 0 ? prev : Math.ceil(initialPatients.length / itemsPerPage)));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar e ordenar pacientes (apenas para dados locais)
  const filteredAndSortedPatients = useMemo(() => {
    // Filtrar apenas para dados locais
    let filtered = patients.filter(patient => {
      // Filtro de busca (nome, diagnóstico, número da carteirinha, CPF, operadora)
      if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        const patientName = (patient.name || '').toString();
        const patientDiagnosis = (patient.diagnosis || '').toString();
        const patientOperadoraName = getOperadoraName(patient.Operadora) || '';
        
        const matchesSearch = 
          patientName.toLowerCase().includes(term) ||
          patientDiagnosis.toLowerCase().includes(term) ||
          (patient.numero_carteirinha && typeof patient.numero_carteirinha === 'string' && patient.numero_carteirinha.toLowerCase().includes(term)) ||
          (patient.cpf && typeof patient.cpf === 'string' && patient.cpf.toLowerCase().includes(term)) ||
          (patientOperadoraName && patientOperadoraName.toLowerCase().includes(term));
        
        if (!matchesSearch) {
          return false;
        }
      }
      
      // Filtro de status
      if (statusFilter && statusFilter !== 'all') {
        const patientStatus = patient.status || '';
        const filterValue = typeof statusFilter === 'string' ? statusFilter : String(statusFilter || '');
        const matchesStatus = patientStatus.toLowerCase().includes(filterValue.toLowerCase());
        if (!matchesStatus) {
          return false;
        }
      }
      
      // Filtro de CID
      if (cidFilter && cidFilter !== 'all') {
        const cids = Array.isArray(patient.Cid_Diagnostico) ? patient.Cid_Diagnostico : [patient.Cid_Diagnostico || ''];
        const filterValue = typeof cidFilter === 'string' ? cidFilter : String(cidFilter || '');
        const matchesCid = cids.some(cid => cid && typeof cid === 'string' && cid.toLowerCase().includes(filterValue.toLowerCase()));
        if (!matchesCid) {
          return false;
        }
      }
      
      // Filtro de Protocolo (tratamento)
      if (protocoloFilter && protocoloFilter !== 'all') {
        const patientTreatment = patient.treatment || '';
        const filterValue = typeof protocoloFilter === 'string' ? protocoloFilter : String(protocoloFilter || '');
        const matchesProtocolo = patientTreatment.toLowerCase().includes(filterValue.toLowerCase());
        if (!matchesProtocolo) {
          return false;
        }
      }
      
      // Filtro de Operadora
      if (operadoraFilter && operadoraFilter !== 'all') {
        // Obter o nome da operadora do paciente (pode ser string ou número)
        const patientOperadoraName = getOperadoraName(patient.Operadora) || '';
        
        // Verificar se a operadora do paciente corresponde ao filtro selecionado
        if (!patientOperadoraName) {
          return false; // Se não tem operadora, não corresponde ao filtro
        }
        
        // Garantir que operadoraFilter seja uma string antes de chamar toLowerCase
        const filterValue = typeof operadoraFilter === 'string' ? operadoraFilter : String(operadoraFilter || '');
        const matchesOperadora = patientOperadoraName.toLowerCase() === filterValue.toLowerCase();
        
        if (!matchesOperadora) {
          return false;
        }
      }
      
      return true;
    });

    // Ordenar apenas para dados locais
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.startDate.split('/').reverse().join('-')).getTime() - 
                 new Date(a.startDate.split('/').reverse().join('-')).getTime();
        case 'oldest':
          return new Date(a.startDate.split('/').reverse().join('-')).getTime() - 
                 new Date(b.startDate.split('/').reverse().join('-')).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [patients, searchTerm, statusFilter, cidFilter, protocoloFilter, operadoraFilter, sortBy, backendConnected]);

  // Paginação para dados locais
  const displayedPatients = useMemo(() => {
    // Para ambos os casos (backend e local), aplicar paginação local para melhor controle
    const localTotalPages = Math.ceil(filteredAndSortedPatients.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedPatients = filteredAndSortedPatients.slice(startIndex, startIndex + itemsPerPage);

    // Atualizar o estado de paginação
    if (totalPages !== localTotalPages) {
      setTotalPages(localTotalPages);
      setTotalPatients(filteredAndSortedPatients.length);
    }

    return paginatedPatients;
  }, [filteredAndSortedPatients, currentPage, totalPages, itemsPerPage, backendConnected]);

  // Função para filtrar solicitações do paciente
  const getSolicitacoesDoPaciente = (pacienteId: number): Authorization[] => {
    return solicitacoes
      .filter(s => s.paciente_id === pacienteId)
      .map(s => ({
        id: s.id,
        numero_autorizacao: s.numero_autorizacao || `#${s.id}`,
        status: s.status,
        data_solicitacao: s.data_solicitacao,
        diagnostico_descricao: s.diagnostico_descricao,
        hospital_nome: s.hospital_nome,
        ciclo_atual: s.ciclo_atual,
        ciclos_previstos: s.ciclos_previstos,
        medicamentos_antineoplasticos: s.medicamentos_antineoplasticos,
        finalidade: s.finalidade,
        siglas: (s as any).siglas
      }));
  };

  const handleAddNew = () => {
    setIsEditing(false);
    setCurrentPatient(emptyPatient);
    setValidationErrors({});
    setIsDialogOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
    setStatusFilter('all');
    setCidFilter('all');
    setProtocoloFilter('all');
    setOperadoraFilter('all');
    setOperadoraFilterManual(false); // Resetar flag de seleção manual
    setCurrentPage(1);
    
    // Após resetar, re-aplicar a pré-seleção automática da operadora da clínica
    const clinicaId = user?.clinica_id || user?.id || 1;
    OperadoraService.getOperadoraByClinica(clinicaId)
      .then(operadoraClinica => {
        if (operadoraClinica) {
          setOperadoraFilter(operadoraClinica.nome);
          setOperadoraFilterManual(false);
        }
      })
      .catch(error => {
        console.error('❌ Erro ao re-aplicar pré-seleção:', error);
      });
  };

  const handleEdit = async (id: string) => {
    const patientToEdit = patients.find(patient => patient.id === id);
    if (patientToEdit) {
      // Buscar dados atualizados do backend para garantir que temos os dados mais recentes
      try {
        const pacienteAtualizado = await PacienteService.buscarPaciente(parseInt(id));
        console.log(`🔍 [Patients.handleEdit] Dados do paciente buscados do backend:`, pacienteAtualizado);
        
        // Converter datas ISO para formato brasileiro para edição
        // Verificar se há um prestador_id no paciente ou se o nome corresponde a um prestador
        const medicoNome = pacienteAtualizado.medico_assistente_nome || '';
        let prestadorId: string = '';
        
        // Se o paciente tem prestador_id, usar esse ID
        if ((pacienteAtualizado as any).prestador_id) {
          prestadorId = (pacienteAtualizado as any).prestador_id.toString();
        } else {
          // Caso contrário, tentar encontrar pelo nome
          const prestadorCorrespondente = prestadoresOptions.find(
            opt => opt.label.includes(medicoNome) || opt.label === medicoNome
          );
          if (prestadorCorrespondente) {
            prestadorId = prestadorCorrespondente.value;
          }
        }
        
        const patientForEdit = {
          ...pacienteAtualizado,
          Data_Nascimento: convertFromISODate(pacienteAtualizado.Data_Nascimento),
          startDate: convertFromISODate(pacienteAtualizado.startDate),
          // Se encontrou um prestador correspondente, usar o ID no Prestador
          // Caso contrário, manter medico_assistente_nome para o input de texto
          Prestador: prestadorId,
          medico_assistente_nome: prestadorId ? '' : medicoNome,
          // Garantir que os campos do médico assistente sejam carregados
          medico_assistente_email: pacienteAtualizado.medico_assistente_email || '',
          medico_assistente_telefone: pacienteAtualizado.medico_assistente_telefone || '',
          medico_assistente_especialidade: pacienteAtualizado.medico_assistente_especialidade || ''
        };
        
        console.log(`✅ [Patients.handleEdit] Paciente preparado para edição:`, patientForEdit);
        console.log(`   - medico_assistente_nome: "${patientForEdit.medico_assistente_nome}"`);
        console.log(`   - Prestador: "${patientForEdit.Prestador}"`);
        console.log(`   - prestadorCorrespondente encontrado:`, prestadorCorrespondente ? 'Sim' : 'Não');
        
        setCurrentPatient(patientForEdit);
        setIsEditing(true);
        setValidationErrors({});
        setIsDialogOpen(true);
      } catch (error) {
        console.error('❌ [Patients.handleEdit] Erro ao buscar paciente atualizado, usando dados locais:', error);
        // Fallback: usar dados locais se a busca falhar
        const patientForEdit = {
          ...patientToEdit,
          Data_Nascimento: convertFromISODate(patientToEdit.Data_Nascimento),
          startDate: convertFromISODate(patientToEdit.startDate)
        };
        setCurrentPatient(patientForEdit);
        setIsEditing(true);
        setValidationErrors({});
        setIsDialogOpen(true);
      }
    }
  };

  const handleDelete = (id: string) => {
    const patientToDelete = patients.find(patient => patient.id === id);
    if (patientToDelete) {
      setDeleteAlert({ isOpen: true, patient: patientToDelete });
    }
  };

  const confirmDelete = async () => {
    if (!deleteAlert.patient) return;

    if (backendConnected) {
      try {
        await PacienteService.deletarPaciente(parseInt(deleteAlert.patient.id));
        toast.success('Paciente excluído com sucesso!');
        // Recarregar dados da API
        await loadPatientsFromAPI();
      } catch (error) {
        console.error('Erro ao excluir paciente:', error);
        toast.error('Erro ao excluir paciente');
      }
    } else {
      setPatients(patients.filter(patient => patient.id !== deleteAlert.patient!.id));
      toast.success('Paciente removido localmente!');
    }
    
    setDeleteAlert({ isOpen: false, patient: null });
  };

  const handleShowInfo = (id: string) => {
    const patient = patients.find(p => p.id === id);
    if (patient) {
      setSelectedPatient(patient);
      setIsInfoDialogOpen(true);
    }
  };

  const handleSubmit = async () => {
    // Validação completa antes de enviar
    const errors: {[key: string]: string} = {};
    
    // Campos obrigatórios
    if (!currentPatient.Paciente_Nome?.trim()) errors.Paciente_Nome = 'Nome é obrigatório';
    if (!currentPatient.Data_Nascimento?.trim()) errors.Data_Nascimento = 'Data de nascimento é obrigatória';
    const cids = Array.isArray(currentPatient.Cid_Diagnostico) ? currentPatient.Cid_Diagnostico : [currentPatient.Cid_Diagnostico || ''];
    if (cids.length === 0 || cids.every(cid => !cid?.trim())) errors.Cid_Diagnostico = 'Pelo menos um CID diagnóstico é obrigatório';
    if (!currentPatient.stage?.trim()) errors.stage = 'Estágio é obrigatório';
    if (!currentPatient.treatment?.trim()) errors.treatment = 'Tratamento é obrigatório';
    if (!currentPatient.startDate?.trim()) errors.startDate = 'Data de início é obrigatória';
    if (!currentPatient.status?.trim()) errors.status = 'Status é obrigatório';
    if (!currentPatient.Operadora?.trim()) errors.Operadora = 'Operadora é obrigatória';
    // Validar médico assistente: pode ser Prestador (do select) ou medico_assistente_nome (digitado)
    if (!currentPatient.Prestador?.trim() && !currentPatient.medico_assistente_nome?.trim()) {
      errors.Prestador = 'Médico Assistente é obrigatório';
    }
    
    // Validações específicas
    if (currentPatient.cpf && !validateCPF(currentPatient.cpf)) {
      errors.cpf = 'CPF inválido';
    }
    if (currentPatient.Data_Nascimento && !validateDate(currentPatient.Data_Nascimento)) {
      errors.Data_Nascimento = 'Data de nascimento inválida';
    }
    if (currentPatient.startDate && !validateDate(currentPatient.startDate)) {
      errors.startDate = 'Data de início inválida';
    }
    if (currentPatient.telefone && !validateTelefone(currentPatient.telefone)) {
      errors.telefone = 'Telefone inválido';
    }
    if (currentPatient.email && !validateEmail(currentPatient.email)) {
      errors.email = 'E-mail inválido';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('Corrija os erros no formulário antes de continuar');
      return;
    }
    
    // Limpar erros se chegou até aqui
    setValidationErrors({});
    
    if (backendConnected) {
      setLoading(true);
      try {
        // Preparar dados com conversão de datas
        // Se medico_assistente_nome foi fornecido, não incluir Prestador no spread
        const { Prestador, ...patientWithoutPrestador } = currentPatient;
        const dadosParaEnvio: any = {
          ...(currentPatient.medico_assistente_nome && currentPatient.medico_assistente_nome.trim() !== '' 
            ? patientWithoutPrestador 
            : currentPatient),
          // Garantir que as datas estejam no formato correto para o backend
          Data_Nascimento: convertToISODate(currentPatient.Data_Nascimento),
          Data_Primeira_Solicitacao: convertToISODate(currentPatient.startDate),
          // Garantir que Operadora seja número se necessário
          Operadora: typeof currentPatient.Operadora === 'string' ? getOperadoraId(currentPatient.Operadora) : currentPatient.Operadora,
          // Adicionar clinica_id se não existir
          clinica_id: currentPatient.clinica_id || 1
        };
        
        // Lógica para Prestador e medico_assistente_*
        // Se Prestador (ID) está selecionado, enviar o ID e também os campos medico_assistente_* para atualizar
        // Se apenas medico_assistente_nome está preenchido (digitado manualmente), enviar apenas medico_assistente_*
        if (currentPatient.Prestador && currentPatient.Prestador.trim() !== '') {
          // Prestador selecionado do dropdown - enviar ID e campos para atualizar
          const prestadorId = typeof currentPatient.Prestador === 'string' 
            ? parseInt(currentPatient.Prestador) 
            : currentPatient.Prestador;
          if (!isNaN(prestadorId)) {
            dadosParaEnvio.Prestador = prestadorId;
            // Também enviar campos medico_assistente_* para atualizar as informações no banco
            if (currentPatient.medico_assistente_nome) {
              dadosParaEnvio.medico_assistente_nome = currentPatient.medico_assistente_nome;
            }
            if (currentPatient.medico_assistente_email !== undefined) {
              dadosParaEnvio.medico_assistente_email = currentPatient.medico_assistente_email || null;
            }
            if (currentPatient.medico_assistente_telefone !== undefined) {
              dadosParaEnvio.medico_assistente_telefone = currentPatient.medico_assistente_telefone || null;
            }
            if (currentPatient.medico_assistente_especialidade !== undefined) {
              dadosParaEnvio.medico_assistente_especialidade = currentPatient.medico_assistente_especialidade || null;
            }
            console.log(`🔍 [Patients.handleSubmit] Prestador selecionado (ID: ${prestadorId}), enviando campos para atualizar`);
          }
        } else if (currentPatient.medico_assistente_nome && currentPatient.medico_assistente_nome.trim() !== '') {
          // Apenas medico_assistente_nome preenchido (digitado manualmente) - não enviar Prestador
          delete dadosParaEnvio.Prestador;
          console.log(`🔍 [Patients.handleSubmit] Apenas medico_assistente_nome fornecido: "${currentPatient.medico_assistente_nome}"`);
        }
        
        if (isEditing) {
          const pacienteAtualizado = await PacienteService.atualizarPaciente(parseInt(currentPatient.id!), dadosParaEnvio);
          console.log(`✅ [Patients.handleSubmit] Paciente atualizado, dados retornados:`, pacienteAtualizado);
          toast.success('Paciente atualizado com sucesso!');
          
          // Atualizar o paciente na lista local imediatamente
          setPatients(prevPatients => 
            prevPatients.map(p => 
              p.id === currentPatient.id ? pacienteAtualizado : p
            )
          );
        } else {
          await PacienteService.criarPaciente(dadosParaEnvio);
          toast.success('Paciente criado com sucesso!');
        }
        
        setIsDialogOpen(false);
        // Recarregar dados da API para garantir sincronização
        await loadPatientsFromAPI();
      } catch (error) {
        console.error('Erro ao salvar paciente:', error);
        toast.error(error instanceof Error ? error.message : 'Erro ao salvar paciente');
      } finally {
        setLoading(false);
      }
    } else {
      // Usar lógica local existente
      const updatedPatient = {
        ...currentPatient,
        name: currentPatient.Paciente_Nome,
        age: calculateAge(convertToISODate(currentPatient.Data_Nascimento)),
        gender: currentPatient.Sexo,
        diagnosis: Array.isArray(currentPatient.Cid_Diagnostico) 
          ? currentPatient.Cid_Diagnostico.join(', ') 
          : currentPatient.Cid_Diagnostico,
        // Converter datas para formato interno
        Data_Nascimento: convertToISODate(currentPatient.Data_Nascimento),
        startDate: convertToISODate(currentPatient.startDate)
      };
      
      if (isEditing) {
        setPatients(patients.map(patient => 
          patient.id === updatedPatient.id ? updatedPatient : patient
        ));
        toast.success('Paciente atualizado localmente!');
      } else {
        const newPatient = {
          ...updatedPatient,
          id: Date.now().toString(),
        };
        setPatients([...patients, newPatient]);
        toast.success('Paciente criado localmente!');
      }
      
      setIsDialogOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;
    let newErrors = { ...validationErrors };

    // Aplicar formatação específica para cada campo
    switch (name) {
      case 'cpf':
        formattedValue = formatCPF(value);
        // Validar CPF se o campo estiver completo
        if (formattedValue.length === 14) {
          if (!validateCPF(formattedValue)) {
            newErrors.cpf = 'CPF inválido';
          } else {
            delete newErrors.cpf;
          }
        } else {
          delete newErrors.cpf;
        }
        break;
      case 'telefone':
        formattedValue = formatTelefone(value);
        if (!validateTelefone(formattedValue)) {
          newErrors.telefone = 'Telefone inválido';
        } else {
          delete newErrors.telefone;
        }
        break;
      case 'contato_emergencia_telefone':
        formattedValue = formatTelefone(value);
        if (!validateTelefone(formattedValue)) {
          (newErrors as any).contato_emergencia_telefone = 'Telefone inválido';
        } else {
          delete (newErrors as any).contato_emergencia_telefone;
        }
        break;
      case 'endereco_cep':
        formattedValue = formatCEP(value);
        break;
      case 'Data_Nascimento':
        formattedValue = formatDateInput(value);
        break;
      case 'startDate':
        formattedValue = formatDateInput(value);
        break;
      case 'numero_carteirinha':
        formattedValue = formatCarteirinha(value);
        break;
      case 'rg':
        formattedValue = formatRG(value);
        break;
      case 'email':
        formattedValue = value.toLowerCase();
        if (formattedValue && !validateEmail(formattedValue)) {
          newErrors.email = 'E-mail inválido';
        } else {
          delete newErrors.email;
        }
        break;
      case 'Paciente_Nome':
        // Capitalizar apenas a primeira letra, mantendo o resto como digitado
        formattedValue = value.charAt(0).toUpperCase() + value.slice(1);
        break;
      case 'Cid_Diagnostico':
        // Para arrays de CIDs, não aplicar formatação aqui (será feita pelo componente)
        formattedValue = value;
        break;
      default:
        formattedValue = value;
        break;
    }

    setValidationErrors(newErrors);
    setCurrentPatient({
      ...currentPatient,
      [name]: formattedValue,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentPatient({
      ...currentPatient,
      [name]: value,
    });
  };

  const handleCidSelectChange = (cids: string[]) => {
    setCurrentPatient({
      ...currentPatient,
      Cid_Diagnostico: cids,
    });
  };

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Pacientes
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative max-w-xs">
              <Search className={`absolute left-2.5 top-2.5 h-4 w-4 ${
                searchTerm ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <Input
                placeholder="Buscar pacientes..."
                className={`pl-8 transition-all duration-300 focus:ring-2 focus:ring-primary/20 ${
                  searchTerm ? 'border-primary bg-primary/5' : ''
                }`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                  onClick={() => setSearchTerm('')}
                >
                  ×
                </Button>
              )}
            </div>
            
            <Button 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-105 hover:shadow-lg" 
              onClick={handleAddNew}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Paciente
            </Button>
          </div>
        </div>
      </AnimatedSection>

      {/* Filtros */}
      <AnimatedSection delay={100}>
        <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className={`w-40 ${sortBy !== 'newest' ? 'border-primary bg-primary/5' : ''}`}>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recente</SelectItem>
              <SelectItem value="oldest">Mais antigo</SelectItem>
              <SelectItem value="name">Nome (A-Z)</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`w-40 ${statusFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="em tratamento">Em tratamento</SelectItem>
              <SelectItem value="em remissão">Em remissão</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
            </SelectContent>
          </Select>

          <Select value={cidFilter} onValueChange={setCidFilter}>
            <SelectTrigger className={`w-40 ${cidFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <SelectValue placeholder="CID" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os CIDs</SelectItem>
              <SelectItem value="C50">C50 - Mama</SelectItem>
              <SelectItem value="C78">C78 - Metástases</SelectItem>
              <SelectItem value="C34">C34 - Pulmão</SelectItem>
              <SelectItem value="C18">C18 - Cólon</SelectItem>
              <SelectItem value="C16">C16 - Estômago</SelectItem>
            </SelectContent>
          </Select>

          <Select value={protocoloFilter} onValueChange={setProtocoloFilter}>
            <SelectTrigger className={`w-40 ${protocoloFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <SelectValue placeholder="Protocolo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os protocolos</SelectItem>
              {protocolosOptions.map((protocolo) => (
                <SelectItem key={protocolo.value} value={protocolo.value}>
                  {protocolo.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select 
            value={operadoraFilter} 
            onValueChange={(value) => {
              setOperadoraFilter(value);
              // Marcar como seleção manual quando usuário muda o filtro
              setOperadoraFilterManual(true);
            }}
          >
            <SelectTrigger className={`w-40 ${operadoraFilterManual && operadoraFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <SelectValue placeholder="Operadora" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as operadoras</SelectItem>
              {operadorasOptions.map(operadora => (
                <SelectItem key={operadora.value} value={operadora.value}>
                  {operadora.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto">

            
            {(searchTerm || statusFilter !== 'all' || cidFilter !== 'all' || protocoloFilter !== 'all' || (operadoraFilterManual && operadoraFilter !== 'all') || sortBy !== 'newest') && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="text-xs"
              >
                Limpar Filtros
              </Button>
            )}
            <div className="text-sm text-muted-foreground">
              {filteredAndSortedPatients.length} paciente(s) encontrado(s)
            </div>
          </div>
        </div>
      </AnimatedSection>
      
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {displayedPatients.length === 0 && !loading ? (
        <AnimatedSection delay={200}>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Nenhum paciente encontrado</h3>
            <p className="text-muted-foreground mt-2">
              {(searchTerm || statusFilter !== 'all' || cidFilter !== 'all' || protocoloFilter !== 'all' || (operadoraFilterManual && operadoraFilter !== 'all')) ? 
                'Tente mudar sua busca ou filtros, ou adicione um novo paciente' :
                'Nenhum paciente cadastrado ainda. Adicione o primeiro paciente!'
              }
            </p>
            
            <Button 
              variant="outline"
              className="mt-6 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              onClick={handleAddNew}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar paciente
            </Button>
          </div>
        </AnimatedSection>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayedPatients.map((patient, index) => (
              <AnimatedSection key={patient.id} delay={100 * index}>
                <PatientCard 
                  patient={{ ...patient, authorizations: getSolicitacoesDoPaciente(parseInt(patient.id)) }} 
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onShowInfo={handleShowInfo}
                />
              </AnimatedSection>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}

      {/* Alert de Confirmação Moderno */}
      <ModernAlert
        isOpen={deleteAlert.isOpen}
        onClose={() => setDeleteAlert({ isOpen: false, patient: null })}
        onConfirm={confirmDelete}
        title="Confirmar Exclusão"
        description="Tem certeza que deseja excluir o paciente"
        type="delete"
        patientName={deleteAlert.patient?.name}
      />
      
      {/* Modal de Adicionar/Editar Paciente */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-hide">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Paciente' : 'Adicionar Novo Paciente'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md border border-muted">
            <div className="flex items-center gap-2">
              <Info className="h-3 w-3 opacity-60" />
              <span>Campos com formatação automática - digite normalmente</span>
            </div>
          </div>
          
          <div className="space-y-4">
                          <Tabs defaultValue="dados-pessoais" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="dados-pessoais">Dados Pessoais</TabsTrigger>
                  <TabsTrigger value="dados-autorizacao">Dados Autorização</TabsTrigger>
                  <TabsTrigger value="dados-medicos">Informações de Saúde</TabsTrigger>
                  <TabsTrigger value="dados-contato">Dados de Contato</TabsTrigger>
              </TabsList>

              <TabsContent value="dados-pessoais" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="Paciente_Nome">Nome do Paciente *</Label>
                    <Input
                      id="Paciente_Nome"
                      name="Paciente_Nome"
                      value={currentPatient.Paciente_Nome}
                      onChange={handleInputChange}
                      placeholder="Digite o nome completo"
                      required
                      className={`transition-all duration-300 focus:border-primary ${
                        validationErrors.Paciente_Nome ? 'border-red-500' : ''
                      }`}
                    />
                    {validationErrors.Paciente_Nome && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.Paciente_Nome}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      value={currentPatient.cpf}
                      onChange={handleInputChange}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      className={`transition-all duration-300 focus:border-primary ${
                        validationErrors.cpf ? 'border-red-500' : ''
                      }`}
                    />
                    {validationErrors.cpf && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.cpf}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      name="rg"
                      value={currentPatient.rg}
                      onChange={handleInputChange}
                      placeholder="00.000.000-0"
                      maxLength={12}
                      className={`transition-all duration-300 focus:border-primary ${
                        validationErrors.rg ? 'border-red-500' : ''
                      }`}
                    />
                    {validationErrors.rg && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.rg}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="Data_Nascimento">Data de Nascimento *</Label>
                    <Input
                      id="Data_Nascimento"
                      name="Data_Nascimento"
                      value={currentPatient.Data_Nascimento}
                      onChange={handleInputChange}
                      placeholder="DD/MM/AAAA"
                      required
                      maxLength={10}
                      className={`transition-all duration-300 focus:border-primary ${
                        validationErrors.Data_Nascimento ? 'border-red-500' : ''
                      }`}
                    />
                    {validationErrors.Data_Nascimento && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.Data_Nascimento}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="Sexo">Sexo</Label>
                    <Select
                      value={currentPatient.Sexo}
                      onValueChange={(value) => handleSelectChange('Sexo', value)}
                    >
                      <SelectTrigger className="transition-all duration-300 focus:border-primary">
                        <SelectValue placeholder="Selecione o sexo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

                             <TabsContent value="dados-autorizacao" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plano_saude">Plano</Label>
                    <Input
                      id="plano_saude"
                      name="plano_saude"
                      value={currentPatient.plano_saude}
                      onChange={handleInputChange}
                      placeholder="Ex: Unimed Nacional"
                      className="transition-all duration-300 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero_carteirinha">Número da Carteira</Label>
                    <Input
                      id="numero_carteirinha"
                      name="numero_carteirinha"
                      value={currentPatient.numero_carteirinha}
                      onChange={handleInputChange}
                      placeholder="Ex: 123456789"
                      className="transition-all duration-300 focus:border-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="Operadora">Operadora *</Label>
                    <Select
                      value={currentPatient.Operadora}
                      onValueChange={(value) => handleSelectChange('Operadora', value)}
                    >
                      <SelectTrigger className={`transition-all duration-300 focus:border-primary ${
                        validationErrors.Operadora ? 'border-red-500' : ''
                      }`}>
                        <SelectValue placeholder="Selecione uma operadora" />
                      </SelectTrigger>
                      <SelectContent>
                        {operadorasOptions.map((operadora) => (
                          <SelectItem key={operadora.value} value={operadora.value}>
                            {operadora.label}
                          </SelectItem>
                        ))}
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    {validationErrors.Operadora && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.Operadora}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="abrangencia">Abrangência</Label>
                    <Select
                      value={(currentPatient as any).abrangencia || ''}
                      onValueChange={(value) => handleInputChange({ target: { name: 'abrangencia', value } } as any)}
                    >
                      <SelectTrigger className="transition-all duration-300 focus:border-primary">
                        <SelectValue placeholder="Selecione a abrangência" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nacional">Nacional</SelectItem>
                        <SelectItem value="Estadual">Estadual</SelectItem>
                        <SelectItem value="Municipal">Municipal</SelectItem>
                        <SelectItem value="Regional">Regional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dados-medicos" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="Cid_Diagnostico">CIDs Diagnóstico *</Label>
                    <CIDSelection
                      value={Array.isArray(currentPatient.Cid_Diagnostico) ? currentPatient.Cid_Diagnostico : [currentPatient.Cid_Diagnostico || '']}
                      patientCID={Array.isArray(currentPatient.Cid_Diagnostico) ? currentPatient.Cid_Diagnostico[0] : currentPatient.Cid_Diagnostico || ''}
                      onChange={(arr) => handleCidSelectChange(arr.map(item => item.codigo))}
                      multiple={true}
                      placeholder="Selecione um ou mais CIDs..."
                    />
                    {validationErrors.Cid_Diagnostico && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.Cid_Diagnostico}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stage">Estágio *</Label>
                    <Select
                      value={currentPatient.stage}
                      onValueChange={(value) => handleInputChange({ target: { name: 'stage', value } } as any)}
                    >
                      <SelectTrigger className={`transition-all duration-300 focus:border-primary ${
                        validationErrors.stage ? 'border-red-500' : ''
                      }`}>
                        <SelectValue placeholder="Selecione o estágio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="I">Estágio I</SelectItem>
                        <SelectItem value="II">Estágio II</SelectItem>
                        <SelectItem value="III">Estágio III</SelectItem>
                        <SelectItem value="IV">Estágio IV</SelectItem>
                        <SelectItem value="Recidiva">Recidiva</SelectItem>
                        <SelectItem value="Metastático">Metastático</SelectItem>
                        <SelectItem value="Localizado">Localizado</SelectItem>
                        <SelectItem value="Avançado">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                    {validationErrors.stage && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.stage}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="treatment">Tratamento *</Label>
                    <Select
                      value={currentPatient.treatment}
                      onValueChange={(value) => handleInputChange({ target: { name: 'treatment', value } } as any)}
                    >
                      <SelectTrigger className={`transition-all duration-300 focus:border-primary ${
                        validationErrors.treatment ? 'border-red-500' : ''
                      }`}>
                        <SelectValue placeholder="Selecione o tratamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Quimioterapia">Quimioterapia</SelectItem>
                        <SelectItem value="Radioterapia">Radioterapia</SelectItem>
                        <SelectItem value="Cirurgia">Cirurgia</SelectItem>
                        <SelectItem value="Imunoterapia">Imunoterapia</SelectItem>
                        <SelectItem value="Terapia Alvo">Terapia Alvo</SelectItem>
                        <SelectItem value="Hormonioterapia">Hormonioterapia</SelectItem>
                        <SelectItem value="Transplante de Medula">Transplante de Medula</SelectItem>
                        <SelectItem value="Cuidados Paliativos">Cuidados Paliativos</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    {validationErrors.treatment && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.treatment}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data Início Tratamento *</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      value={currentPatient.startDate}
                      onChange={handleInputChange}
                      placeholder="DD/MM/AAAA"
                      required
                      maxLength={10}
                      className={`transition-all duration-300 focus:border-primary ${
                        validationErrors.startDate ? 'border-red-500' : ''
                      }`}
                    />
                    {validationErrors.startDate && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.startDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="medico_assistente_nome">Médico Assistente *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={currentPatient.Prestador || ''}
                        onValueChange={async (value) => {
                          console.log(`🔍 [Patients] Select Prestador alterado para: "${value}"`);
                          try {
                            // Buscar informações do prestador selecionado
                            const prestadorId = parseInt(value);
                            if (!isNaN(prestadorId)) {
                              const prestador = await PrestadorService.getPrestadorById(prestadorId);
                              console.log(`✅ [Patients] Prestador encontrado:`, prestador);
                              
                              // Preencher campos com as informações do prestador
                              setCurrentPatient(prev => ({
                                ...prev,
                                Prestador: value,
                                medico_assistente_nome: prestador.nome || '',
                                medico_assistente_email: prestador.email || '',
                                medico_assistente_telefone: prestador.telefone || '',
                                medico_assistente_especialidade: prestador.especialidade_principal || prestador.especialidade || ''
                              }));
                            } else {
                              // Se não conseguir converter para número, limpar campos
                              setCurrentPatient(prev => ({
                                ...prev,
                                Prestador: value,
                                medico_assistente_nome: '',
                                medico_assistente_email: '',
                                medico_assistente_telefone: '',
                                medico_assistente_especialidade: ''
                              }));
                            }
                          } catch (error) {
                            console.error('❌ [Patients] Erro ao buscar prestador:', error);
                            // Em caso de erro, apenas atualizar o Prestador
                            setCurrentPatient(prev => ({
                              ...prev,
                              Prestador: value,
                              medico_assistente_nome: '',
                              medico_assistente_email: '',
                              medico_assistente_telefone: '',
                              medico_assistente_especialidade: ''
                            }));
                          }
                        }}
                      >
                        <SelectTrigger className={`flex-1 transition-all duration-300 focus:border-primary ${
                          validationErrors.Prestador ? 'border-red-500' : ''
                        }`}>
                          <SelectValue placeholder="Selecione o médico" />
                        </SelectTrigger>
                        <SelectContent>
                          {prestadoresOptions.map((prestador) => (
                            <SelectItem key={prestador.value} value={prestador.value}>
                              {prestador.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        id="medico_assistente_nome"
                        name="medico_assistente_nome"
                        value={currentPatient.medico_assistente_nome || ''}
                        onChange={(e) => {
                          console.log(`🔍 [Patients] Input medico_assistente_nome alterado para: "${e.target.value}"`);
                          // Quando digita no input, atualizar medico_assistente_nome e limpar Prestador
                          setCurrentPatient(prev => ({
                            ...prev,
                            medico_assistente_nome: e.target.value,
                            Prestador: '' // Limpar select quando digita no input
                          }));
                        }}
                        placeholder="Ou digite o nome..."
                        className={`flex-1 transition-all duration-300 focus:border-primary ${
                          validationErrors.Prestador ? 'border-red-500' : ''
                        }`}
                      />
                    </div>
                    {validationErrors.Prestador && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.Prestador}</p>
                    )}
                  </div>

                  {/* Campos adicionais do médico assistente - só aparecem quando medico_assistente_nome está preenchido */}
                  {currentPatient.medico_assistente_nome && currentPatient.medico_assistente_nome.trim() !== '' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="medico_assistente_email">E-mail do Médico Assistente</Label>
                        <Input
                          id="medico_assistente_email"
                          name="medico_assistente_email"
                          type="email"
                          value={currentPatient.medico_assistente_email || ''}
                          onChange={handleInputChange}
                          placeholder="exemplo@email.com"
                          className="transition-all duration-300 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="medico_assistente_telefone">Telefone do Médico Assistente</Label>
                        <Input
                          id="medico_assistente_telefone"
                          name="medico_assistente_telefone"
                          value={currentPatient.medico_assistente_telefone || ''}
                          onChange={handleInputChange}
                          placeholder="(42) 99999-9999"
                          className="transition-all duration-300 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="medico_assistente_especialidade">Especialidade do Médico Assistente</Label>
                        <Input
                          id="medico_assistente_especialidade"
                          name="medico_assistente_especialidade"
                          value={currentPatient.medico_assistente_especialidade || ''}
                          onChange={handleInputChange}
                          placeholder="Ex: Oncologia, Clínica Geral..."
                          className="transition-all duration-300 focus:border-primary"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="peso">Peso (kg)</Label>
                    <Input
                      id="peso"
                      name="peso"
                      value={(currentPatient as any).peso || ''}
                      onChange={handleInputChange}
                      placeholder="Ex: 70"
                      className="transition-all duration-300 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="altura">Altura (cm)</Label>
                    <Input
                      id="altura"
                      name="altura"
                      value={(currentPatient as any).altura || ''}
                      onChange={handleInputChange}
                      placeholder="Ex: 170"
                      className="transition-all duration-300 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={currentPatient.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger className={`transition-all duration-300 focus:border-primary ${
                        validationErrors.status ? 'border-red-500' : ''
                      }`}>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Em tratamento">Em tratamento</SelectItem>
                        <SelectItem value="Em remissão">Em remissão</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Óbito">Óbito</SelectItem>
                        <SelectItem value="Suspenso">Suspenso</SelectItem>
                      </SelectContent>
                    </Select>
                    {validationErrors.status && (
                      <p className="text-sm text-red-500 mt-1">{validationErrors.status}</p>
                    )}
                  </div>
                </div>
              </TabsContent>

                             <TabsContent value="dados-contato" className="space-y-4">
                <div className="space-y-6">
                  {/* Seção de Informações do Prestador */}
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="text-lg font-medium text-foreground">Informações do Prestador</h3>
                      <p className="text-sm text-muted-foreground">Dados de contato do prestador de serviços</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="setor_prestador">Setor</Label>
                        <Select
                          value={currentPatient.setor_prestador}
                          onValueChange={(value) => handleSelectChange('setor_prestador', value)}
                        >
                          <SelectTrigger className="transition-all duration-300 focus:border-primary">
                            <SelectValue placeholder="Selecione o setor" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Agendamento">Agendamento</SelectItem>
                            <SelectItem value="Faturamento">Faturamento</SelectItem>
                            <SelectItem value="Administração">Administração</SelectItem>
                            <SelectItem value="Farmácia">Farmácia</SelectItem>
                            <SelectItem value="Contratos">Contratos</SelectItem>
                            <SelectItem value="Outros">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="telefone">Telefone</Label>
                        <Input
                          id="telefone"
                          name="telefone"
                          value={currentPatient.telefone}
                          onChange={handleInputChange}
                          placeholder="(00) 00000-0000"
                          maxLength={15}
                          className={`transition-all duration-300 focus:border-primary ${
                            validationErrors.telefone ? 'border-red-500' : ''
                          }`}
                        />
                        {validationErrors.telefone && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.telefone}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">E-mail</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={currentPatient.email}
                          onChange={handleInputChange}
                          placeholder="exemplo@email.com"
                          className={`transition-all duration-300 focus:border-primary ${
                            validationErrors.email ? 'border-red-500' : ''
                          }`}
                        />
                        {validationErrors.email && (
                          <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Seção de Informações Pessoais do Paciente */}
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <h3 className="text-lg font-medium text-foreground">Informações Pessoais</h3>
                      <p className="text-sm text-muted-foreground">Dados pessoais e endereço do paciente</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="contato_emergencia_nome">Contato de Emergência - Nome</Label>
                          <Input
                            id="contato_emergencia_nome"
                            name="contato_emergencia_nome"
                            value={(currentPatient as any).contato_emergencia_nome || ''}
                            onChange={handleInputChange}
                            placeholder="Nome do contato de emergência"
                            className="transition-all duration-300 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contato_emergencia_telefone">Contato de Emergência - Telefone</Label>
                          <Input
                            id="contato_emergencia_telefone"
                            name="contato_emergencia_telefone"
                            value={(currentPatient as any).contato_emergencia_telefone || ''}
                            onChange={handleInputChange}
                            placeholder="(00) 00000-0000"
                            maxLength={15}
                            className={`transition-all duration-300 focus:border-primary ${
                              (validationErrors as any).contato_emergencia_telefone ? 'border-red-500' : ''
                            }`}
                          />
                          {(validationErrors as any).contato_emergencia_telefone && (
                            <p className="text-sm text-red-500 mt-1">{(validationErrors as any).contato_emergencia_telefone}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="endereco_rua">Rua</Label>
                          <Input
                            id="endereco_rua"
                            name="endereco_rua"
                            value={(currentPatient as any).endereco_rua || ''}
                            onChange={handleInputChange}
                            placeholder="Rua"
                            className="transition-all duration-300 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endereco_numero">Número</Label>
                          <Input
                            id="endereco_numero"
                            name="endereco_numero"
                            value={(currentPatient as any).endereco_numero || ''}
                            onChange={handleInputChange}
                            placeholder="Número"
                            className="transition-all duration-300 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endereco_complemento">Complemento</Label>
                          <Input
                            id="endereco_complemento"
                            name="endereco_complemento"
                            value={(currentPatient as any).endereco_complemento || ''}
                            onChange={handleInputChange}
                            placeholder="Ap, Bloco, etc."
                            className="transition-all duration-300 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="endereco_bairro">Bairro</Label>
                          <Input
                            id="endereco_bairro"
                            name="endereco_bairro"
                            value={(currentPatient as any).endereco_bairro || ''}
                            onChange={handleInputChange}
                            placeholder="Bairro"
                            className="transition-all duration-300 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endereco_cidade">Cidade</Label>
                          <Input
                            id="endereco_cidade"
                            name="endereco_cidade"
                            value={(currentPatient as any).endereco_cidade || ''}
                            onChange={handleInputChange}
                            placeholder="Cidade"
                            className="transition-all duration-300 focus:border-primary"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endereco_estado">Estado</Label>
                          <Input
                            id="endereco_estado"
                            name="endereco_estado"
                            value={(currentPatient as any).endereco_estado || ''}
                            onChange={handleInputChange}
                            placeholder="UF"
                            maxLength={2}
                            className="transition-all duration-300 focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endereco_cep">CEP</Label>
                        <Input
                          id="endereco_cep"
                          name="endereco_cep"
                          value={(currentPatient as any).endereco_cep || ''}
                          onChange={handleInputChange}
                          placeholder="00000-000"
                          maxLength={9}
                          className="transition-all duration-300 focus:border-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="observacoes">Observações</Label>
                        <Textarea
                          id="observacoes"
                          name="observacoes"
                          value={currentPatient.observacoes}
                          onChange={handleInputChange}
                          placeholder="Informações adicionais sobre o paciente"
                          className="transition-all duration-300 focus:border-primary"
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                onClick={handleSubmit}
              >
                {isEditing ? 'Salvar Alterações' : 'Adicionar Paciente'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Informações Detalhadas */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-hide">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Completas do Paciente
            </DialogTitle>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">{selectedPatient.name}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant={selectedPatient.status === 'Em tratamento' ? 'default' : selectedPatient.status === 'Em remissão' ? 'secondary' : 'outline'}>
                    {selectedPatient.status}
                  </Badge>
                  {selectedPatient.numero_carteirinha && (
                    <span className="text-muted-foreground">Carteirinha: {selectedPatient.numero_carteirinha}</span>
                  )}
                  <span className="text-muted-foreground">Idade: {selectedPatient.age} anos</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados Pessoais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">CPF:</span>
                    <p className="font-medium">{selectedPatient.cpf || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">RG:</span>
                    <p className="font-medium">{selectedPatient.rg || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data de Nascimento:</span>
                    <p className="font-medium">{convertFromISODate(selectedPatient.Data_Nascimento)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sexo:</span>
                    <p className="font-medium">{selectedPatient.Sexo || selectedPatient.gender}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Informações de Saúde
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Operadora / Plano / Abrangência:</span>
                    <p className="font-medium">{getOperadoraName(selectedPatient.Operadora)} {selectedPatient.plano_saude ? `• ${selectedPatient.plano_saude}` : ''} {(selectedPatient as any).abrangencia ? `• ${(selectedPatient as any).abrangencia}` : ''}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Médico Assistente:</span>
                    <p className="font-medium">
                      {selectedPatient.medico_assistente_nome || 
                       (selectedPatient as any).medico_assistente_nome || 
                       selectedPatient.Prestador || 
                       'Não informado'}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CIDs Diagnóstico:</span>
                    <p className="font-medium">
                      {Array.isArray(selectedPatient.Cid_Diagnostico) 
                        ? selectedPatient.Cid_Diagnostico.join(', ') 
                        : selectedPatient.Cid_Diagnostico}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estágio:</span>
                    <p className="font-medium">{selectedPatient.stage}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tratamento:</span>
                    <p className="font-medium">{selectedPatient.treatment}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Início do Tratamento:</span>
                    <p className="font-medium">{selectedPatient.startDate}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Peso / Altura:</span>
                    <p className="font-medium">
                      {selectedPatient.peso || (selectedPatient as any).weight || '—'} kg 
                      {selectedPatient.altura || (selectedPatient as any).height ? 
                        ` • ${selectedPatient.altura || (selectedPatient as any).height} cm` : ''}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Dados de Contato
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Telefone:</span>
                      <p className="font-medium">
                        {(selectedPatient as any).contato_telefone || 
                         (selectedPatient as any).telefone || 
                         selectedPatient.telefone || 
                         'Não informado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">E-mail:</span>
                      <p className="font-medium">
                        {(selectedPatient as any).contato_email || 
                         (selectedPatient as any).email || 
                         selectedPatient.email || 
                         'Não informado'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Contato de Emergência:</span>
                      <p className="font-medium">
                        {selectedPatient.contato_emergencia_nome || 
                         (selectedPatient as any).nome_responsavel || 
                         '—'} 
                        {selectedPatient.contato_emergencia_telefone || 
                         (selectedPatient as any).telefone_responsavel ? 
                          ` • ${selectedPatient.contato_emergencia_telefone || (selectedPatient as any).telefone_responsavel}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <span className="text-muted-foreground">Endereço:</span>
                      <p className="font-medium">
                        {((selectedPatient as any).endereco_rua || '')}
                        {((selectedPatient as any).endereco_numero ? `, ${(selectedPatient as any).endereco_numero}` : '')}
                        {((selectedPatient as any).endereco_complemento ? ` - ${(selectedPatient as any).endereco_complemento}` : '')}
                        {((selectedPatient as any).endereco_bairro ? ` - ${(selectedPatient as any).endereco_bairro}` : '')}
                        {((selectedPatient as any).endereco_cidade ? ` - ${(selectedPatient as any).endereco_cidade}` : '')}
                        {((selectedPatient as any).endereco_estado ? ` - ${(selectedPatient as any).endereco_estado}` : '')}
                        {((selectedPatient as any).endereco_cep ? ` - ${(selectedPatient as any).endereco_cep}` : '')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPatient.observacoes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3">Observações</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedPatient.observacoes}
                    </p>
                  </div>
                </>
              )}

              {selectedPatient.authorizations && selectedPatient.authorizations.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Autorizações ({selectedPatient.authorizations.length})
                    </h4>
                    <div className="space-y-4">
                      {selectedPatient.authorizations.map((auth) => (
                        <Card 
                          key={auth.id} 
                          className="group p-4 cursor-pointer bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 hover:from-background/80 hover:to-background/60 hover:border-border/50 transition-all duration-300 hover:shadow-md hover:scale-[1.01] auth-card-hover"
                          onClick={() => {
                            setIsInfoDialogOpen(false);
                            navigate('/historico-solicitacoes', { 
                              state: { 
                                scrollToAuth: auth.id.toString(),
                                authId: auth.id 
                              }
                            });
                          }}
                        >
                          {/* Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                                             <span className="text-sm font-bold text-primary bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-1 rounded-full border border-primary/20">
                                 {auth.numero_autorizacao}
                               </span>
                              <Badge variant={
                                auth.status === 'aprovada' ? 'default' : 
                                auth.status === 'pendente' ? 'secondary' : 
                                'destructive'
                              } className="text-xs">
                                {auth.status === 'aprovada' ? 'Aprovada' : 
                                 auth.status === 'pendente' ? 'Pendente' : 
                                 'Rejeitada'}
                              </Badge>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </div>

                          {/* Informações principais */}
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-foreground">
                              {auth.diagnostico_descricao}
                            </div>
                            
                            {/* Ciclos com barra de progresso */}
                            {(auth.ciclo_atual || auth.ciclos_previstos) && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>Progresso do Tratamento</span>
                                  <span className="font-medium">
                                    Ciclo {auth.ciclo_atual || 0} de {auth.ciclos_previstos || 0}
                                  </span>
                                </div>
                                {auth.ciclos_previstos && (
                                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                                    <div 
                                      className="bg-gradient-to-r from-primary to-primary/80 h-full transition-all duration-500 rounded-full"
                                      style={{ 
                                        width: `${Math.min(100, ((auth.ciclo_atual || 0) / auth.ciclos_previstos) * 100)}%` 
                                      }}
                                    ></div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Informações detalhadas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
                              {auth.medicamentos_antineoplasticos && (
                                <div>
                                  <span className="font-medium">Medicamentos:</span>
                                  <p className="line-clamp-2 mt-1">{auth.medicamentos_antineoplasticos}</p>
                                </div>
                              )}
                              
                              {auth.finalidade && (
                                <div>
                                  <span className="font-medium">Finalidade:</span>
                                  <p className="mt-1">{auth.finalidade}</p>
                                </div>
                              )}
                              
                              <div>
                                <span className="font-medium">Data:</span>
                                <p className="mt-1">{auth.data_solicitacao}</p>
                              </div>
                              
                              <div>
                                <span className="font-medium">Hospital:</span>
                                <p className="mt-1 line-clamp-1">{auth.hospital_nome}</p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Autorizações reais vinculadas ao paciente */}
              {(() => {
                const authsDoPaciente = solicitacoes.filter(s => s.paciente_id === Number(selectedPatient.id));
                return authsDoPaciente.length > 0 ? (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Autorizações ({authsDoPaciente.length})
                      </h4>
                      <div className="space-y-4">
                        {authsDoPaciente.map((auth) => (
                          <Card 
                            key={auth.id} 
                            className="group p-4 cursor-pointer bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/30 hover:from-background/80 hover:to-background/60 hover:border-border/50 transition-all duration-300 hover:shadow-md hover:scale-[1.01] auth-card-hover"
                            onClick={() => {
                              setIsInfoDialogOpen(false);
                              navigate('/historico-solicitacoes', { 
                                    state: { 
                                      scrollToAuth: String(auth.id || ''),
                                      authId: auth.id 
                                    }
                                  });
                            }}
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-primary bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-1 rounded-full border border-primary/20">
                                  {auth.id ? `AUTH-${auth.id}` : 'Autorização'}
                                </span>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>

                            {/* Informações principais */}
                            <div className="space-y-2">
                              <div className="text-sm font-medium text-foreground">
                                {auth.diagnostico_descricao}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted-foreground">
                                <div>
                                  <span className="font-medium">CID:</span> {auth.diagnostico_cid}
                                </div>
                                <div>
                                  <span className="font-medium">Data:</span> {auth.data_solicitacao}
                                </div>
                                {auth.ciclos_previstos ? (
                                  <div>
                                    <span className="font-medium">Ciclos:</span> {auth.ciclo_atual || 0} de {auth.ciclos_previstos}
                                  </div>
                                ) : null}
                                {auth.hospital_nome ? (
                                  <div>
                                    <span className="font-medium">Hospital:</span> {auth.hospital_nome}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                ) : null;
              })()}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                handleEdit(selectedPatient!.id);
                setIsInfoDialogOpen(false);
              }}
            >
              Editar Paciente
            </Button>
            <Button onClick={() => setIsInfoDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Patients;