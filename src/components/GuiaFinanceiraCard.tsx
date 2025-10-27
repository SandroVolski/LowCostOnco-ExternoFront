import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Calendar,
  DollarSign,
  FileText,
  User,
  Building2,
  Stethoscope,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Paperclip,
  Hash,
  Package,
} from 'lucide-react';

interface GuiaFinanceira {
  id: number;
  lote_id: number;
  numero_guia_prestador: string;
  numero_guia_operadora?: string;
  numero_carteira?: string;
  data_autorizacao?: string;
  data_execucao?: string;
  codigo_item?: string;
  descricao_item?: string;
  quantidade_executada?: number;
  valor_unitario?: number;
  valor_total: number;
  status_pagamento: 'pendente' | 'pago' | 'glosado';
  documentos_anexos?: string;
}

interface GuiaFinanceiraCardProps {
  guia: GuiaFinanceira;
  onStatusChange: (guiaId: number, status: string) => void;
  onAnexarDocumento: (guiaId: number, files: FileList) => void;
}

const GuiaFinanceiraCard = ({ guia, onStatusChange, onAnexarDocumento }: GuiaFinanceiraCardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pendente: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock, 
        label: 'Pendente' 
      },
      pago: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle2, 
        label: 'Pago' 
      },
      glosado: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: XCircle, 
        label: 'Glosado' 
      },
    };
    return configs[status as keyof typeof configs] || configs.pendente;
  };

  const statusConfig = getStatusConfig(guia.status_pagamento);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/20 hover:border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Hash className="h-5 w-5 text-primary" />
              Guia #{guia.numero_guia_prestador}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                Operadora: {guia.numero_guia_operadora || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Carteira: {guia.numero_carteira || 'N/A'}
              </span>
            </div>
          </div>
          <Badge className={`${statusConfig.color} flex items-center gap-1`}>
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informações do Procedimento */}
        <div className="bg-muted/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Stethoscope className="h-4 w-4 text-primary" />
            Procedimento
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Código</label>
              <p className="text-sm font-mono bg-background px-2 py-1 rounded border">
                {guia.codigo_item || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Descrição</label>
              <p className="text-sm line-clamp-2">
                {guia.descricao_item || 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
              <p className="text-sm font-semibold">
                {guia.quantidade_executada || 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Valor Unitário</label>
              <p className="text-sm font-semibold">
                {guia.valor_unitario ? formatCurrency(guia.valor_unitario) : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Valor Total</label>
              <p className="text-sm font-bold text-primary">
                {formatCurrency(guia.valor_total)}
              </p>
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Data de Autorização
            </label>
            <p className="text-sm">
              {guia.data_autorizacao ? formatDate(guia.data_autorizacao) : 'N/A'}
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Data de Execução
            </label>
            <p className="text-sm">
              {guia.data_execucao ? formatDate(guia.data_execucao) : 'N/A'}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Select
              value={guia.status_pagamento}
              onValueChange={(value) => onStatusChange(guia.id, value)}
            >
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="pago">Pago</SelectItem>
                <SelectItem value="glosado">Glosado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Detalhes
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Detalhes da Guia #{guia.numero_guia_prestador}</DialogTitle>
                  <DialogDescription>
                    Informações completas do procedimento financeiro
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Número da Guia</label>
                      <p className="text-lg font-semibold">{guia.numero_guia_prestador}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Guia da Operadora</label>
                      <p className="text-lg font-semibold">{guia.numero_guia_operadora || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Número da Carteira</label>
                      <p className="text-lg font-semibold">{guia.numero_carteira || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <Badge className={`${statusConfig.color} mt-1`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Detalhes do Procedimento
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Código</label>
                        <p className="font-mono text-sm bg-background px-2 py-1 rounded border">
                          {guia.codigo_item || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                        <p className="text-sm">{guia.descricao_item || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-3">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Quantidade</label>
                        <p className="text-lg font-semibold">{guia.quantidade_executada || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Valor Unitário</label>
                        <p className="text-lg font-semibold">
                          {guia.valor_unitario ? formatCurrency(guia.valor_unitario) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Valor Total</label>
                        <p className="text-lg font-bold text-primary">
                          {formatCurrency(guia.valor_total)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <label htmlFor={`anexo-${guia.id}`} className="cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span className="gap-2">
                  <Paperclip className="h-4 w-4" />
                  Anexar
                </span>
              </Button>
            </label>
            <input
              id={`anexo-${guia.id}`}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  onAnexarDocumento(guia.id, e.target.files);
                }
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GuiaFinanceiraCard;
