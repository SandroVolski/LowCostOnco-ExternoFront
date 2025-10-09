import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, Clock, TrendingUp, FileText, AlertCircle, Loader2, Heart, Pill, Calendar, Building2, Plus } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AnimatedSection from '@/components/AnimatedSection';
import { cn } from '@/lib/utils';
import { MouseTilt } from '@/components/MouseTilt';
import { PacienteService, SolicitacaoService, testarConexaoBackend, PatientFromAPI, SolicitacaoFromAPI } from '@/services/api';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Interfaces para dados processados
interface PatientMetrics {
  totalPacientes: number;
  pacientesAtivos: number;
  pacientesEmTratamento: number;
  pacientesEmRemissao: number;
  mediaIdadePacientes: number;
  totalProtocolos: number;
  tratamentosAtivos: number;
  totalCiclosRealizados: number;
}

interface TreatmentProtocolData {
  name: string;
  value: number;
  porcentagem: number;
  cor: string;
}

interface TreatmentProgressData {
  paciente: string;
  protocolo: string;
  cicloAtual: number;
  ciclosPrevistos: number;
  progresso: number;
  status: 'active' | 'completed' | 'paused';
  proximoCiclo: string;
  solicitacaoStatus: string; // Status da solicitação (pendente, aprovada, etc.)
}

interface PatientAgeGroupData {
  faixaEtaria: string;
  quantidade: number;
  porcentagem: number;
}

interface TreatmentTypeData {
  tipo: string;
  quantidade: number;
  cor: string;
}

