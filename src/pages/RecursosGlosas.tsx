import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SearchIcon, CheckCircle2, Clock, AlertCircle, MinusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Confetti from 'react-confetti';

// Interface básica para uma etapa do fluxo
interface FlowStep {
  id: number;
  name: string;
  status: 'pending' | 'completed' | 'active' | 'failed';
  date?: string;
}

// Interface básica para um recurso de glosa
interface GlosaResource {
  code: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  currentStep: number;
  steps: FlowStep[];
}

// Função para obter o ícone da etapa
const getStepIcon = (status: FlowStep['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-support-green" />;
    case 'active':
      return <Clock className="h-5 w-5 text-primary animate-pulse-slow" />;
    case 'failed':
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    case 'pending':
    default:
      return <MinusCircle className="h-5 w-5 text-muted-foreground" />;
  }
};

// Função para obter a cor de fundo do círculo da etapa
const getStepCircleColor = (status: FlowStep['status']) => {
  switch (status) {
    case 'completed':
      return 'bg-support-green/20 border-support-green';
    case 'active':
      return 'bg-primary/20 border-primary';
    case 'failed':
      return 'bg-destructive/20 border-destructive';
    case 'pending':
    default:
      return 'bg-muted/20 border-border';
  }
};

const RecursosGlosas = () => {
  const [trackingCode, setTrackingCode] = useState('');
  const [glosaResource, setGlosaResource] = useState<GlosaResource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
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
      // Parar os confetes após 5 segundos
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [glosaResource]);

  const handleTrack = () => {
    setLoading(true);
    setError(null);
    setGlosaResource(null);
    setShowConfetti(false);

    // TODO: Implementar a lógica real de busca do recurso de glosa
    // Por enquanto, vamos simular uma busca com dados mockados
    setTimeout(() => {
      const mockResource: GlosaResource = {
        code: trackingCode,
        status: 'in_progress',
        currentStep: 2,
        steps: [
          { id: 1, name: 'Recurso Cadastrado', status: 'completed', date: '2024-06-01' },
          { id: 2, name: 'Em Análise pela Operadora', status: 'active', date: '2024-06-05' },
          { id: 3, name: 'Aguardando Documentação Adicional', status: 'pending' },
          { id: 4, name: 'Análise Finalizada', status: 'pending' },
          { id: 5, name: 'Resultado Disponível', status: 'pending' },
        ],
      };

      if (trackingCode.toLowerCase() === 'glosa123') { // Exemplo de código válido, case-insensitive
        setGlosaResource(mockResource);
      } else if (trackingCode.toLowerCase() === 'glosa456') { // Exemplo de outro código
         const anotherMockResource: GlosaResource = {
          code: trackingCode,
          status: 'completed',
          currentStep: 5,
          steps: [
            { id: 1, name: 'Recurso Cadastrado', status: 'completed', date: '2024-05-10' },
            { id: 2, name: 'Em Análise pela Operadora', status: 'completed', date: '2024-05-12' },
            { id: 3, name: 'Aguardando Documentação Adicional', status: 'completed', date: '2024-05-15'.split('-').reverse().join('/') },
            { id: 4, name: 'Análise Finalizada', status: 'completed', date: '2024-05-18'.split('-').reverse().join('/') },
            { id: 5, name: 'Resultado Disponível', status: 'completed', date: '2024-05-20'.split('-').reverse().join('/') },
          ],
        };
         setGlosaResource(anotherMockResource);
      } else {
        setError('Recurso de glosa não encontrado.');
      }

      setLoading(false);
    }, 1000);
  };

  return (
    <div className="relative space-y-8 animate-fade-in container mx-auto py-4 px-4">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']}
        />
      )}
      
      <h1 className="text-2xl font-semibold text-foreground absolute top-0 left-0 pl-4">Acompanhamento de Recursos de Glosas</h1>
      
      <div className="pt-12 flex gap-8">
        {/* Card de Busca - Lado Esquerdo */}
        <Card className="w-full max-w-4xl bg-card/50 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semibold text-foreground/90 flex items-center gap-2">
              <SearchIcon className="h-6 w-6 text-primary" />
              Buscar Recurso
            </CardTitle>
            <p className="text-muted-foreground/70 mt-1">Digite o código do recurso para acompanhar seu status</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex space-x-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="trackingCode" className="text-foreground/80 text-base">Código do Recurso</Label>
                <Input
                  id="trackingCode"
                  placeholder="Digite o código do recurso"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-12 text-lg"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleTrack();
                    }
                  }}
                />
              </div>
              <Button 
                onClick={handleTrack} 
                disabled={loading || trackingCode.trim() === ''} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md h-12 px-6 text-base"
              >
                {loading ? 'Buscando...' : <SearchIcon className="h-5 w-5" />}
              </Button>
            </div>
            {error && <p className="text-destructive text-sm mt-4 text-center">{error}</p>}
          </CardContent>
        </Card>

        {/* Card de Status - Lado Direito */}
        {glosaResource && (
          <Card className="w-full max-w-6xl bg-card/50 backdrop-blur-sm border-border/50 shadow-lg animate-fade-in transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-primary/30">
            <CardHeader>
              <CardTitle className="text-xl font-medium text-foreground/90">
                Status do Recurso: <span className="text-primary font-semibold">{glosaResource.code}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Visualização do fluxo de etapas */}
              <div className="relative pl-8">
                {glosaResource.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center mb-8 last:mb-0">
                    {/* Indicador da etapa */}
                    <div className="absolute left-0 flex items-center justify-center">
                      <div className={cn(
                        "w-9 h-9 rounded-full border-2 flex items-center justify-center z-10 shadow-md",
                        getStepCircleColor(step.status)
                      )}>
                        {getStepIcon(step.status)}
                      </div>
                       {/* Linha conectora vertical */}
                      {index < glosaResource.steps.length - 1 && (
                         <div className={cn(
                           "absolute top-10 bottom-[-2rem] left-1/2 w-0.5 transform -translate-x-1/2",
                           step.status === 'completed' ? 'bg-support-green' : 'bg-border/50'
                         )}></div>
                       )}
                    </div>
                    {/* Conteúdo da etapa */}
                    <div className="ml-8 flex-1">
                      <p className={cn(
                        "font-medium",
                         step.status === 'completed' ? 'text-muted-foreground/70 line-through' : 
                         step.status === 'active' ? 'text-foreground font-semibold' : 'text-muted-foreground/70'
                      )}>
                        {step.name}
                      </p>
                      {step.date && (
                        <p className="text-sm text-muted-foreground/60 mt-1">
                          {step.date}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RecursosGlosas; 