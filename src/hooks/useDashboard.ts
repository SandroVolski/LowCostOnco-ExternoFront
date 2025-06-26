// src/hooks/useDashboard.ts
import { useState, useEffect, useCallback } from 'react';
import { PacienteService, SolicitacaoService, testarConexaoBackend, SolicitacaoFromAPI } from '@/services/api';
import { toast } from 'sonner';

// Interfaces para os dados processados
export interface DashboardStats {
  totalPacientes: number;
  totalSolicitacoes: number;
  pacientesVariacao: number;
  solicitacoesVariacao: number;
  valorEstimado: number;
  valorVariacao: number;
}

export interface PatientStatusData {
  name: string;
  count: number;
  color: string;
}

export interface TreatmentData {
  name: string;
  value: number;
  color: string;
}

export interface MedicationData {
  name: string;
  jan: number;
  fev: number;
  mar: number;
  abr: number;
  mai: number;
  jun: number;
}

export interface UpcomingTreatment {
  id: string;
  patientName: string;
  treatmentType: string;
  daysRemaining: number;
  cycle: string;
  status: 'urgent' | 'warning' | 'normal';
}

export interface SolicitationStatusData {
  name: string;
  count: number;
  color: string;
}

// Cores modernas para os gráficos
const CHART_COLORS = [
  { fill: '#8cb369', stroke: '#a8c97d', glow: '0 0 10px rgba(140, 179, 105, 0.5)' },
  { fill: '#e4a94f', stroke: '#f2c94c', glow: '0 0 10px rgba(228, 169, 79, 0.5)' },
  { fill: '#f26b6b', stroke: '#ff8f8f', glow: '0 0 10px rgba(242, 107, 107, 0.5)' },
  { fill: '#c6d651', stroke: '#d4e37b', glow: '0 0 10px rgba(198, 214, 81, 0.5)' },
  { fill: '#74b9ff', stroke: '#81ecec', glow: '0 0 10px rgba(116, 185, 255, 0.5)' },
];

