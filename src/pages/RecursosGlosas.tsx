import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SearchIcon, CheckCircle2, Clock, AlertCircle, MinusCircle, FileText, Calendar, User, Copy, CheckIcon, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';

// Interface para uma etapa do fluxo
interface FlowStep {
  id: number;
  name: string;
  description?: string;
  status: 'pending' | 'completed' | 'active' | 'failed';
  date?: string;
  estimatedDays?: number;
}

// Interface para um recurso de glosa
interface GlosaResource {
  code: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  currentStep: number;
  steps: FlowStep[];
  patientName?: string;
  createdDate?: string;
  lastUpdate?: string;
  priority?: 'high' | 'medium' | 'low';
}

// Função para obter o ícone da etapa
const getStepIcon = (status: FlowStep['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'active':
      return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
    case 'failed':
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    case 'pending':
    default:
      return <MinusCircle className="h-5 w-5 text-muted-foreground" />;
  }
};

// Função para obter o status badge
const getStatusBadge = (status: GlosaResource['status']) => {
  switch (status) {
    case 'completed':
      return (
        <Badge className="status-approved">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Concluído
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge className="status-pending">
          <Clock className="h-3 w-3 mr-1" />
          Em Andamento
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="status-rejected">
          <AlertCircle className="h-3 w-3 mr-1" />
          Falhado
        </Badge>
      );
    case 'pending':
    default:
      return (
        <Badge variant="secondary">
          <MinusCircle className="h-3 w-3 mr-1" />
          Pendente
        </Badge>
      );
  }
};

