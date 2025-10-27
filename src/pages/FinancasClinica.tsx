import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Upload,
  FileText,
  DollarSign,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileX,
  Eye,
  Search,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LoteFinancas {
  id: number;
  clinica_id: number;
  numero_lote: string;
  operadora_nome: string;
  operadora_registro_ans: string;
  data_envio: string;
  quantidade_guias: number;
  valor_total: number;
  status: string;
  created_at: string;
}

interface GuiaDetalhada {
  id: number;
  numero_guia_prestador: string;
  numero_carteira: string;
  data_autorizacao: string;
  data_execucao: string;
  valor_total: number;
  status_pagamento: string;
  profissional_nome?: string;
  indicacao_clinica?: string;
}

const FinancasClinica = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [lotes, setLotes] = useState<LoteFinancas[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedLote, setSelectedLote] = useState<LoteFinancas | null>(null);
  const [guiasDetalhadas, setGuiasDetalhadas] = useState<GuiaDetalhada[]>([]);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');

  useEffect(() => {
    loadLotes();
  }, []);

  const loadLotes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authAccessToken') || localStorage.getItem('token');
      const clinicaId = user?.id || 1;
      
      const response = await fetch(`/api/financeiro/lotes?clinica_id=${clinicaId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setLotes(data);
    } catch (error) {
      console.error('Erro ao carregar lotes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os lotes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGuiasDetalhadas = async (loteId: number) => {
    try {
      const token = localStorage.getItem('authAccessToken') || localStorage.getItem('token');
      const response = await fetch(`/api/financeiro/lotes/${loteId}/guias`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      setGuiasDetalhadas(data);
    } catch (error) {
      console.error('Erro ao carregar guias:', error);
    }
  };

  const handleDetalhesClick = async (lote: LoteFinancas) => {
    setSelectedLote(lote);
    setShowDetalhesModal(true);
    await loadGuiasDetalhadas(lote.id);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.xml')) {
      setSelectedFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.xml')) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('xml', selectedFile);
      formData.append('clinica_id', (user?.id || 0).toString());

      const token = localStorage.getItem('authAccessToken') || localStorage.getItem('token');
      const response = await fetch(`/api/financeiro/upload-xml`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Erro ao processar XML');
      }

      toast({
        title: 'Sucesso',
        description: 'XML processado com sucesso!',
      });

      setSelectedFile(null);
      loadLotes();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível processar o arquivo XML.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const filteredLotes = lotes.filter(lote => {
    const matchesSearch = lote.numero_lote.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || lote.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pendente: { variant: 'outline' as const, icon: <Clock className="h-3 w-3" />, text: 'Pendente' },
      pago: { variant: 'default' as const, icon: <CheckCircle2 className="h-3 w-3" />, text: 'Pago' },
      glosado: { variant: 'destructive' as const, icon: <XCircle className="h-3 w-3" />, text: 'Glosado' },
    };
    const config = variants[status] || variants.pendente;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {config.text}
      </Badge>
    );
  };

  const totalValor = lotes.reduce((sum, lote) => sum + Number(lote.valor_total || 0), 0);
  const totalPago = lotes.filter(lote => lote.status === 'pago').reduce((sum, lote) => sum + Number(lote.valor_total || 0), 0);
  const totalPendente = totalValor - totalPago;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Finanças</h1>
        <p className="text-muted-foreground">
          Gerencie lotes financeiros TISS e acompanhe o faturamento
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Geral</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalValor.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{lotes.length} lotes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {totalPago.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Pagamentos recebidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">R$ {totalPendente.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Recebimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalValor > 0 ? ((totalPago / totalValor) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Percentual pago</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Arquivo XML TISS
          </CardTitle>
          <CardDescription>
            Faça upload de arquivos XML no padrão TISS para processamento automático
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
          >
            {selectedFile ? (
              <div className="space-y-4">
                <FileText className="h-12 w-12 mx-auto text-primary" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={() => setSelectedFile(null)} disabled={uploading}>
                    Remover
                  </Button>
                  <Button onClick={handleUpload} disabled={uploading}>
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Processar XML
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <Input
                    id="xml-upload"
                    type="file"
                    accept=".xml"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label htmlFor="xml-upload" className="cursor-pointer text-primary hover:underline">
                    Clique para selecionar
                  </label>
                  {' ou arraste e solte um arquivo XML aqui'}
                </div>
                <p className="text-sm text-muted-foreground">Formatos aceitos: XML TISS 4.x</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Lotes Processados</CardTitle>
              <CardDescription>Visualize e gerencie todos os lotes de faturamento</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar lotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="glosado">Glosado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredLotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileX className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum lote encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número do Lote</TableHead>
                    <TableHead>Operadora</TableHead>
                    <TableHead>Data Envio</TableHead>
                    <TableHead>Guias</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLotes.map((lote) => (
                    <TableRow key={lote.id}>
                      <TableCell className="font-medium">{lote.numero_lote}</TableCell>
                      <TableCell>{lote.operadora_nome}</TableCell>
                      <TableCell>{format(new Date(lote.data_envio), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell>{lote.quantidade_guias}</TableCell>
                      <TableCell className="font-medium">R$ {Number(lote.valor_total || 0).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(lote.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleDetalhesClick(lote)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetalhesModal} onOpenChange={setShowDetalhesModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Lote</DialogTitle>
            <DialogDescription>Informações completas do lote de faturamento</DialogDescription>
          </DialogHeader>
          {selectedLote && (
            <Tabs defaultValue="guias" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Informações</TabsTrigger>
                <TabsTrigger value="guias">Guias ({guiasDetalhadas.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Número do Lote</p>
                        <p className="font-medium">{selectedLote.numero_lote}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Operadora</p>
                        <p className="font-medium">{selectedLote.operadora_nome}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                        <p className="font-medium text-lg text-primary">R$ {Number(selectedLote.valor_total || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        <div className="mt-1">{getStatusBadge(selectedLote.status)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="guias" className="space-y-4 mt-4">
                {guiasDetalhadas.length === 0 ? (
                  <div className="text-center py-8">Nenhuma guia encontrada</div>
                ) : (
                  guiasDetalhadas.map((guia) => (
                    <Card key={guia.id} className="border-l-4 border-l-primary">
                      <CardContent className="pt-6">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">Guia #{guia.numero_guia_prestador}</p>
                            <p className="text-sm text-muted-foreground">Carteira: {guia.numero_carteira}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-primary">R$ {Number(guia.valor_total || 0).toFixed(2)}</p>
                            <div className="mt-1">{getStatusBadge(guia.status_pagamento)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancasClinica;
