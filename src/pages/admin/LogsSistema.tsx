import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import AnimatedSection from '@/components/AnimatedSection';
import { toast } from 'sonner';
import { 
  FileText, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Server,
  Activity,
  Eye,
  EyeOff,
  Shield,
  Users
} from 'lucide-react';

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  category: 'system' | 'database' | 'api' | 'auth' | 'user' | 'performance';
  message: string;
  details?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  stackTrace?: string;
}

const LogsSistema = () => {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadLogs();
    
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 10000); // Atualiza a cada 10 segundos
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, selectedLevel, selectedCategory]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      console.log('🔍 Carregando logs do sistema...');
      
      // Construir parâmetros de filtro
      const params = new URLSearchParams();
      if (selectedLevel !== 'all') params.append('level', selectedLevel);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', '1');
      params.append('pageSize', '100');

      const url = `/api/logs/system?${params.toString()}`;
      console.log('🌐 Chamando API:', url);

      const token = localStorage.getItem('token');
      console.log('🔑 Token encontrado:', token ? 'Sim' : 'Não');

      if (!token) {
        toast.error('Usuário não autenticado. Faça login novamente.');
        setLogs([]);
        return;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Resposta da API:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error('Sessão expirada. Faça login novamente.');
          setLogs([]);
          return;
        }
        
        const errorText = await response.text();
        console.error('❌ Erro da API:', errorText);
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📊 Dados recebidos:', result);
      
      if (result.success && result.data && result.data.logs) {
        // Converter dados da API para o formato esperado pelo frontend
        const apiLogs = result.data.logs.map((log: any) => ({
          id: log.id.toString(),
          timestamp: log.timestamp,
          level: log.level,
          category: log.category,
          message: log.message,
          details: log.details,
          userId: log.userId?.toString(),
          userAgent: log.userAgent,
          ip: log.ipAddress,
          endpoint: log.endpoint,
          method: log.method,
          statusCode: log.statusCode,
          responseTime: log.responseTime,
          stackTrace: log.stackTrace
        }));
        
        console.log('✅ Logs carregados com sucesso:', apiLogs.length, 'registros');
        setLogs(apiLogs);
        
        if (apiLogs.length === 0) {
          toast.info('Nenhum log encontrado com os filtros aplicados');
        } else {
          toast.success(`${apiLogs.length} logs carregados com sucesso`);
        }
      } else {
        console.log('⚠️  Nenhum log encontrado ou resposta vazia');
        setLogs([]);
        toast.info('Nenhum log encontrado no sistema');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar logs:', error);
      
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        toast.error('Erro de conexão. Verifique se o servidor está rodando.');
      } else {
        toast.error('Erro ao carregar logs do sistema');
      }
      
      // Em caso de erro, NÃO carregar dados fictícios
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = logs;

    // Filtro por nível
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    // Filtro por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(log => log.category === selectedCategory);
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.endpoint?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  };

  const toggleDetails = (logId: string) => {
    const newShowDetails = new Set(showDetails);
    if (newShowDetails.has(logId)) {
      newShowDetails.delete(logId);
    } else {
      newShowDetails.add(logId);
    }
    setShowDetails(newShowDetails);
  };

  const clearLogs = async () => {
    if (confirm('Tem certeza que deseja limpar todos os logs? Esta ação não pode ser desfeita.')) {
      try {
        setLogs([]);
        toast.success('Logs limpos com sucesso!');
      } catch (error) {
        toast.error('Erro ao limpar logs');
      }
    }
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Level', 'Category', 'Message', 'Details', 'User ID', 'IP', 'Endpoint', 'Method', 'Status Code', 'Response Time'],
      ...filteredLogs.map(log => [
        log.timestamp,
        log.level,
        log.category,
        log.message,
        log.details || '',
        log.userId || '',
        log.ip || '',
        log.endpoint || '',
        log.method || '',
        log.statusCode || '',
        log.responseTime || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Logs exportados com sucesso!');
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warn': return 'secondary';
      case 'info': return 'default';
      case 'debug': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'system': return <Server className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'api': return <Activity className="h-4 w-4" />;
      case 'auth': return <Shield className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      case 'performance': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <AnimatedSection>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Logs do Sistema</h2>
            <p className="text-muted-foreground">Monitoramento e depuração do sistema para desenvolvedores</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex-1 sm:flex-none ${autoRefresh ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
            <Button variant="outline" onClick={exportLogs} className="flex-1 sm:flex-none">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" onClick={clearLogs} className="text-destructive flex-1 sm:flex-none">
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
          </div>
        </div>
      </AnimatedSection>

      {/* Filtros */}
      <AnimatedSection delay={100}>
        <div className="lco-card hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle>Filtros de Logs</CardTitle>
            <CardDescription>
              Configure os filtros para visualizar os logs desejados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nivel">Nível</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os níveis" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Níveis</SelectItem>
                    <SelectItem value="error">Erro</SelectItem>
                    <SelectItem value="warn">Aviso</SelectItem>
                    <SelectItem value="info">Informação</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as Categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="system">Sistema</SelectItem>
                    <SelectItem value="database">Banco de Dados</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="auth">Autenticação</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="searchTerm">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="searchTerm"
                    placeholder="Buscar nos logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Button variant="outline" onClick={loadLogs} disabled={loading} className="w-full sm:w-auto">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Carregando...' : 'Atualizar'}
              </Button>
            </div>
          </CardContent>
        </div>
      </AnimatedSection>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedSection delay={200}>
          <div className="lco-card bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Erros</p>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                    {logs.filter(log => log.level === 'error').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </div>
        </AnimatedSection>
        
        <AnimatedSection delay={300}>
          <div className="lco-card bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Avisos</p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    {logs.filter(log => log.level === 'warn').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </div>
        </AnimatedSection>
        
        <AnimatedSection delay={400}>
          <div className="lco-card bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Informações</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {logs.filter(log => log.level === 'info').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </div>
        </AnimatedSection>
        
        <AnimatedSection delay={500}>
          <div className="lco-card bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700/50 hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{logs.length}</p>
                </div>
              </div>
            </CardContent>
          </div>
        </AnimatedSection>
      </div>

      {/* Lista de Logs */}
      <AnimatedSection delay={600}>
        <div className="lco-card hover:shadow-lg transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Logs do Sistema ({filteredLogs.length})</span>
            </CardTitle>
            <CardDescription>
              Últimos logs do sistema ordenados por timestamp
            </CardDescription>
          </CardHeader>
          <CardContent>
                         {filteredLogs.length === 0 ? (
               <div className="text-center py-8">
                 {loading ? (
                   <div className="text-muted-foreground">
                     <RefreshCw className="h-12 w-12 mx-auto mb-4 animate-spin" />
                     <p>Carregando logs do sistema...</p>
                   </div>
                 ) : logs.length === 0 ? (
                   <div className="text-muted-foreground">
                     <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                     <p className="text-lg font-medium mb-2">Nenhum log encontrado</p>
                     <p className="text-sm mb-4">O sistema ainda não possui logs registrados ou houve um erro na conexão.</p>
                     <div className="space-y-2 text-xs">
                       <p>💡 Verifique se:</p>
                       <ul className="list-disc list-inside space-y-1">
                         <li>O servidor backend está rodando</li>
                         <li>As tabelas de logs foram criadas no banco</li>
                         <li>Você está autenticado no sistema</li>
                       </ul>
                     </div>
                     <Button 
                       onClick={loadLogs} 
                       variant="outline" 
                       className="mt-4"
                       disabled={loading}
                     >
                       <RefreshCw className="h-4 w-4 mr-2" />
                       Tentar Novamente
                     </Button>
                   </div>
                 ) : (
                   <div className="text-muted-foreground">
                     <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                     <p>Nenhum log encontrado com os filtros aplicados</p>
                     <p className="text-sm">Tente ajustar os filtros ou limpar a busca.</p>
                   </div>
                 )}
               </div>
             ) : (
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-all duration-200 hover:shadow-md">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center space-x-2 mb-3">
                          <Badge variant={getLevelColor(log.level)}>
                            {log.level.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="flex items-center space-x-1">
                            {getCategoryIcon(log.category)}
                            <span>{log.category}</span>
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        
                        <h4 className="font-medium mb-2">{log.message}</h4>
                        
                        {log.details && (
                          <p className="text-sm text-muted-foreground mb-2">{log.details}</p>
                        )}
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-sm text-muted-foreground">
                          {log.userId && (
                            <p><strong>Usuário:</strong> {log.userId}</p>
                          )}
                          {log.ip && (
                            <p><strong>IP:</strong> {log.ip}</p>
                          )}
                          {log.endpoint && (
                            <p><strong>Endpoint:</strong> {log.method} {log.endpoint}</p>
                          )}
                          {log.statusCode && (
                            <p><strong>Status:</strong> {log.statusCode}</p>
                          )}
                          {log.responseTime && (
                            <p><strong>Tempo:</strong> {log.responseTime}ms</p>
                          )}
                        </div>
                        
                        {showDetails.has(log.id) && log.stackTrace && (
                          <div className="mt-3 p-3 bg-muted rounded-md">
                            <h5 className="font-medium mb-2">Stack Trace:</h5>
                            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {log.stackTrace}
                            </pre>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 lg:ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleDetails(log.id)}
                          className="flex-1 lg:flex-none"
                        >
                          {showDetails.has(log.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </div>
      </AnimatedSection>
    </div>
  );
};

export default LogsSistema;
