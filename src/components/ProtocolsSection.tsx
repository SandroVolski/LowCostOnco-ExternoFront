import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, Search, X, Save, 
  Pill, Clock, Droplet, Activity, Bookmark,
  Info, ChevronDown, ChevronRight, Calendar, Filter, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import ProtocoloFlipCard from './ProtocoloFlipCard';
import { ProtocoloService, ProtocoloFromAPI, MedicamentoFromAPI, ProtocoloCreateInput, ProtocoloUpdateInput, testarConexaoBackend } from '@/services/api';
import { CatalogService, type CatalogPrincipioAtivoItem } from '@/services/api';
import CIDSelection from '@/components/CIDSelection';
import ActivePrincipleSelection from '@/components/ActivePrincipleSelection';

// Interfaces (mantidas para compatibilidade, mas usando as da API)
interface Medicamento {
  nome: string;
  dose: string;
  unidade_medida: string;
  via_adm: string;
  dias_adm: string;
  frequencia: string;
  observacoes?: string;
}

interface Protocolo {
  id?: string;
  nome: string;
  descricao: string;
  cid?: string;
  intervalo_ciclos?: number;
  ciclos_previstos?: number;
  linha?: number;
  medicamentos: Medicamento[];
  created_at?: string;
  updated_at?: string;
}

// Constantes
const UNIDADES_MEDIDA_PREDEFINIDAS = [
  { id: 'mg', sigla: 'mg', nome: 'Miligrama' },
  { id: 'mg/m2', sigla: 'mg/m²', nome: 'Miligrama por m²' }, 
  { id: 'mg/kg', sigla: 'mg/kg', nome: 'Miligrama por quilograma' },
  { id: 'AUC', sigla: 'AUC', nome: 'Área sob a curva' },
  { id: 'UI', sigla: 'UI', nome: 'Unidade Internacional' },
  { id: 'mcg', sigla: 'mcg', nome: 'Micrograma' },
  { id: 'ml', sigla: 'ml', nome: 'Mililitro' },
  { id: 'g', sigla: 'g', nome: 'Grama' }
];

const FREQUENCIAS_ADMINISTRACAO = [
  { value: '1x', label: '1x ao dia' },
  { value: '2x', label: '2x ao dia' },
  { value: '3x', label: '3x ao dia' },
  { value: '4x', label: '4x ao dia' },
  { value: '5x', label: '5x ao dia' },
  { value: 'SOS', label: 'Se necessário' },
  { value: 'único', label: 'Dose única' }
];

const VIAS_ADMINISTRACAO = [
  { id: 'EV', nome: 'Endovenosa' },
  { id: 'VO', nome: 'Via Oral' },
  { id: 'SC', nome: 'Subcutânea' },
  { id: 'IM', nome: 'Intramuscular' },
  { id: 'IT', nome: 'Intratecal' },
  { id: 'IP', nome: 'Intraperitoneal' },
  { id: 'TOP', nome: 'Tópica' }
];

const emptyMedicamento: Medicamento = {
  nome: '',
  dose: '',
  unidade_medida: '',
  via_adm: '',
  dias_adm: '',
  frequencia: '',
  observacoes: ''
};

const emptyProtocolo: Protocolo = {
  nome: '',
  descricao: '',
  cid: '',
  intervalo_ciclos: undefined,
  ciclos_previstos: undefined,
  linha: undefined,
  medicamentos: []
};

// Componente AnimatedSection para consistência
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

