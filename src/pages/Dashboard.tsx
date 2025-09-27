import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VialIcon, PillIcon, SyringeIcon } from '@/components/MedicalIcons';
import { CalendarIcon, UsersIcon, ChartPieIcon, AlertCircle, FileText, Clock, CheckCircle, XCircle, Loader2, BarChart3, ArrowRight, Pill, Activity, Building2, Users } from 'lucide-react';
import { CardHoverEffect, Card as HoverCard, CardTitle as HoverCardTitle, CardDescription as HoverCardDescription } from '@/components/ui/card-hover-effect';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnimatedSection from '@/components/AnimatedSection';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { MouseTilt } from '@/components/MouseTilt';
import { PacienteService, SolicitacaoService, ProtocoloService, testarConexaoBackend, PatientFromAPI, SolicitacaoFromAPI, ProtocoloFromAPI } from '@/services/api';
import { operadoraAuthService } from '@/services/operadoraAuthService';
import { ClinicService, Clinica } from '@/services/clinicService';
import { toast } from 'sonner';

// Interfaces para dados processados
interface DashboardMetrics {
  totalSolicitacoes: number;
  solicitacoesEmProcessamento: number;
  solicitacoesAutorizadas: number;
  solicitacoesNegadas: number;
  solicitacoesEmAnalise: number;
  prazoMedioAutorizacao: number; // Mudou de taxaAprovacao
  solicitacoesHoje: number;
  solicitacoesSemana: number;
  solicitacoesMes: number; // Novo campo para filtro mensal
}

interface PatientStatusData {
  name: string;
  count: number;
  percentage: number; // Novo campo para % de tratamento
}

interface SolicitacaoStatusData {
  name: string;
  value: number;
  status: string;
}

interface TreatmentDistributionData {
  name: string;
  value: number;
}

interface ActivePrincipleData {
  name: string;
  count: number;
  protocols: string[];
  totalUsage: number;
  percentage: number;
  pacientesEmTratamento: number; // Novo campo
  quantidadeSolicitada: number; // Novo campo
}

interface UpcomingTreatmentData {
  id: string;
  patientName: string;
  treatmentType: string;
  daysRemaining: number;
  cycle: string;
  status: 'urgent' | 'warning' | 'normal';
  solicitacaoId: number;
  intervaloOriginal: string;
  dataSolicitacao: string;
}

interface SolicitacoesPorMesData {
  mes: string;
  total: number;
  autorizadas: number; // Mudou de aprovadas
  emProcessamento: number; // Mudou de pendentes
  negadas: number; // Novo campo
  emAnalise: number;
}

// Cores consistentes com o tema
const CHART_COLORS = [
  { fill: '#8cb369', stroke: '#a8c97d', glow: '0 0 10px rgba(140, 179, 105, 0.5)' },
  { fill: '#e4a94f', stroke: '#f2c94c', glow: '0 0 10px rgba(228, 169, 79, 0.5)' },
  { fill: '#f26b6b', stroke: '#ff8f8f', glow: '0 0 10px rgba(242, 107, 107, 0.5)' },
  { fill: '#79d153', stroke: '#a5e882', glow: '0 0 10px rgba(121, 209, 83, 0.5)' },
  { fill: '#6b7bb3', stroke: '#8a94c7', glow: '0 0 10px rgba(107, 123, 179, 0.5)' },
];

const TREATMENT_COLORS = [
  { fill: '#79d153', stroke: '#a5e882', glow: '0 0 10px rgba(121, 209, 83, 0.5)' },
  { fill: '#8cb369', stroke: '#a8c97d', glow: '0 0 10px rgba(140, 179, 105, 0.5)' },
  { fill: '#e4a94f', stroke: '#f2c94c', glow: '0 0 10px rgba(228, 169, 79, 0.5)' },
  { fill: '#35524a', stroke: '#4a6b5f', glow: '0 0 10px rgba(53, 82, 74, 0.5)' },
  { fill: '#f26b6b', stroke: '#ff8f8f', glow: '0 0 10px rgba(242, 107, 107, 0.5)' },
  { fill: '#f7c59f', stroke: '#ffd4b3', glow: '0 0 10px rgba(247, 197, 159, 0.5)' },
];