export const useDashboard = () => {
  // Estados para dados
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [patientStatusData, setPatientStatusData] = useState<PatientStatusData[]>([]);
  const [treatmentData, setTreatmentData] = useState<TreatmentData[]>([]);
  const [medicationData, setMedicationData] = useState<MedicationData[]>([]);
  const [solicitationStatusData, setSolicitationStatusData] = useState<SolicitationStatusData[]>([]);
  const [upcomingTreatments, setUpcomingTreatments] = useState<UpcomingTreatment[]>([]);
  
  // Estados de controle
  const [loading, setLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Função para verificar backend e carregar dados
  const checkBackendAndLoadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔧 Verificando conexão com backend...');
      const connected = await testarConexaoBackend();
      setBackendConnected(connected);
      
      if (connected) {
        console.log('✅ Backend conectado, carregando dados...');
        await loadDashboardData();
        setLastUpdate(new Date());
        toast.success('Dashboard atualizado com sucesso!');
      } else {
        setError('Backend não está conectado. Inicie o servidor na porta 3001.');
        console.log('❌ Backend não conectado');
        toast.error('Backend não conectado', {
          description: 'Verifique se o servidor está rodando na porta 3001'
        });
      }
    } catch (err) {
      console.error('❌ Erro ao verificar backend:', err);
      setError('Erro ao conectar com o servidor');
      setBackendConnected(false);
      toast.error('Erro ao conectar com servidor', {
        description: err instanceof Error ? err.message : 'Erro desconhecido'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Função para carregar dados do dashboard
  const loadDashboardData = useCallback(async () => {
    try {
      console.log('📊 Carregando dados do dashboard...');
      
      // Carregar pacientes e solicitações em paralelo
      const [patientsResult, solicitationsResult] = await Promise.all([
        PacienteService.listarPacientes({ page: 1, limit: 1000 }),
        SolicitacaoService.listarSolicitacoes({ page: 1, limit: 1000 })
      ]);
      
      console.log('👥 Pacientes carregados:', patientsResult.data.length);
      console.log('📋 Solicitações carregadas:', solicitationsResult.data.length);
      
      // Processar dados
      processDashboardData(patientsResult.data, solicitationsResult.data);
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      setError('Erro ao carregar dados do servidor');
      throw error;
    }
  }, []);

  // Função para processar os dados do dashboard
  const processDashboardData = useCallback((patients: any[], solicitations: SolicitacaoFromAPI[]) => {
    console.log('🔄 Processando dados do dashboard...');
    
    // Calcular estatísticas básicas
    const totalPacientes = patients.length;
    const totalSolicitacoes = solicitations.length;
    
    // Calcular valor estimado (baseado nas solicitações)
    const valorEstimado = solicitations.reduce((total, solicitation) => {
      // Calcular valor baseado no tipo de tratamento e medicamentos
      let valorSolicitacao = 2500; // Valor base
      
      if (solicitation.medicamentos_antineoplasticos) {
        const medicamentos = solicitation.medicamentos_antineoplasticos.toLowerCase();
        if (medicamentos.includes('trastuzumab')) valorSolicitacao += 5000;
        if (medicamentos.includes('rituximab')) valorSolicitacao += 3000;
        if (medicamentos.includes('bevacizumab')) valorSolicitacao += 4000;
      }
      
      // Multiplicar por número de ciclos
      const ciclos = solicitation.ciclos_previstos || 1;
      return total + (valorSolicitacao * ciclos);
    }, 0);
    
    // Estatísticas principais (variações simuladas por enquanto)
    const stats: DashboardStats = {
      totalPacientes,
      totalSolicitacoes,
      pacientesVariacao: Math.floor(Math.random() * 20) - 10,
      solicitacoesVariacao: Math.floor(Math.random() * 20) - 10,
      valorEstimado,
      valorVariacao: Math.floor(Math.random() * 20) - 10,
    };
    
    setDashboardStats(stats);
    
    // Processar status dos pacientes
    const statusCount = patients.reduce((acc, patient) => {
      const status = patient.status || 'Em tratamento';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const patientStatusProcessed: PatientStatusData[] = Object.entries(statusCount).map(([status, count], index) => ({
      name: status,
      count,
      color: CHART_COLORS[index % CHART_COLORS.length].fill,
    }));
    
    setPatientStatusData(patientStatusProcessed);
    
    // Processar status das solicitações
    const solicitationStatusCount = solicitations.reduce((acc, solicitation) => {
      const status = solicitation.status || 'pendente';
      const statusName = status === 'pendente' ? 'Pendente' : 
                        status === 'aprovada' ? 'Aprovada' : 
                        status === 'rejeitada' ? 'Rejeitada' : 
                        status === 'em_analise' ? 'Em Análise' : status;
      acc[statusName] = (acc[statusName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const solicitationStatusProcessed: SolicitationStatusData[] = Object.entries(solicitationStatusCount).map(([status, count], index) => ({
      name: status,
      count,
      color: CHART_COLORS[index % CHART_COLORS.length].fill,
    }));
    
    setSolicitationStatusData(solicitationStatusProcessed);
    
    // Processar medicamentos mais utilizados
    const medicationCount = solicitations.reduce((acc, solicitation) => {
      if (solicitation.medicamentos_antineoplasticos) {
        const text = solicitation.medicamentos_antineoplasticos.toLowerCase();
        
        // Lista de medicamentos comuns para detectar
        const medicamentos = [
          { nome: 'Trastuzumabe', palavras: ['trastuzumab', 'herceptin'] },
          { nome: 'Rituximabe', palavras: ['rituximab', 'mabthera'] },
          { nome: 'Bevacizumabe', palavras: ['bevacizumab', 'avastin'] },
          { nome: 'Paclitaxel', palavras: ['paclitaxel', 'taxol'] },
          { nome: 'Carboplatina', palavras: ['carboplatin', 'carboplatina'] },
          { nome: 'Pembrolizumabe', palavras: ['pembrolizumab', 'keytruda'] },
          { nome: 'Doxorrubicina', palavras: ['doxorubicin', 'adriamicina'] },
          { nome: 'Ciclofosfamida', palavras: ['cyclophosphamide', 'ciclofosfamida'] }
        ];
        
        medicamentos.forEach(({ nome, palavras }) => {
          if (palavras.some(palavra => text.includes(palavra))) {
            acc[nome] = (acc[nome] || 0) + 1;
          }
        });
      }
      return acc;
    }, {} as Record<string, number>);
    
    // Criar dados mensais simulados baseados nos medicamentos encontrados
    const medicationDataProcessed: MedicationData[] = Object.entries(medicationCount)
      .slice(0, 5) // Top 5 medicamentos
      .map(([name, total]) => {
        // Distribuir o total ao longo dos meses com alguma variação
        const baseValue = total / 6;
        return {
          name,
          jan: Math.max(1, Math.floor(baseValue * (0.8 + Math.random() * 0.4))),
          fev: Math.max(1, Math.floor(baseValue * (0.8 + Math.random() * 0.4))),
          mar: Math.max(1, Math.floor(baseValue * (0.8 + Math.random() * 0.4))),
          abr: Math.max(1, Math.floor(baseValue * (0.8 + Math.random() * 0.4))),
          mai: Math.max(1, Math.floor(baseValue * (0.8 + Math.random() * 0.4))),
          jun: Math.max(1, Math.floor(baseValue * (0.8 + Math.random() * 0.4))),
        };
      });
    
    setMedicationData(medicationDataProcessed);
    
    // Processar tipos de tratamento baseado na finalidade
    const treatmentTypeCount = solicitations.reduce((acc, solicitation) => {
      const finalidade = solicitation.finalidade;
      
      if (finalidade?.includes('curativo') || finalidade?.includes('adjuvante')) {
        acc['Quimioterapia'] = (acc['Quimioterapia'] || 0) + 1;
      }
      if (finalidade?.includes('radioterapia')) {
        acc['Radioterapia'] = (acc['Radioterapia'] || 0) + 1;
      }
      if (finalidade?.includes('paliativo')) {
        acc['Paliativo'] = (acc['Paliativo'] || 0) + 1;
      }
      if (finalidade?.includes('neoadjuvante')) {
        acc['Neoadjuvante'] = (acc['Neoadjuvante'] || 0) + 1;
      }
      
      return acc;
    }, {} as Record<string, number>);
    
    const treatmentDataProcessed: TreatmentData[] = Object.entries(treatmentTypeCount)
      .filter(([_, value]) => value > 0)
      .map(([name, value], index) => ({
        name,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length].fill,
      }));
    
    setTreatmentData(treatmentDataProcessed);
    
    // Processar tratamentos próximos (baseado em solicitações ativas)
    const upcomingTreatmentsProcessed: UpcomingTreatment[] = solicitations
      .filter(s => s.status === 'aprovada' || s.status === 'em_analise')
      .slice(0, 6) // Máximo 6 tratamentos
      .map((solicitation, index) => {
        // Calcular dias restantes baseado no ciclo atual vs previstos
        const cicloAtual = solicitation.ciclo_atual || 1;
        const ciclosPrevistos = solicitation.ciclos_previstos || 6;
        const progresso = cicloAtual / ciclosPrevistos;
        
        // Simular dias restantes baseado no progresso
        const daysRemaining = Math.max(1, Math.floor((1 - progresso) * 30 + Math.random() * 10));
        
        return {
          id: solicitation.id?.toString() || index.toString(),
          patientName: solicitation.cliente_nome,
          treatmentType: solicitation.finalidade === 'curativo' ? 'Quimioterapia' : 
                        solicitation.finalidade === 'radioterapia' ? 'Radioterapia' : 
                        solicitation.finalidade === 'paliativo' ? 'Tratamento Paliativo' :
                        'Tratamento Oncológico',
          daysRemaining,
          cycle: `${cicloAtual}/${ciclosPrevistos}`,
          status: daysRemaining <= 3 ? 'urgent' : daysRemaining <= 7 ? 'warning' : 'normal',
        };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining); // Ordenar por urgência
    
    setUpcomingTreatments(upcomingTreatmentsProcessed);
    
    console.log('✅ Dados do dashboard processados com sucesso');
    console.log('📊 Estatísticas:', {
      pacientes: totalPacientes,
      solicitacoes: totalSolicitacoes,
      valor: valorEstimado,
      medicamentos: medicationDataProcessed.length,
      tratamentosProximos: upcomingTreatmentsProcessed.length
    });
  }, []);

  // Função para formatar moeda
  const formatCurrency = useCallback((value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }, []);

  // Função para obter cor da variação
  const getVariationColor = useCallback((variation: number): string => {
    return variation >= 0 ? 'text-green-600' : 'text-red-600';
  }, []);

  // Carregar dados ao montar o hook
  useEffect(() => {
    checkBackendAndLoadData();
  }, [checkBackendAndLoadData]);

  return {
    // Dados
    dashboardStats,
    patientStatusData,
    treatmentData,
    medicationData,
    solicitationStatusData,
    upcomingTreatments,
    
    // Estados de controle
    loading,
    backendConnected,
    error,
    lastUpdate,
    
    // Funções
    checkBackendAndLoadData,
    loadDashboardData,
    formatCurrency,
    getVariationColor,
    
    // Constantes
    CHART_COLORS,
  };
};