const RecursosGlosas = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const [glosaResource, setGlosaResource] = useState<GlosaResource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Atualizar tamanho da janela quando redimensionar
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Verificar se deve mostrar confetes
  useEffect(() => {
    if (glosaResource?.status === 'completed') {
      setShowConfetti(true);
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [glosaResource]);

  const handleCopyCode = async () => {
    if (glosaResource?.code) {
      try {
        await navigator.clipboard.writeText(glosaResource.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Erro ao copiar código:', error);
      }
    }
  };

  const handleTrack = () => {
    setLoading(true);
    setError(null);
    setGlosaResource(null);
    setShowConfetti(false);

    // Simular busca com dados mockados
    setTimeout(() => {
      const mockResource: GlosaResource = {
        code: trackingCode,
        status: 'in_progress',
        currentStep: 2,
        patientName: 'Maria Silva Santos',
        createdDate: '01/06/2024',
        lastUpdate: '05/06/2024',
        priority: 'high',
        steps: [
          { 
            id: 1, 
            name: 'Recurso Cadastrado', 
            description: 'Solicitação de recurso foi registrada no sistema',
            status: 'completed', 
            date: '01/06/2024',
            estimatedDays: 1
          },
          { 
            id: 2, 
            name: 'Em Análise pela Operadora', 
            description: 'Documentação sendo analisada pelo setor competente',
            status: 'active', 
            date: '05/06/2024',
            estimatedDays: 7
          },
          { 
            id: 3, 
            name: 'Aguardando Documentação Adicional', 
            description: 'Podem ser solicitados documentos complementares',
            status: 'pending',
            estimatedDays: 3
          },
          { 
            id: 4, 
            name: 'Análise Finalizada', 
            description: 'Processo de análise concluído',
            status: 'pending',
            estimatedDays: 2
          },
          { 
            id: 5, 
            name: 'Resultado Disponível', 
            description: 'Resultado do recurso disponível para consulta',
            status: 'pending',
            estimatedDays: 1
          },
        ],
      };

      if (trackingCode.toLowerCase() === 'glosa123') {
        setGlosaResource(mockResource);
      } else if (trackingCode.toLowerCase() === 'glosa456') {
        const completedResource: GlosaResource = {
          code: trackingCode,
          status: 'completed',
          currentStep: 5,
          patientName: 'João Pedro Oliveira',
          createdDate: '10/05/2024',
          lastUpdate: '20/05/2024',
          priority: 'medium',
          steps: [
            { 
              id: 1, 
              name: 'Recurso Cadastrado', 
              description: 'Solicitação de recurso foi registrada no sistema',
              status: 'completed', 
              date: '10/05/2024',
              estimatedDays: 1
            },
            { 
              id: 2, 
              name: 'Em Análise pela Operadora', 
              description: 'Documentação analisada pelo setor competente',
              status: 'completed', 
              date: '12/05/2024',
              estimatedDays: 7
            },
            { 
              id: 3, 
              name: 'Aguardando Documentação Adicional', 
              description: 'Documentos adicionais foram fornecidos',
              status: 'completed', 
              date: '15/05/2024',
              estimatedDays: 3
            },
            { 
              id: 4, 
              name: 'Análise Finalizada', 
              description: 'Processo de análise concluído com sucesso',
              status: 'completed', 
              date: '18/05/2024',
              estimatedDays: 2
            },
            { 
              id: 5, 
              name: 'Resultado Disponível', 
              description: 'Recurso APROVADO - Consulte o resultado',
              status: 'completed', 
              date: '20/05/2024',
              estimatedDays: 1
            },
          ],
        };
        setGlosaResource(completedResource);
      } else {
        setError('Código de recurso não encontrado. Tente "glosa123" ou "glosa456" para demonstração.');
      }

      setLoading(false);
    }, 1500);
  };

  const getPriorityLabel = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'Alta Prioridade';
      case 'medium':
        return 'Prioridade Média';
      case 'low':
        return 'Baixa Prioridade';
      default:
        return 'Prioridade Normal';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="space-y-6 animate-entry">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']}
          className="z-50"
        />
      )}

      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Recursos de Glosas
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                Acompanhe o status do seu recurso de glosa e gerencie solicitações
              </p>
            </div>
            <Button 
              size="lg"
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all invisible"
            >
              <SearchIcon className="h-5 w-5" />
              Buscar Recurso
            </Button>
          </div>
        </div>
      </div>

      {/* Search Card */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <SearchIcon className="h-5 w-5" />
            Buscar Recurso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trackingCode">Código do Recurso</Label>
            <Input
              id="trackingCode"
              placeholder="Digite o código do recurso"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              className="lco-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && trackingCode.trim()) {
                  handleTrack();
                }
              }}
            />
          </div>
          
          <Button 
            onClick={handleTrack} 
            disabled={loading || trackingCode.trim() === ''} 
            className="w-full lco-btn-primary"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Buscando...
              </>
            ) : (
              <>
                <SearchIcon className="h-4 w-4 mr-2" />
                Buscar Recurso
              </>
            )}
          </Button>
          
          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Demo codes */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <p className="text-sm text-muted-foreground mb-2">Códigos para demonstração:</p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTrackingCode('GLOSA123')}
                className="text-xs"
              >
                GLOSA123 (Em andamento)
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setTrackingCode('GLOSA456')}
                className="text-xs"
              >
                GLOSA456 (Concluído)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {glosaResource && (
        <Card className="animate-scale-in">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    Recurso: {glosaResource.code}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCode}
                      className="h-8 w-8 p-0"
                    >
                      {copied ? (
                        <CheckIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </CardTitle>
                  {glosaResource.patientName && (
                    <p className="text-sm text-muted-foreground">
                      Paciente: {glosaResource.patientName}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right space-y-2">
                {getStatusBadge(glosaResource.status)}
                {glosaResource.priority && (
                  <div className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium",
                    getPriorityColor(glosaResource.priority)
                  )}>
                    {getPriorityLabel(glosaResource.priority)}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Criado em</p>
                  <p className="font-medium">{glosaResource.createdDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Última atualização</p>
                  <p className="font-medium">{glosaResource.lastUpdate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Etapa atual</p>
                  <p className="font-medium">{glosaResource.currentStep} de {glosaResource.steps.length}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Timeline */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Progresso do Recurso
              </h3>
              
              <div className="space-y-6">
                {glosaResource.steps.map((step, index) => (
                  <div key={step.id} className="flex gap-4">
                    {/* Step indicator */}
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full border-2 flex items-center justify-center",
                        step.status === 'completed' 
                          ? 'bg-green-50 border-green-200' 
                          : step.status === 'active' 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-muted border-border'
                      )}>
                        {getStepIcon(step.status)}
                      </div>
                      {/* Connector line */}
                      {index < glosaResource.steps.length - 1 && (
                        <div className={cn(
                          "w-0.5 h-12 mt-2",
                          step.status === 'completed' 
                            ? 'bg-green-200' 
                            : 'bg-border'
                        )}></div>
                      )}
                    </div>
                    
                    {/* Step content */}
                    <div className="flex-1 pb-6">
                      <Card className="hover-lift">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={cn(
                                "font-medium mb-1",
                                step.status === 'completed' 
                                  ? 'text-green-700' 
                                  : step.status === 'active' 
                                    ? 'text-blue-700' 
                                    : 'text-foreground'
                              )}>
                                {step.name}
                              </h4>
                              {step.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {step.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {step.date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {step.date}
                                  </div>
                                )}
                                {step.estimatedDays && step.status === 'pending' && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    ~{step.estimatedDays} dias
                                  </div>
                                )}
                              </div>
                            </div>
                            {step.status === 'active' && (
                              <Badge variant="secondary" className="ml-4">
                                Em Andamento
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Next Steps */}
            {glosaResource.status !== 'completed' && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Sua solicitação está sendo processada. Você será notificado sobre qualquer atualização no status do recurso.
                  Em caso de dúvidas, entre em contato com nossa equipe de suporte.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecursosGlosas; 