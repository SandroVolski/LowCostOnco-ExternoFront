import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  Building2, 
  User, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface LoteCardProps {
  lote: {
    id: number;
    numero_lote: string;
    operadora_nome: string;
    operadora_registro_ans: string;
    competencia: string;
    data_envio: string;
    quantidade_guias: number;
    valor_total: number;
    status: 'pendente' | 'pago' | 'glosado';
    created_at: string;
  };
  onViewXML: () => void;
  onViewDetails: () => void;
  onDownload: () => void;
}

const LoteCard: React.FC<LoteCardProps> = ({ 
  lote, 
  onViewXML, 
  onViewDetails, 
  onDownload 
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: {
        icon: Clock,
        label: 'Pendente',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        iconColor: 'text-yellow-600'
      },
      pago: {
        icon: CheckCircle2,
        label: 'Pago',
        className: 'bg-green-100 text-green-800 border-green-200',
        iconColor: 'text-green-600'
      },
      glosado: {
        icon: XCircle,
        label: 'Glosado',
        className: 'bg-red-100 text-red-800 border-red-200',
        iconColor: 'text-red-600'
      }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente;
    const Icon = config.icon;

    return (
      <Badge className={`${config.className} gap-1`}>
        <Icon className={`h-3 w-3 ${config.iconColor}`} />
        {config.label}
      </Badge>
    );
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'from-yellow-500 to-orange-500';
      case 'pago':
        return 'from-green-500 to-emerald-500';
      case 'glosado':
        return 'from-red-500 to-rose-500';
      default:
        return 'from-gray-500 to-slate-500';
    }
  };

  return (
    <Card className="group border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300 hover:border-l-blue-600 hover:scale-[1.02]">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Informações Principais */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors duration-200">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                  Lote #{lote.numero_lote}
                </h3>
                <p className="text-sm text-gray-600">
                  {lote.operadora_nome || `Operadora ANS ${lote.operadora_registro_ans}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(lote.data_envio)}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{lote.quantidade_guias} guias</span>
              </div>
            </div>
          </div>

          {/* Detalhes Financeiros */}
          <div className="lg:col-span-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Valor Total:</span>
                <span className="text-lg font-bold text-green-600 group-hover:text-green-700 transition-colors duration-200">
                  {formatCurrency(lote.valor_total)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Competência:</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {lote.competencia}
                </Badge>
              </div>
            </div>
          </div>

          {/* Status e Indicadores */}
          <div className="lg:col-span-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status:</span>
                {getStatusBadge(lote.status)}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Criado:</span>
                <span className="text-sm text-gray-900">
                  {formatDate(lote.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onViewXML}
                className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 group/btn"
              >
                <FileText className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-200" />
                Ver XML
              </button>
              <button
                onClick={onViewDetails}
                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 group/btn"
              >
                <Activity className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-200" />
                Detalhes
              </button>
              <button
                onClick={onDownload}
                className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2 group/btn"
              >
                <TrendingDown className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Progresso Animada */}
        {lote.status === 'pendente' && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progresso do Processamento</span>
              <span className="font-medium">75%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: '75%' }}
              />
            </div>
          </div>
        )}

        {/* Indicador de Status com Gradiente */}
        <div className={`absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent to-${getStatusGradient(lote.status)} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      </CardContent>
    </Card>
  );
};

export default LoteCard;