// Novo componente de Card de Protocolo (visual grid)
const ProtocolCard = ({ protocolo, onShowDetails, onEdit, onDelete }: any) => {
  return (
    <div className="h-[320px] w-full cursor-pointer animate-fade-in-up" onClick={() => onShowDetails(protocolo)}>
      <Card className="h-full bg-gradient-to-br from-card via-card to-card/90 shadow-lg transition-all duration-300 overflow-hidden border-2 border-border hover:shadow-xl hover:border-primary/30">
        <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold line-clamp-1 text-primary">{protocolo.nome}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <span className="text-sm">{protocolo.cid || 'CID não informado'}</span>
              </CardDescription>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10" onClick={e => { e.stopPropagation(); onEdit(protocolo); }}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={e => { e.stopPropagation(); onDelete(protocolo.id); }}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4 flex-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Intervalo: {protocolo.intervalo_ciclos || 'N/D'} dias</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-3 w-3" />
              <span>Ciclos: {protocolo.ciclos_previstos || 'N/D'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Bookmark className="h-3 w-3" />
              <span>Linha: {protocolo.linha || 'N/D'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Pill className="h-3 w-3" />
              <span>Princípios Ativos: {protocolo.medicamentos.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OutdoorText = ({ text, className = '', speed = 25, delay = 3000 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const textWidth = textRef.current?.offsetWidth || 0;
    const duration = (textWidth / speed) * 1000;

    const animate = () => {
      if (!isPaused) {
        textRef.current!.style.animation = `marquee ${duration}ms linear infinite`;
      } else {
        textRef.current!.style.animation = 'none';
      }
    };

    const resetAnimation = () => {
      textRef.current!.style.animation = 'none';
      void textRef.current!.offsetWidth;
      animate();
    };

    animate();

    const observer = new ResizeObserver(resetAnimation);
    observer.observe(containerRef.current!);

    return () => observer.disconnect();
  }, [isPaused, speed, delay]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden whitespace-nowrap group ${className}`}
      style={{ minHeight: 24 }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="pointer-events-none absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-card via-card/80 to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-card via-card/80 to-transparent z-10" />
      <span
        ref={textRef}
        className="inline-block font-semibold"
        style={{
          animation: `marquee ${(textRef.current?.offsetWidth || 0) / speed}s linear infinite`,
          animationPlayState: isPaused ? 'paused' : 'running',
          animationDelay: `${delay}ms`,
          animationTimingFunction: 'ease-in-out'
        }}
      >
        {text}
      </span>
    </div>
  );
};

const ProtocolsSection = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightSigla = searchParams.get('highlight');
  const listRef = useRef<HTMLDivElement>(null);
  const [highlightedProtocol, setHighlightedProtocol] = useState<string | null>(null);
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProtocols, setExpandedProtocols] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProtocolo, setCurrentProtocolo] = useState<Protocolo>(emptyProtocolo);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [detailsModal, setDetailsModal] = useState<{ open: boolean, protocolo: Protocolo | null }>({ open: false, protocolo: null });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name', 'linha'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'ativo', 'inativo'
  const [backendConnected, setBackendConnected] = useState(false);
  const [principiosOptions, setPrincipiosOptions] = useState<CatalogPrincipioAtivoItem[]>([]);
  const [principiosSearch, setPrincipiosSearch] = useState('');
  const [principiosTotal, setPrincipiosTotal] = useState(0);
  const [principiosLimit] = useState(100);
  const [principiosOffset, setPrincipiosOffset] = useState(0);
  const [principiosLoading, setPrincipiosLoading] = useState(false);

  // useEffect para destacar protocolo
  useEffect(() => {
    if (!highlightSigla || !listRef.current) return;
    
    // Aguarda um pouco para garantir que os protocolos foram renderizados
    const timer = setTimeout(() => {
      const target = listRef.current?.querySelector(`[data-proto-sigla="${CSS.escape(highlightSigla.toUpperCase())}"]`);
      
      if (target) {
        (target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedProtocol(highlightSigla.toUpperCase());
        
        // Remove o destaque após 3 segundos e limpa o parâmetro da URL
        const clearTimer = setTimeout(() => {
          setHighlightedProtocol(null);
          setSearchParams({}); // Remove o parâmetro highlight da URL
        }, 3000);
        
        return () => clearTimeout(clearTimer);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [highlightSigla, setSearchParams, protocolos.length]);

  // Testar conexão com o backend
  useEffect(() => {
    const testConnection = async () => {
      try {
        const isConnected = await testarConexaoBackend();
        setBackendConnected(isConnected);
        if (!isConnected) {
          toast.error('Não foi possível conectar ao backend. Verifique a URL e a porta.');
        }
      } catch (error) {
        console.error('Erro ao testar conexão com o backend:', error);
        toast.error('Erro ao testar conexão com o backend');
      }
    };

    testConnection();
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setPrincipiosLoading(true);
      const { items, total } = await CatalogService.searchPrincipiosAtivosPaged({ search: principiosSearch, limit: principiosLimit, offset: 0 });
      if (!active) return;
      setPrincipiosOptions(items);
      setPrincipiosTotal(total);
      setPrincipiosOffset(items.length);
      setPrincipiosLoading(false);
    })();
    return () => { active = false; };
  }, [principiosSearch, principiosLimit]);

  const handleLoadMorePrincipios = async () => {
    if (principiosLoading || principiosOptions.length >= principiosTotal) return;
    setPrincipiosLoading(true);
    const { items } = await CatalogService.searchPrincipiosAtivosPaged({ search: principiosSearch, limit: principiosLimit, offset: principiosOffset });
    setPrincipiosOptions(prev => [...prev, ...items]);
    setPrincipiosOffset(prev => prev + items.length);
    setPrincipiosLoading(false);
  };

  const loadProtocolos = useCallback(async () => {
    try {
      if (backendConnected) {
        console.log('🔧 Carregando protocolos da API...');
        const result = await ProtocoloService.listarProtocolos({
          page: 1,
          limit: 1000, // Carregar todos os protocolos
          clinica_id: 1 // Assumindo clínica ID 1 para testes
        });
        
        // Converter da API para o formato local
        const protocolosConvertidos = result.data.map((protocoloAPI: ProtocoloFromAPI) => ({
          id: protocoloAPI.id.toString(),
          nome: protocoloAPI.nome,
          descricao: protocoloAPI.descricao || '',
          cid: protocoloAPI.cid,
          intervalo_ciclos: protocoloAPI.intervalo_ciclos,
          ciclos_previstos: protocoloAPI.ciclos_previstos,
          linha: protocoloAPI.linha,
          medicamentos: protocoloAPI.medicamentos.map(med => ({
            nome: med.nome,
            dose: med.dose || '',
            unidade_medida: med.unidade_medida || '',
            via_adm: med.via_adm || '',
            dias_adm: med.dias_adm || '',
            frequencia: med.frequencia || '',
            observacoes: med.observacoes
          })),
          created_at: protocoloAPI.created_at,
          updated_at: protocoloAPI.updated_at
        }));
        
        setProtocolos(protocolosConvertidos);
        console.log('✅ Protocolos carregados da API:', protocolosConvertidos.length);
      } else {
        console.log('⚠️ Backend não conectado, usando localStorage como fallback');
        // Fallback para localStorage
      const savedProtocolos = localStorage.getItem('clinic_protocols');
      if (savedProtocolos) {
        const parsed = JSON.parse(savedProtocolos);
        setProtocolos(Array.isArray(parsed) ? parsed : []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar protocolos:', error);
      toast.error('Erro ao carregar protocolos');
      
      // Fallback para localStorage em caso de erro
      const savedProtocolos = localStorage.getItem('clinic_protocols');
      if (savedProtocolos) {
        const parsed = JSON.parse(savedProtocolos);
        setProtocolos(Array.isArray(parsed) ? parsed : []);
      }
    }
  }, [backendConnected]);

  // Carregar protocolos do localStorage
  useEffect(() => {
    loadProtocolos();
  }, [loadProtocolos]);

  // Resetar filtros quando necessário (para melhor UX)
  useEffect(() => {
    // Log para debug dos filtros
    console.log('🔄 Filtros atualizados:', { searchTerm, statusFilter, sortBy });
  }, [searchTerm, statusFilter, sortBy]);

  const saveProtocolos = useCallback((newProtocolos: Protocolo[]) => {
    // Manter localStorage como backup apenas
    try {
      localStorage.setItem('clinic_protocols', JSON.stringify(newProtocolos));
    } catch (error) {
      console.error('Erro ao salvar no localStorage:', error);
    }
    setProtocolos(newProtocolos);
  }, []);

  // Filtro e ordenação dos protocolos
  const filteredAndSortedProtocolos = useMemo(() => {
    console.log('🔍 Aplicando filtros de protocolos:', { 
      searchTerm, 
      statusFilter, 
      sortBy, 
      totalProtocolos: protocolos.length
    });

    // Filtrar protocolos
    let filtered = protocolos.filter((protocolo) => {
      // Filtro de busca (nome, cid, descrição)
      if (searchTerm && searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase().trim();
        const matchesSearch = 
          protocolo.nome.toLowerCase().includes(term) ||
          (protocolo.cid && protocolo.cid.toLowerCase().includes(term)) ||
          protocolo.descricao.toLowerCase().includes(term);
        
        if (!matchesSearch) {
          return false;
        }
      }
      
      // Filtro de status (todos são considerados ativos por enquanto)
      let matchesStatus = true;
      // TODO: Implementar campo de status quando disponível
      // if (statusFilter !== 'all') {
      //   matchesStatus = protocolo.status === statusFilter;
      // }
      
      return matchesStatus;
    });

    console.log('✅ Protocolos filtrados:', filtered.length, 'de', protocolos.length);

    // Ordenar protocolos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case 'oldest':
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case 'name':
          return a.nome.localeCompare(b.nome);
        case 'linha':
          return (a.linha || 0) - (b.linha || 0);
        default:
          return 0;
      }
    });

    console.log('📋 Protocolos finais:', filtered.map(p => p.nome));
    return filtered;
  }, [protocolos, searchTerm, statusFilter, sortBy]);

  // Debug: verificar se protocolos estão sendo carregados
  useEffect(() => {
    console.log('📊 Estado atual:', {
      protocolos: protocolos.length,
      searchTerm,
      statusFilter,
      sortBy,
      filteredAndSortedProtocolos: filteredAndSortedProtocolos.length
    });
  }, [protocolos, filteredAndSortedProtocolos]);

  // Funções CRUD
  const handleAdd = () => {
    setCurrentProtocolo({ ...emptyProtocolo, medicamentos: [{ ...emptyMedicamento }] });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
    setStatusFilter('all');
  };

  const handleEdit = (protocolo: Protocolo) => {
    setCurrentProtocolo({ ...protocolo });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (protocoloId: string) => {
    try {
      if (backendConnected) {
        await ProtocoloService.deletarProtocolo(parseInt(protocoloId));
        toast.success('Protocolo excluído com sucesso!');
      } else {
        // Fallback para localStorage
    const newProtocolos = protocolos.filter(p => p.id !== protocoloId);
    saveProtocolos(newProtocolos);
    toast.success('Protocolo excluído com sucesso!');
      }
      
      // Recarregar protocolos
      await loadProtocolos();
    } catch (error) {
      console.error('Erro ao deletar protocolo:', error);
      toast.error('Erro ao deletar protocolo');
    }
  };

  const handleSave = async () => {
    // Validações
    if (!currentProtocolo.nome.trim()) {
      toast.error('Nome do protocolo é obrigatório');
      return;
    }

    if (!currentProtocolo.descricao.trim()) {
      toast.error('Descrição do protocolo é obrigatória');
      return;
    }

    // Filtrar medicamentos válidos
    const medicamentosValidos = currentProtocolo.medicamentos.filter(med => 
      med.nome.trim() !== ''
    );

    setLoading(true);
    
    try {
      if (backendConnected) {
        // Usar API
        const protocoloData: ProtocoloCreateInput = {
          clinica_id: 1, // Assumindo clínica ID 1 para testes
          nome: currentProtocolo.nome,
          descricao: currentProtocolo.descricao,
          cid: currentProtocolo.cid,
          intervalo_ciclos: currentProtocolo.intervalo_ciclos,
          ciclos_previstos: currentProtocolo.ciclos_previstos,
          linha: currentProtocolo.linha,
          status: 'ativo',
          medicamentos: medicamentosValidos.map(med => ({
            nome: med.nome,
            dose: med.dose,
            unidade_medida: med.unidade_medida,
            via_adm: med.via_adm,
            dias_adm: med.dias_adm,
            frequencia: med.frequencia,
            observacoes: med.observacoes,
            ordem: 0
          }))
        };

        if (isEditing && currentProtocolo.id) {
          // Atualizar protocolo existente
          const updateData: ProtocoloUpdateInput = {
            nome: protocoloData.nome,
            descricao: protocoloData.descricao,
            cid: protocoloData.cid,
            intervalo_ciclos: protocoloData.intervalo_ciclos,
            ciclos_previstos: protocoloData.ciclos_previstos,
            linha: protocoloData.linha,
            medicamentos: protocoloData.medicamentos
          };
          
          await ProtocoloService.atualizarProtocolo(parseInt(currentProtocolo.id), updateData);
          toast.success('Protocolo atualizado com sucesso!');
        } else {
          // Criar novo protocolo
          await ProtocoloService.criarProtocolo(protocoloData);
          toast.success('Protocolo adicionado com sucesso!');
        }
      } else {
        // Fallback para localStorage
      const protocoloToSave = {
        ...currentProtocolo,
        medicamentos: medicamentosValidos,
        id: isEditing ? currentProtocolo.id : Date.now().toString(),
        updated_at: new Date().toISOString(),
        created_at: isEditing ? currentProtocolo.created_at : new Date().toISOString()
      };

      let newProtocolos;
      if (isEditing) {
        newProtocolos = protocolos.map(p => 
          p.id === currentProtocolo.id ? protocoloToSave : p
        );
        toast.success('Protocolo atualizado com sucesso!');
      } else {
        newProtocolos = [...protocolos, protocoloToSave];
        toast.success('Protocolo adicionado com sucesso!');
      }

      saveProtocolos(newProtocolos);
      }
      
      setIsDialogOpen(false);
      setCurrentProtocolo(emptyProtocolo);
      
      // Recarregar protocolos
      await loadProtocolos();
    } catch (error) {
      console.error('Erro ao salvar protocolo:', error);
      toast.error('Erro ao salvar protocolo');
    } finally {
      setLoading(false);
    }
  };

  // Funções para medicamentos
  const handleAddMedicamento = () => {
    setCurrentProtocolo(prev => ({
      ...prev,
      medicamentos: [...prev.medicamentos, { ...emptyMedicamento }]
    }));
  };

  const handleRemoveMedicamento = (index: number) => {
    setCurrentProtocolo(prev => ({
      ...prev,
      medicamentos: prev.medicamentos.filter((_, i) => i !== index)
    }));
  };

  const handleMedicamentoChange = (index: number, field: keyof Medicamento, value: string) => {
    setCurrentProtocolo(prev => ({
      ...prev,
      medicamentos: prev.medicamentos.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const handleInputChange = (field: keyof Protocolo, value: string | number) => {
    setCurrentProtocolo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleExpanded = (protocoloId: string) => {
    setExpandedProtocols(prev => {
      const newSet = new Set(prev);
      if (newSet.has(protocoloId)) {
        newSet.delete(protocoloId);
      } else {
        newSet.add(protocoloId);
      }
      return newSet;
    });
  };

  const formatDiasAdministracao = (dias: string) => {
    if (!dias) return 'N/D';
    return dias;
  };

  const getViaAdmText = (via: string) => {
    const viaObj = VIAS_ADMINISTRACAO.find(v => v.id === via);
    return viaObj ? viaObj.nome : via || 'N/D';
  };

  // Função para converter intervalo em dias isolados
  const intervalToDays = (start: number, end: number): string[] => {
    const days = [];
    for (let i = start; i <= end; i++) {
      days.push(i.toString());
    }
    return days;
  };

  // Função para detectar se dias isolados formam um intervalo contínuo
  const isConsecutiveInterval = (days: string[]): { isInterval: boolean; start?: number; end?: number } => {
    if (days.length < 2) return { isInterval: false };
    
    const sortedDays = days.map(d => parseInt(d)).sort((a, b) => a - b);
    let consecutive = true;
    
    for (let i = 1; i < sortedDays.length; i++) {
      if (sortedDays[i] !== sortedDays[i-1] + 1) {
        consecutive = false;
        break;
      }
    }
    
    return consecutive 
      ? { isInterval: true, start: sortedDays[0], end: sortedDays[sortedDays.length - 1] }
      : { isInterval: false };
  };

  // Função para obter dias isolados a partir do valor armazenado
  const getDaysFromValue = (diasAdm: string): string[] => {
    if (!diasAdm || diasAdm.trim() === '') return [];
    
    // Se contém hífen, é um intervalo - converter para dias isolados
    if (diasAdm.includes('-')) {
      const [start, end] = diasAdm
        .split('-')
        .map(d => parseInt(d.replace(/D/i, '').trim()) || 0);
      return intervalToDays(Math.min(start, end), Math.max(start, end));
    }
    
    // Se contém vírgula, são dias isolados
    if (diasAdm.includes(',')) {
      return diasAdm
        .split(',')
        .map(d => d.replace(/D/i, '').trim())
        .filter(Boolean);
    }
    
    // Dia único
    return [diasAdm.replace(/D/i, '').trim()];
  };

  // Função para obter intervalo a partir do valor armazenado
  const getIntervalFromValue = (diasAdm: string): [number, number] => {
    if (!diasAdm || diasAdm.trim() === '') return [0, 7];
    
    // Se já é um intervalo
    if (diasAdm.includes('-')) {
      const dias = diasAdm
        .split('-')
        .map(d => parseInt(d.replace(/D/i, '').trim()) || 0);
      if (dias.length >= 2) {
        return [Math.min(dias[0], dias[1]), Math.max(dias[0], dias[1])];
      }
    }
    
    // Se são dias isolados, verificar se formam intervalo
    const days = getDaysFromValue(diasAdm);
    const intervalCheck = isConsecutiveInterval(days);
    
    if (intervalCheck.isInterval && intervalCheck.start !== undefined && intervalCheck.end !== undefined) {
      return [intervalCheck.start, intervalCheck.end];
    }
    
    // Fallback: usar primeiro e último dia
    if (days.length > 0) {
      const nums = days.map(d => parseInt(d)).sort((a, b) => a - b);
      return [nums[0], nums[nums.length - 1]];
    }
    
    return [0, 7];
  };

  // Corrigir showProtocoloDetails para garantir que recebe o objeto completo
  const showProtocoloDetails = (protocoloIdOrObj) => {
    let protocoloObj = protocoloIdOrObj;
    if (typeof protocoloIdOrObj === 'string') {
      protocoloObj = protocolos.find(p => p.id === protocoloIdOrObj);
    }
    setDetailsModal({ open: true, protocolo: protocoloObj });
  };

  return (
    <AnimatedSection delay={500}>
      <div className="space-y-6">
        {/* Indicador de Status da Conexão */}
        {!backendConnected && (
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              Modo offline: Os protocolos estão sendo salvos localmente. 
              Conecte-se ao backend para sincronizar com o banco de dados.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Protocolos
            </h1>
            </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-[440px]">
              <Search className={`absolute left-2.5 top-2.5 h-4 w-4 ${
                searchTerm ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <Input
                placeholder="Buscar protocolos, CID ou descrição..."
                className={`pl-8 w-[440px] transition-all duration-300 focus:ring-2 focus:ring-primary/20 ${
                  searchTerm ? 'border-primary bg-primary/5' : ''
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
              onClick={handleAdd}
              >
              <Plus className="w-4 h-4 mr-2" />
              Novo Protocolo
              </Button>
          </div>
        </div>
        {/* Filtros */}
        <AnimatedSection delay={100}>
          <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg mb-4">
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
                <SelectItem value="linha">Linha</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={`w-40 ${statusFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto">
              {/* Indicadores de filtros ativos */}
              <div className="flex gap-1 text-xs">
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs">
                    Busca: "{searchTerm}"
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Status: {statusFilter}
                  </Badge>
                )}
                {sortBy !== 'newest' && (
                  <Badge variant="secondary" className="text-xs">
                    Ordenação: {sortBy === 'oldest' ? 'Mais antigo' : sortBy === 'name' ? 'Nome' : 'Linha'}
                  </Badge>
                )}
              </div>
              
              {(searchTerm || statusFilter !== 'all' || sortBy !== 'newest') && (
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
                {filteredAndSortedProtocolos.length} protocolo(s) encontrado(s)
              </div>
            </div>
          </div>
        </AnimatedSection>
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
        {filteredAndSortedProtocolos.length === 0 && !loading ? (
          <AnimatedSection delay={200}>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Pill className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">Nenhum protocolo encontrado</h3>
              <p className="text-muted-foreground mt-2">
                {searchTerm || statusFilter !== 'all' || sortBy !== 'newest' ? 
                  'Tente mudar seus filtros ou adicione um novo protocolo' :
                  'Nenhum protocolo cadastrado ainda. Adicione o primeiro protocolo!'
                }
              </p>
              {(searchTerm || statusFilter !== 'all' || sortBy !== 'newest') && (
                <Button 
                  variant="outline"
                  className="mt-4 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  onClick={resetFilters}
                >
                  Limpar Filtros
                </Button>
              )}
              <Button 
                variant="outline"
                className="mt-6 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                onClick={handleAdd}
              >
                  <Plus className="w-4 h-4 mr-2" />
                Adicionar protocolo
                </Button>
            </div>
          </AnimatedSection>
        ) : (
          <div ref={listRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedProtocolos.map((protocolo, idx) => {
              const protocoloSigla = (protocolo as any).sigla?.toUpperCase?.() || (protocolo.nome || '').toUpperCase?.() || '';
              const isHighlighted = highlightedProtocol === protocoloSigla;
              
              return (
                <AnimatedSection key={protocolo.id} delay={100 * idx}>
                  <div 
                    data-proto-sigla={protocoloSigla}
                    className={isHighlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg transition-all duration-300 shadow-lg shadow-primary/20 scale-[1.02]' : 'transition-all duration-300'}
                  >
                    <ProtocoloFlipCard
                      protocolo={protocolo}
                      isSelected={selectedRows.has(protocolo.id)}
                      showProtocoloDetails={showProtocoloDetails}
                      handleEditFixedWithSelection={handleEdit}
                      handleDelete={handleDelete}
                    />
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        )}
      {/* Dialog para adicionar/editar protocolo */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Protocolo' : 'Adicionar Novo Protocolo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Informações básicas */}
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Protocolo *</Label>
                  <Input
                    id="nome"
                    value={currentProtocolo.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    placeholder="Ex: Protocolo AC-T"
                    className="lco-input"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cid">CID Associado</Label>
                  <CIDSelection
                    value={currentProtocolo.cid || ''}
                    onChange={(arr) => handleInputChange('cid', arr?.[0]?.codigo || '')}
                    multiple={false}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição do Protocolo *</Label>
                <Textarea
                  id="descricao"
                  value={currentProtocolo.descricao}
                  onChange={(e) => handleInputChange('descricao', e.target.value)}
                  placeholder="Descreva o protocolo de tratamento..."
                  className="lco-input min-h-[80px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="intervalo_ciclos">Intervalo entre Ciclos (dias)</Label>
                  <Input
                    id="intervalo_ciclos"
                    type="number"
                    value={currentProtocolo.intervalo_ciclos || ''}
                    onChange={(e) => handleInputChange('intervalo_ciclos', Number(e.target.value))}
                    placeholder="21"
                    className="lco-input"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ciclos_previstos">Ciclos Previstos</Label>
                  <Input
                    id="ciclos_previstos"
                    type="number"
                    value={currentProtocolo.ciclos_previstos || ''}
                    onChange={(e) => handleInputChange('ciclos_previstos', Number(e.target.value))}
                    placeholder="6"
                    className="lco-input"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linha">Linha</Label>
                  <Input
                    id="linha"
                    type="number"
                    value={currentProtocolo.linha || ''}
                    onChange={(e) => handleInputChange('linha', Number(e.target.value))}
                    placeholder="1"
                    className="lco-input"
                    min="1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Medicamentos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium flex items-center">
                  <Pill className="h-5 w-5 mr-2" />
                  Princípios Ativos
                </h3>
              </div>

              {currentProtocolo.medicamentos.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum princípio ativo adicionado. Use o botão "Adicionar Princípio Ativo" para incluir princípios ativos ao protocolo.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {currentProtocolo.medicamentos.map((med, index) => (
                    <Card key={index} className="border border-border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Princípio Ativo {index + 1}</CardTitle>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMedicamento(index)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                          <div className="space-y-2">
                            <Label>Princípio Ativo *</Label>
                            <ActivePrincipleSelection
                              value={med.nome || ''}
                              onChange={(selected) => handleMedicamentoChange(index, 'nome', selected[0] || '')}
                              multiple={false}
                              placeholder="Selecione o princípio ativo"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Dose</Label>
                            <div className="flex gap-2">
                              <Input
                                value={med.dose}
                                onChange={(e) => handleMedicamentoChange(index, 'dose', e.target.value)}
                                placeholder="175"
                                className="lco-input flex-1"
                              />
                              <Select
                                value={med.unidade_medida}
                                onValueChange={(value) => handleMedicamentoChange(index, 'unidade_medida', value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Unidade" />
                                </SelectTrigger>
                                <SelectContent>
                                  {UNIDADES_MEDIDA_PREDEFINIDAS.map(unidade => (
                                    <SelectItem key={unidade.id} value={unidade.id}>
                                      {unidade.sigla}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Via de Administração</Label>
                            <Select
                              value={med.via_adm}
                              onValueChange={(value) => handleMedicamentoChange(index, 'via_adm', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {VIAS_ADMINISTRACAO.map(via => (
                                  <SelectItem key={via.id} value={via.id}>
                                    {via.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Frequência</Label>
                            <Select
                              value={med.frequencia}
                              onValueChange={(value) => handleMedicamentoChange(index, 'frequencia', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                {FREQUENCIAS_ADMINISTRACAO.map(freq => (
                                  <SelectItem key={freq.value} value={freq.value}>
                                    {freq.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 md:col-span-2">
                            <Label>Dias de Administração</Label>
                              <Tabs defaultValue={`isolados-${index}`} className="w-full">
                                <TabsList className="mb-2 flex justify-center">
                                  <TabsTrigger value={`isolados-${index}`}>Dias Isolados</TabsTrigger>
                                  <TabsTrigger value={`intervalo-${index}`}>Intervalo de Dias</TabsTrigger>
                                </TabsList>
                                <TabsContent value={`isolados-${index}`}> {/* Dias Isolados */}
                                  <div className="flex flex-wrap gap-1 justify-center">
                                    {Array.from({ length: 71 }, (_, i) => i).map((dia) => {
                                      const diasSelecionados = getDaysFromValue(med.dias_adm);
                                      const selected = diasSelecionados.includes(dia.toString());
                                      return (
                                        <button
                                          key={dia}
                                          type="button"
                                          className={`w-9 h-9 rounded-full border text-xs font-semibold transition-all duration-200
                                            ${selected ? 'bg-primary text-white border-primary' : 'bg-muted text-foreground border-border hover:bg-primary/10'}`}
                                          onClick={() => {
                                            let dias = getDaysFromValue(med.dias_adm);
                                            if (selected) {
                                              dias = dias.filter((d) => d !== dia.toString());
                                            } else {
                                              dias.push(dia.toString());
                                            }
                                            dias = Array.from(new Set(dias)).sort((a, b) => Number(a) - Number(b));
                                            
                                            // Verificar se os dias formam um intervalo contínuo
                                            const intervalCheck = isConsecutiveInterval(dias);
                                            if (intervalCheck.isInterval && intervalCheck.start !== undefined && intervalCheck.end !== undefined) {
                                              // Salvar como intervalo
                                              handleMedicamentoChange(index, 'dias_adm', `D${intervalCheck.start}-D${intervalCheck.end}`);
                                            } else if (dias.length === 0) {
                                              // Limpar seleção
                                              handleMedicamentoChange(index, 'dias_adm', '');
                                            } else {
                                              // Salvar como dias isolados
                                              handleMedicamentoChange(index, 'dias_adm', dias.map((d) => `D${d}`).join(','));
                                            }
                                          }}
                                        >
                                          D{dia}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-2 text-center min-h-[1.5em]">
                                    {(() => {
                                      const dias = getDaysFromValue(med.dias_adm);
                                      if (dias.length === 0) return 'Selecione os dias de administração';
                                      
                                      const intervalCheck = isConsecutiveInterval(dias);
                                      if (intervalCheck.isInterval && intervalCheck.start !== undefined && intervalCheck.end !== undefined) {
                                        return (
                                          <span className="font-semibold text-primary">
                                            Intervalo: D{intervalCheck.start} até D{intervalCheck.end} ({dias.length} dias)
                                          </span>
                                        );
                                      } else {
                                        return dias.map((d, i) => (
                                          <span key={d} className="inline-block font-semibold text-primary mr-1">D{d}</span>
                                        ));
                                      }
                                    })()}
                                  </div>
                                </TabsContent>
                                <TabsContent value={`intervalo-${index}`}> {/* Intervalo de Dias */}
                                  <div className="flex flex-col gap-2 items-center">
                                    <div className="w-full flex flex-col items-center">
                                      <div className="flex w-full items-center justify-between mb-1">
                                        <span className="w-5 h-5 rounded-full border-2 border-muted bg-muted flex items-center justify-center text-xs text-muted-foreground font-bold">D0</span>
                                        <span className="w-5 h-5 rounded-full border-2 border-muted bg-muted flex items-center justify-center text-xs text-muted-foreground font-bold">D70</span>
                                      </div>
                                      <Slider
                                        min={0}
                                        max={70}
                                        step={1}
                                        value={getIntervalFromValue(med.dias_adm)}
                                        onValueChange={([start, end]) => {
                                          const menor = Math.min(start, end);
                                          const maior = Math.max(start, end);
                                          
                                          if (menor === maior) {
                                            // Dia único
                                            handleMedicamentoChange(index, 'dias_adm', `D${menor}`);
                                          } else {
                                            // Intervalo - sempre salvar como intervalo para manter consistência
                                            handleMedicamentoChange(index, 'dias_adm', `D${menor}-D${maior}`);
                                          }
                                        }}
                                      />
                                      <div className="flex justify-between w-full text-xs text-muted-foreground mt-1">
                                        <span>D0</span>
                                        <span>D70</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1 justify-center">
                                      <span className="w-8 h-8 rounded-full border-2 border-primary bg-primary/80 flex items-center justify-center text-xs text-white font-bold">
                                        D{getIntervalFromValue(med.dias_adm)[0]}
                                      </span>
                                      <span className="text-xs">até</span>
                                      <span className="w-8 h-8 rounded-full border-2 border-primary bg-primary/80 flex items-center justify-center text-xs text-white font-bold">
                                        D{getIntervalFromValue(med.dias_adm)[1]}
                                      </span>
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
                <div className="flex justify-center mt-4">
                  <Button 
                    type="button" 
                    onClick={handleAddMedicamento}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Princípio Ativo
                  </Button>
                </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="lco-btn-primary"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Salvar Alterações' : 'Adicionar Protocolo'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes do protocolo */}
      <Dialog open={detailsModal.open} onOpenChange={open => setDetailsModal({ open, protocolo: open ? detailsModal.protocolo : null })}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Informações Completas do Protocolo
            </DialogTitle>
          </DialogHeader>
          {detailsModal.protocolo && (
            <div className="space-y-6">
                {/* Header com nome e badges */}
                <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-2">{detailsModal.protocolo.nome}</h3>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="secondary">{(detailsModal.protocolo.medicamentos || []).length} princípio(s) ativo(s)</Badge>
                    <span className="text-muted-foreground">CID: {detailsModal.protocolo.cid || 'N/D'}</span>
                    <span className="text-muted-foreground">Linha: {detailsModal.protocolo.linha || 'N/D'}</span>
                  </div>
                </div>

                {/* Seção: Dados principais */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Dados do Protocolo
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Descrição:</span>
                      <p className="font-medium">{detailsModal.protocolo.descricao || 'N/D'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Intervalo entre ciclos:</span>
                      <p className="font-medium">{detailsModal.protocolo.intervalo_ciclos || 'N/D'} dias</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ciclos previstos:</span>
                      <p className="font-medium">{detailsModal.protocolo.ciclos_previstos || 'N/D'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Linha:</span>
                      <p className="font-medium">{detailsModal.protocolo.linha || 'N/D'}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Seção: Medicamentos */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    Princípios Ativos do Protocolo
                  </h4>
                  {(detailsModal.protocolo.medicamentos || []).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(detailsModal.protocolo.medicamentos || []).map((med, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-lg p-3 border border-border/50">
                          <div className="flex items-center gap-2 mb-2">
                            <Pill className="h-4 w-4 text-primary" />
                            <span className="font-medium text-base">{med.nome}</span>
                          </div>
                          <div className="grid grid-cols-1 gap-1 text-xs">
                            <div className="flex items-center gap-1">
                              <Droplet className="h-3 w-3 text-primary" />
                              <span className="text-muted-foreground">Dose:</span>
                              <span className="font-medium">{med.dose} {med.unidade_medida}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-primary" />
                              <span className="text-muted-foreground">Dias:</span>
                              <span className="font-medium">{med.dias_adm}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-primary" />
                              <span className="text-muted-foreground">Frequência:</span>
                              <span className="font-medium">{med.frequencia}</span>
                            </div>
                            {med.via_adm && (
                              <div className="flex items-center gap-1">
                                <Info className="h-3 w-3 text-primary" />
                                <span className="text-muted-foreground">Via:</span>
                                <span className="font-medium">{getViaAdmText(med.via_adm)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <Pill size={32} className="mx-auto mb-2" />
                      Nenhum princípio ativo cadastrado
                    </div>
                  )}
                </div>
              </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AnimatedSection>
  );
};

export default ProtocolsSection; 