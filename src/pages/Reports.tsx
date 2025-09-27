import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent,
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  File, 
  FilePlus, 
  PencilIcon, 
  SendIcon, 
  Eye,
  Trash2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  UserPlus,
  Building2,
  Search,
  Edit,
  Users,
  Stethoscope,
  Plus,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { SolicitacaoService, SolicitacaoFromAPI, testarConexaoBackend, PacienteService, ProtocoloService, ProtocoloFromAPI } from '@/services/api';
import { ClinicService } from '@/services/clinicService';
import { usePageNavigation } from '@/components/transitions/PageTransitionContext';
import PDFViewerModal from '@/components/PDFViewerModal';
import DoctorAuthModal from '@/components/DoctorAuthModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CatalogService, type CatalogCidItem } from '@/services/api';
import type { CatalogPrincipioAtivoItem } from '@/services/api';
import CIDSelection from '@/components/CIDSelection';
import ActivePrincipleSelection from '@/components/ActivePrincipleSelection';

interface PatientOption {
  id: string;
  name: string;
  codigo: string;
  cpf: string;
  dataNascimento: string;
  idade: number;
  sexo: string;
  cidDiagnostico: string;
}

const Reports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { navigateWithTransition } = usePageNavigation();
  const authRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  
  // Estados para o formulário
  const [formData, setFormData] = useState({
    hospital_nome: '',
    hospital_codigo: '',
    cliente_nome: '',
    cliente_codigo: '',
    sexo: '',
    data_nascimento: '',
    idade: '',
    data_solicitacao: '',
    diagnostico_cid: '',
    diagnostico_descricao: '',
    local_metastases: '',
    estagio_t: '',
    estagio_n: '',
    estagio_m: '',
    estagio_clinico: '',
    tratamento_cirurgia_radio: '',
    tratamento_quimio_adjuvante: '',
    tratamento_quimio_primeira_linha: '',
    tratamento_quimio_segunda_linha: '',
    finalidade: '',
    performance_status: '',
    siglas: '',
    ciclos_previstos: '',
    ciclo_atual: '',
    superficie_corporal: '',
    peso: '',
    altura: '',
    medicamentos_antineoplasticos: '',
    dose_por_m2: '',
    dose_total: '',
    via_administracao: '',
    dias_aplicacao_intervalo: '',
    medicacoes_associadas: '',
    medico_assinatura_crm: '',
    numero_autorizacao: '',
  });

  const [cidOptions, setCidOptions] = useState<CatalogCidItem[]>([]);
  const [cidSearch, setCidSearch] = useState('');
  const [cidTotal, setCidTotal] = useState(0);
  const [cidLimit] = useState(100);
  const [cidOffset, setCidOffset] = useState(0);
  const [cidLoading, setCidLoading] = useState(false);
  const [principiosOptions, setPrincipiosOptions] = useState<CatalogPrincipioAtivoItem[]>([]);
  const [principiosSearch, setPrincipiosSearch] = useState('');
  const [principiosSelected, setPrincipiosSelected] = useState<string[]>([]);
  const [principiosTotal, setPrincipiosTotal] = useState(0);
  const [principiosLimit] = useState(100);
  const [principiosOffset, setPrincipiosOffset] = useState(0);
  const [principiosLoading, setPrincipiosLoading] = useState(false);

  // Estados para pacientes e clínica
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [clinicProfile, setClinicProfile] = useState<any>(null);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoFromAPI[]>([]);

  const [backendConnected, setBackendConnected] = useState(false);
  const [loadingClinic, setLoadingClinic] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<SolicitacaoFromAPI | null>(null);

  // Estados para protocolos
  const [protocolos, setProtocolos] = useState<ProtocoloFromAPI[]>([]);
  const [selectedProtocolo, setSelectedProtocolo] = useState<ProtocoloFromAPI | null>(null);
  const [showProtocoloModal, setShowProtocoloModal] = useState(false);
  const [medicamentosFields, setMedicamentosFields] = useState<Array<{
    id: string;
    nome: string;
    dose: string;
    unidade_medida: string;
    via_adm: string;
    dias_adm: string;
    frequencia: string;
    observacoes: string;
  }>>([{ id: '1', nome: '', dose: '', unidade_medida: '', via_adm: '', dias_adm: '', frequencia: '', observacoes: '' }]);
  const [activeMedicamentoIndex, setActiveMedicamentoIndex] = useState(0);

  // Estados adicionais necessários
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [useCustomCRM, setUseCustomCRM] = useState(false);
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
  
  // Estados para autenticação médica
  const [isDoctorAuthModalOpen, setIsDoctorAuthModalOpen] = useState(false);
  const [doctorAuthData, setDoctorAuthData] = useState<any>(null);
  const [pendingSolicitacaoData, setPendingSolicitacaoData] = useState<any>(null);

  // Verificar conexão com backend ao carregar
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Carregar dados quando backend estiver conectado
  useEffect(() => {
    if (backendConnected) {
      loadClinicProfile();
      loadPatients();
      loadSolicitacoes();
      loadProtocolos(); // Adicionar carregamento de protocolos
    }
  }, [backendConnected]);

  // Scroll automático para autorização específica
  useEffect(() => {
    const state = location.state as { scrollToAuth?: string; authId?: number } | null;
    if (state?.scrollToAuth && state?.authId) {
      // Aguardar um pouco para garantir que as solicitações foram carregadas
      setTimeout(() => {
        const element = authRefs.current[state.authId];
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          // Adicionar highlight temporário
          element.classList.add('ring-2', 'ring-primary', 'ring-opacity-50', 'bg-primary/5');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-opacity-50', 'bg-primary/5');
          }, 3000);
        }
      }, 500);
    }
  }, [location.state, solicitacoes]);

  // Definir data atual como padrão
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({
      ...prev,
      data_solicitacao: today
    }));
  }, []);

  const checkBackendConnection = async () => {
    const connected = await testarConexaoBackend();
    setBackendConnected(connected);
    
    if (!connected) {
      toast.error('Backend não conectado', {
        description: 'Verifique se o servidor está rodando na porta 3001'
      });
    }
  };

  // ✅ FUNÇÃO CORRIGIDA - Carregamento do perfil da clínica
  const loadClinicProfile = async () => {
    setLoadingClinic(true);
    try {
      // Primeiro, tentar carregar da API se conectada
      if (backendConnected) {
        try {
          console.log('🔧 Tentando carregar perfil da API...');
          const apiProfile = await ClinicService.getProfile();
          
          if (apiProfile && apiProfile.clinica) {
            console.log('✅ Perfil carregado da API:', apiProfile);
            setClinicProfile(apiProfile);
            
            // Preencher automaticamente os dados da clínica
            setFormData(prev => ({
              ...prev,
              hospital_nome: apiProfile.clinica.nome || '',
              hospital_codigo: apiProfile.clinica.codigo || '',
              medico_assinatura_crm: apiProfile.responsaveis_tecnicos?.[0]?.crm || '',
            }));
            
            console.log('📋 Responsáveis técnicos encontrados:', apiProfile.responsaveis_tecnicos?.length || 0);
            return;
          }
        } catch (apiError) {
          console.warn('⚠️ Erro ao carregar da API, tentando localStorage:', apiError);
        }
      }
      
      // Fallback para localStorage
      console.log('🔧 Carregando perfil do localStorage...');
      const savedProfile = localStorage.getItem('clinic_profile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        console.log('📋 Perfil do localStorage:', profile);
        
        // ✅ CORREÇÃO: Estruturar dados corretamente
        let structuredProfile;
        
        // Se o profile já tem a estrutura correta (clinica + responsaveis_tecnicos)
        if (profile.clinica && profile.responsaveis_tecnicos) {
          structuredProfile = profile;
        }
        // Se o profile é direto (dados da clínica na raiz)
        else if (profile.nome || profile.codigo) {
          structuredProfile = {
            clinica: profile,
            responsaveis_tecnicos: profile.responsaveis_tecnicos || []
          };
        }
        // Se tem responsaveis_tecnicos na raiz mas outros dados também
        else {
          structuredProfile = {
            clinica: {
              nome: profile.nome,
              codigo: profile.codigo,
              cnpj: profile.cnpj,
              endereco: profile.endereco,
              cidade: profile.cidade,
              estado: profile.estado,
              cep: profile.cep,
              telefone: profile.telefone,
              email: profile.email,
              website: profile.website,
              logo_url: profile.logo_url,
              observacoes: profile.observacoes,
            },
            responsaveis_tecnicos: profile.responsaveis_tecnicos || []
          };
        }
        
        console.log('✅ Perfil estruturado:', structuredProfile);
        setClinicProfile(structuredProfile);
        
        // Preencher automaticamente os dados da clínica
        setFormData(prev => ({
          ...prev,
          hospital_nome: structuredProfile.clinica.nome || '',
          hospital_codigo: structuredProfile.clinica.codigo || '',
          medico_assinatura_crm: structuredProfile.responsaveis_tecnicos?.[0]?.crm || '',
        }));
        
        console.log('👨‍⚕️ Responsáveis técnicos encontrados:', structuredProfile.responsaveis_tecnicos?.length || 0);
        if (structuredProfile.responsaveis_tecnicos?.length > 0) {
          structuredProfile.responsaveis_tecnicos.forEach((resp, index) => {
            console.log(`   ${index + 1}. ${resp.nome} - CRM: ${resp.crm}`);
          });
        }
      } else {
        console.log('⚠️ Nenhum perfil encontrado no localStorage');
        toast.info('Configure o perfil da clínica', {
          description: 'Acesse Configurações para definir as informações da clínica',
          action: {
            label: 'Configurar',
            onClick: () => navigateWithTransition('/profile'),
          },
        });
      }
    } catch (error) {
      console.error('❌ Erro ao carregar perfil da clínica:', error);
      toast.error('Erro ao carregar perfil da clínica');
    } finally {
      setLoadingClinic(false);
    }
  };

  const loadPatients = async () => {
    if (!backendConnected) return;
    
    setLoadingPatients(true);
    try {
      const result = await PacienteService.listarPacientes({
        page: 1,
        limit: 100, // Carregar mais pacientes para o select
      });
      
      // Converter para formato do select
      const patientOptions: PatientOption[] = result.data.map((patient: any) => ({
        id: patient.id,
        name: patient.name || patient.Paciente_Nome,
        codigo: patient.Codigo,
        cpf: patient.cpf || '',
        dataNascimento: patient.Data_Nascimento,
        idade: patient.age,
        sexo: patient.Sexo || patient.gender,
        cidDiagnostico: patient.Cid_Diagnostico || patient.diagnosis,
      }));
      
      setPatients(patientOptions);
    } catch (error) {
      console.error('Erro ao carregar pacientes:', error);
      toast.error('Erro ao carregar lista de pacientes');
    } finally {
      setLoadingPatients(false);
    }
  };

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientId(patientId);
    
    const selectedPatient = patients.find(p => p.id === patientId);
    if (selectedPatient) {
      // Preencher automaticamente os dados do paciente
      setFormData(prev => ({
        ...prev,
        cliente_nome: selectedPatient.name || prev.cliente_nome || '',
        cliente_codigo: selectedPatient.codigo || prev.cliente_codigo || '',
        sexo: selectedPatient.sexo === 'Masculino' ? 'M' : selectedPatient.sexo === 'Feminino' ? 'F' : (selectedPatient.sexo || prev.sexo || ''),
        data_nascimento: convertDateToInput(selectedPatient.dataNascimento || '') || prev.data_nascimento || '',
        idade: (selectedPatient.idade != null ? String(selectedPatient.idade) : (prev.idade || '')),
        diagnostico_cid: selectedPatient.cidDiagnostico || prev.diagnostico_cid || '',
      }));
      
      toast.success('Dados do paciente preenchidos automaticamente!');
    }
  };

  const convertDateToInput = (dateStr: string): string => {
    if (!dateStr) return '';
    
    // Se está no formato brasileiro (DD/MM/YYYY), converter para YYYY-MM-DD
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Se já está no formato ISO (YYYY-MM-DD), retorna como está
    if (dateStr.includes('-') && dateStr.length === 10) {
      return dateStr;
    }
    
    return '';
  };

  const loadSolicitacoes = async () => {
    if (!backendConnected) return;
    
    setLoading(true);
    try {
      const result = await SolicitacaoService.listarSolicitacoes({
        page: currentPage,
        limit: 10,
        clinica_id: 1 // Valor fixo para testes
      });
      
      setSolicitacoes(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error);
      toast.error('Erro ao carregar histórico de solicitações');
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular idade automaticamente
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Se mudou a data de nascimento, calcular idade automaticamente
    if (name === 'data_nascimento') {
      const age = calculateAge(value);
      setFormData({ 
        ...formData, 
        [name]: value,
        idade: age.toString()
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  // Função para validar campos obrigatórios e identificar qual está faltando
  const validateRequiredFields = () => {
    const missingFields: { field: string; label: string; elementId: string }[] = [];
    
    // Verificar cada campo obrigatório
    if (!formData.hospital_nome?.trim()) {
      missingFields.push({ 
        field: 'hospital_nome', 
        label: 'Hospital', 
        elementId: 'hospital_nome' 
      });
    }
    
    if (!formData.cliente_nome?.trim()) {
      missingFields.push({ 
        field: 'cliente_nome', 
        label: 'Cliente', 
        elementId: 'cliente_nome' 
      });
    }
    
    if (!formData.diagnostico_cid?.trim()) {
      missingFields.push({ 
        field: 'diagnostico_cid', 
        label: 'CID', 
        elementId: 'diagnostico_cid' 
      });
    }
    
    // Verificar medicamentos - precisa ter pelo menos um medicamento com nome preenchido
    const medicamentosValidos = medicamentosFields.filter(med => med.nome.trim() !== '');
    if (medicamentosValidos.length === 0) {
      missingFields.push({ 
        field: 'medicamentos', 
        label: 'Medicamentos', 
        elementId: 'medicamento-nome-0' 
      });
    }
    
    return missingFields;
  };

  // Função para fazer scroll até o campo com erro
  const scrollToField = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      // Adicionar destaque visual temporário
      element.classList.add('border-red-500', 'ring-2', 'ring-red-500/20');
      
      // Scroll suave até o elemento
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      
      // Focar no campo
      element.focus();
      
      // Remover destaque após 3 segundos
      setTimeout(() => {
        element.classList.remove('border-red-500', 'ring-2', 'ring-red-500/20');
      }, 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!backendConnected) {
      toast.error('Backend não conectado', {
        description: 'Não é possível enviar a solicitação sem conexão com o servidor'
      });
      return;
    }

    // Validações básicas
    if (!selectedPatientId) {
      toast.error('Paciente não selecionado', {
        description: 'Selecione um paciente cadastrado antes de criar a solicitação'
      });
      return;
    }
    
    // Validar campos obrigatórios e identificar quais estão faltando
    const missingFields = validateRequiredFields();
    
    // Debug: mostrar quais campos estão faltando
    console.log('🔍 Campos faltando:', missingFields);
    console.log('🔍 Estado do formData:', {
      hospital_nome: formData.hospital_nome,
      cliente_nome: formData.cliente_nome,
      diagnostico_cid: formData.diagnostico_cid,
      medicamentos: medicamentosFields.filter(med => med.nome.trim() !== '')
    });
    
    if (missingFields.length > 0) {
      const fieldLabels = missingFields.map(f => f.label).join(', ');
      toast.error('Campos obrigatórios não preenchidos', {
        description: `Preencha: ${fieldLabels}`
      });
      
      // Scroll para o primeiro campo faltando
      if (missingFields.length > 0) {
        scrollToField(missingFields[0].elementId);
      }
      
      return;
    }

    setSubmitting(true);
    try {
      // Converter dados do formulário para o formato da API
      const solicitacaoDataRaw = {
        clinica_id: clinicProfile?.clinica?.id ?? 1,
        paciente_id: selectedPatientId ? parseInt(selectedPatientId) : undefined,
        hospital_nome: formData.hospital_nome || '',
        hospital_codigo: formData.hospital_codigo || '',
        cliente_nome: formData.cliente_nome || '',
        cliente_codigo: formData.cliente_codigo || undefined,
        sexo: (formData.sexo as 'M' | 'F') || undefined,
        data_nascimento: formData.data_nascimento || undefined,
        idade: formData.idade ? parseInt(formData.idade) : undefined,
        data_solicitacao: formData.data_solicitacao || undefined,
        diagnostico_cid: formData.diagnostico_cid || '',
        diagnostico_descricao: formData.diagnostico_descricao || '',
        local_metastases: formData.local_metastases || '',
        estagio_t: formData.estagio_t || '',
        estagio_n: formData.estagio_n || '',
        estagio_m: formData.estagio_m || '',
        estagio_clinico: formData.estagio_clinico || '',
        tratamento_cirurgia_radio: formData.tratamento_cirurgia_radio || '',
        tratamento_quimio_adjuvante: formData.tratamento_quimio_adjuvante || '',
        tratamento_quimio_primeira_linha: formData.tratamento_quimio_primeira_linha || '',
        tratamento_quimio_segunda_linha: formData.tratamento_quimio_segunda_linha || '',
        finalidade: (formData.finalidade as 'neoadjuvante' | 'adjuvante' | 'curativo' | 'controle' | 'radioterapia' | 'paliativo') || 'curativo',
        performance_status: formData.performance_status || '',
        siglas: formData.siglas || '',
        ciclos_previstos: formData.ciclos_previstos ? parseInt(formData.ciclos_previstos) : undefined,
        ciclo_atual: formData.ciclo_atual ? parseInt(formData.ciclo_atual) : undefined,
        superficie_corporal: formData.superficie_corporal ? parseFloat(formData.superficie_corporal) : undefined,
        peso: formData.peso ? parseFloat(formData.peso) : undefined,
        altura: formData.altura ? parseFloat(formData.altura) : undefined,
        medicamentos_antineoplasticos: getMedicamentosString(),
        dose_por_m2: formData.dose_por_m2 || '',
        dose_total: formData.dose_total || '',
        via_administracao: formData.via_administracao || '',
        dias_aplicacao_intervalo: formData.dias_aplicacao_intervalo || '',
        medicacoes_associadas: formData.medicacoes_associadas || '',
        medico_assinatura_crm: formData.medico_assinatura_crm || '',
        numero_autorizacao: formData.numero_autorizacao || undefined,
      } as Record<string, any>;

      // Coagir campos numéricos quando vierem como string
      const numericFields = [
        'idade',
        'ciclos_previstos',
        'ciclo_atual',
        'superficie_corporal',
        'peso',
        'altura',
        'dose_por_m2',
        'dose_total',
        'via_administracao',
        'dias_aplicacao_intervalo'
      ];
      numericFields.forEach((key) => {
        const val = solicitacaoDataRaw[key as keyof typeof solicitacaoDataRaw];
        if (typeof val === 'string' && val.trim() !== '') {
          const num = Number(val);
          if (!Number.isNaN(num)) {
            solicitacaoDataRaw[key] = num;
          }
        }
      });

      // Sanitizar: remover undefined/null para evitar 500 no backend
      const solicitacaoData = Object.fromEntries(
        Object.entries(solicitacaoDataRaw).filter(([_, v]) => v !== undefined && v !== null)
      );

      // Log para debug
      console.log('🔧 Dados da solicitação sendo enviados:', {
        paciente_id: solicitacaoData.paciente_id,
        selectedPatientId,
        paciente_nome: solicitacaoData.cliente_nome
      });
      
      // Log completo dos dados para debug
      console.log('🔧 Dados completos da solicitação:', JSON.stringify(solicitacaoData, null, 2));

      // Verificar se o médico foi selecionado
      if (!formData.medico_assinatura_crm) {
        toast.error('Médico não selecionado', {
          description: 'Selecione um médico responsável antes de criar a solicitação'
        });
        return;
      }

      // Armazenar dados pendentes e abrir modal de autenticação
      setPendingSolicitacaoData(solicitacaoData);
      setIsDoctorAuthModalOpen(true);
      
      // A criação da solicitação será feita após a autenticação
      return;

      // Limpar formulário (mantendo dados da clínica)
      setFormData({
        hospital_nome: clinicProfile?.clinica?.nome || '',
        hospital_codigo: clinicProfile?.clinica?.codigo || '',
        cliente_nome: '',
        cliente_codigo: '',
        sexo: '',
        data_nascimento: '',
        idade: '',
        data_solicitacao: new Date().toISOString().split('T')[0],
        diagnostico_cid: '',
        diagnostico_descricao: '',
        local_metastases: '',
        estagio_t: '',
        estagio_n: '',
        estagio_m: '',
        estagio_clinico: '',
        tratamento_cirurgia_radio: '',
        tratamento_quimio_adjuvante: '',
        tratamento_quimio_primeira_linha: '',
        tratamento_quimio_segunda_linha: '',
        finalidade: '',
        performance_status: '',
        siglas: '',
        ciclos_previstos: '',
        ciclo_atual: '',
        superficie_corporal: '',
        peso: '',
        altura: '',
        medicamentos_antineoplasticos: '',
        dose_por_m2: '',
        dose_total: '',
        via_administracao: '',
        dias_aplicacao_intervalo: '',
        medicacoes_associadas: '',
        medico_assinatura_crm: clinicProfile?.responsaveis_tecnicos?.[0]?.crm || '',
        numero_autorizacao: '',
      });

      // Limpar seleção de paciente
      setSelectedPatientId('');

      // Recarregar lista
      await loadSolicitacoes();
      
    } catch (error) {
      console.error('Erro ao criar solicitação:', error);
      toast.error('Erro ao criar solicitação', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = async (id: number) => {
    try {
      toast.info('Gerando PDF...', {
        description: 'Aguarde enquanto o documento é preparado.'
      });
      
      await SolicitacaoService.downloadPDF(id, `solicitacao_autorizacao_${id}.pdf`);
      
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      toast.error('Erro ao gerar PDF', {
        description: 'Tente novamente em alguns instantes.'
      });
    }
  };

  // Adicione esta nova função para visualizar PDF:
  const handleViewPDF = (solicitacao: SolicitacaoFromAPI) => {
    if (!backendConnected) {
      toast.error('Backend não conectado', {
        description: 'Não é possível visualizar o PDF sem conexão com o servidor'
      });
      return;
    }

    console.log('🔧 Abrindo modal de visualização para solicitação:', solicitacao.id);
    
    // ✅ ABRE O MODAL IMEDIATAMENTE
    setSelectedSolicitacao(solicitacao);
    setIsPDFViewerOpen(true);
    
    // O PDF será carregado dentro do modal já aberto
  };

  // Função para lidar com sucesso na autenticação médica
  const handleDoctorAuthenticationSuccess = async (authData: any) => {
    try {
      setDoctorAuthData(authData);
      
      // Criar solicitação com dados de autenticação
      const solicitacaoDataWithAuth = {
        ...pendingSolicitacaoData,
        medico_assinatura_crm: authData.doctorCRM,
        medico_assinatura_nome: authData.doctorName,
        medico_assinatura_metodo: authData.method,
        medico_assinatura_timestamp: authData.timestamp,
        medico_assinatura_hash: authData.signatureHash,
        medico_assinatura_otp: authData.otpCode,
        medico_assinatura_aprovacao: authData.approvalCode,
        medico_assinatura_ip: authData.ipAddress,
        medico_assinatura_useragent: authData.userAgent,
      };

      console.log('🔧 Criando solicitação com autenticação médica:', solicitacaoDataWithAuth);

      const novaSolicitacao = await SolicitacaoService.criarSolicitacao(solicitacaoDataWithAuth);
      
      toast.success('Solicitação criada e autenticada com sucesso!', {
        description: `ID: ${novaSolicitacao.id}. Documento assinado pelo médico responsável.`,
        action: {
          label: 'Baixar PDF',
          onClick: () => handleDownloadPDF(novaSolicitacao.id!),
        },
      });

      // Limpar formulário (mantendo dados da clínica)
      setFormData({
        hospital_nome: clinicProfile?.clinica?.nome || '',
        hospital_codigo: clinicProfile?.clinica?.codigo || '',
        cliente_nome: '',
        cliente_codigo: '',
        sexo: '',
        data_nascimento: '',
        idade: '',
        data_solicitacao: new Date().toISOString().split('T')[0],
        diagnostico_cid: '',
        diagnostico_descricao: '',
        local_metastases: '',
        estagio_t: '',
        estagio_n: '',
        estagio_m: '',
        estagio_clinico: '',
        tratamento_cirurgia_radio: '',
        tratamento_quimio_adjuvante: '',
        tratamento_quimio_primeira_linha: '',
        tratamento_quimio_segunda_linha: '',
        finalidade: '',
        performance_status: '',
        siglas: '',
        ciclos_previstos: '',
        ciclo_atual: '',
        superficie_corporal: '',
        peso: '',
        altura: '',
        medicamentos_antineoplasticos: '',
        dose_por_m2: '',
        dose_total: '',
        via_administracao: '',
        dias_aplicacao_intervalo: '',
        medicacoes_associadas: '',
        medico_assinatura_crm: clinicProfile?.responsaveis_tecnicos?.[0]?.crm || '',
        numero_autorizacao: '',
      });

      // Limpar seleção de paciente
      setSelectedPatientId('');

      // Recarregar lista
      await loadSolicitacoes();
      
      // Fechar modal de autenticação
      setIsDoctorAuthModalOpen(false);
      setPendingSolicitacaoData(null);
      setDoctorAuthData(null);
      
    } catch (error) {
      console.error('Erro ao criar solicitação autenticada:', error);
      toast.error('Erro ao criar solicitação autenticada', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Função para cancelar autenticação médica
  const handleDoctorAuthenticationCancel = () => {
    setIsDoctorAuthModalOpen(false);
    setPendingSolicitacaoData(null);
    setDoctorAuthData(null);
    setSubmitting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovada':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejeitada':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'em_analise':
        return <AlertCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovada':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejeitada':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'em_analise':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  // Carregar protocolos
  const loadProtocolos = async () => {
    try {
      console.log('🔧 Carregando protocolos...');
      const result = await ProtocoloService.listarProtocolos({
        page: 1,
        limit: 1000,
        clinica_id: 1
      });
      
      console.log('📋 Protocolos carregados:', result.data);
      
      // Verificar se os medicamentos têm unidade_medida
      result.data.forEach((protocolo, index) => {
        console.log(`🔍 Protocolo ${index + 1}:`, {
          nome: protocolo.nome,
          medicamentos: protocolo.medicamentos?.map(med => ({
            nome: med.nome,
            dose: med.dose,
            unidade_medida: med.unidade_medida,
            via_adm: med.via_adm,
            dias_adm: med.dias_adm,
            frequencia: med.frequencia
          }))
        });
      });
      
      setProtocolos(result.data);
    } catch (error) {
      console.error('Erro ao carregar protocolos:', error);
      toast.error('Erro ao carregar protocolos');
    }
  };

  // Selecionar protocolo
  // Função para normalizar unidade de medida
  const normalizeUnidadeMedida = (unidade: string): string => {
    if (!unidade) return '';
    
    // Normalizar variações comuns
    const normalizations: Record<string, string> = {
      'mg/m²': 'mg/m2',
      'mg/m2': 'mg/m2'
    };
    
    return normalizations[unidade] || unidade;
  };

  const handleProtocoloSelect = (protocolo: ProtocoloFromAPI) => {
    console.log('🔍 Protocolo selecionado:', protocolo);
    console.log('📋 Medicamentos do protocolo:', protocolo.medicamentos);
    
    setSelectedProtocolo(protocolo);
    
    // Preencher campos automaticamente
    setFormData(prev => ({
      ...prev,
      siglas: protocolo.nome,
      ciclos_previstos: protocolo.ciclos_previstos?.toString() || '',
      diagnostico_cid: protocolo.cid || '',
      diagnostico_descricao: protocolo.descricao || ''
    }));

    // Preencher medicamentos
    if (protocolo.medicamentos && protocolo.medicamentos.length > 0) {
      const medicamentosConvertidos = protocolo.medicamentos.map((med, index) => {
        console.log(`💊 Medicamento ${index + 1}:`, {
          nome: med.nome,
          dose: med.dose,
          unidade_medida: med.unidade_medida,
          via_adm: med.via_adm,
          dias_adm: med.dias_adm,
          frequencia: med.frequencia,
          observacoes: med.observacoes
        });
        
        const unidadeNormalizada = normalizeUnidadeMedida(med.unidade_medida || '');
        console.log(`🔄 Normalizando unidade: "${med.unidade_medida}" -> "${unidadeNormalizada}"`);
        
        return {
          id: (index + 1).toString(),
          nome: med.nome || '',
          dose: med.dose || '',
          unidade_medida: unidadeNormalizada,
          via_adm: med.via_adm || '',
          dias_adm: med.dias_adm || '',
          frequencia: med.frequencia || '',
          observacoes: med.observacoes || ''
        };
      });
      
      console.log('✅ Medicamentos convertidos:', medicamentosConvertidos);
      setMedicamentosFields(medicamentosConvertidos);
      
      // Debug adicional: verificar se as unidades estão sendo preenchidas
      medicamentosConvertidos.forEach((med, index) => {
        if (!med.unidade_medida) {
          console.warn(`⚠️ Medicamento ${index + 1} (${med.nome}) não tem unidade_medida preenchida`);
        } else {
          console.log(`✅ Medicamento ${index + 1} (${med.nome}) tem unidade_medida: ${med.unidade_medida}`);
        }
      });
    } else {
      console.log('⚠️ Nenhum medicamento encontrado no protocolo');
    }

    setShowProtocoloModal(false);
    toast.success(`Protocolo "${protocolo.nome}" selecionado!`);
  };

  // Adicionar campo de medicamento
  const addMedicamentoField = () => {
    const newId = (medicamentosFields.length + 1).toString();
    setMedicamentosFields(prev => [...prev, {
      id: newId,
      nome: '',
      dose: '',
      unidade_medida: '',
      via_adm: '',
      dias_adm: '',
      frequencia: '',
      observacoes: ''
    }]);
  };

  // Remover campo de medicamento
  const removeMedicamentoField = (index: number) => {
    if (medicamentosFields.length > 1) {
      setMedicamentosFields(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Atualizar campo de medicamento
  const updateMedicamentoField = (index: number, field: string, value: string) => {
    setMedicamentosFields(prev => prev.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    ));
  };

  // Converter medicamentos para string
  const getMedicamentosString = () => {
    const principios = principiosSelected.join(', ');
    const detalhes = medicamentosFields
      .filter(med => med.nome.trim() !== '' || med.dose || med.unidade_medida || med.via_adm || med.dias_adm || med.frequencia)
      .map(med => [med.nome, `${med.dose}${med.unidade_medida}`.trim(), med.via_adm, med.dias_adm, med.frequencia].filter(Boolean).join(' '))
      .filter(Boolean)
      .join('; ');
    if (principios && detalhes) return `${principios}; ${detalhes}`;
    if (principios) return principios;
    return detalhes;
  };

  useEffect(() => {
    let active = true;
    (async () => {
      setCidLoading(true);
      const { items, total } = await CatalogService.searchCid10Paged({ search: cidSearch, limit: cidLimit, offset: 0 });
      if (!active) return;
      setCidOptions(items);
      setCidTotal(total);
      setCidOffset(items.length);
      setCidLoading(false);
    })();
    return () => { active = false; };
  }, [cidSearch, cidLimit]);

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

  const handleLoadMoreCid = async () => {
    if (cidLoading || cidOptions.length >= cidTotal) return;
    setCidLoading(true);
    const { items } = await CatalogService.searchCid10Paged({ search: cidSearch, limit: cidLimit, offset: cidOffset });
    setCidOptions(prev => [...prev, ...items]);
    setCidOffset(prev => prev + items.length);
    setCidLoading(false);
  };

  const handleLoadMorePrincipios = async () => {
    if (principiosLoading || principiosOptions.length >= principiosTotal) return;
    setPrincipiosLoading(true);
    const { items } = await CatalogService.searchPrincipiosAtivosPaged({ search: principiosSearch, limit: principiosLimit, offset: principiosOffset });
    setPrincipiosOptions(prev => [...prev, ...items]);
    setPrincipiosOffset(prev => prev + items.length);
    setPrincipiosLoading(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Solicitação de Autorização
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                Gerencie solicitações de autorização e acompanhe o status dos tratamentos
              </p>
            </div>
            <div className="flex items-center gap-3">
              {!backendConnected && (
                <Badge variant="destructive" className="animate-pulse">
                  Backend Desconectado
                </Badge>
              )}
              {!clinicProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWithTransition('/profile')}
                  className="text-orange-600 border-orange-600 hover:bg-orange-50"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Configurar Clínica
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full">
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center">
                <PencilIcon className="h-5 w-5 mr-2 text-primary" />
                Autorização/Processamento de Tratamento Oncológico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* ===== INDICADOR DE CARREGAMENTO ===== */}
                {loadingClinic && (
                  <div className="mb-6">
                    <div className="flex items-center justify-center bg-muted/30 border border-border rounded-lg px-4 py-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                        <span className="text-sm text-foreground">
                          Carregando informações da clínica...
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== SEÇÃO MELHORADA: INFORMAÇÕES BÁSICAS ===== */}
                
                {/* ===== INFORMAÇÕES DA CLÍNICA - APENAS SE NÃO CONFIGURADA ===== */}
                {!clinicProfile && !loadingClinic && (
                  <div className="mb-8">
                    <Card className="border-l-4 border-l-primary/50 bg-gradient-to-r from-primary/5 to-transparent">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center text-primary">
                          <Building2 className="h-5 w-5 mr-3" />
                          Informações da Clínica
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="hospital_nome" className="flex items-center gap-2">
                              <span>Nome do Hospital *</span>
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="hospital_nome"
                              name="hospital_nome"
                              value={formData.hospital_nome}
                              onChange={handleChange}
                              className="lco-input"
                              required
                              placeholder="Digite o nome do hospital"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="hospital_codigo">Código do Hospital</Label>
                            <Input
                              id="hospital_codigo"
                              name="hospital_codigo"
                              value={formData.hospital_codigo}
                              onChange={handleChange}
                              className="lco-input"
                              placeholder="Código do hospital"
                            />
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg p-4 text-center">
                          <Building2 className="h-8 w-8 text-primary mx-auto mb-2" />
                          <p className="text-primary text-sm mb-3">
                            Configure as informações da clínica para preenchimento automático
                          </p>
                          <Button
                            type="button"
                            onClick={() => navigateWithTransition('/profile')}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
                          >
                            <Building2 className="h-4 w-4 mr-2" />
                            Configurar Clínica
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* ===== INFORMAÇÃO SUTIL DA CLÍNICA - SE JÁ CONFIGURADA ===== */}
                {clinicProfile && !loadingClinic && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        {clinicProfile.clinica?.logo_url && (
                          <img 
                            src={clinicProfile.clinica.logo_url} 
                            alt="Logo" 
                            className="w-8 h-8 object-contain rounded border" 
                          />
                        )}
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800 dark:text-green-300">
                            {clinicProfile.clinica?.nome || 'Clínica Configurada'}
                          </span>
                          <span className="text-xs text-green-600 dark:text-green-400">
                            • {clinicProfile.clinica?.codigo}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate('/profile')}
                          className="text-green-700 hover:bg-green-100 dark:hover:bg-green-900/50 h-8 px-3"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={loadClinicProfile}
                          disabled={loadingClinic}
                          className="text-green-700 hover:bg-green-100 dark:hover:bg-green-900/50 h-8 px-2"
                        >
                          {loadingClinic ? (
                            <div className="w-3 h-3 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
                          ) : (
                            'Atualizar'
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className={clinicProfile ? "grid grid-cols-1 gap-8" : "grid grid-cols-1 xl:grid-cols-2 gap-8"}>
                  {/* ===== MANTÉM O ESPAÇO APENAS SE NÃO TIVER CLÍNICA CONFIGURADA ===== */}
                  {!clinicProfile && <div></div>}

                  {/* ===== INFORMAÇÕES DO PACIENTE ===== */}
                  <div className="space-y-6">
                    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg flex items-center text-foreground">
                          <Users className="h-5 w-5 mr-3 text-primary" />
                          Informações do Paciente
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Seleção de Paciente */}
                        <div className="border border-border rounded-lg p-4 bg-muted/10">
                          <Label htmlFor="patient-select" className="text-foreground font-medium mb-3 block">
                            Selecionar Paciente Cadastrado
                          </Label>
                          <div className="flex gap-3">
                            <Select 
                              value={selectedPatientId} 
                              onValueChange={handlePatientSelect}
                              disabled={loadingPatients || !backendConnected}
                            >
                              <SelectTrigger className="flex-1 border-border focus:border-primary">
                                <SelectValue placeholder={
                                  loadingPatients ? "Carregando pacientes..." : 
                                  !backendConnected ? "Backend desconectado" :
                                  "Selecione um paciente cadastrado"
                                }>
                                  {selectedPatientId && patients.find(p => p.id === selectedPatientId)?.name}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-3">
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3 pb-2 border-b">
                                    <Search className="h-4 w-4" />
                                    <span className="font-medium">{patients.length} paciente(s) encontrado(s)</span>
                                  </div>
                                  {patients.map((patient) => (
                                    <SelectItem key={patient.id} value={patient.id} className="py-3 px-3">
                                      <div className="flex flex-col items-start w-full space-y-1">
                                        <span className="font-medium leading-tight">{patient.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {patient.codigo} • {patient.sexo} • {patient.idade} anos
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </div>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => navigateWithTransition('/patients')}
                              className="text-primary border-primary hover:bg-primary/10"
                              title="Cadastrar novo paciente"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Não encontrou o paciente? Clique no botão + para cadastrar um novo
                          </p>
                          
                          {/* Indicador de paciente selecionado */}
                          {selectedPatientId && (
                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-300">
                                  Paciente selecionado:
                                </span>
                              </div>
                              <div className="mt-1 text-sm text-green-700 dark:text-green-400">
                                <strong>{patients.find(p => p.id === selectedPatientId)?.name}</strong>
                                <span className="ml-2">
                                  (ID: {selectedPatientId})
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Campos do Paciente */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="cliente_nome" className="flex items-center gap-2">
                              <span>Nome do Cliente</span>
                              <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="cliente_nome"
                              name="cliente_nome"
                              value={formData.cliente_nome}
                              onChange={handleChange}
                              className="lco-input"
                              required
                              placeholder={selectedPatientId ? "Preenchido automaticamente" : "Digite o nome do cliente"}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="cliente_codigo">Código do Cliente</Label>
                              <Input
                                id="cliente_codigo"
                                name="cliente_codigo"
                                value={formData.cliente_codigo}
                                onChange={handleChange}
                                className="lco-input"
                                placeholder={selectedPatientId ? "Preenchido" : "Código"}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sexo" className="flex items-center gap-2">
                                <span>Sexo</span>
                                <span className="text-red-500">*</span>
                              </Label>
                              <Select 
                                onValueChange={handleSelectChange("sexo")} 
                                value={formData.sexo}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="M">Masculino</SelectItem>
                                  <SelectItem value="F">Feminino</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="data_nascimento" className="flex items-center gap-2">
                                <span>Data de Nascimento</span>
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="data_nascimento"
                                name="data_nascimento"
                                type="date"
                                value={formData.data_nascimento}
                                onChange={handleChange}
                                className="lco-input"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="idade">Idade (calculada automaticamente)</Label>
                              <Input
                                id="idade"
                                name="idade"
                                type="number"
                                value={formData.idade}
                                onChange={handleChange}
                                className="lco-input bg-muted/50"
                                readOnly
                                placeholder="Idade automática"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="data_solicitacao">Data da Solicitação</Label>
                            <Input
                              id="data_solicitacao"
                              name="data_solicitacao"
                              type="date"
                              value={formData.data_solicitacao}
                              onChange={handleChange}
                              className="lco-input"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* ===== SEÇÃO: DIAGNÓSTICO E ESTADIAMENTO ===== */}
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center text-foreground">
                      <Stethoscope className="h-5 w-5 mr-3 text-primary" />
                      Diagnóstico e Estadiamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="diagnostico_cid">CID-10 *</Label>
                      <CIDSelection
                        value={formData.diagnostico_cid || ''}
                        onChange={(arr) => setFormData(prev => ({ ...prev, diagnostico_cid: arr?.[0]?.codigo || '' }))}
                        multiple={false}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diagnostico_descricao">Diagnóstico</Label>
                      <Input
                        id="diagnostico_descricao"
                        name="diagnostico_descricao"
                        value={formData.diagnostico_descricao}
                        onChange={handleChange}
                        className="lco-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="local_metastases">Local das metástases</Label>
                    <Input
                      id="local_metastases"
                      name="local_metastases"
                      value={formData.local_metastases}
                      onChange={handleChange}
                      className="lco-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="estagio_t">T</Label>
                      <Input
                        id="estagio_t"
                        name="estagio_t"
                        value={formData.estagio_t}
                        onChange={handleChange}
                        className="lco-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estagio_n">N</Label>
                      <Input
                        id="estagio_n"
                        name="estagio_n"
                        value={formData.estagio_n}
                        onChange={handleChange}
                        className="lco-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estagio_m">M</Label>
                      <Input
                        id="estagio_m"
                        name="estagio_m"
                        value={formData.estagio_m}
                        onChange={handleChange}
                        className="lco-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estagio_clinico">Estágio Clínico</Label>
                      <Input
                        id="estagio_clinico"
                        name="estagio_clinico"
                        value={formData.estagio_clinico}
                        onChange={handleChange}
                        className="lco-input"
                      />
                    </div>
                  </div>
                  </CardContent>
                </Card>

                {/* ===== SEÇÃO: TRATAMENTOS REALIZADOS ANTERIORMENTE ===== */}
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center text-foreground">
                      <Clock className="h-5 w-5 mr-3 text-primary" />
                    Tratamentos Realizados Anteriormente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tratamento_cirurgia_radio">Cirurgia ou Radioterapia</Label>
                      <Textarea
                        id="tratamento_cirurgia_radio"
                        name="tratamento_cirurgia_radio"
                        value={formData.tratamento_cirurgia_radio}
                        onChange={handleChange}
                        className="lco-input h-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tratamento_quimio_adjuvante">Quimioterapia Adjuvante</Label>
                      <Textarea
                        id="tratamento_quimio_adjuvante"
                        name="tratamento_quimio_adjuvante"
                        value={formData.tratamento_quimio_adjuvante}
                        onChange={handleChange}
                        className="lco-input h-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tratamento_quimio_primeira_linha">Quimioterapia 1ª linha</Label>
                      <Textarea
                        id="tratamento_quimio_primeira_linha"
                        name="tratamento_quimio_primeira_linha"
                        value={formData.tratamento_quimio_primeira_linha}
                        onChange={handleChange}
                        className="lco-input h-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tratamento_quimio_segunda_linha">Quimioterapia 2ª linha ou mais</Label>
                      <Textarea
                        id="tratamento_quimio_segunda_linha"
                        name="tratamento_quimio_segunda_linha"
                        value={formData.tratamento_quimio_segunda_linha}
                        onChange={handleChange}
                        className="lco-input h-20"
                      />
                    </div>
                  </div>
                  </CardContent>
                </Card>

                {/* ===== SEÇÃO: ESQUEMA TERAPÊUTICO ===== */}
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center text-foreground">
                      <BookOpen className="h-5 w-5 mr-3 text-primary" />
                      Esquema Terapêutico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="finalidade">Finalidade *</Label>
                      <Select 
                        onValueChange={handleSelectChange("finalidade")} 
                        value={formData.finalidade}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="neoadjuvante">Prévio (neoadjuvante)</SelectItem>
                          <SelectItem value="adjuvante">Adjuvante</SelectItem>
                          <SelectItem value="curativo">Curativo</SelectItem>
                          <SelectItem value="controle">De Controle</SelectItem>
                          <SelectItem value="radioterapia">Associado à Radioterapia</SelectItem>
                          <SelectItem value="paliativo">Paliativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="performance_status">Performance status atual *</Label>
                      <Input
                        id="performance_status"
                        name="performance_status"
                        value={formData.performance_status}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="siglas">Siglas</Label>
                        <div className="flex gap-2">
                      <Input
                        id="siglas"
                        name="siglas"
                        value={formData.siglas}
                        onChange={handleChange}
                            className="lco-input flex-1"
                            placeholder="Digite as siglas ou selecione um protocolo"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowProtocoloModal(true)}
                            className="flex items-center gap-1"
                          >
                            <BookOpen className="h-4 w-4" />
                            Protocolos
                          </Button>
                        </div>
                        {selectedProtocolo && (
                          <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Protocolo selecionado: {selectedProtocolo.nome}
                          </div>
                        )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ciclos_previstos">Números de Ciclos Previstos *</Label>
                      <Input
                        id="ciclos_previstos"
                        name="ciclos_previstos"
                        type="number"
                        value={formData.ciclos_previstos}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ciclo_atual">Número de ciclos Atual *</Label>
                      <Input
                        id="ciclo_atual"
                        name="ciclo_atual"
                        type="number"
                        value={formData.ciclo_atual}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="superficie_corporal">Superfície Corporal (m²) *</Label>
                      <Input
                        id="superficie_corporal"
                        name="superficie_corporal"
                        type="number"
                        step="0.01"
                        value={formData.superficie_corporal}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="peso">Peso (kg) *</Label>
                      <Input
                        id="peso"
                        name="peso"
                        type="number"
                        step="0.1"
                        value={formData.peso}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="altura">Altura (cm) *</Label>
                      <Input
                        id="altura"
                        name="altura"
                        type="number"
                        value={formData.altura}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                  </div>
                  
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Medicamentos Antineoplásticos *</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addMedicamentoField}
                          className="flex items-center gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Adicionar Medicamento
                        </Button>
                      </div>
                      
                      {medicamentosFields.length > 0 && (
                        <div className="space-y-4">
                          {/* Navegação dos Medicamentos */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">
                                Medicamento {activeMedicamentoIndex + 1} de {medicamentosFields.length}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const prevIndex = activeMedicamentoIndex > 0 ? activeMedicamentoIndex - 1 : medicamentosFields.length - 1;
                                  setActiveMedicamentoIndex(prevIndex);
                                }}
                                disabled={medicamentosFields.length <= 1}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const nextIndex = activeMedicamentoIndex < medicamentosFields.length - 1 ? activeMedicamentoIndex + 1 : 0;
                                  setActiveMedicamentoIndex(nextIndex);
                                }}
                                disabled={medicamentosFields.length <= 1}
                                className="h-8 w-8 p-0"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Tabs dos Medicamentos */}
                          <div className="border rounded-lg">
                            <div className="flex items-center border-b bg-muted/30">
                              {medicamentosFields.map((med, index) => (
                                <button
                                  key={med.id}
                                  type="button"
                                  onClick={() => setActiveMedicamentoIndex(index)}
                                  className={`flex-1 px-3 py-2 text-sm font-medium border-r last:border-r-0 transition-colors ${
                                    activeMedicamentoIndex === index 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'hover:bg-muted/50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>Med {index + 1}</span>
                                    {medicamentosFields.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeMedicamentoField(index);
                                          if (activeMedicamentoIndex >= medicamentosFields.length - 1) {
                                            setActiveMedicamentoIndex(Math.max(0, medicamentosFields.length - 2));
                                          }
                                        }}
                                        className="h-5 w-5 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                            
                            <div className="p-4">
                              {medicamentosFields.map((medicamento, index) => (
                                <div 
                                  key={medicamento.id} 
                                  className={`space-y-4 ${activeMedicamentoIndex === index ? 'block' : 'hidden'}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-lg">Medicamento {index + 1}</h4>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-muted-foreground">
                                        {index + 1} de {medicamentosFields.length}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                      <Label>Nome do Medicamento *</Label>
                                      <Input
                                        id={`medicamento-nome-${index}`}
                                        value={medicamento.nome}
                                        onChange={(e) => updateMedicamentoField(index, 'nome', e.target.value)}
                                        placeholder="Ex: Oxaliplatina"
                                        className="mt-1"
                    />
                  </div>
                  
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <Label>Dose</Label>
                                        <Input
                                          value={medicamento.dose}
                                          onChange={(e) => updateMedicamentoField(index, 'dose', e.target.value)}
                                          placeholder="Ex: 85"
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label>Unidade</Label>
                                        <Select 
                                          value={medicamento.unidade_medida} 
                                          onValueChange={(value) => updateMedicamentoField(index, 'unidade_medida', value)}
                                        >
                                          <SelectTrigger className="mt-1">
                                            <SelectValue placeholder="Unidade" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="mg">mg</SelectItem>
                                            <SelectItem value="mg/m²">mg/m²</SelectItem>
                                            <SelectItem value="mg/m2">mg/m²</SelectItem>
                                            <SelectItem value="mg/kg">mg/kg</SelectItem>
                                            <SelectItem value="AUC">AUC</SelectItem>
                                            <SelectItem value="UI">UI</SelectItem>
                                            <SelectItem value="mcg">mcg</SelectItem>
                                            <SelectItem value="ml">ml</SelectItem>
                                            <SelectItem value="g">g</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <Label>Via de Administração</Label>
                                      <Select 
                                        value={medicamento.via_adm} 
                                        onValueChange={(value) => updateMedicamentoField(index, 'via_adm', value)}
                                      >
                                        <SelectTrigger className="mt-1">
                                          <SelectValue placeholder="Via" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="EV">Endovenosa</SelectItem>
                                          <SelectItem value="VO">Via Oral</SelectItem>
                                          <SelectItem value="SC">Subcutânea</SelectItem>
                                          <SelectItem value="IM">Intramuscular</SelectItem>
                                          <SelectItem value="IT">Intratecal</SelectItem>
                                          <SelectItem value="IP">Intraperitoneal</SelectItem>
                                          <SelectItem value="TOP">Tópica</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div>
                                      <Label>Dias de Administração</Label>
                                      <Input
                                        value={medicamento.dias_adm}
                                        onChange={(e) => updateMedicamentoField(index, 'dias_adm', e.target.value)}
                                        placeholder="Ex: 1,2"
                                        className="mt-1"
                                      />
                                    </div>
                                    
                                    <div>
                                      <Label>Frequência</Label>
                                      <Select 
                                        value={medicamento.frequencia} 
                                        onValueChange={(value) => updateMedicamentoField(index, 'frequencia', value)}
                                      >
                                        <SelectTrigger className="mt-1">
                                          <SelectValue placeholder="Frequência" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="1x">1x ao dia</SelectItem>
                                          <SelectItem value="2x">2x ao dia</SelectItem>
                                          <SelectItem value="3x">3x ao dia</SelectItem>
                                          <SelectItem value="4x">4x ao dia</SelectItem>
                                          <SelectItem value="5x">5x ao dia</SelectItem>
                                          <SelectItem value="SOS">Se necessário</SelectItem>
                                          <SelectItem value="único">Dose única</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div className="md:col-span-2 lg:col-span-1">
                                      <Label>Observações</Label>
                                      <Input
                                        value={medicamento.observacoes}
                                        onChange={(e) => updateMedicamentoField(index, 'observacoes', e.target.value)}
                                        placeholder="Observações adicionais..."
                                        className="mt-1"
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Navegação entre medicamentos */}
                                  {medicamentosFields.length > 1 && (
                                    <div className="flex items-center justify-between pt-4 border-t">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const prevIndex = index > 0 ? index - 1 : medicamentosFields.length - 1;
                                          setActiveMedicamentoIndex(prevIndex);
                                        }}
                                        className="flex items-center gap-1"
                                      >
                                        <ChevronLeft className="h-4 w-4" />
                                        Anterior
                                      </Button>
                                      
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">
                                          {index + 1} de {medicamentosFields.length}
                                        </span>
                                      </div>
                                      
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const nextIndex = index < medicamentosFields.length - 1 ? index + 1 : 0;
                                          setActiveMedicamentoIndex(nextIndex);
                                        }}
                                        className="flex items-center gap-1"
                                      >
                                        Próximo
                                        <ChevronRight className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dose_por_m2">Dose por m² *</Label>
                      <Input
                        id="dose_por_m2"
                        name="dose_por_m2"
                        value={formData.dose_por_m2}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dose_total">Dose Total *</Label>
                      <Input
                        id="dose_total"
                        name="dose_total"
                        value={formData.dose_total}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="via_administracao">Via de Administração *</Label>
                      <Input
                        id="via_administracao"
                        name="via_administracao"
                        value={formData.via_administracao}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dias_aplicacao_intervalo">Dias de Aplicação e intervalo *</Label>
                    <Input
                      id="dias_aplicacao_intervalo"
                      name="dias_aplicacao_intervalo"
                      value={formData.dias_aplicacao_intervalo}
                      onChange={handleChange}
                      className="lco-input"
                      required
                    />
                  </div>
                  </CardContent>
                </Card>

                {/* ===== SEÇÃO: MEDICAÇÕES ASSOCIADAS ===== */}
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center text-foreground">
                      <Stethoscope className="h-5 w-5 mr-3 text-primary" />
                      Medicações Associadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      id="medicacoes_associadas"
                      name="medicacoes_associadas"
                      value={formData.medicacoes_associadas}
                      onChange={handleChange}
                      className="lco-input min-h-[100px]"
                      placeholder="Descreva as medicações associadas..."
                    />
                  </div>
                  </CardContent>
                </Card>
                
                {/* ===== SEÇÃO MELHORADA: MÉDICO SOLICITANTE ===== */}
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-foreground">
                      Médico Solicitante
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Coluna 1: Seleção do Médico */}
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Label htmlFor="medico_assinatura_crm" className="flex items-center gap-2 text-base font-medium">
                            <span>Médico Responsável</span>
                            <span className="text-red-500">*</span>
                          </Label>
                        </div>
                        
                        {useCustomCRM ? (
                          // Input customizado para CRM
                          <div className="space-y-3">
                            <Input
                              id="medico_assinatura_crm"
                              name="medico_assinatura_crm"
                              value={formData.medico_assinatura_crm}
                              onChange={handleChange}
                              className="lco-input"
                              placeholder="Digite o CRM do médico (ex: CRM 123456/SP)"
                              required
                            />
                            <p className="text-xs text-muted-foreground">
                              Digite o CRM completo do médico responsável
                            </p>
                            
                            {/* Botão de alternância - Abaixo do campo */}
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => setUseCustomCRM(!useCustomCRM)}
                                className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors duration-200 font-medium"
                              >
                                Usar lista de médicos cadastrados
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Select com responsáveis técnicos - MELHORADO
                          <div className="space-y-3">
                            <Select
                              value={formData.medico_assinatura_crm}
                              onValueChange={(value) => setFormData(prev => ({ ...prev, medico_assinatura_crm: value }))}
                            >
                              <SelectTrigger className="lco-input">
                                <SelectValue placeholder="Selecione o médico solicitante">
                                  {formData.medico_assinatura_crm && clinicProfile?.responsaveis_tecnicos?.find(r => r.crm === formData.medico_assinatura_crm)?.nome}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <div className="p-4">
                                  {clinicProfile?.responsaveis_tecnicos?.length > 0 ? (
                                    <>
                                      <div className="text-xs text-muted-foreground mb-4 px-3 py-2 bg-muted/50 rounded-md">
                                        {clinicProfile.responsaveis_tecnicos.length} médico(s) cadastrado(s):
                                      </div>
                                      {clinicProfile.responsaveis_tecnicos.map((responsavel) => (
                                        <SelectItem key={responsavel.id || responsavel.crm} value={responsavel.crm} className="py-3 px-3">
                                          <div className="flex flex-col items-start w-full space-y-2">
                                            <span className="font-medium text-sm leading-tight">{responsavel.nome}</span>
                                            <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                              <span className="font-medium">CRM: {responsavel.crm}</span>
                                              {responsavel.especialidade && (
                                                <span className="text-xs text-muted-foreground">
                                                  Especialidade: {responsavel.especialidade}
                                                </span>
                                              )}
                                              {responsavel.telefone && (
                                                <span className="text-xs text-muted-foreground">
                                                  Telefone: {responsavel.telefone}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </>
                                  ) : (
                                    <div className="px-3 py-6 text-sm text-muted-foreground text-center">
                                      <AlertCircle className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                                      <p className="font-medium mb-2">Nenhum médico cadastrado</p>
                                      <p className="text-xs mb-3">
                                        Cadastre os responsáveis técnicos no perfil da clínica para seleção automática
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => navigateWithTransition('/profile')}
                                        className="text-primary hover:text-primary/80 underline text-xs font-medium"
                                      >
                                        Cadastrar médicos responsáveis
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </SelectContent>
                            </Select>
                            
                            {/* Informações do médico selecionado - ABAIXO DO CAMPO */}
                            {formData.medico_assinatura_crm && clinicProfile?.responsaveis_tecnicos && (
                              <div className="space-y-3">
                                <Label className="text-base font-medium text-foreground">
                                  Médico Selecionado
                                </Label>
                                <div className="p-3 bg-muted/30 rounded-lg border">
                                  {(() => {
                                    const medicoSelecionado = clinicProfile.responsaveis_tecnicos.find(r => r.crm === formData.medico_assinatura_crm);
                                    return medicoSelecionado ? (
                                      <div className="space-y-1 text-xs text-muted-foreground">
                                        <p><span className="font-medium">Nome:</span> {medicoSelecionado.nome}</p>
                                        <p><span className="font-medium">CRM:</span> {medicoSelecionado.crm}</p>
                                        {medicoSelecionado.especialidade && (
                                          <p><span className="font-medium">Especialidade:</span> {medicoSelecionado.especialidade}</p>
                                        )}
                                        {medicoSelecionado.telefone && (
                                          <p><span className="font-medium">Telefone:</span> {medicoSelecionado.telefone}</p>
                                        )}
                                      </div>
                                    ) : null;
                                  })()}
                                </div>
                              </div>
                            )}
                            
                            <p className="text-xs text-muted-foreground">
                              {clinicProfile?.responsaveis_tecnicos?.length > 0 
                                ? `${clinicProfile.responsaveis_tecnicos.length} médico(s) disponível(is) para seleção`
                                : 'Nenhum médico cadastrado. Configure no perfil da clínica.'
                              }
                            </p>
                            
                            {/* Botão de alternância - Abaixo do campo */}
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => setUseCustomCRM(!useCustomCRM)}
                                className="text-sm text-primary hover:text-primary/80 underline underline-offset-2 transition-colors duration-200 font-medium"
                              >
                                Digitar CRM personalizado
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Coluna 2: Número da Autorização */}
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Label htmlFor="numero_autorizacao" className="text-base font-medium">
                            Número da Autorização
                          </Label>
                          <Input
                            id="numero_autorizacao"
                            name="numero_autorizacao"
                            value={formData.numero_autorizacao}
                            onChange={handleChange}
                            className="lco-input"
                            placeholder="Preenchido após aprovação"
                          />
                          <p className="text-xs text-muted-foreground">
                            Este campo será preenchido automaticamente após a aprovação
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="px-6"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
                    disabled={submitting || !backendConnected}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Criando Solicitação...
                      </>
                    ) : (
                      <>
                        <SendIcon className="mr-2 h-4 w-4" />
                        Gerar Solicitação de Autorização
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

      {/* Modal de Seleção de Protocolos */}
      <Dialog open={showProtocoloModal} onOpenChange={setShowProtocoloModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Selecionar Protocolo
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Selecione um protocolo para preencher automaticamente os campos da solicitação.
            </div>
            
            {protocolos.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhum protocolo encontrado.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Crie protocolos na seção de Protocolos para usá-los aqui.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {protocolos.map((protocolo) => (
                  <Card 
                    key={protocolo.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleProtocoloSelect(protocolo)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-lg">{protocolo.nome}</h4>
                            <Badge variant={protocolo.status === 'ativo' ? 'default' : 'secondary'}>
                              {protocolo.status}
                            </Badge>
                          </div>
                          
                          {protocolo.descricao && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {protocolo.descricao}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {protocolo.cid && (
                              <div>
                                <span className="font-medium">CID:</span> {protocolo.cid}
                              </div>
                            )}
                            {protocolo.ciclos_previstos && (
                              <div>
                                <span className="font-medium">Ciclos:</span> {protocolo.ciclos_previstos}
                              </div>
                            )}
                            {protocolo.intervalo_ciclos && (
                              <div>
                                <span className="font-medium">Intervalo:</span> {protocolo.intervalo_ciclos} dias
                              </div>
                            )}
                            {protocolo.linha && (
                              <div>
                                <span className="font-medium">Linha:</span> {protocolo.linha}ª
                              </div>
                            )}
                          </div>
                          
                          {protocolo.medicamentos && protocolo.medicamentos.length > 0 && (
                            <div className="mt-3">
                              <p className="text-sm font-medium mb-1">Medicamentos ({protocolo.medicamentos.length}):</p>
                              <div className="flex flex-wrap gap-1">
                                {protocolo.medicamentos.slice(0, 3).map((med, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {med.nome}
                                  </Badge>
                                ))}
                                {protocolo.medicamentos.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{protocolo.medicamentos.length - 3} mais
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right text-xs text-muted-foreground">
                          <div>ID: {protocolo.id}</div>
                          {protocolo.created_at && (
                            <div>Criado em: {new Date(protocolo.created_at).toLocaleDateString()}</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProtocoloModal(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Visualização de PDF */}
      {selectedSolicitacao && (
        <PDFViewerModal
          isOpen={isPDFModalOpen}
          onClose={() => setIsPDFModalOpen(false)}
          solicitacao={selectedSolicitacao}
        />
      )}

      {/* Modal de Autenticação Médica */}
      {pendingSolicitacaoData && (
        <DoctorAuthModal
          isOpen={isDoctorAuthModalOpen}
          onClose={handleDoctorAuthenticationCancel}
          doctorCRM={formData.medico_assinatura_crm}
          doctorName={clinicProfile?.responsaveis_tecnicos?.find(r => r.crm === formData.medico_assinatura_crm)?.nome || 'Médico'}
          onAuthenticationSuccess={handleDoctorAuthenticationSuccess}
          solicitacaoData={pendingSolicitacaoData}
        />
      )}
    </div>
  );
};

export default Reports;