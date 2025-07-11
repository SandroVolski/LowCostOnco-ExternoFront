import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Stethoscope
} from 'lucide-react';
import { toast } from 'sonner';
import { SolicitacaoService, SolicitacaoFromAPI, testarConexaoBackend, PacienteService } from '@/services/api';
import { ClinicService } from '@/services/clinicService';
import { usePageNavigation } from '@/components/transitions/PageTransitionContext';
import PDFViewerModal from '@/components/PDFViewerModal';

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
  const { navigateWithTransition } = usePageNavigation();
  
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

  // Estados para pacientes e clínica
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [clinicProfile, setClinicProfile] = useState<any>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingClinic, setLoadingClinic] = useState(false);
  const [useCustomCRM, setUseCustomCRM] = useState(false);

  // Estados para o histórico
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoFromAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Estados para visualização de PDF
  const [selectedSolicitacao, setSelectedSolicitacao] = useState<SolicitacaoFromAPI | null>(null);
  const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);

  // Verificar conexão com backend ao carregar
  useEffect(() => {
    checkBackendConnection();
    loadClinicProfile();
  }, []);

  // Carregar solicitações quando conectar
  useEffect(() => {
    if (backendConnected) {
      loadSolicitacoes();
      loadPatients();
    }
  }, [backendConnected, currentPage]);

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
        cliente_nome: selectedPatient.name,
        cliente_codigo: selectedPatient.codigo,
        sexo: selectedPatient.sexo === 'Masculino' ? 'M' : selectedPatient.sexo === 'Feminino' ? 'F' : selectedPatient.sexo,
        data_nascimento: convertDateToInput(selectedPatient.dataNascimento),
        idade: selectedPatient.idade.toString(),
        diagnostico_cid: selectedPatient.cidDiagnostico,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!backendConnected) {
      toast.error('Backend não conectado', {
        description: 'Não é possível enviar a solicitação sem conexão com o servidor'
      });
      return;
    }

    // Validações básicas
    if (!formData.hospital_nome || !formData.cliente_nome || 
        !formData.diagnostico_cid || !formData.medicamentos_antineoplasticos) {
      toast.error('Campos obrigatórios não preenchidos', {
        description: 'Preencha pelo menos: Hospital, Cliente, CID e Medicamentos'
      });
      return;
    }

    setSubmitting(true);
    try {
      // Converter dados do formulário para o formato da API
      const solicitacaoData: Partial<SolicitacaoFromAPI> = {
        clinica_id: 1, // Valor fixo para testes
        hospital_nome: formData.hospital_nome,
        hospital_codigo: formData.hospital_codigo,
        cliente_nome: formData.cliente_nome,
        cliente_codigo: formData.cliente_codigo,
        sexo: formData.sexo as 'M' | 'F',
        data_nascimento: formData.data_nascimento,
        idade: parseInt(formData.idade) || 0,
        data_solicitacao: formData.data_solicitacao,
        diagnostico_cid: formData.diagnostico_cid,
        diagnostico_descricao: formData.diagnostico_descricao,
        local_metastases: formData.local_metastases,
        estagio_t: formData.estagio_t,
        estagio_n: formData.estagio_n,
        estagio_m: formData.estagio_m,
        estagio_clinico: formData.estagio_clinico,
        tratamento_cirurgia_radio: formData.tratamento_cirurgia_radio,
        tratamento_quimio_adjuvante: formData.tratamento_quimio_adjuvante,
        tratamento_quimio_primeira_linha: formData.tratamento_quimio_primeira_linha,
        tratamento_quimio_segunda_linha: formData.tratamento_quimio_segunda_linha,
        finalidade: formData.finalidade as any,
        performance_status: formData.performance_status,
        siglas: formData.siglas,
        ciclos_previstos: parseInt(formData.ciclos_previstos) || 0,
        ciclo_atual: parseInt(formData.ciclo_atual) || 0,
        superficie_corporal: parseFloat(formData.superficie_corporal) || 0,
        peso: parseFloat(formData.peso) || 0,
        altura: parseInt(formData.altura) || 0,
        medicamentos_antineoplasticos: formData.medicamentos_antineoplasticos,
        dose_por_m2: formData.dose_por_m2,
        dose_total: formData.dose_total,
        via_administracao: formData.via_administracao,
        dias_aplicacao_intervalo: formData.dias_aplicacao_intervalo,
        medicacoes_associadas: formData.medicacoes_associadas,
        medico_assinatura_crm: formData.medico_assinatura_crm,
        numero_autorizacao: formData.numero_autorizacao,
      };

      // Criar solicitação
      const novaSolicitacao = await SolicitacaoService.criarSolicitacao(solicitacaoData);
      
      toast.success('Solicitação criada com sucesso!', {
        description: `ID: ${novaSolicitacao.id}. Clique em "Baixar PDF" para obter o documento.`,
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Solicitação de Autorização</h1>
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

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="new">
            <FilePlus className="h-4 w-4 mr-2" />
            Nova Solicitação
          </TabsTrigger>
          <TabsTrigger value="history">
            <File className="h-4 w-4 mr-2" />
            Histórico de Solicitações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new">
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
                          Configuração Necessária
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/30 rounded-lg p-6 text-center">
                          <Building2 className="h-12 w-12 text-primary mx-auto mb-3" />
                          <p className="text-primary font-medium mb-3">
                            Configure as informações da clínica para preenchimento automático
                          </p>
                          <Button
                            type="button"
                            onClick={() => navigateWithTransition('/profile')}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
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

                {/* Resto do formulário permanece igual... */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Diagnóstico e Estadiamento</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="diagnostico_cid">CID-10 *</Label>
                      <Input
                        id="diagnostico_cid"
                        name="diagnostico_cid"
                        value={formData.diagnostico_cid}
                        onChange={handleChange}
                        className="lco-input"
                        required
                        placeholder={selectedPatientId ? "Preenchido automaticamente" : "Digite o CID"}
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
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">
                    Tratamentos Realizados Anteriormente
                  </h3>
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
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Esquema Terapêutico</h3>
                  
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
                      <Input
                        id="siglas"
                        name="siglas"
                        value={formData.siglas}
                        onChange={handleChange}
                        className="lco-input"
                      />
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="medicamentos_antineoplasticos">Medicamentos antineoplásticos *</Label>
                    <Textarea
                      id="medicamentos_antineoplasticos"
                      name="medicamentos_antineoplasticos"
                      value={formData.medicamentos_antineoplasticos}
                      onChange={handleChange}
                      className="lco-input"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
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
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Medicações Associadas</h3>
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
                </div>
                
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
        </TabsContent>

        <TabsContent value="history">
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Histórico de Solicitações</span>
                {backendConnected && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadSolicitacoes}
                    disabled={loading}
                  >
                    {loading ? 'Carregando...' : 'Atualizar'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!backendConnected ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Backend não conectado</h3>
                  <p className="text-muted-foreground">
                    Para visualizar o histórico, certifique-se de que o servidor backend está rodando.
                  </p>
                </div>
              ) : loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : solicitacoes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma solicitação encontrada</h3>
                  <p className="text-muted-foreground">
                    Crie sua primeira solicitação na aba "Nova Solicitação".
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {solicitacoes.map((solicitacao) => (
                    <div 
                      key={solicitacao.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 hover:bg-muted/50 p-4 rounded-lg transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium">
                            Solicitação #{solicitacao.id}
                          </h4>
                          <Badge 
                            variant="outline" 
                            className={getStatusColor(solicitacao.status || 'pendente')}
                          >
                            <div className="flex items-center gap-1">
                              {getStatusIcon(solicitacao.status || 'pendente')}
                              {solicitacao.status?.toUpperCase() || 'PENDENTE'}
                            </div>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Paciente:</strong> {solicitacao.cliente_nome}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Hospital:</strong> {solicitacao.hospital_nome}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Criado em:</strong> {formatDate(solicitacao.created_at || '')}
                        </p>
                        {solicitacao.numero_autorizacao && (
                          <p className="text-sm text-muted-foreground mt-1">
                            <strong>Autorização:</strong> {solicitacao.numero_autorizacao}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex items-center"
                          onClick={() => handleDownloadPDF(solicitacao.id!)}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          PDF
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex items-center"
                          onClick={() => handleViewPDF(solicitacao)}
                          title="Visualizar documento PDF"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <span className="flex items-center px-3 text-sm">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 🆕 MODAL DE VISUALIZAÇÃO PDF */}
      {selectedSolicitacao && (
        <PDFViewerModal
          isOpen={isPDFViewerOpen}
          onClose={() => {
            setIsPDFViewerOpen(false);
            setSelectedSolicitacao(null);
          }}
          solicitacao={selectedSolicitacao}
        />
      )}
    </div>
  );
};

export default Reports;