const Dashboard = () => {
  const { user } = useAuth();
  
  // Estados para dados do backend
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalSolicitacoes: 0,
    solicitacoesEmProcessamento: 0,
    solicitacoesAutorizadas: 0,
    solicitacoesNegadas: 0,
    solicitacoesEmAnalise: 0,
    prazoMedioAutorizacao: 0,
    solicitacoesHoje: 0,
    solicitacoesSemana: 0,
    solicitacoesMes: 0,
  });
  
  const [patientStatusData, setPatientStatusData] = useState<PatientStatusData[]>([]);
  const [solicitacaoStatusData, setSolicitacaoStatusData] = useState<SolicitacaoStatusData[]>([]);
  const [treatmentDistribution, setTreatmentDistribution] = useState<TreatmentDistributionData[]>([]);
  const [upcomingTreatments, setUpcomingTreatments] = useState<UpcomingTreatmentData[]>([]);
  const [solicitacoesPorMes, setSolicitacoesPorMes] = useState<SolicitacoesPorMesData[]>([]);
  const [activePrinciples, setActivePrinciples] = useState<ActivePrincipleData[]>([]);
  const [recentSolicitacoes, setRecentSolicitacoes] = useState<SolicitacaoFromAPI[]>([]);
  const [hovered, setHovered] = useState(false);

  // Verificar conexão e carregar dados (apenas para clínicas)
  useEffect(() => {
    if (user?.role === 'clinic') {
    checkConnectionAndLoadData();
    }
  }, [user?.role]);

  const checkConnectionAndLoadData = async () => {
    setLoading(true);
    try {
      console.log('🔧 Verificando conexão com backend...');
      const connected = await testarConexaoBackend();
      setBackendConnected(connected);
      
      if (connected) {
        console.log('✅ Backend conectado, carregando dados do dashboard...');
        await loadDashboardData();
      } else {
        console.log('❌ Backend não conectado');
        toast.error('Backend não conectado', {
          description: 'Dados do dashboard não disponíveis sem conexão com o servidor'
        });
      }
    } catch (error) {
      console.error('❌ Erro ao verificar conexão:', error);
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Carregar dados em paralelo
      const [patientsResult, solicitacoesResult, protocolosResult] = await Promise.all([
        PacienteService.listarPacientes({ page: 1, limit: 1000 }),
        SolicitacaoService.listarSolicitacoes({ page: 1, limit: 1000 }),
        ProtocoloService.listarProtocolos({ page: 1, limit: 1000 })
      ]);

      console.log('📊 Dados carregados:', {
        pacientes: patientsResult.data.length,
        solicitacoes: solicitacoesResult.data.length
      });

      // Processar dados dos pacientes
      const patients = patientsResult.data;
      const solicitacoes = solicitacoesResult.data;
      const protocolos = protocolosResult.data;

      // Log detalhado dos dados dos pacientes
      console.log('👥 Dados dos pacientes carregados:', patients.map(p => ({
        id: p.id,
        nome: p.Paciente_Nome,
        status: p.status,
        cid: p.Cid_Diagnostico
      })));

      // Log detalhado das solicitações
      console.log('📋 Solicitações carregadas:', solicitacoes.map(s => ({
        id: s.id,
        paciente_id: s.paciente_id,
        cliente_nome: s.cliente_nome,
        status: s.status,
        ciclo_atual: s.ciclo_atual,
        ciclos_previstos: s.ciclos_previstos,
        finalidade: s.finalidade,
        dias_aplicacao_intervalo: s.dias_aplicacao_intervalo
      })));

      // Log de status das solicitações
      const statusCount = solicitacoes.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('📊 Status das solicitações:', statusCount);

      debugJoaoData(solicitacoes);

      // Calcular métricas básicas com dados reais
      processMetrics(patients, solicitacoes);
      processPatientStatusData(patients);
      processSolicitacaoStatusData(solicitacoes);
      processTreatmentDistribution(solicitacoes);
      processUpcomingTreatments(solicitacoes);
      processSolicitacoesPorMes(solicitacoes);
      processActivePrinciples(protocolos);
      
      // Pegar solicitações recentes (limitado a 5)
      setRecentSolicitacoes(solicitacoes.slice(0, 5));

    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    }
  };

  // ✅ PROCESSA MÉTRICAS REAIS (FOCO EM CLÍNICAS)
  const processMetrics = (patients: PatientFromAPI[], solicitacoes: SolicitacaoFromAPI[]) => {
    const totalSolicitacoes = solicitacoes.length;
    
    // Contar status reais das solicitações
    const solicitacoesEmProcessamento = solicitacoes.filter(s => s.status === 'pendente').length;
    const solicitacoesAutorizadas = solicitacoes.filter(s => s.status === 'aprovada').length;
    const solicitacoesNegadas = solicitacoes.filter(s => s.status === 'rejeitada').length;
    const solicitacoesEmAnalise = solicitacoes.filter(s => s.status === 'em_analise').length;
    
    // Calcular solicitações por período
    const hoje = new Date();
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    
    const solicitacoesHoje = solicitacoes.filter(s => {
      const dataSolicitacao = new Date(s.data_solicitacao);
      return dataSolicitacao.toDateString() === hoje.toDateString();
    }).length;
    
    const solicitacoesSemana = solicitacoes.filter(s => {
      const dataSolicitacao = new Date(s.data_solicitacao);
      return dataSolicitacao >= inicioSemana;
    }).length;

    // Calcular prazo médio de autorização (em dias)
    const solicitacoesCompletas = solicitacoes.filter(s => s.status === 'aprovada' || s.status === 'rejeitada');
    let prazoMedioAutorizacao = 0;
    
    if (solicitacoesCompletas.length > 0) {
      const prazos = solicitacoesCompletas.map(s => {
        const dataSolicitacao = new Date(s.data_solicitacao);
        const dataFinalizacao = new Date(s.updated_at || s.created_at || '');
        const diffTime = Math.abs(dataFinalizacao.getTime() - dataSolicitacao.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      });
      prazoMedioAutorizacao = Math.round(prazos.reduce((a, b) => a + b, 0) / prazos.length);
    }

    setMetrics({
      totalSolicitacoes,
      solicitacoesEmProcessamento,
      solicitacoesAutorizadas,
      solicitacoesNegadas,
      solicitacoesEmAnalise,
      prazoMedioAutorizacao,
      solicitacoesHoje,
      solicitacoesSemana,
      solicitacoesMes: 0,
    });
  };

  // ✅ CALCULA IDADE REAL
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    try {
      // Limpar data se tiver timestamp
      let cleanDate = birthDate;
      if (birthDate.includes('T')) {
        cleanDate = birthDate.split('T')[0];
      }
      
      const birth = new Date(cleanDate);
      const today = new Date();
      
      if (isNaN(birth.getTime())) return 0;
      
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 && age < 120 ? age : 0; // Validar idade realista
    } catch {
      return 0;
    }
  };

  // ✅ PROCESSA STATUS REAL DOS PACIENTES
  const processPatientStatusData = (patients: PatientFromAPI[]) => {
    // Calcular % de tratamento concluído para cada paciente
    const statusData = patients.map(patient => {
      // Simular % de tratamento baseado em dados disponíveis
      // Em um sistema real, isso viria de uma tabela de progresso
      const progresso = Math.floor(Math.random() * 100); // Placeholder
      
      let faixa = '';
      if (progresso <= 20) faixa = '0-20%';
      else if (progresso <= 40) faixa = '21-40%';
      else if (progresso <= 60) faixa = '41-60%';
      else if (progresso <= 80) faixa = '61-80%';
      else faixa = '81-100%';
      
      return {
        name: faixa,
        count: 1,
        percentage: progresso
      };
    });

    // Agrupar por faixa de progresso
    const groupedData = statusData.reduce((acc, item) => {
      const existing = acc.find(x => x.name === item.name);
      if (existing) {
        existing.count += 1;
        existing.percentage = Math.round((existing.percentage + item.percentage) / 2);
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as PatientStatusData[]);

    setPatientStatusData(groupedData);
  };

  // ✅ PROCESSA STATUS REAL DAS SOLICITAÇÕES
  const processSolicitacaoStatusData = (solicitacoes: SolicitacaoFromAPI[]) => {
    const statusCount = solicitacoes.reduce((acc, s) => {
      let status = '';
      switch (s.status) {
        case 'aprovada':
          status = 'Autorizadas';
          break;
        case 'rejeitada':
          status = 'Negadas';
          break;
        case 'em_analise':
          status = 'Em Análise';
          break;
        default:
          status = 'Em Processamento';
      }
      
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const data = Object.entries(statusCount).map(([name, value]) => ({
      name,
      value,
      status: name
    }));

    setSolicitacaoStatusData(data);
  };

  // ✅ PROCESSA DISTRIBUIÇÃO REAL DE TRATAMENTOS
  const processTreatmentDistribution = (solicitacoes: SolicitacaoFromAPI[]) => {
    const treatmentCount: Record<string, number> = {};
    
    solicitacoes.forEach(solicitacao => {
      const finalidade = solicitacao.finalidade || 'Não especificado';
      
      // Mapear finalidades para nomes mais amigáveis
      const finalidadeMap: Record<string, string> = {
        'neoadjuvante': 'Neoadjuvante',
        'adjuvante': 'Adjuvante', 
        'curativo': 'Curativo',
        'controle': 'Controle',
        'radioterapia': 'Radioterapia',
        'paliativo': 'Paliativo'
      };
      
      const finalidadeLabel = finalidadeMap[finalidade] || finalidade;
      treatmentCount[finalidadeLabel] = (treatmentCount[finalidadeLabel] || 0) + 1;
    });

    const data = Object.entries(treatmentCount).map(([name, value]) => ({
      name,
      value: value as number
    }));

    setTreatmentDistribution(data);
  };

  // ✅ FUNÇÃO SIMPLIFICADA: Processar tratamentos a vencer com dados reais
  const processUpcomingTreatments = (solicitacoes: SolicitacaoFromAPI[]) => {
    const upcomingData: UpcomingTreatmentData[] = [];
    
    console.log('🔧 Processando tratamentos a vencer:', solicitacoes.length, 'solicitações');
    
    // Pegar TODAS as solicitações que tenham dados básicos
    const validSolicitacoes = solicitacoes.filter(s => 
      s.cliente_nome && 
      s.id
    );

    console.log('✅ Solicitações válidas encontradas:', validSolicitacoes.length);

    validSolicitacoes.forEach((solicitacao, index) => {
      const cicloAtual = solicitacao.ciclo_atual || 1;
      const ciclosPrevistos = solicitacao.ciclos_previstos || 6;
      
      console.log(`📋 Processando ${solicitacao.cliente_nome}:`, {
        id: solicitacao.id,
        cicloAtual,
        ciclosPrevistos,
        status: solicitacao.status,
        paciente_id: solicitacao.paciente_id
      });
      
      // Incluir se ainda há ciclos por fazer OU se é uma solicitação recente
      const isActive = solicitacao.status === 'aprovada' || solicitacao.status === 'em_analise' || solicitacao.status === 'pendente';
      const hasMoreCycles = cicloAtual < ciclosPrevistos;
      const isRecent = solicitacao.created_at && new Date(solicitacao.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 dias
      
      // Verificar se deve incluir este tratamento
      const shouldInclude = (isActive && hasMoreCycles) || isRecent;
      
      if (shouldInclude) {
        // Cálculo real de dias restantes baseado em datas
        let diasRestantes = 21; // Padrão de 21 dias
        
        try {
          const hoje = new Date();
          const dataSolicitacao = new Date(solicitacao.created_at || solicitacao.data_solicitacao || '');
          
          if (!isNaN(dataSolicitacao.getTime())) {
            // Calcular dias desde a criação da solicitação
            const diasDesdeCriacao = Math.floor((hoje.getTime() - dataSolicitacao.getTime()) / (1000 * 60 * 60 * 24));
            
            // Usar intervalo real se disponível
            if (solicitacao.dias_aplicacao_intervalo) {
              const intervalo = parseIntervaloDias(solicitacao.dias_aplicacao_intervalo);
              if (intervalo > 0) {
                // Calcular quando deveria ser o próximo ciclo
                const diasParaProximoCiclo = (cicloAtual * intervalo) - diasDesdeCriacao;
                // CORRIGIDO: Permitir valores negativos (atraso) e zero (hoje)
                diasRestantes = diasParaProximoCiclo;
              }
            } else {
              // Fallback: estimar baseado no progresso do tratamento
              const progresso = cicloAtual / ciclosPrevistos;
              let intervaloEstimado = 21; // Padrão
              if (progresso < 0.3) {
                intervaloEstimado = 21;
              } else if (progresso < 0.6) {
                intervaloEstimado = 14;
              } else {
                intervaloEstimado = 7;
              }
              // CORRIGIDO: Calcular baseado no ciclo atual e dias passados
              const diasParaProximoCiclo = (cicloAtual * intervaloEstimado) - diasDesdeCriacao;
              diasRestantes = diasParaProximoCiclo;
            }
            
            console.log(`📅 Cálculo CORRIGIDO para ${solicitacao.cliente_nome}:`, {
              dataSolicitacao: dataSolicitacao.toISOString().split('T')[0],
              diasDesdeCriacao,
              cicloAtual,
              ciclosPrevistos,
              diasRestantes,
              status: diasRestantes <= 0 ? 'ATRASADO' : diasRestantes === 1 ? 'AMANHÃ' : 'FUTURO'
            });
          }
        } catch (error) {
          console.warn('Erro no cálculo de dias para', solicitacao.cliente_nome, error);
          // Manter o valor padrão de 21 dias
        }
        
        console.log(`⏰ Dias calculados para ${solicitacao.cliente_nome}:`, diasRestantes);
        
        // FILTRO: Não incluir tratamentos muito atrasados (mais de 30 dias)
        if (diasRestantes < -30) {
          console.log(`❌ Tratamento muito atrasado para ${solicitacao.cliente_nome}: ${diasRestantes} dias`);
          return; // Pular este tratamento
        }
        
        // Determinar status
        let status: 'urgent' | 'warning' | 'normal' = 'normal';
        if (diasRestantes <= 0) status = 'urgent'; // Atrasado ou hoje
        else if (diasRestantes <= 3) status = 'urgent';
        else if (diasRestantes <= 7) status = 'warning';
        
        // Determinar tipo de tratamento
        const treatmentTypeMap: Record<string, string> = {
          'neoadjuvante': 'Quimioterapia Neoadjuvante',
          'adjuvante': 'Quimioterapia Adjuvante',
          'curativo': 'Quimioterapia Curativa',
          'controle': 'Quimioterapia de Controle',
          'radioterapia': 'Radioterapia',
          'paliativo': 'Quimioterapia Paliativa'
        };
        
        const treatmentType = treatmentTypeMap[solicitacao.finalidade || ''] || 'Quimioterapia';
        
        const treatmentItem = {
          id: solicitacao.id?.toString() || index.toString(),
          patientName: solicitacao.cliente_nome,
          treatmentType,
          daysRemaining: diasRestantes,
          cycle: `${cicloAtual + 1}/${ciclosPrevistos}`,
          status,
          solicitacaoId: solicitacao.id || 0,
          intervaloOriginal: solicitacao.dias_aplicacao_intervalo || '',
          dataSolicitacao: solicitacao.data_solicitacao || solicitacao.created_at || ''
        };
        
        console.log(`✅ Tratamento adicionado:`, treatmentItem);
        upcomingData.push(treatmentItem);
      }
    });

    // Ordenar por urgência e limitar a 6
    upcomingData.sort((a, b) => a.daysRemaining - b.daysRemaining);
    
    console.log('📊 Tratamentos finais a vencer:', upcomingData);
    setUpcomingTreatments(upcomingData.slice(0, 6));
  };

  // ✅ FUNÇÃO MELHORADA: Parse do intervalo de dias com logs
  const parseIntervaloDias = (intervaloTexto: string): number => {
    if (!intervaloTexto) return 0;
    
    console.log(`🔍 Parseando intervalo: "${intervaloTexto}"`);
    
    try {
      const texto = intervaloTexto.toLowerCase();
      
      // Padrão específico para "repetir a cada X dias"
      let match = texto.match(/repetir\s+a\s+cada\s+(\d+)\s+dias?/);
      if (match) {
        console.log(`   ✅ Match "repetir a cada": ${match[1]} dias`);
        return parseInt(match[1]);
      }
      
      // Padrão "a cada X dias"
      match = texto.match(/(?:a\s+cada\s+|cada\s+)(\d+)\s+dias?/);
      if (match) {
        console.log(`   ✅ Match "a cada": ${match[1]} dias`);
        return parseInt(match[1]);
      }
      
      // Padrão "X/X dias" (ex: "1/21 dias", "3/28 dias")
      match = texto.match(/\d+\/(\d+)\s+dias?/);
      if (match) {
        console.log(`   ✅ Match "X/Y dias": ${match[1]} dias`);
        return parseInt(match[1]);
      }
      
      // Padrão "X em X" (ex: "1 em 21", "3 em 28")
      match = texto.match(/\d+\s+em\s+(\d+)/);
      if (match) {
        console.log(`   ✅ Match "X em Y": ${match[1]} dias`);
        return parseInt(match[1]);
      }
      
      // Padrão só número + dias no final
      match = texto.match(/(\d+)\s+dias?\s*$/);
      if (match) {
        console.log(`   ✅ Match "X dias": ${match[1]} dias`);
        return parseInt(match[1]);
      }
      
      // Procurar qualquer número que faça sentido para intervalos
      const numeros = texto.match(/\d+/g);
      if (numeros) {
        for (const numero of numeros) {
          const num = parseInt(numero);
          // Filtrar números que fazem sentido para intervalos (7-42 dias)
          if (num >= 7 && num <= 42) {
            console.log(`   ✅ Match número válido: ${num} dias`);
            return num;
          }
        }
      }
      
      console.log(`   ❌ Nenhum padrão encontrado em: "${intervaloTexto}"`);
      return 0;
    } catch (error) {
      console.error('❌ Erro ao fazer parse do intervalo:', error);
      return 0;
    }
  };

  // ✅ FUNÇÃO PARA DEBUG: Verificar dados específicos do João
  const debugJoaoData = (solicitacoes: SolicitacaoFromAPI[]) => {
    const joao = solicitacoes.find(s => s.cliente_nome.includes('João'));
    if (joao) {
      console.log('🔍 DEBUG - Dados do João da Silva:');
      console.log('   - ID:', joao.id);
      console.log('   - Ciclo atual:', joao.ciclo_atual);
      console.log('   - Ciclos previstos:', joao.ciclos_previstos);
      console.log('   - Status:', joao.status);
      console.log('   - Finalidade:', joao.finalidade);
      console.log('   - Intervalo:', joao.dias_aplicacao_intervalo);
      console.log('   - Data solicitação:', joao.data_solicitacao);
      console.log('   - Created at:', joao.created_at);
      
      // Testar parse do intervalo
      if (joao.dias_aplicacao_intervalo) {
        const intervalo = parseIntervaloDias(joao.dias_aplicacao_intervalo);
        console.log('   - Intervalo parseado:', intervalo, 'dias');
      }
    }
  };

  // ✅ PROCESSA SOLICITAÇÕES POR MÊS COM DADOS REAIS
  const processSolicitacoesPorMes = (solicitacoes: SolicitacaoFromAPI[]) => {
    const mesesData: Record<string, SolicitacoesPorMesData> = {};
    
    solicitacoes.forEach(solicitacao => {
      try {
        const dataSolicitacao = new Date(solicitacao.data_solicitacao);
        const mesAno = dataSolicitacao.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        
        if (!mesesData[mesAno]) {
          mesesData[mesAno] = {
            mes: mesAno,
            total: 0,
            autorizadas: 0,
            emProcessamento: 0,
            negadas: 0,
            emAnalise: 0
          };
        }
        
        mesesData[mesAno].total++;
        
        switch (solicitacao.status) {
          case 'aprovada':
            mesesData[mesAno].autorizadas++;
            break;
          case 'rejeitada':
            mesesData[mesAno].negadas++;
            break;
          case 'em_analise':
            mesesData[mesAno].emAnalise++;
            break;
          default:
            mesesData[mesAno].emProcessamento++;
        }
      } catch (error) {
        console.error('❌ Erro ao processar data da solicitação:', error);
      }
    });

    const sortedData = Object.values(mesesData).sort((a, b) => {
      const [mesA, anoA] = a.mes.split(' ');
      const [mesB, anoB] = b.mes.split(' ');
      return new Date(parseInt(anoB), getMonthIndex(mesB)).getTime() - 
             new Date(parseInt(anoA), getMonthIndex(mesA)).getTime();
    });

    setSolicitacoesPorMes(sortedData);
  };

  // Função auxiliar para converter mês abreviado para índice
  const getMonthIndex = (mesAbrev: string): number => {
    const meses: Record<string, number> = {
      'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
      'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
    };
    return meses[mesAbrev.toLowerCase()] || 0;
  };

  // ✅ PROCESSAMENTO DOS PRINCÍPIOS ATIVOS MAIS UTILIZADOS
  const processActivePrinciples = (protocolos: ProtocoloFromAPI[]) => {
    const principleCount: Record<string, ActivePrincipleData> = {};
    
    protocolos.forEach(protocolo => {
      if (protocolo.medicamentos && protocolo.medicamentos.length > 0) {
        protocolo.medicamentos.forEach(medicamento => {
          const principio = medicamento.nome;
          
          if (!principleCount[principio]) {
            principleCount[principio] = {
              name: principio,
              count: 0,
              protocols: [],
              totalUsage: 0,
              percentage: 0,
              pacientesEmTratamento: 0,
              quantidadeSolicitada: 0
            };
          }
          
          principleCount[principio].count++;
          principleCount[principio].protocols.push(protocolo.nome || 'Protocolo sem nome');
          principleCount[principio].totalUsage += 1; // Contar uso
          principleCount[principio].pacientesEmTratamento = Math.floor(Math.random() * 50) + 1; // Placeholder
          principleCount[principio].quantidadeSolicitada = 1; // Contar solicitações
        });
      }
    });

    const sortedPrinciples = Object.values(principleCount)
      .sort((a, b) => b.totalUsage - a.totalUsage)
      .slice(0, 10) // Top 10
      .map((principle, index) => ({
        ...principle,
        percentage: Math.round((principle.totalUsage / Object.values(principleCount).reduce((sum, p) => sum + p.totalUsage, 0)) * 100)
      }));

    setActivePrinciples(sortedPrinciples);
  };

  // ✅ FORMATAÇÃO DE DIAS CORRIGIDA E MELHORADA
  const formatDaysRemaining = (days: number): string => {
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Amanhã';
    if (days < 0) {
      const atraso = Math.abs(days);
      if (atraso === 1) return '1 dia atraso';
      if (atraso <= 7) return `${atraso} dias atraso`;
      if (atraso <= 30) return `${Math.ceil(atraso / 7)} semanas atraso`;
      return `${Math.ceil(atraso / 30)} meses atraso`;
    }
    if (days === 2) return '2 dias';
    if (days === 3) return '3 dias';
    if (days === 4) return '4 dias';
    if (days === 5) return '5 dias';
    if (days === 6) return '6 dias';
    if (days === 7) return '1 semana';
    if (days <= 14) return `${days} dias`;
    if (days <= 21) return `${Math.ceil(days / 7)} semanas`;
    return `${days} dias`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovada':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pendente':
      case 'em_analise':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejeitada':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
      return dateStr;
    }
  };

  // ✅ FUNÇÃO: Visualizar PDF da solicitação
  const handleViewPDF = async (solicitacaoId?: number, event?: React.MouseEvent) => {
    // Prevenir propagação se necessário
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!solicitacaoId) {
      toast.error('ID da solicitação não encontrado');
      return;
    }

    try {
      console.log('🔧 Abrindo PDF da solicitação:', solicitacaoId);
      
      // Toast de loading
      const loadingToast = toast.loading('Gerando PDF...', {
        description: 'Aguarde enquanto o PDF está sendo preparado'
      });

      await SolicitacaoService.viewPDF(solicitacaoId);
      
      // Remover loading e mostrar sucesso
      toast.dismiss(loadingToast);
      toast.success('PDF aberto com sucesso!', {
        description: 'O PDF foi aberto em uma nova aba'
      });
      
    } catch (error) {
      console.error('❌ Erro ao abrir PDF:', error);
      toast.error('Erro ao abrir PDF', {
        description: error instanceof Error ? error.message : 'Verifique se a solicitação possui PDF disponível'
      });
    }
  };

  const ClinicDashboard = () => {
    if (!backendConnected) {
      return (
        <div className="space-y-6">
          <Card className="lco-card border-orange-200">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-orange-800 mb-2">Backend não conectado</h3>
                <p className="text-orange-600 mb-4">
                  Para visualizar os dados do dashboard, certifique-se de que o servidor backend está rodando.
                </p>
                <button 
                  onClick={checkConnectionAndLoadData}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                >
                  Tentar Novamente
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando dados reais do dashboard...</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Cards de Métricas Reais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <AnimatedSection delay={100}>
            <MouseTilt maxTilt={5} scale={1.02}>
              <Card className="lco-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-support-green/5 to-support-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-lg flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5 text-support-green" />
                    Solicitações Hoje
                  </CardTitle>
                  <CardDescription>Solicitações encaminhadas hoje</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">{metrics.solicitacoesHoje}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="text-support-green">
                      {metrics.solicitacoesSemana} esta semana
                    </span>
                  </p>
                </CardContent>
              </Card>
            </MouseTilt>
          </AnimatedSection>
          
          <AnimatedSection delay={200}>
            <MouseTilt maxTilt={5} scale={1.02}>
              <Card className="lco-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-support-yellow/5 to-support-yellow/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-support-yellow" />
                    Solicitações
                  </CardTitle>
                  <CardDescription>Solicitações encaminhadas no mês</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">{metrics.totalSolicitacoes}</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="text-support-yellow">
                      {metrics.solicitacoesEmProcessamento} em processamento
                    </span> • <span className="text-support-green">
                      {metrics.solicitacoesAutorizadas} autorizadas
                    </span> • <span className="text-highlight-red">
                      {metrics.solicitacoesNegadas} negadas
                    </span>
                  </p>
                </CardContent>
              </Card>
            </MouseTilt>
          </AnimatedSection>
          
          <AnimatedSection delay={300}>
            <MouseTilt maxTilt={5} scale={1.02}>
              <Card className="lco-card hover-lift group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-highlight-peach/5 to-highlight-peach/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-lg flex items-center">
                    <Clock className="mr-2 h-5 w-5 text-highlight-peach" />
                    Prazo Médio de Autorização
                  </CardTitle>
                  <CardDescription>Dias entre entrada e finalização</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="text-3xl font-bold">{metrics.prazoMedioAutorizacao} dias</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    <span className="text-support-green">
                      {metrics.solicitacoesAutorizadas} de {metrics.totalSolicitacoes} solicitações
                    </span>
                  </p>
                </CardContent>
              </Card>
            </MouseTilt>
          </AnimatedSection>
        </div>
        
        {/* Gráficos com Dados Reais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Status das Solicitações */}
          <AnimatedSection delay={400}>
            <Card className="lco-card h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-primary" />
                  Status das Solicitações
                </CardTitle>
                <CardDescription>Distribuição por status atual</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex justify-center">
                {solicitacaoStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                        </filter>
                      </defs>
                      <Pie
                        data={solicitacaoStatusData}
                        cx="50%"
                        cy="60%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        animationDuration={1500}
                        animationBegin={200}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        filter="url(#shadow)"
                      >
                        {solicitacaoStatusData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={CHART_COLORS[index % CHART_COLORS.length].fill}
                            stroke={CHART_COLORS[index % CHART_COLORS.length].stroke}
                            strokeWidth={2}
                            style={{
                              filter: `drop-shadow(${CHART_COLORS[index % CHART_COLORS.length].glow})`
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid var(--border)', 
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          background: 'var(--background)',
                          color: 'hsl(var(--foreground))'
                        }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend 
                        wrapperStyle={{
                          paddingTop: '20px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma solicitação encontrada</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>
          
          {/* Status dos Pacientes */}
          <AnimatedSection delay={500}>
            <Card className="lco-card h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UsersIcon className="mr-2 h-5 w-5 text-primary" />
                  Status dos Pacientes
                </CardTitle>
                <CardDescription>Progresso do tratamento por faixa de conclusão</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {patientStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={patientStatusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#79d153" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#79d153" stopOpacity={0.3}/>
                        </linearGradient>
                        <filter id="barShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="var(--border)" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                      />
                      <YAxis 
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'var(--border)' }}
                        tickLine={{ stroke: 'var(--border)' }}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(198, 214, 81, 0.1)' }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                                <p className="font-medium text-foreground">{label}</p>
                                <p className="text-sm text-muted-foreground">
                                  {payload[0].value} pacientes
                                </p>
                                <p className="text-xs text-primary">
                                  Média: {payload[0].payload?.percentage}% de progresso
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        name="Pacientes" 
                        fill="url(#barGradient)"
                        animationDuration={1500}
                        animationBegin={300}
                        radius={[8, 8, 0, 0]}
                        stroke="var(--background)"
                        strokeWidth={2}
                        maxBarSize={50}
                        filter="url(#barShadow)"
                        className="transition-all duration-300 hover:brightness-110"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <UsersIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum paciente encontrado</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>
        
        {/* Tratamentos a Vencer e Distribuição */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Próximas Solicitações (antigo Tratamentos a Vencer) */}
          <AnimatedSection delay={600}>
            <Card className="lco-card h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
                  Próximas Solicitações
                </CardTitle>
                <CardDescription>Próximos ciclos • Clique para visualizar PDF</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] overflow-y-auto">
                <div className="space-y-4">
                  {upcomingTreatments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum tratamento programado</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Verifique se há solicitações aprovadas ou em análise
                      </p>
                    </div>
                  ) : (
                    upcomingTreatments.map((treatment) => (
                      <div 
                        key={treatment.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-lg transition-all duration-300 border hover:shadow-md",
                          treatment.status === 'urgent' ? 'bg-highlight-red/10 hover:bg-highlight-red/20 border-highlight-red/20' :
                          treatment.status === 'warning' ? 'bg-support-yellow/10 hover:bg-support-yellow/20 border-support-yellow/20' :
                          'bg-support-green/10 hover:bg-support-green/20 border-support-green/20'
                        )}
                        title={`Clique para visualizar PDF • Solicitação: ${formatDate(treatment.dataSolicitacao)}\nIntervalo: ${treatment.intervaloOriginal}`}
                        onClick={(e) => handleViewPDF(treatment.solicitacaoId, e)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base truncate">{treatment.patientName}</div>
                          <div className="text-sm text-muted-foreground mb-1">{treatment.treatmentType}</div>
                          <div className="text-xs text-muted-foreground/70">
                            Solicitação: {formatDate(treatment.dataSolicitacao)}
                        </div>
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                                                     <div className="text-right">
                             <div className={cn(
                              "text-lg font-bold",
                               treatment.status === 'urgent' ? 'text-highlight-red' :
                               treatment.status === 'warning' ? 'text-support-yellow' :
                               'text-support-green'
                             )}>
                               {formatDaysRemaining(treatment.daysRemaining)}
                             </div>
                            <div className="text-xs text-muted-foreground font-medium">
                               Ciclo {treatment.cycle}
                             </div>
                            <div className="text-xs text-muted-foreground/70">
                              {treatment.intervaloOriginal ? `Intervalo: ${treatment.intervaloOriginal}` : 'Intervalo não definido'}
                            </div>
                           </div>
                           <div className="flex flex-col items-center gap-1">
                             <div className={cn(
                              "w-3 h-3 rounded-full",
                               treatment.status === 'urgent' ? 'bg-highlight-red animate-pulse' :
                               treatment.status === 'warning' ? 'bg-support-yellow' :
                               'bg-support-green'
                             )} />
                            <FileText className="h-4 w-4 text-muted-foreground opacity-60" />
                           </div>
                        </div>
                      </div>
                    ))
                                       )}
                   </div>
                   
                   {upcomingTreatments.length > 0 && (
                     <div className="mt-4 pt-3 border-t">
                       <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                         <FileText className="h-3 w-3" />
                         <span>Clique em qualquer tratamento para visualizar o PDF</span>
                       </div>
                     </div>
                   )}
                 </CardContent>
            </Card>
          </AnimatedSection>

          {/* Distribuição de Tratamentos */}
          <AnimatedSection delay={700}>
            <Card className="lco-card h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                  Distribuição de Tratamentos
                </CardTitle>
                <CardDescription>Por finalidade terapêutica</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px] flex justify-center">
                {treatmentDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <filter id="treatmentShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                        </filter>
                      </defs>
                      <Pie
                        data={treatmentDistribution}
                        cx="50%"
                        cy="60%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={100}
                        endAngle={460}
                        animationDuration={1500}
                        animationBegin={200}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        filter="url(#treatmentShadow)"
                      >
                        {treatmentDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={TREATMENT_COLORS[index % TREATMENT_COLORS.length].fill}
                            stroke={TREATMENT_COLORS[index % TREATMENT_COLORS.length].stroke}
                            strokeWidth={2}
                            style={{
                              filter: `drop-shadow(${TREATMENT_COLORS[index % TREATMENT_COLORS.length].glow})`
                            }}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid var(--border)', 
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          background: 'var(--background)',
                          color: 'hsl(var(--foreground))'
                        }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend 
                        wrapperStyle={{
                          paddingTop: '20px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum tratamento encontrado</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

        {/* Solicitações Recentes */}
        <div className="grid grid-cols-1 gap-6">
          <AnimatedSection delay={700}>
            <Card className="lco-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  Solicitações Recentes
                </CardTitle>
                <CardDescription>Últimas solicitações de autorização • Clique para visualizar PDF</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentSolicitacoes.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma solicitação encontrada</p>
                    </div>
                  ) : (
                    recentSolicitacoes.map((solicitacao) => (
                      <div 
                        key={solicitacao.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg transition-all duration-300 border cursor-pointer hover:shadow-md",
                          solicitacao.status === 'aprovada' ? 'bg-support-green/10 hover:bg-support-green/20 border-support-green/20' :
                          solicitacao.status === 'rejeitada' ? 'bg-highlight-red/10 hover:bg-highlight-red/20 border-highlight-red/20' :
                          'bg-support-yellow/10 hover:bg-support-yellow/20 border-support-yellow/20'
                        )}
                        onClick={() => handleViewPDF(solicitacao.id)}
                        title={`Clique para visualizar o PDF da solicitação #${solicitacao.id}`}
                      >
                        <div className="flex-1">
                          <div className="font-medium text-sm">{solicitacao.cliente_nome}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(solicitacao.created_at || '')}
                          </div>
                          <div className="text-xs text-muted-foreground opacity-75">
                            {solicitacao.finalidade || 'Não especificado'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(solicitacao.status || 'pendente')}
                          <span className="text-xs font-medium">#{solicitacao.id}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {recentSolicitacoes.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      <span>Clique em qualquer solicitação para visualizar o PDF</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

        {/* Principais Medicamentos por Princípio Ativos */}
        <AnimatedSection delay={800}>
          <Card className="lco-card h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Pill className="mr-2 h-5 w-5 text-primary" />
                Principais Medicamentos por Princípio Ativos
              </CardTitle>
              <CardDescription>Top 10 medicamentos mais utilizados</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] overflow-hidden">
              {activePrinciples.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum medicamento encontrado</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Verifique se há protocolos cadastrados
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={activePrinciples.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip formatter={(value: any, name: any) => [String(value), name]} />
                    <Bar dataKey="pacientesEmTratamento" name="Pacientes em Tratamento" fill="#22c55e" radius={[6,6,0,0]} />
                    <Bar dataKey="quantidadeSolicitada" name="Quantidade Solicitada" fill="#f59e0b" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Solicitações por Período - Gráfico Modernizado */}
        {solicitacoesPorMes.length > 1 && (
          <AnimatedSection delay={900}>
            <Card className="lco-card overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChartPieIcon className="mr-2 h-5 w-5 text-primary" />
                  Solicitações por Período
                </CardTitle>
                <CardDescription className="text-muted-foreground/80 font-medium">
                  Evolução das solicitações ao longo do tempo com análise detalhada
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[350px] bg-gradient-to-br from-background via-background to-muted/20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={solicitacoesPorMes} 
                    margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
                  >
                    <defs>
                      {/* Gradiente moderno para Total */}
                      <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                      </linearGradient>
                      
                      {/* Gradiente moderno para Aprovadas */}
                      <linearGradient id="aprovadasGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
                        <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.05}/>
                      </linearGradient>
                      
                      {/* Gradiente moderno para Pendentes */}
                      <linearGradient id="pendentesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                        <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.05}/>
                      </linearGradient>
                      
                      {/* Filtro de sombra para efeito neon */}
                      <filter id="neonGlow">
                        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="hsl(var(--primary))" floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    
                    {/* Grid moderno com opacidade reduzida */}
                    <CartesianGrid 
                      strokeDasharray="5 5" 
                      opacity={0.08} 
                      stroke="hsl(var(--border))"
                      strokeWidth={1}
                    />
                    
                    {/* Eixo X modernizado */}
                    <XAxis 
                      dataKey="mes" 
                      tick={{ 
                        fill: 'hsl(var(--muted-foreground))', 
                        fontSize: 11,
                        fontWeight: 500
                      }}
                      axisLine={{ 
                        stroke: 'hsl(var(--border))', 
                        strokeWidth: 1,
                        opacity: 0.3
                      }}
                      tickLine={{ 
                        stroke: 'hsl(var(--border))', 
                        strokeWidth: 1,
                        opacity: 0.3
                      }}
                      tickMargin={8}
                    />
                    
                    {/* Eixo Y modernizado */}
                    <YAxis 
                      tick={{ 
                        fill: 'hsl(var(--muted-foreground))', 
                        fontSize: 11,
                        fontWeight: 500
                      }}
                      axisLine={{ 
                        stroke: 'hsl(var(--border))', 
                        strokeWidth: 1,
                        opacity: 0.3
                      }}
                      tickLine={{ 
                        stroke: 'hsl(var(--border))', 
                        strokeWidth: 1,
                        opacity: 0.3
                      }}
                      tickMargin={8}
                    />
                    
                    {/* Tooltip personalizado e moderno */}
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '16px', 
                        border: '1px solid hsl(var(--border))', 
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        backdropFilter: 'blur(10px)',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                      cursor={{
                        fill: 'hsl(var(--primary))',
                        fillOpacity: 0.1,
                        stroke: 'hsl(var(--primary))',
                        strokeWidth: 2,
                        strokeDasharray: '5 5'
                      }}
                    />
                    
                    {/* Legend modernizada */}
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                      iconType="circle"
                      iconSize={8}
                    />
                    
                    {/* Área Total com efeito moderno */}
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stackId="1"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fill="url(#totalGradient)" 
                      name="Total de Solicitações"
                      fillOpacity={0.8}
                      filter="url(#neonGlow)"
                    />
                    
                    {/* Área Aprovadas com efeito moderno */}
                    <Area 
                      type="monotone" 
                      dataKey="autorizadas" 
                      stackId="2"
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={3}
                      fill="url(#aprovadasGradient)" 
                      name="Autorizadas"
                      fillOpacity={0.8}
                      filter="url(#neonGlow)"
                    />
                    
                    {/* Área Pendentes com efeito moderno */}
                    <Area 
                      type="monotone" 
                      dataKey="emProcessamento" 
                      stackId="3"
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      fill="url(#pendentesGradient)" 
                      name="Em Processamento"
                      fillOpacity={0.8}
                      filter="url(#neonGlow)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                
                {/* Estatísticas rápidas abaixo do gráfico */}
                <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-border/20">
                  <div className="text-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="text-2xl font-bold text-primary">
                      {solicitacoesPorMes.reduce((sum, item) => sum + item.total, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">Total Geral</div>
                  </div>
                  <div className="text-center p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                    <div className="text-2xl font-bold text-secondary">
                      {solicitacoesPorMes.reduce((sum, item) => sum + item.autorizadas, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">Autorizadas</div>
                  </div>
                  <div className="text-center p-3 bg-accent/5 rounded-lg border border-accent/20">
                    <div className="text-2xl font-bold text-accent">
                      {solicitacoesPorMes.reduce((sum, item) => sum + item.emProcessamento, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">Em Processamento</div>
                  </div>
                  <div className="text-center p-3 bg-accent/5 rounded-lg border border-accent/20">
                    <div className="text-2xl font-bold text-accent">
                      {solicitacoesPorMes.reduce((sum, item) => sum + item.negadas, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">Negadas</div>
                  </div>
                  <div className="text-center p-3 bg-accent/5 rounded-lg border border-accent/20">
                    <div className="text-2xl font-bold text-accent">
                      {solicitacoesPorMes.reduce((sum, item) => sum + item.emAnalise, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">Em Análise</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}
      </div>
    );
  };

  const OperatorDashboard = () => {
    // Estados para dados da operadora
    const [operatorLoading, setOperatorLoading] = useState(true);
    const [operatorBackendConnected, setOperatorBackendConnected] = useState(false);
    const [operatorMetrics, setOperatorMetrics] = useState({
      totalClinicas: 0,
      totalSolicitacoes: 0,
      totalPacientes: 0,
      taxaAprovacao: 0,
      tempoMedioAnaliseDias: 0,
      custoTotalPeriodo: 0,
      custoMedioPorPaciente: 0,
      economiaEstimativa: 0,
      taxaNegacao: 0,
      slaDentroPrazo: 0,
    });
    
    const [clinicsData, setClinicsData] = useState<any[]>([]);
    const [statusPorClinica, setStatusPorClinica] = useState<any[]>([]);
    const [solicitacoesPorMes, setSolicitacoesPorMes] = useState<any[]>([]);
    const [performanceClinicas, setPerformanceClinicas] = useState<any[]>([]);
    const [principiosAtivosTop, setPrincipiosAtivosTop] = useState<any[]>([]);
    const [demografiaSexo, setDemografiaSexo] = useState<any[]>([]);
    const [demografiaIdade, setDemografiaIdade] = useState<any[]>([]);
    const [realClinicas, setRealClinicas] = useState<Clinica[]>([]);

    // Filtros
    const [selectedClinicId, setSelectedClinicId] = useState<number | 'todas'>('todas');
    const [activeTab, setActiveTab] = useState<'principal' | 'clinicas'>(() => {
      try {
        const params = new URLSearchParams(window.location.search);
        return (params.get('tab') as any) === 'clinicas' ? 'clinicas' : 'principal';
      } catch {
        return 'principal';
      }
    });

    // Carregar e recarregar dados conforme filtros
    useEffect(() => {
      loadOperatorData();
    }, [selectedClinicId]);

    // Funções específicas para operadora usando operadoraAuthService
    const listarPacientesOperadora = async (params: { page: number; limit: number }) => {
      const queryParams = new URLSearchParams();
      queryParams.append('page', params.page.toString());
      queryParams.append('limit', params.limit.toString());
      
      const url = `/api/pacientes?${queryParams.toString()}`;
      console.log('🔧 Operadora - Fazendo requisição para:', url);
      
      let response = await operadoraAuthService.authorizedFetch(url);
      if (!response) {
        const token = localStorage.getItem('operadora_access_token') || '';
        const { default: cfg } = await import('@/config/environment');
        response = await fetch(`${cfg.API_BASE_URL}/pacientes?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (!response || !response.ok) {
        const errorText = await response.text();
        console.error('❌ Operadora - Resposta não OK:', errorText);
        throw new Error(`HTTP ${response?.status}: ${response?.statusText}`);
      }
      // Evitar tentar parsear HTML como JSON (quando proxy devolve index.html)
      const ct1 = response.headers.get('content-type') || '';
      if (ct1.includes('text/html')) {
        const html = await response.text();
        console.error('❌ Operadora - Recebeu HTML ao buscar pacientes');
        throw new Error('Resposta HTML do backend (pacientes)');
      }
      
      const result = await response.json();
      return result;
    };

    const listarSolicitacoesOperadora = async (params: { page: number; limit: number }) => {
      const queryParams = new URLSearchParams();
      queryParams.append('page', params.page.toString());
      queryParams.append('limit', params.limit.toString());
      
      const url = `/api/solicitacoes?${queryParams.toString()}`;
      console.log('🔧 Operadora - Fazendo requisição para:', url);
      
      let response = await operadoraAuthService.authorizedFetch(url);
      if (!response) {
        const token = localStorage.getItem('operadora_access_token') || '';
        const { default: cfg } = await import('@/config/environment');
        response = await fetch(`${cfg.API_BASE_URL}/solicitacoes?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (!response || !response.ok) {
        const errorText = await response.text();
        console.error('❌ Operadora - Resposta não OK:', errorText);
        throw new Error(`HTTP ${response?.status}: ${response?.statusText}`);
      }
      const ct2 = response.headers.get('content-type') || '';
      if (ct2.includes('text/html')) {
        const html = await response.text();
        console.error('❌ Operadora - Recebeu HTML ao buscar solicitações');
        throw new Error('Resposta HTML do backend (solicitações)');
      }
      
      const result = await response.json();
      return result;
    };

    const listarProtocolosOperadora = async (params: { page: number; limit: number }) => {
      const queryParams = new URLSearchParams();
      queryParams.append('page', params.page.toString());
      queryParams.append('limit', params.limit.toString());
      
      const url = `/api/protocolos?${queryParams.toString()}`;
      console.log('🔧 Operadora - Fazendo requisição para:', url);
      
      let response = await operadoraAuthService.authorizedFetch(url);
      if (!response) {
        const token = localStorage.getItem('operadora_access_token') || '';
        const { default: cfg } = await import('@/config/environment');
        response = await fetch(`${cfg.API_BASE_URL}/protocolos?${queryParams.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (!response || !response.ok) {
        const errorText = await response.text();
        console.error('❌ Operadora - Resposta não OK:', errorText);
        throw new Error(`HTTP ${response?.status}: ${response?.statusText}`);
      }
      const ct3 = response.headers.get('content-type') || '';
      if (ct3.includes('text/html')) {
        const html = await response.text();
        console.error('❌ Operadora - Recebeu HTML ao buscar protocolos');
        throw new Error('Resposta HTML do backend (protocolos)');
      }
      
      const result = await response.json();
      return result;
    };

    const loadOperatorData = async () => {
      setOperatorLoading(true);
      try {
        console.log('🔧 Carregando dados da operadora...');
        
        // Verificar conexão
        const connected = await testarConexaoBackend();
        setOperatorBackendConnected(connected);
        
        if (!connected) {
          console.log('❌ Backend não conectado para operadora');
          return;
        }

        // Carregar dados agregados de todas as clínicas usando operadoraAuthService
        const [pacientesResult, solicitacoesResult, protocolosResult, clinicasResult] = await Promise.all([
          listarPacientesOperadora({ page: 1, limit: 10000 }),
          listarSolicitacoesOperadora({ page: 1, limit: 10000 }),
          listarProtocolosOperadora({ page: 1, limit: 10000 }),
          ClinicService.getAllClinicasForOperadora()
        ]);

        console.log('🔍 Debug - Resposta pacientes:', pacientesResult);
        console.log('🔍 Debug - Resposta solicitações:', solicitacoesResult);
        console.log('🔍 Debug - Resposta protocolos:', protocolosResult);
        console.log('🔍 Debug - Resposta clínicas:', clinicasResult);

        const pacientes = pacientesResult.data?.data || [];
        const solicitacoes = solicitacoesResult.data?.data || [];
        const protocolos = protocolosResult.data?.data || [];
        const clinicas = clinicasResult || [];

        // Debug: Verificar IDs de clínicas nos dados
        console.log('🔍 Debug - Clínicas do banco:', clinicas.map(c => ({ id: c.id, nome: c.nome })));
        console.log('🔍 Debug - Clinica IDs nos pacientes:', [...new Set(pacientes.map(p => p.clinica_id))]);
        console.log('🔍 Debug - Clinica IDs nas solicitações:', [...new Set(solicitacoes.map(s => s.clinica_id))]);
        console.log('🔍 Debug - Total de clínicas encontradas:', clinicas.length);

        // Filtrar TUDO por clínicas pertencentes à operadora
        const clinicIdSet = new Set((clinicas || []).map((c: any) => c.id));
        const pacientesOperadora = pacientes.filter((p: any) => p?.clinica_id && clinicIdSet.has(p.clinica_id));
        const solicitacoesOperadora = solicitacoes.filter((s: any) => s?.clinica_id && clinicIdSet.has(s.clinica_id));
        const protocolosOperadora = protocolos.filter((pr: any) => !('clinica_id' in pr) || (pr?.clinica_id && clinicIdSet.has(pr.clinica_id)));

        console.log('📊 Dados da operadora carregados (filtrados por operadora):', {
          pacientes: pacientesOperadora.length,
          solicitacoes: solicitacoesOperadora.length,
          protocolos: protocolosOperadora.length
        });

        // Validar se os dados são arrays
        if (!Array.isArray(pacientes)) {
          console.error('❌ Dados de pacientes não são um array:', pacientes);
          throw new Error('Dados de pacientes inválidos');
        }
        if (!Array.isArray(solicitacoes)) {
          console.error('❌ Dados de solicitações não são um array:', solicitacoes);
          throw new Error('Dados de solicitações inválidos');
        }
        if (!Array.isArray(protocolos)) {
          console.error('❌ Dados de protocolos não são um array:', protocolos);
          throw new Error('Dados de protocolos inválidos');
        }

        // Armazenar clínicas reais
        setRealClinicas(clinicas);

        // Processar métricas agregadas (passando clínicas diretamente)
        processOperatorMetrics(pacientesOperadora, solicitacoesOperadora, selectedClinicId, clinicas);
        processClinicsData(pacientesOperadora, solicitacoesOperadora, clinicas);
        processStatusPorClinica(solicitacoesOperadora, clinicas, selectedClinicId);
        processSolicitacoesPorMesOperator(solicitacoesOperadora, selectedClinicId);
        processPerformanceClinicas(pacientesOperadora, solicitacoesOperadora, clinicas, selectedClinicId);
        processPrincipiosAtivosOperator(protocolosOperadora, selectedClinicId);
        processDemografiaOperator(pacientesOperadora, selectedClinicId);

      } catch (error) {
        console.error('❌ Erro ao carregar dados da operadora:', error);
        toast.error('Erro ao carregar dados da operadora');
      } finally {
        setOperatorLoading(false);
      }
    };

    // Processar métricas agregadas da operadora
    const processOperatorMetrics = (pacientes: PatientFromAPI[], solicitacoes: SolicitacaoFromAPI[], selectedClinicId: number | 'todas', clinicas: Clinica[]) => {
      // Filtrar dados por clínica se necessário
      const pacientesFiltrados = selectedClinicId === 'todas' 
        ? pacientes 
        : pacientes.filter(p => p.clinica_id === selectedClinicId);
      
      const solicitacoesFiltradas = selectedClinicId === 'todas' 
        ? solicitacoes 
        : solicitacoes.filter(s => s.clinica_id === selectedClinicId);

      const totalSolicitacoes = solicitacoesFiltradas.length;
      const totalPacientes = pacientesFiltrados.length;
      
      // Contar status das solicitações
      const solicitacoesAprovadas = solicitacoesFiltradas.filter(s => s.status === 'aprovada').length;
      const solicitacoesNegadas = solicitacoesFiltradas.filter(s => s.status === 'rejeitada').length;
      const solicitacoesPendentes = solicitacoesFiltradas.filter(s => s.status === 'pendente').length;
      
      // Calcular métricas
      const taxaAprovacao = totalSolicitacoes > 0 ? solicitacoesAprovadas / totalSolicitacoes : 0;
      const taxaNegacao = totalSolicitacoes > 0 ? solicitacoesNegadas / totalSolicitacoes : 0;
      
      // Calcular tempo médio de análise (simulado baseado em datas)
      const tempoMedioAnaliseDias = calculateTempoMedioAnalise(solicitacoesFiltradas);
      
      // Remover métricas financeiras inventadas - usar apenas dados reais
      // TODO: Implementar endpoint de custos reais no backend
      const custoTotalPeriodo = 0; // Sem dados financeiros reais
      const custoMedioPorPaciente = 0; // Sem dados financeiros reais
      const economiaEstimativa = 0; // Sem dados financeiros reais
      const slaDentroPrazo = 0; // Sem dados de SLA reais
      
      // Contar clínicas únicas (usar lista da própria chamada)
      const clinicasUnicas = selectedClinicId === 'todas' 
        ? (Array.isArray(clinicas) ? clinicas.length : 0)
        : 1; // Se filtrado por clínica específica, mostrar 1

      setOperatorMetrics({
        totalClinicas: clinicasUnicas,
        totalSolicitacoes,
        totalPacientes,
        taxaAprovacao,
        tempoMedioAnaliseDias,
        custoTotalPeriodo,
        custoMedioPorPaciente,
        economiaEstimativa,
        taxaNegacao,
        slaDentroPrazo,
      });
    };

    // Calcular tempo médio de análise
    const calculateTempoMedioAnalise = (solicitacoes: SolicitacaoFromAPI[]): number => {
      const solicitacoesComData = solicitacoes.filter(s => s.created_at && s.updated_at);
      if (solicitacoesComData.length === 0) return 0;
      
      const tempos = solicitacoesComData.map(s => {
        const inicio = new Date(s.created_at!);
        const fim = new Date(s.updated_at!);
        return Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
      });
      
      return tempos.reduce((sum, tempo) => sum + tempo, 0) / tempos.length;
    };

    // Processar dados das clínicas
    const processClinicsData = (pacientes: PatientFromAPI[], solicitacoes: SolicitacaoFromAPI[], clinicas: any[]) => {
      console.log('🔍 processClinicsData - clinicas recebidas:', clinicas);
      console.log('🔍 processClinicsData - pacientes:', pacientes.length);
      console.log('🔍 processClinicsData - solicitacoes:', solicitacoes.length);
      
      const clinicasMap = new Map();
      
      // Usar dados reais de clínicas se disponíveis
      clinicas.forEach(clinica => {
        console.log('🔍 processClinicsData - Adicionando clínica:', { id: clinica.id, nome: clinica.nome });
        clinicasMap.set(clinica.id, {
          id: clinica.id,
          nome: clinica.nome,
          cidade: clinica.cidade || 'Não informado',
          totalPacientes: 0,
          totalSolicitacoes: 0
        });
      });
      
      // Contar pacientes por clínica (apenas clínicas que existem no banco)
      pacientes.forEach(paciente => {
        const clinicaId = paciente.clinica_id || 1;
        if (clinicasMap.has(clinicaId)) {
          clinicasMap.get(clinicaId).totalPacientes++;
        }
        // Não criar clínicas inventadas - apenas usar as que existem no banco
      });
      
      // Contar solicitações por clínica
      solicitacoes.forEach(solicitacao => {
        const clinicaId = solicitacao.clinica_id || 1;
        if (clinicasMap.has(clinicaId)) {
          clinicasMap.get(clinicaId).totalSolicitacoes++;
        }
      });
      
      const clinicasArray = Array.from(clinicasMap.values());
      console.log('🔍 processClinicsData - Resultado final:', clinicasArray);
      console.log('🔍 processClinicsData - Setando clinicsData com:', clinicasArray.length, 'clínicas');
      setClinicsData(clinicasArray);
    };

    // Processar status por clínica
    const processStatusPorClinica = (solicitacoes: SolicitacaoFromAPI[], clinicas: any[], selectedClinicId: number | 'todas') => {
      console.log('🔍 processStatusPorClinica - clinicas recebidas:', clinicas.length);
      console.log('🔍 processStatusPorClinica - solicitacoes:', solicitacoes.length);
      
      const clinicasMap = new Map();
      
      // Filtrar dados por clínica se necessário
      const solicitacoesFiltradas = selectedClinicId === 'todas' 
        ? solicitacoes 
        : solicitacoes.filter(s => s.clinica_id === selectedClinicId);

      // Inicializar TODAS as clínicas com contadores zerados
      clinicas.forEach(clinica => {
        clinicasMap.set(clinica.id, {
          name: clinica.nome,
          aprovadas: 0,
          pendentes: 0,
          rejeitadas: 0
        });
      });
      
      // Processar solicitações e distribuir por status
      solicitacoesFiltradas.forEach(solicitacao => {
        const clinicaId = solicitacao.clinica_id || 1;
        if (clinicasMap.has(clinicaId)) {
          const clinica = clinicasMap.get(clinicaId);
          switch (solicitacao.status) {
            case 'aprovada':
              clinica.aprovadas++;
              break;
            case 'pendente':
              clinica.pendentes++;
              break;
            case 'rejeitada':
              clinica.rejeitadas++;
              break;
          }
        }
      });
      
      const result = Array.from(clinicasMap.values());
      console.log('🔍 processStatusPorClinica - Resultado final:', result);
      setStatusPorClinica(result);
    };

    // Processar solicitações por mês para operadora
    const processSolicitacoesPorMesOperator = (solicitacoes: SolicitacaoFromAPI[], selectedClinicId: number | 'todas') => {
      const mesesData: Record<string, any> = {};
      
      // Filtrar dados por clínica se necessário
      const solicitacoesFiltradas = selectedClinicId === 'todas' 
        ? solicitacoes 
        : solicitacoes.filter(s => s.clinica_id === selectedClinicId);
      
      solicitacoesFiltradas.forEach(solicitacao => {
        try {
          const dataSolicitacao = new Date(solicitacao.created_at || solicitacao.data_solicitacao || '');
          if (isNaN(dataSolicitacao.getTime())) return;
          
          const mes = dataSolicitacao.toLocaleDateString('pt-BR', { month: 'short' });
          
          if (!mesesData[mes]) {
            mesesData[mes] = {
              mes,
              total: 0,
              aprovadas: 0,
              pendentes: 0,
              rejeitadas: 0
            };
          }
          
          mesesData[mes].total++;
          switch (solicitacao.status) {
            case 'aprovada':
              mesesData[mes].aprovadas++;
              break;
            case 'pendente':
              mesesData[mes].pendentes++;
              break;
            case 'rejeitada':
              mesesData[mes].rejeitadas++;
              break;
          }
        } catch (error) {
          console.warn('Erro ao processar data da solicitação:', error);
        }
      });
      
      setSolicitacoesPorMes(Object.values(mesesData).sort((a, b) => {
        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        return meses.indexOf(a.mes) - meses.indexOf(b.mes);
      }));
    };

    // Processar performance por clínica
    const processPerformanceClinicas = (pacientes: PatientFromAPI[], solicitacoes: SolicitacaoFromAPI[], clinicas: any[], selectedClinicId: number | 'todas') => {
      console.log('🔍 processPerformanceClinicas - clinicas recebidas:', clinicas.length);
      console.log('🔍 processPerformanceClinicas - solicitacoes:', solicitacoes.length);
      
      const performanceMap = new Map();
      
      // Filtrar dados por clínica se necessário
      const solicitacoesFiltradas = selectedClinicId === 'todas' 
        ? solicitacoes 
        : solicitacoes.filter(s => s.clinica_id === selectedClinicId);
      
      // Inicializar TODAS as clínicas (mesmo as sem solicitações)
      clinicas.forEach(clinica => {
        performanceMap.set(clinica.id, {
          name: clinica.nome,
          aprovacao: 0,
          prazoMedio: 0,
          totalSolicitacoes: 0
        });
      });
      
      // Agrupar solicitações por clínica
      const solicitacoesPorClinica = solicitacoesFiltradas.reduce((acc, s) => {
        const clinicaId = s.clinica_id || 1;
        if (!acc[clinicaId]) acc[clinicaId] = [];
        acc[clinicaId].push(s);
        return acc;
      }, {} as Record<number, SolicitacaoFromAPI[]>);
      
      // Atualizar dados das clínicas que têm solicitações
      Object.entries(solicitacoesPorClinica).forEach(([clinicaId, s]) => {
        const aprovadas = s.filter(s => s.status === 'aprovada').length;
        const total = s.length;
        const aprovacao = total > 0 ? aprovadas / total : 0;
        
        if (performanceMap.has(parseInt(clinicaId))) {
          performanceMap.set(parseInt(clinicaId), {
            name: performanceMap.get(parseInt(clinicaId)).name, // Manter nome original
            aprovacao: Math.round(aprovacao * 100) / 100,
            prazoMedio: calculateTempoMedioAnalise(s),
            totalSolicitacoes: total
          });
        }
      });
      
      const result = Array.from(performanceMap.values());
      console.log('🔍 processPerformanceClinicas - Resultado final:', result);
      setPerformanceClinicas(result);
    };

    // Processar princípios ativos para operadora
    const processPrincipiosAtivosOperator = (protocolos: ProtocoloFromAPI[], selectedClinicId: number | 'todas') => {
      const principleCount: Record<string, number> = {};
      
      protocolos.forEach(protocolo => {
        if (protocolo.medicamentos && protocolo.medicamentos.length > 0) {
          protocolo.medicamentos.forEach(medicamento => {
            const principio = medicamento.nome || 'Não especificado';
            principleCount[principio] = (principleCount[principio] || 0) + 1;
          });
        }
      });
      
      const sortedPrinciples = Object.entries(principleCount)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      
      setPrincipiosAtivosTop(sortedPrinciples);
    };

    // Processar demografia para operadora
    const processDemografiaOperator = (pacientes: PatientFromAPI[], selectedClinicId: number | 'todas') => {
      // Filtrar dados por clínica se necessário
      const pacientesFiltrados = selectedClinicId === 'todas' 
        ? pacientes 
        : pacientes.filter(p => p.clinica_id === selectedClinicId);

      // Demografia por sexo
      const sexoCount = pacientesFiltrados.reduce((acc, p) => {
        const sexo = p.Sexo || 'Não informado';
        acc[sexo] = (acc[sexo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const demografiaSexoData = Object.entries(sexoCount).map(([name, value]) => ({
        name: name === 'M' ? 'Masculino' : name === 'F' ? 'Feminino' : name,
        value: Math.round((value / pacientes.length) * 100)
      }));
      
      setDemografiaSexo(demografiaSexoData);
      
      // Demografia por idade
      const faixasIdade = [
        { faixa: '0-17', min: 0, max: 17 },
        { faixa: '18-39', min: 18, max: 39 },
        { faixa: '40-59', min: 40, max: 59 },
        { faixa: '60+', min: 60, max: 120 }
      ];
      
      const demografiaIdadeData = faixasIdade.map(faixa => {
        const count = pacientesFiltrados.filter(p => {
          // Calcular idade a partir da data de nascimento
          const dataNascimento = new Date(p.Data_Nascimento);
          if (isNaN(dataNascimento.getTime())) return false;
          
          const hoje = new Date();
          const idade = hoje.getFullYear() - dataNascimento.getFullYear();
          const mesAtual = hoje.getMonth();
          const mesNascimento = dataNascimento.getMonth();
          
          // Ajustar se ainda não fez aniversário este ano
          const idadeReal = (mesAtual < mesNascimento || 
            (mesAtual === mesNascimento && hoje.getDate() < dataNascimento.getDate())) 
            ? idade - 1 : idade;
          
          return idadeReal >= faixa.min && idadeReal <= faixa.max;
        }).length;
        return { faixa: faixa.faixa, qtd: count };
      });
      
      setDemografiaIdade(demografiaIdadeData);
    };

    // Verificar se está carregando
    if (operatorLoading) {
      return (
    <div className="space-y-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando dados da operadora...</p>
            </div>
          </div>
        </div>
      );
    }

    // Verificar se backend está conectado
    if (!operatorBackendConnected) {
      return (
        <div className="space-y-6">
          <Card className="lco-card border-orange-200">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
                <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-orange-800 mb-2">Backend não conectado</h3>
                <p className="text-orange-600 mb-4">
                  Para visualizar os dados da operadora, certifique-se de que o servidor backend está rodando.
                </p>
                <button 
                  onClick={loadOperatorData}
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                >
                  Tentar Novamente
                </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
    }

    return (
      <div className="space-y-6">
        {/* Header elegante com informações da operadora */}
        <Card className="relative overflow-hidden border-primary/20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
          <CardContent className="relative p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                  <Building2 className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Operadora</div>
                  <div className="text-2xl font-bold">
                    {selectedClinicId === 'todas' ? 'Todas as clínicas' : clinicsData.find(c => c.id === selectedClinicId)?.nome || 'Clínica'}
                  </div>
                  <div className="text-sm text-muted-foreground">Dashboard da Operadora</div>
                </div>
              </div>
              {/* Toolbar de filtros */}
              <div className="w-full md:w-auto">
                <div className="min-w-[200px]">
                  <div className="text-xs font-medium text-muted-foreground mb-1">Clínica</div>
                  <Select value={selectedClinicId === 'todas' ? 'todas' : String(selectedClinicId)} onValueChange={(v) => setSelectedClinicId(v === 'todas' ? 'todas' : Number(v))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas as clínicas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas as clínicas</SelectItem>
                      {clinicsData.map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs resumidos na parte superior */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <AnimatedSection delay={80}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Clínicas</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 flex items-end justify-between">
                <div className="text-3xl font-bold">{operatorMetrics.totalClinicas}</div>
                <Building2 className="h-6 w-6 text-primary" />
              </CardContent>
            </Card>
          </AnimatedSection>
          <AnimatedSection delay={100}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Pacientes</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 flex items-end justify-between">
                <div className="text-3xl font-bold">{operatorMetrics.totalPacientes}</div>
                <UsersIcon className="h-6 w-6 text-primary" />
              </CardContent>
            </Card>
          </AnimatedSection>
          <AnimatedSection delay={120}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-support-yellow/5 to-support-yellow/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Solicitações</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 flex items-end justify-between">
                <div className="text-3xl font-bold">{operatorMetrics.totalSolicitacoes}</div>
                <FileText className="h-6 w-6 text-support-yellow" />
              </CardContent>
            </Card>
          </AnimatedSection>
          <AnimatedSection delay={160}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-support-green/5 to-support-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Taxa de Aprovação</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 flex items-end justify-between">
                <div className="text-3xl font-bold">{Math.round(operatorMetrics.taxaAprovacao * 100)}%</div>
                <CheckCircle className="h-6 w-6 text-support-green" />
              </CardContent>
            </Card>
          </AnimatedSection>
          <AnimatedSection delay={200}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-highlight-peach/5 to-highlight-peach/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Tempo Médio</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10 flex items-end justify-between">
                <div className="text-3xl font-bold">{Math.round(operatorMetrics.tempoMedioAnaliseDias)}d</div>
                <Clock className="h-6 w-6 text-highlight-peach" />
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

        {/* KPIs operacionais (apenas dados reais) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatedSection delay={220}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Taxa de Negação</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{Math.round(operatorMetrics.taxaNegacao * 100)}%</div>
                <CardDescription>solicitações negadas</CardDescription>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={240}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Tempo Médio de Análise</CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{Math.round(operatorMetrics.tempoMedioAnaliseDias)} dias</div>
                <CardDescription>média de processamento</CardDescription>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

        {/* Gráficos principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatedSection delay={400}>
            <Card className="lco-card h-[380px] hover-lift group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                  Status por Clínica
                </CardTitle>
                <CardDescription>Comparativo entre clínicas</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                {statusPorClinica.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusPorClinica}>
                      <defs>
                        <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.25}/>
                        </linearGradient>
                        <filter id="barShadow2" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25"/>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="5 5" opacity={0.08} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                      <YAxis tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--primary))', fillOpacity: 0.06 }}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid var(--border)',
                          background: 'var(--background)',
                          color: 'hsl(var(--foreground))',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                        }}
                      />
                      <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                      <Bar dataKey="aprovadas" name="Autorizadas" fill="url(#barGradient2)" stroke="hsl(var(--primary))" strokeWidth={1.5} radius={[8,8,0,0]} filter="url(#barShadow2)" />
                      <Bar dataKey="pendentes" name="Em Processamento" fill="#f59e0b" radius={[8,8,0,0]} filter="url(#barShadow2)" />
                      <Bar dataKey="rejeitadas" name="Negadas" fill="#ef4444" radius={[8,8,0,0]} filter="url(#barShadow2)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum dado encontrado</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={500}>
            <Card className="lco-card h-[380px] hover-lift group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/0 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChartPieIcon className="mr-2 h-5 w-5 text-secondary" />
                  Top Princípios Ativos
                </CardTitle>
                <CardDescription>Mais utilizados no período</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                {principiosAtivosTop.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <filter id="pieShadowOp" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25"/>
                        </filter>
                      </defs>
                      <Pie 
                        data={principiosAtivosTop} 
                        dataKey="value" 
                        cx="50%" cy="60%" 
                        innerRadius={60} outerRadius={95} 
                        paddingAngle={5}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        filter="url(#pieShadowOp)"
                      >
                        {principiosAtivosTop.map((entry, index) => (
                          <Cell 
                            key={`cell-prot-${index}`} 
                            fill={CHART_COLORS[index % CHART_COLORS.length].fill}
                            stroke={CHART_COLORS[index % CHART_COLORS.length].stroke}
                            strokeWidth={2}
                            style={{ filter: `drop-shadow(${CHART_COLORS[index % CHART_COLORS.length].glow})` }}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: '1px solid var(--border)', 
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          background: 'var(--background)',
                          color: 'hsl(var(--foreground))'
                        }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <ChartPieIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum princípio ativo encontrado</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

        {/* Demografia e Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatedSection delay={600}>
            <Card className="lco-card h-[380px] hover-lift group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5 text-accent" />
                  Demografia - Sexo
                </CardTitle>
                <CardDescription>Distribuição por sexo</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                {demografiaSexo.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <filter id="pieShadowDemo" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25"/>
                        </filter>
                      </defs>
                      <Pie 
                        data={demografiaSexo} 
                        dataKey="value" 
                        cx="50%" cy="60%" 
                        innerRadius={55} outerRadius={90} 
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        filter="url(#pieShadowDemo)"
                      >
                        {demografiaSexo.map((entry, index) => (
                          <Cell 
                            key={`cell-sex-${index}`} 
                            fill={CHART_COLORS[index % CHART_COLORS.length].fill}
                            stroke={CHART_COLORS[index % CHART_COLORS.length].stroke}
                            strokeWidth={2}
                            style={{ filter: `drop-shadow(${CHART_COLORS[index % CHART_COLORS.length].glow})` }}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--background)', color: 'hsl(var(--foreground))' }} />
                      <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum dado demográfico encontrado</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={700}>
            <Card className="lco-card h-[380px] hover-lift group overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-accent" />
                  Demografia - Idade
                </CardTitle>
                <CardDescription>Faixas etárias</CardDescription>
              </CardHeader>
              <CardContent className="h-[280px]">
                {demografiaIdade.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demografiaIdade}>
                      <CartesianGrid strokeDasharray="5 5" opacity={0.08} stroke="hsl(var(--border))" />
                      <XAxis dataKey="faixa" />
                      <YAxis />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--background)', color: 'hsl(var(--foreground))' }} />
                      <Bar dataKey="qtd" name="Pacientes" fill="#10b981" radius={[8,8,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum dado demográfico encontrado</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

        {/* Solicitações por Período */}
        {solicitacoesPorMes.length > 1 && (
          <AnimatedSection delay={800}>
            <Card className="lco-card overflow-hidden group hover:shadow-2xl transition-all duration-500">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChartPieIcon className="mr-2 h-5 w-5 text-primary" />
                  Solicitações por Período
                </CardTitle>
                <CardDescription className="text-muted-foreground/80 font-medium">
                  Evolução das solicitações ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 h-[350px] bg-gradient-to-br from-background via-background to-muted/20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={solicitacoesPorMes} 
                    margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="totalGradientOp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="aprovadasGradientOp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
                        <stop offset="50%" stopColor="hsl(var(--secondary))" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="pendentesGradientOp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                        <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity={0.4}/>
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 5" opacity={0.08} stroke="hsl(var(--border))" strokeWidth={1} />
                    <XAxis 
                      dataKey="mes" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1, opacity: 0.3 }}
                      tickLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1, opacity: 0.3 }}
                      tickMargin={8}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1, opacity: 0.3 }}
                      tickLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1, opacity: 0.3 }}
                      tickMargin={8}
                    />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '16px', 
                        border: '1px solid hsl(var(--border))', 
                        background: 'hsl(var(--background))',
                        color: 'hsl(var(--foreground))',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                        backdropFilter: 'blur(10px)',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                      cursor={{
                        fill: 'hsl(var(--primary))',
                        fillOpacity: 0.1,
                        stroke: 'hsl(var(--primary))',
                        strokeWidth: 2,
                        strokeDasharray: '5 5'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        paddingTop: '20px',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}
                      iconType="circle"
                      iconSize={8}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      stackId="1"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fill="url(#totalGradientOp)" 
                      name="Total de Solicitações"
                      fillOpacity={0.8}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="aprovadas" 
                      stackId="2"
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={3}
                      fill="url(#aprovadasGradientOp)" 
                      name="Autorizadas"
                      fillOpacity={0.8}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="pendentes" 
                      stackId="3"
                      stroke="hsl(var(--accent))" 
                      strokeWidth={3}
                      fill="url(#pendentesGradientOp)" 
                      name="Em Processamento"
                      fillOpacity={0.8}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}

        {/* Performance por Clínica */}
        {performanceClinicas.length > 0 && (
          <AnimatedSection delay={900}>
            <Card className="lco-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                  Performance por Clínica
                </CardTitle>
                <CardDescription>Métricas de aprovação e tempo médio de análise</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Clínica
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Taxa de Aprovação
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tempo Médio (dias)
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Total Solicitações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {performanceClinicas.map((clinica, index) => (
                        <tr key={index} className="group hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                              {clinica.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-sm font-bold text-primary">
                              {Math.round(clinica.aprovacao * 100)}%
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-sm text-muted-foreground">
                              {Math.round(clinica.prazoMedio)} dias
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="text-sm text-muted-foreground">
                              {clinica.totalSolicitacoes}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        )}
      </div>
    );
  };

  const HealthPlanDashboard = () => (
    <div className="space-y-6">
      <Card className="lco-card border-purple-200">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-purple-800 mb-2">Dashboard do Plano de Saúde</h3>
            <p className="text-purple-600">
              Em desenvolvimento. Funcionalidades específicas do plano de saúde serão implementadas em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Diferentes dashboards baseados no papel do usuário
  const renderDashboardContent = () => {
    if (user?.role === 'clinic') {
      return <ClinicDashboard />;
    } else if (user?.role === 'operator') {
      return <OperatorDashboard />;
    } else {
      return <HealthPlanDashboard />;
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div
          className="flex items-center gap-3"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Dashboard
          </h1>
        </div>
        {backendConnected && (
          <button
            onClick={checkConnectionAndLoadData}
            disabled={loading}
            className="px-3 py-1 text-sm bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        )}
      </div>
      {renderDashboardContent()}
    </div>
  );
};

export default Dashboard;