const PatientDashboard = () => {
  const { user } = useAuth();
  
  // Estados para dados do backend
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PatientMetrics>({
    totalPacientes: 0,
    pacientesAtivos: 0,
    pacientesEmTratamento: 0,
    pacientesEmRemissao: 0,
    mediaIdadePacientes: 0,
    totalProtocolos: 0,
    tratamentosAtivos: 0,
    totalCiclosRealizados: 0,
  });
  
  const [treatmentProtocolData, setTreatmentProtocolData] = useState<TreatmentProtocolData[]>([]);
  const [treatmentProgressData, setTreatmentProgressData] = useState<TreatmentProgressData[]>([]);
  const [patientAgeGroupData, setPatientAgeGroupData] = useState<PatientAgeGroupData[]>([]);
  const [treatmentTypeData, setTreatmentTypeData] = useState<TreatmentTypeData[]>([]);
  const [patientSexData, setPatientSexData] = useState<any[]>([]);
  const [cidTableData, setCidTableData] = useState<any[]>([]);
  const [patientsByDoctorData, setPatientsByDoctorData] = useState<any[]>([]);
  const [treatmentProgressRanges, setTreatmentProgressRanges] = useState<any[]>([]);
  
  // Estados para paginação do Progresso dos Tratamentos
  const [allTreatmentProgressData, setAllTreatmentProgressData] = useState<TreatmentProgressData[]>([]);
  const [displayedTreatmentProgress, setDisplayedTreatmentProgress] = useState<TreatmentProgressData[]>([]);
  const [treatmentProgressPage, setTreatmentProgressPage] = useState(1);
  const [hasMoreTreatmentProgress, setHasMoreTreatmentProgress] = useState(true);

  // Cores para os gráficos
  const CHART_COLORS = [
    '#8cb369', '#e4a94f', '#f26b6b', '#79d153', '#74b9ff', 
    '#fd79a8', '#fdcb6e', '#6c5ce7', '#a29bfe', '#fd79a8'
  ];

  // Verificar conexão e carregar dados
  useEffect(() => {
    checkConnectionAndLoadData();
  }, []);

  const checkConnectionAndLoadData = async () => {
    setLoading(true);
    try {
      console.log('🔧 Verificando conexão com backend...');
      const connected = await testarConexaoBackend();
      setBackendConnected(connected);
      
      if (connected) {
        console.log('✅ Backend conectado, carregando dados do dashboard de pacientes...');
        await loadPatientDashboardData();
      } else {
        console.log('❌ Backend não conectado');
        toast.error('Backend não conectado', {
          description: 'Dados do dashboard de pacientes não disponíveis sem conexão com o servidor'
        });
      }
    } catch (error) {
      console.error('❌ Erro ao verificar conexão:', error);
      setBackendConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const loadPatientDashboardData = async () => {
    try {
      // Carregar dados em paralelo
      const [patientsResult, solicitacoesResult] = await Promise.all([
        PacienteService.listarPacientes({ page: 1, limit: 1000 }),
        SolicitacaoService.listarSolicitacoes({ page: 1, limit: 1000 })
      ]);

      console.log('📊 Dados carregados:', {
        pacientes: patientsResult.data.length,
        solicitacoes: solicitacoesResult.data.length
      });

      const patients = patientsResult.data;
      const solicitacoes = solicitacoesResult.data;

      // Processar métricas e dados
      processPatientMetrics(patients, solicitacoes);
      processTreatmentProtocolData(solicitacoes);
      processTreatmentProgressData(patients, solicitacoes);
      processPatientAgeGroupData(patients);
      processTreatmentTypeData(solicitacoes);
      processPatientSexData(patients);
      processCidTableData(patients);
      processPatientsByDoctorData(patients);
      processTreatmentProgressByRanges(patients, solicitacoes);

    } catch (error) {
      console.error('❌ Erro ao carregar dados do dashboard de pacientes:', error);
      toast.error('Erro ao carregar dados do dashboard de pacientes');
    }
  };

  const processPatientMetrics = (patients: any[], solicitacoes: SolicitacaoFromAPI[]) => {
    const totalPacientes = patients.length;
    
    // Contar pacientes por status
    const pacientesAtivos = patients.filter(p => 
      p.status === 'Em tratamento' || p.status === 'ativo'
    ).length;
    
    const pacientesEmTratamento = patients.filter(p => 
      p.status === 'Em tratamento'
    ).length;
    
    const pacientesEmRemissao = patients.filter(p => 
      p.status === 'Em remissão' || p.status === 'remissao'
    ).length;

    // Calcular média de idade
    console.log('🔍 Calculando idade média para', patients.length, 'pacientes');
    
    const idades = patients
      .map(p => {
        const idade = calculateAge(p.Data_Nascimento);
        console.log(`📋 Paciente: ${p.Paciente_Nome}, Data: ${p.Data_Nascimento}, Idade: ${idade}`);
        return idade;
      })
      .filter(age => age > 0 && age < 120);
    
    console.log('📊 Idades válidas encontradas:', idades);
    
    const mediaIdadePacientes = idades.length > 0 
      ? Math.round(idades.reduce((sum, age) => sum + age, 0) / idades.length)
      : 0;
    
    console.log('✅ Idade média calculada:', mediaIdadePacientes);

    // Contar protocolos únicos
    const protocolosUnicos = new Set(
      solicitacoes.filter(s => s.finalidade).map(s => s.finalidade)
    );
    
    const totalProtocolos = protocolosUnicos.size;
    
    // Tratamentos ativos (solicitações aprovadas)
    const tratamentosAtivos = solicitacoes.filter(s => 
      s.status === 'aprovada' || s.status === 'em_analise'
    ).length;

    // Total de ciclos realizados
    const totalCiclosRealizados = solicitacoes.reduce((total, s) => 
      total + (s.ciclo_atual || 0), 0
    );

    setMetrics({
      totalPacientes,
      pacientesAtivos,
      pacientesEmTratamento,
      pacientesEmRemissao,
      mediaIdadePacientes,
      totalProtocolos,
      tratamentosAtivos,
      totalCiclosRealizados,
    });
  };

  const processTreatmentProtocolData = (solicitacoes: SolicitacaoFromAPI[]) => {
    const protocolCount: Record<string, number> = {};
    
    solicitacoes.forEach(solicitacao => {
      if (solicitacao.finalidade) {
        protocolCount[solicitacao.finalidade] = (protocolCount[solicitacao.finalidade] || 0) + 1;
      }
    });

    const total = Object.values(protocolCount).reduce((sum, count) => sum + count, 0);
    
    const protocolLabels: Record<string, string> = {
      'neoadjuvante': 'Neoadjuvante',
      'adjuvante': 'Adjuvante',
      'curativo': 'Curativo',
      'controle': 'Controle',
      'radioterapia': 'Radioterapia',
      'paliativo': 'Paliativo'
    };

    const data = Object.entries(protocolCount).map(([protocolo, quantidade], index) => ({
      name: protocolLabels[protocolo] || protocolo,
      value: quantidade as number,
      porcentagem: Math.round((quantidade / total) * 100),
      cor: CHART_COLORS[index % CHART_COLORS.length]
    }));

    setTreatmentProtocolData(data);
  };

  const processTreatmentProgressData = (patients: any[], solicitacoes: SolicitacaoFromAPI[]) => {
    const progressData: TreatmentProgressData[] = [];
    
    // Pegar solicitações ativas E pendentes para fins de teste
    const relevantSolicitacoes = solicitacoes.filter(s => 
      s.status === 'aprovada' || s.status === 'em_analise' || s.status === 'pendente'
    );

    relevantSolicitacoes.forEach(solicitacao => {
      const cicloAtual = solicitacao.ciclo_atual || 1;
      const ciclosPrevistos = solicitacao.ciclos_previstos || 6;
      const progresso = Math.round((cicloAtual / ciclosPrevistos) * 100);
      
      // Calcular próximo ciclo
      const proximoCiclo = calculateNextCycleDate(solicitacao);
      
      // Determinar status do tratamento baseado no status da solicitação
      let treatmentStatus: 'active' | 'completed' | 'paused';
      if (solicitacao.status === 'pendente') {
        treatmentStatus = 'paused';
      } else if (cicloAtual >= ciclosPrevistos) {
        treatmentStatus = 'completed';
      } else {
        treatmentStatus = 'active';
      }
      
      progressData.push({
        paciente: solicitacao.cliente_nome,
        protocolo: solicitacao.finalidade || 'Não especificado',
        cicloAtual,
        ciclosPrevistos,
        progresso,
        status: treatmentStatus,
        proximoCiclo,
        solicitacaoStatus: solicitacao.status || 'pendente'
      });
    });

    // Armazenar todos os dados e mostrar apenas os primeiros 3
    setAllTreatmentProgressData(progressData);
    
    // Mostrar apenas os primeiros 3 inicialmente
    const initialDisplay = progressData.slice(0, 3);
    setDisplayedTreatmentProgress(initialDisplay);
    setTreatmentProgressPage(1);
    setHasMoreTreatmentProgress(progressData.length > 3);
    
    // Manter compatibilidade com o estado antigo
    setTreatmentProgressData(initialDisplay);
  };

  // Nova função para agrupar pacientes por faixas de progresso de 10 em 10%
  const processTreatmentProgressByRanges = (patients: any[], solicitacoes: SolicitacaoFromAPI[]) => {
    // Criar faixas de 10 em 10%
    const progressRanges = [
      { min: 0, max: 10, label: '0-10%', color: 'bg-red-500' },
      { min: 11, max: 20, label: '11-20%', color: 'bg-red-600' },
      { min: 21, max: 30, label: '21-30%', color: 'bg-orange-500' },
      { min: 31, max: 40, label: '31-40%', color: 'bg-amber-500' },
      { min: 41, max: 50, label: '41-50%', color: 'bg-yellow-500' },
      { min: 51, max: 60, label: '51-60%', color: 'bg-lime-500' },
      { min: 61, max: 70, label: '61-70%', color: 'bg-green-500' },
      { min: 71, max: 80, label: '71-80%', color: 'bg-emerald-500' },
      { min: 81, max: 90, label: '81-90%', color: 'bg-teal-500' },
      { min: 91, max: 100, label: '91-100%', color: 'bg-support-green' }
    ];

    const rangeCounts = progressRanges.map(range => {
      const pacientesNaFaixa = solicitacoes.filter(s => {
        const cicloAtual = s.ciclo_atual || 1;
        const ciclosPrevistos = s.ciclos_previstos || 6;
        const progresso = Math.round((cicloAtual / ciclosPrevistos) * 100);
        return progresso >= range.min && progresso <= range.max;
      }).length;

      return {
        ...range,
        count: pacientesNaFaixa,
        percentage: solicitacoes.length > 0 ? Math.round((pacientesNaFaixa / solicitacoes.length) * 100) : 0
      };
    });

    // Filtrar apenas faixas com pacientes
    const rangesWithPatients = rangeCounts.filter(range => range.count > 0);
    
    setTreatmentProgressRanges(rangesWithPatients);
    return rangesWithPatients;
  };

  const processPatientAgeGroupData = (patients: any[]) => {
    const ageGroups: Record<string, number> = {
      '< 30': 0,
      '30-39': 0,
      '40-49': 0,
      '50-59': 0,
      '60-69': 0,
      '≥ 70': 0
    };

    patients.forEach(patient => {
      const age = calculateAge(patient.Data_Nascimento);
      if (age < 30) ageGroups['< 30']++;
      else if (age < 40) ageGroups['30-39']++;
      else if (age < 50) ageGroups['40-49']++;
      else if (age < 60) ageGroups['50-59']++;
      else if (age < 70) ageGroups['60-69']++;
      else ageGroups['≥ 70']++;
    });

    const total = patients.length;
    const data = Object.entries(ageGroups).map(([faixaEtaria, quantidade]) => ({
      faixaEtaria,
      quantidade: quantidade as number,
      porcentagem: total > 0 ? Math.round((quantidade / total) * 100) : 0
    }));

    setPatientAgeGroupData(data);
  };

  const processTreatmentTypeData = (solicitacoes: SolicitacaoFromAPI[]) => {
    const typeCount: Record<string, number> = {};
    
    console.log('🔍 Processando tipos de tratamento para', solicitacoes.length, 'solicitações');
    
    solicitacoes.forEach((solicitacao, index) => {
      let tipo = 'Outros';
      
      // Verificar se há medicamentos antineoplásicos
      if (solicitacao.medicamentos_antineoplasticos) {
        const medicamentos = solicitacao.medicamentos_antineoplasticos.toLowerCase();
        
        // Terapias Alvo
        if (medicamentos.includes('trastuzumab') || 
            medicamentos.includes('pertuzumab') || 
            medicamentos.includes('bevacizumab') || 
            medicamentos.includes('cetuximab') || 
            medicamentos.includes('panitumumab') ||
            medicamentos.includes('ramucirumab') ||
            medicamentos.includes('aflibercept')) {
          tipo = 'Terapia Alvo';
        }
        // Imunoterapia
        else if (medicamentos.includes('rituximab') || 
                 medicamentos.includes('nivolumab') || 
                 medicamentos.includes('pembrolizumab') || 
                 medicamentos.includes('atezolizumab') ||
                 medicamentos.includes('durvalumab') ||
                 medicamentos.includes('avelumab') ||
                 medicamentos.includes('ipilimumab')) {
          tipo = 'Imunoterapia';
        }
        // Quimioterapia Clássica
        else if (medicamentos.includes('paclitaxel') || 
                 medicamentos.includes('doxorrubicina') || 
                 medicamentos.includes('cisplatina') || 
                 medicamentos.includes('carboplatina') ||
                 medicamentos.includes('oxaliplatina') ||
                 medicamentos.includes('docetaxel') ||
                 medicamentos.includes('gemcitabina') ||
                 medicamentos.includes('5-fluorouracil') ||
                 medicamentos.includes('capecitabina') ||
                 medicamentos.includes('irinotecano') ||
                 medicamentos.includes('etoposido') ||
                 medicamentos.includes('ciclofosfamida') ||
                 medicamentos.includes('metotrexato') ||
                 medicamentos.includes('vinorelbina') ||
                 medicamentos.includes('vinblastina') ||
                 medicamentos.includes('vincristina') ||
                 medicamentos.includes('adriamicina') ||
                 medicamentos.includes('epirrubicina') ||
                 medicamentos.includes('mitomicina') ||
                 medicamentos.includes('bleomicina') ||
                 medicamentos.includes('dactinomicina') ||
                 medicamentos.includes('daunorrubicina') ||
                 medicamentos.includes('idarrubicina') ||
                 medicamentos.includes('mitoxantrona') ||
                 medicamentos.includes('topotecano') ||
                 medicamentos.includes('etoposido') ||
                 medicamentos.includes('teniposido') ||
                 medicamentos.includes('ifosfamida') ||
                 medicamentos.includes('bendamustina') ||
                 medicamentos.includes('clorambucila') ||
                 medicamentos.includes('melfalano') ||
                 medicamentos.includes('busulfano') ||
                 medicamentos.includes('tiotepa') ||
                 medicamentos.includes('carmustina') ||
                 medicamentos.includes('lomustina') ||
                 medicamentos.includes('procarbazina') ||
                 medicamentos.includes('dacarbazina') ||
                 medicamentos.includes('temozolomida') ||
                 medicamentos.includes('fludarabina') ||
                 medicamentos.includes('cladribina') ||
                 medicamentos.includes('clofarabina') ||
                 medicamentos.includes('nelarabina') ||
                 medicamentos.includes('citarabina') ||
                 medicamentos.includes('gemcitabina') ||
                 medicamentos.includes('decitabina') ||
                 medicamentos.includes('azacitidina') ||
                 medicamentos.includes('hidroxiureia') ||
                 medicamentos.includes('mercaptopurina') ||
                 medicamentos.includes('tioguanina') ||
                 medicamentos.includes('metotrexato') ||
                 medicamentos.includes('pemetrexede') ||
                 medicamentos.includes('raltitrexede') ||
                 medicamentos.includes('pralatrexato')) {
          tipo = 'Quimioterapia';
        }
        // Hormonioterapia
        else if (medicamentos.includes('tamoxifeno') || 
                 medicamentos.includes('anastrozol') || 
                 medicamentos.includes('letrozol') || 
                 medicamentos.includes('exemestano') ||
                 medicamentos.includes('fulvestranto') ||
                 medicamentos.includes('goserelina') ||
                 medicamentos.includes('leuprorelina')) {
          tipo = 'Hormonioterapia';
        }
        // Terapia Oral
        else if (medicamentos.includes('capecitabina') || 
                 medicamentos.includes('temozolomida') || 
                 medicamentos.includes('etoposido') ||
                 medicamentos.includes('ciclosporina') ||
                 medicamentos.includes('imatinibe') ||
                 medicamentos.includes('sunitinibe') ||
                 medicamentos.includes('sorafenibe') ||
                 medicamentos.includes('pazopanibe') ||
                 medicamentos.includes('lenvatinibe') ||
                 medicamentos.includes('cabozantinibe')) {
          tipo = 'Terapia Oral';
        }
        // Radioterapia (baseado na finalidade)
        else if (solicitacao.finalidade === 'radioterapia') {
          tipo = 'Radioterapia';
        }
        // Se não encontrou nenhum padrão específico, verificar se tem medicamentos
        else if (medicamentos.trim().length > 0) {
          // Verificar se tem palavras que indicam quimioterapia
          if (medicamentos.includes('mg/') || 
              medicamentos.includes('mg/m²') || 
              medicamentos.includes('mg/m2') ||
              medicamentos.includes('ml/') ||
              medicamentos.includes('ml/m²') ||
              medicamentos.includes('ml/m2') ||
              medicamentos.includes('d1') ||
              medicamentos.includes('d2') ||
              medicamentos.includes('d3') ||
              medicamentos.includes('d4') ||
              medicamentos.includes('d5') ||
              medicamentos.includes('d6') ||
              medicamentos.includes('d7') ||
              medicamentos.includes('d8') ||
              medicamentos.includes('d9') ||
              medicamentos.includes('d10') ||
              medicamentos.includes('d14') ||
              medicamentos.includes('d21') ||
              medicamentos.includes('d28') ||
              medicamentos.includes('vo') ||
              medicamentos.includes('iv') ||
              medicamentos.includes('im') ||
              medicamentos.includes('sc') ||
              medicamentos.includes('ev') ||
              medicamentos.includes('endovenosa') ||
              medicamentos.includes('intramuscular') ||
              medicamentos.includes('subcutanea') ||
              medicamentos.includes('oral')) {
            tipo = 'Quimioterapia'; // Assumir quimioterapia se tem padrões de dosagem
          } else {
            tipo = 'Outros'; // Se não tem padrões reconhecidos
          }
        }
      }
      // Se não tem medicamentos mas tem finalidade radioterapia
      else if (solicitacao.finalidade === 'radioterapia') {
        tipo = 'Radioterapia';
      }
      
      typeCount[tipo] = (typeCount[tipo] || 0) + 1;
      
      // Debug: mostrar o que foi detectado
      console.log(`📋 Solicitação ${index + 1}:`, {
        paciente: solicitacao.cliente_nome,
        medicamentos: solicitacao.medicamentos_antineoplasticos?.substring(0, 50) + '...',
        tipoDetectado: tipo,
        finalidade: solicitacao.finalidade
      });
    });

    // Ordenar por quantidade e pegar apenas os tipos com pacientes
    const data = Object.entries(typeCount)
      .filter(([_, quantidade]) => quantidade > 0) // Remove tipos vazios
      .sort((a, b) => b[1] - a[1]) // Ordena por quantidade decrescente
      .map(([tipo, quantidade], index) => ({
      tipo,
      quantidade: quantidade as number,
      cor: CHART_COLORS[index % CHART_COLORS.length]
    }));

    console.log('📊 Resultado final dos tipos de tratamento (solicitações):', data);
    setTreatmentTypeData(data);
  };

  // Pacientes por Sexo
  const processPatientSexData = (patients: any[]) => {
    const sexCount: Record<string, number> = {
      'Masculino': 0,
      'Feminino': 0
    };
    
    patients.forEach(p => {
      const sexo = (p.Sexo || p.sexo || '').toLowerCase().trim();
      
      if (sexo === 'm' || sexo === 'masculino' || sexo === 'male' || sexo === 'masc') {
        sexCount['Masculino']++;
      } else if (sexo === 'f' || sexo === 'feminino' || sexo === 'female' || sexo === 'fem') {
        sexCount['Feminino']++;
      } else {
        // Se não conseguir identificar, não contar (não adicionar categoria "Não Declarado")
        console.log(`⚠️ Sexo não identificado para paciente: ${p.Paciente_Nome}, valor: "${p.Sexo || p.sexo}"`);
      }
    });
    
    const data = Object.entries(sexCount)
      .filter(([_, quantidade]) => quantidade > 0) // Remove categorias vazias
      .map(([sexo, quantidade], idx) => ({
        name: sexo,
        value: quantidade as number,
        color: idx === 0 ? '#3b82f6' : '#ec4899' // Azul para Masculino, Rosa para Feminino
      }));
    
    setPatientSexData(data);
  };

  // Tabela de CID mais frequentes
  const processCidTableData = (patients: any[]) => {
    const cidCount: Record<string, number> = {};
    patients.forEach(p => {
      const raw = (p.Cid_Diagnostico !== undefined && p.Cid_Diagnostico !== null)
        ? p.Cid_Diagnostico
        : (p.cid_diagnostico !== undefined && p.cid_diagnostico !== null)
          ? p.cid_diagnostico
          : 'Não informado';
      const upper = String(raw).toUpperCase();
      if (!upper.trim() || upper.trim() === 'NÃO INFORMADO') return;

      // Divide possíveis múltiplos CIDs separados por vírgula e conta cada um
      const parts = upper.split(',').map(part => part.trim()).filter(Boolean);
      if (parts.length === 0) return;

      parts.forEach(code => {
        if (!code) return;
        cidCount[code] = (cidCount[code] || 0) + 1;
      });
    });
    const data = Object.entries(cidCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 9)
      .map(([cid, quantidade]) => ({ cid, quantidade }));
    setCidTableData(data);
  };

  // Pacientes por Médico
  const processPatientsByDoctorData = (patients: any[]) => {
    const doctorCount: Record<string, number> = {};
    patients.forEach(p => {
      const medico = (p.Prestador || p.prestador || 'Não informado');
      doctorCount[medico] = (doctorCount[medico] || 0) + 1;
    });
    const data = Object.entries(doctorCount)
      .sort((a, b) => b[1] - a[1])
      .map(([medico, quantidade], idx) => ({
        name: medico,
        value: quantidade as number,
        color: CHART_COLORS[idx % CHART_COLORS.length]
      }));
    setPatientsByDoctorData(data);
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) {
      console.log('⚠️ Data de nascimento vazia');
      return 0;
    }
    
    try {
      let cleanDate = birthDate;
      
      // Limpar a data de diferentes formatos
      if (birthDate.includes('T')) {
        cleanDate = birthDate.split('T')[0];
      }
      
      // Verificar se é formato brasileiro (DD/MM/YYYY)
      if (cleanDate.includes('/')) {
        const parts = cleanDate.split('/');
        if (parts.length === 3) {
          cleanDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      
      console.log(`🔄 Processando data: "${birthDate}" -> "${cleanDate}"`);
      
      const birth = new Date(cleanDate);
      const today = new Date();
      
      if (isNaN(birth.getTime())) {
        console.log('❌ Data inválida:', birthDate);
        return 0;
      }
      
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      const finalAge = age > 0 && age < 120 ? age : 0;
      console.log(`✅ Idade calculada: ${finalAge} anos`);
      
      return finalAge;
    } catch (error) {
      console.log('❌ Erro ao calcular idade para:', birthDate, error);
      return 0;
    }
  };

  const calculateNextCycleDate = (solicitacao: SolicitacaoFromAPI): string => {
    try {
      const intervalo = parseInt(solicitacao.dias_aplicacao_intervalo?.split(' ')[0] || '21');
      const dataBase = new Date(solicitacao.data_solicitacao || solicitacao.created_at || '');
      const cicloAtual = solicitacao.ciclo_atual || 1;
      
      const proximaData = new Date(dataBase);
      proximaData.setDate(proximaData.getDate() + (intervalo * cicloAtual));
      
      return proximaData.toLocaleDateString('pt-BR');
    } catch {
      return 'N/D';
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return 'N/D';
    }
  };

  // Função para carregar mais tratamentos
  const loadMoreTreatmentProgress = () => {
    const currentPage = treatmentProgressPage;
    const nextPage = currentPage + 1;
    const itemsPerPage = 5; // Sempre carregar 5 por vez
    
    const startIndex = currentPage === 1 ? 3 : (currentPage - 1) * 5 + 3;
    const endIndex = startIndex + itemsPerPage;
    
    const newItems = allTreatmentProgressData.slice(startIndex, endIndex);
    
    if (newItems.length > 0) {
      setDisplayedTreatmentProgress(prev => [...prev, ...newItems]);
      setTreatmentProgressPage(nextPage);
      setHasMoreTreatmentProgress(endIndex < allTreatmentProgressData.length);
      
      // Atualizar o estado antigo para compatibilidade
      setTreatmentProgressData(prev => [...prev, ...newItems]);
    } else {
      setHasMoreTreatmentProgress(false);
    }
  };

  if (!backendConnected) {
    return (
      <div className="space-y-6">
        <Card className="lco-card border-orange-200">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-orange-800 mb-2">Backend não conectado</h3>
              <p className="text-orange-600 mb-4">
                Para visualizar os dados do dashboard de pacientes, certifique-se de que o servidor backend está rodando.
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
            <p className="text-muted-foreground">Carregando dados do dashboard de pacientes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Dashboard de Pacientes
          </h1>
        </div>
        <button
          onClick={checkConnectionAndLoadData}
          disabled={loading}
          className="px-3 py-1 text-sm bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatedSection delay={100}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-support-green/5 to-support-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5 text-support-green" />
                  Total de Pacientes
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{metrics.totalPacientes}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-support-green">
                    {metrics.pacientesAtivos} ativos
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
                  <Activity className="mr-2 h-5 w-5 text-support-yellow" />
                  Pacientes em Tratamento
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{metrics.pacientesEmTratamento}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Tratamentos ativos
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
                  <Heart className="mr-2 h-5 w-5 text-highlight-peach" />
                  Idade Média
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">{metrics.mediaIdadePacientes}</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Anos de idade
                </p>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>

        <AnimatedSection delay={400}>
          <MouseTilt maxTilt={5} scale={1.02}>
            <Card className="lco-card hover-lift group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-lg flex items-center">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  Sexo
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold">
                  {patientSexData.find(s => s.name === 'Masculino')?.value || 0} / {patientSexData.find(s => s.name === 'Feminino')?.value || 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-blue-500">Masc</span> / <span className="text-pink-500">Fem</span>
                </p>
              </CardContent>
            </Card>
          </MouseTilt>
        </AnimatedSection>
      </div>

      {/* Progresso dos Tratamentos por Faixas de 10% */}
      <AnimatedSection delay={400}>
        <Card className="lco-card hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="mr-2 h-5 w-5 text-primary" />
              Progresso dos Tratamentos por Faixas
            </CardTitle>
            <CardDescription>Distribuição dos pacientes por faixas de progresso de 10 em 10%</CardDescription>
          </CardHeader>
          <CardContent>
            {treatmentProgressRanges.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {treatmentProgressRanges.map((range, index) => (
                  <div key={index} className="text-center p-4 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-300">
                    <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${range.color}`}></div>
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {range.count}
                    </div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">
                      {range.label}
                    </div>
                    <div className="text-xs text-primary font-medium">
                      {range.percentage}% dos pacientes
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum dado de progresso disponível</p>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Progresso dos Tratamentos - Versão Sutil (comentado a pedido)
      <AnimatedSection delay={450}>
        <Card className="lco-card hover:shadow-md transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              Progresso dos Tratamentos
            </CardTitle>
            <CardDescription>Acompanhamento dos ciclos de tratamento</CardDescription>
          </CardHeader>
          <CardContent>
            ...
          </CardContent>
        </Card>
      </AnimatedSection>
      */}

      {/* Pacientes por Sexo e Pacientes por Médico lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatedSection delay={500}>
          <Card className="lco-card h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Pacientes por Sexo
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              {patientSexData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="sexShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                      </filter>
                    </defs>
                    <Pie
                      data={patientSexData}
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
                      filter="url(#sexShadow)"
                    >
                      {patientSexData.map((entry, idx) => (
                        <Cell 
                          key={`cell-${idx}`} 
                          fill={entry.color}
                          stroke={entry.color}
                          strokeWidth={2}
                          style={{
                            filter: `drop-shadow(0 0 10px ${entry.color}80)`
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
                  <p>Nenhum dado de sexo encontrado</p>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>

        <AnimatedSection delay={500}>
          <Card className="lco-card h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Pacientes por Médico
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              {patientsByDoctorData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patientsByDoctorData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="doctorBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      </linearGradient>
                      <filter id="doctorBarShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="var(--border)" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                      tickLine={{ stroke: 'var(--border)' }}
                      tickMargin={8}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                      tickLine={{ stroke: 'var(--border)' }}
                      tickMargin={8}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid var(--border)', 
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        background: 'var(--background)',
                        color: 'hsl(var(--foreground))',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value, name) => [`${value} pacientes`, 'Quantidade']}
                    />
                    <Bar 
                      dataKey="value" 
                      name="Pacientes" 
                      fill="url(#doctorBarGradient)"
                      animationDuration={2000}
                      animationBegin={300}
                      radius={[6, 6, 0, 0]}
                      stroke="var(--background)"
                      strokeWidth={2}
                      maxBarSize={60}
                      filter="url(#doctorBarShadow)"
                      className="transition-all duration-300 hover:brightness-110"
                      style={{
                        filter: `drop-shadow(0 0 8px hsl(var(--primary) / 0.4))`
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum dado de médico encontrado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>

        
        
      </div>

      {/* CIDs Mais Frequentes */}
      <AnimatedSection delay={550}>
        <Card className="lco-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5 text-primary" />
              CIDs Mais Frequentes
            </CardTitle>
            <CardDescription>Principais diagnósticos dos pacientes</CardDescription>
          </CardHeader>
          <CardContent>
            {cidTableData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <filter id="cidCardShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                    </filter>
                  </defs>
                </svg>
                {cidTableData.map((row, idx) => {
                  const percentage = Math.round((row.quantidade / Math.max(...cidTableData.map(r => r.quantidade))) * 100);
                  const colors = [
                    'from-primary to-primary/80',
                    'from-support-green to-support-green/80', 
                    'from-support-yellow to-support-yellow/80',
                    'from-highlight-red to-highlight-red/80',
                    'from-highlight-peach to-highlight-peach/80',
                    'from-primary/70 to-primary/50',
                    'from-support-green/70 to-support-green/50',
                    'from-support-yellow/70 to-support-yellow/50',
                    'from-highlight-red/70 to-highlight-red/50',
                    'from-highlight-peach/70 to-highlight-peach/50'
                  ];
                  const colorClass = colors[idx % colors.length];
                  
                  // Extrair cor base para o efeito neon
                  const getNeonColor = () => {
                    if (colorClass.includes('primary')) return 'hsl(var(--primary))';
                    if (colorClass.includes('support-green')) return 'hsl(var(--support-green))';
                    if (colorClass.includes('support-yellow')) return 'hsl(var(--support-yellow))';
                    if (colorClass.includes('highlight-red')) return 'hsl(var(--highlight-red))';
                    if (colorClass.includes('highlight-peach')) return 'hsl(var(--highlight-peach))';
                    return 'hsl(var(--primary))';
                  };
                  
                  const neonColor = getNeonColor();
                  
                  return (
                    <div 
                      key={row.cid}
                      className="group relative p-4 bg-muted/20 rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:bg-muted/30"
                      style={{
                        filter: `drop-shadow(0 0 8px ${neonColor}40)`,
                        boxShadow: `0 0 15px ${neonColor}20`
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-3 h-3 rounded-full bg-gradient-to-r ${colorClass} shadow-sm`}
                            style={{
                              filter: `drop-shadow(0 0 6px ${neonColor}80)`,
                              boxShadow: `0 0 8px ${neonColor}60`
                            }}
                          />
                          <div>
                            <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                              {row.cid}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {row.quantidade} paciente{row.quantidade !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {row.quantidade}
                      </div>
                      <div className="text-xs text-muted-foreground">
                            {percentage}% do total
                      </div>
                    </div>
                      </div>
                      
                      {/* Barra de progresso */}
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-500 ease-out`}
                          style={{ 
                            width: `${percentage}%`,
                            animationDelay: `${idx * 100}ms`,
                            filter: `drop-shadow(0 0 4px ${neonColor}60)`,
                            boxShadow: `0 0 6px ${neonColor}40`
                          }}
                        />
                      </div>
                      
                      {/* Efeito de brilho no hover */}
                      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                  );
                })}
                    </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhum CID encontrado</p>
                  <p className="text-sm">Não há dados de diagnóstico disponíveis</p>
                  </div>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Solicitações por Protocolo */}
        <AnimatedSection delay={500}>
          <Card className="lco-card h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Pill className="mr-2 h-5 w-5 text-primary" />
                Solicitações por Protocolo
              </CardTitle>
              <CardDescription>Distribuição de solicitações de autorização por tipo de protocolo</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex justify-center">
              {treatmentProtocolData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      <filter id="protocolShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                      </filter>
                    </defs>
                    <Pie
                      data={treatmentProtocolData}
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
                      label={({ name, porcentagem }) => `${porcentagem}%`}
                      labelLine={false}
                      filter="url(#protocolShadow)"
                    >
                      {treatmentProtocolData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.cor}
                          stroke={entry.cor}
                          strokeWidth={2}
                          style={{
                            filter: `drop-shadow(0 0 10px ${entry.cor}80)`
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
                      formatter={(value, entry) => `${value} (${entry.payload.value})`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum protocolo encontrado</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>

        {/* Distribuição por Faixa Etária */}
        <AnimatedSection delay={600}>
          <Card className="lco-card h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Distribuição por Idade
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              {patientAgeGroupData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patientAgeGroupData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <defs>
                      <linearGradient id="ageBarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      </linearGradient>
                      <filter id="ageBarShadow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.3"/>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="var(--border)" />
                    <XAxis 
                      dataKey="faixaEtaria" 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                      tickLine={{ stroke: 'var(--border)' }}
                      tickMargin={8}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--foreground))', fontSize: 11, fontWeight: 500 }}
                      axisLine={{ stroke: 'var(--border)', strokeWidth: 1 }}
                      tickLine={{ stroke: 'var(--border)' }}
                      tickMargin={8}
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid var(--border)', 
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                        background: 'var(--background)',
                        color: 'hsl(var(--foreground))',
                        fontSize: '12px'
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value, name) => [`${value} pacientes`, 'Quantidade']}
                    />
                    <Bar 
                      dataKey="quantidade" 
                      name="Pacientes" 
                      fill="url(#ageBarGradient)"
                      animationDuration={2000}
                      animationBegin={400}
                      radius={[6, 6, 0, 0]}
                      stroke="var(--background)"
                      strokeWidth={2}
                      maxBarSize={60}
                      filter="url(#ageBarShadow)"
                      className="transition-all duration-300 hover:brightness-110"
                      style={{
                        filter: `drop-shadow(0 0 8px hsl(var(--primary) / 0.4))`
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum dado de idade encontrado</p>
            </div>
                </div>
              )}
          </CardContent>
        </Card>
      </AnimatedSection>
      </div>

      {/* Tipos de Tratamento */}
      <AnimatedSection delay={800}>
        <Card className="lco-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-primary" />
              Tipos de Tratamento
            </CardTitle>
            <CardDescription>Distribuição de solicitações por tipo de tratamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {treatmentTypeData.map((tipo, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: tipo.cor }}
                    />
                    <div>
                      <div className="font-medium">{tipo.tipo}</div>
                      <div className="text-sm text-muted-foreground">
                        {tipo.quantidade} solicitações
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>
    </div>
  );
};

export default PatientDashboard; 