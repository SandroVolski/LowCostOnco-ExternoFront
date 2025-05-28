import { useState, useEffect } from 'react';
import { Plus, Search, User, Calendar as CalendarIcon, Info, Phone, Mail, MapPin, CreditCard, Building2, FlipHorizontal, Edit, Trash2 } from 'lucide-react';

// CSS como string constante
const patientCardStyles = `
  .perspective-1000 {
    perspective: 1000px;
  }
  .transform-style-preserve-3d {
    transform-style: preserve-3d;
  }
  .backface-hidden {
    backface-visibility: hidden;
  }
  .rotate-y-180 {
    transform: rotateY(180deg);
  }
  
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.6s ease-out forwards;
  }
`;
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PacienteService, testarConexaoBackend, testarConexaoBanco } from '@/services/api';
import { toast } from 'sonner';

// Interface Authorization
interface Authorization {
  id: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
  protocol: string;
  description: string;
}

// Interface Patient expandida
interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  stage: string;
  treatment: string;
  startDate: string;
  status: string;
  authorizations: Authorization[];
  Paciente_Nome: string;
  Codigo: string;
  cpf: string;
  rg: string;
  Data_Nascimento: string;
  Sexo: string;
  Operadora: string;
  Prestador: string;
  plano_saude: string;
  numero_carteirinha: string;
  Cid_Diagnostico: string;
  Data_Primeira_Solicitacao: string;
  telefone: string;
  email: string;
  endereco: string;
  observacoes: string;
}

// Componente PatientCard com efeito de virar APENAS no clique
const PatientCard = ({ patient, onEdit, onDelete, onShowInfo }: {
  patient: Patient;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onShowInfo: (id: string) => void;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div 
      className="h-[340px] w-full perspective-1000 cursor-pointer select-none"
      onClick={handleCardClick}
    >
      <div className={`relative w-full h-full transition-all duration-700 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''} active:scale-[0.98]`}>
        {/* Frente do Card */}
        <div className="absolute inset-0 w-full h-full backface-hidden">
          <Card className="h-full bg-gradient-to-br from-card via-card to-card/90 shadow-md transition-shadow duration-300 overflow-hidden border-2 border-border">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold line-clamp-1 text-primary">
                    {patient.name}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    <span className="text-sm">{patient.cpf || 'CPF não informado'}</span>
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      onShowInfo(patient.id);
                    }}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 px-2 py-1 bg-background/80 rounded-full animate-pulse">
                    <FlipHorizontal className="h-3 w-3" />
                    Clique para virar
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    Idade:
                  </span>
                  <span className="font-medium">{patient.age} anos</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Diagnóstico:</span>
                  <span className="font-medium line-clamp-1 text-right">{patient.diagnosis}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Estágio:</span>
                  <Badge variant="outline" className="text-xs">{patient.stage}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Tratamento:</span>
                  <span className="font-medium line-clamp-1 text-right text-xs">{patient.treatment}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Operadora:
                  </span>
                  <span className="font-medium text-xs">{patient.Operadora}</span>
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="flex items-center justify-between">
                <Badge variant={
                  patient.status === 'Em tratamento' ? 'default' : 
                  patient.status === 'Em remissão' ? 'secondary' : 
                  'outline'
                } className="text-xs">
                  {patient.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Início: {patient.startDate}
                </span>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(patient.id);
                  }}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(patient.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verso do Card */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
          <Card className="h-full bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 shadow-md transition-shadow duration-300 overflow-hidden border-2 border-primary/30">
            <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-primary/20">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold text-primary">
                  Detalhes Médicos
                </CardTitle>
                <div className="text-xs text-muted-foreground flex items-center gap-1 px-2 py-1 bg-background/80 rounded-full animate-pulse">
                  <FlipHorizontal className="h-3 w-3" />
                  Clique para voltar
                </div>
              </div>
              <CardDescription className="flex items-center gap-2">
                <CreditCard className="h-3 w-3" />
                Código: {patient.Codigo}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prestador:</span>
                  <span className="font-medium text-xs text-right">{patient.Prestador}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">CID:</span>
                  <span className="font-medium">{patient.Cid_Diagnostico}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Carteirinha:</span>
                  <span className="font-medium text-xs">{patient.numero_carteirinha || 'N/A'}</span>
                </div>
                {patient.telefone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-xs">{patient.telefone}</span>
                  </div>
                )}
                {patient.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-xs line-clamp-1">{patient.email}</span>
                  </div>
                )}
                {patient.endereco && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                    <span className="font-medium text-xs line-clamp-2">{patient.endereco}</span>
                  </div>
                )}
              </div>

              <Separator className="my-3" />

              {patient.authorizations && patient.authorizations.length > 0 ? (
                <div>
                  <h5 className="text-xs font-semibold mb-2 text-primary">Últimas Autorizações</h5>
                  <div className="space-y-2 max-h-20 overflow-y-auto">
                    {patient.authorizations.slice(0, 2).map((auth) => (
                      <div key={auth.id} className="flex items-center justify-between text-xs">
                        <span className="line-clamp-1">{auth.protocol}</span>
                        <Badge 
                          variant={auth.status === 'approved' ? 'default' : auth.status === 'pending' ? 'secondary' : 'destructive'}
                          className="text-[10px] px-1 py-0"
                        >
                          {auth.status === 'approved' ? 'OK' : auth.status === 'pending' ? 'Pend' : 'Rej'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground">Nenhuma autorização registrada</p>
                </div>
              )}

              <div className="flex gap-2 pt-2 mt-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowInfo(patient.id);
                  }}
                >
                  <Info className="h-3 w-3 mr-1" />
                  Ver Tudo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Seção animada
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

// Mock patient data
const initialPatients: Patient[] = [
  {
    id: '1',
    name: 'Maria Silva',
    age: 56,
    gender: 'Feminino',
    diagnosis: 'Câncer de Mama',
    stage: 'II',
    treatment: 'Quimioterapia',
    startDate: '15/01/2024',
    status: 'Em tratamento',
    authorizations: [
      {
        id: 'auth1',
        date: '10/05/2024',
        status: 'approved',
        protocol: 'Protocolo ABC',
        description: 'Solicitação inicial de tratamento'
      },
      {
        id: 'auth2',
        date: '20/05/2024',
        status: 'pending',
        protocol: 'Protocolo DEF',
        description: 'Solicitação para ciclo adicional'
      }
    ],
    Paciente_Nome: 'Maria Silva',
    Codigo: 'PAC001',
    cpf: '123.456.789-00',
    rg: '12.345.678-9',
    Data_Nascimento: '1968-01-01',
    Sexo: 'Feminino',
    Operadora: 'Unimed',
    Prestador: 'Hospital ABC',
    plano_saude: 'Unimed Nacional',
    numero_carteirinha: '123456789',
    Cid_Diagnostico: 'C50',
    Data_Primeira_Solicitacao: '2024-01-15',
    telefone: '(11) 99999-9999',
    email: 'maria.silva@email.com',
    endereco: 'Rua das Flores, 123 - São Paulo, SP',
    observacoes: 'Paciente colaborativa, boa resposta ao tratamento inicial.',
  },
  {
    id: '2',
    name: 'João Mendes',
    age: 62,
    gender: 'Masculino',
    diagnosis: 'Câncer de Próstata',
    stage: 'III',
    treatment: 'Radioterapia',
    startDate: '02/03/2024',
    status: 'Em tratamento',
    authorizations: [],
    Paciente_Nome: 'João Mendes',
    Codigo: 'PAC002',
    cpf: '987.654.321-00',
    rg: '98.765.432-1',
    Data_Nascimento: '1962-01-01',
    Sexo: 'Masculino',
    Operadora: 'Bradesco Saúde',
    Prestador: 'Clínica XYZ',
    plano_saude: 'Bradesco Premium',
    numero_carteirinha: '987654321',
    Cid_Diagnostico: 'C61',
    Data_Primeira_Solicitacao: '2024-03-02',
    telefone: '(11) 88888-8888',
    email: 'joao.mendes@email.com',
    endereco: 'Av. Paulista, 456 - São Paulo, SP',
    observacoes: '',
  },
  {
    id: '3',
    name: 'Ana Costa',
    age: 48,
    gender: 'Feminino',
    diagnosis: 'Câncer Colorretal',
    stage: 'II',
    treatment: 'Cirurgia + Quimioterapia',
    startDate: '10/12/2023',
    status: 'Em tratamento',
    authorizations: [],
    Paciente_Nome: 'Ana Costa',
    Codigo: 'PAC003',
    cpf: '456.789.123-00',
    rg: '45.678.912-3',
    Data_Nascimento: '1976-01-01',
    Sexo: 'Feminino',
    Operadora: 'SulAmérica',
    Prestador: 'Hospital DEF',
    plano_saude: 'SulAmérica Saúde',
    numero_carteirinha: '456789123',
    Cid_Diagnostico: 'C18',
    Data_Primeira_Solicitacao: '2023-12-10',
    telefone: '(11) 77777-7777',
    email: 'ana.costa@email.com',
    endereco: 'Rua Augusta, 789 - São Paulo, SP',
    observacoes: 'Paciente ansiosa, necessita acompanhamento psicológico.',
  }
];

// Empty patient
const emptyPatient: Patient = {
  id: '',
  name: '',
  age: 0,
  gender: '',
  diagnosis: '',
  stage: '',
  treatment: '',
  startDate: '',
  status: '',
  authorizations: [],
  Paciente_Nome: '',
  Codigo: '',
  cpf: '',
  rg: '',
  Data_Nascimento: '',
  Sexo: '',
  Operadora: '',
  Prestador: '',
  plano_saude: '',
  numero_carteirinha: '',
  Cid_Diagnostico: '',
  Data_Primeira_Solicitacao: '',
  telefone: '',
  email: '',
  endereco: '',
  observacoes: '',
};

// Helper functions
const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

const formatDateInput = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
};

const convertToISODate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Se já está no formato ISO (YYYY-MM-DD), retorna como está
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // Se está no formato brasileiro (DD/MM/YYYY)
  if (dateStr.includes('/')) {
    const [day, month, year] = dateStr.split('/');
    if (day && month && year && year.length === 4) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return '';
};

const convertFromISODate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Se já está no formato brasileiro, retorna como está
  if (dateStr.includes('/')) {
    return dateStr;
  }
  
  // Se está no formato ISO (YYYY-MM-DD)
  if (dateStr.includes('-')) {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  }
  
  return dateStr;
};

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient>(emptyPatient);
  const [isEditing, setIsEditing] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Testar conexão com backend ao carregar
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Carregar pacientes do backend quando conectado
  useEffect(() => {
    if (backendConnected) {
      loadPatientsFromAPI();
    }
  }, [backendConnected, pagination.page, searchTerm]);
  
  // Adicionar estilos CSS dinamicamente
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = patientCardStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      // Limpar quando o componente desmontar
      document.head.removeChild(styleElement);
    };
  }, []);

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const checkBackendConnection = async () => {
    const connected = await testarConexaoBackend();
    setBackendConnected(connected);
    
    if (connected) {
      const dbConnected = await testarConexaoBanco();
      if (dbConnected) {
        {/*toast.success('Backend conectado com sucesso!', {
          description: 'Dados serão carregados do banco de dados'
        });*/}
      } else {
        toast.warning('Backend conectado, mas banco com problemas');
      }
    } else {
      toast.error('Backend não está conectado', {
        description: 'Usando dados locais. Inicie o servidor Node.js na porta 3001'
      });
      // Usar dados mockados se backend não estiver disponível
      setPatients(initialPatients);
    }
  };

  const loadPatientsFromAPI = async () => {
    if (!backendConnected) return;
    
    setLoading(true);
    try {
      const result = await PacienteService.listarPacientes({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm
      });
      
      console.log('Pacientes carregados do backend:', result.data);
      setPatients(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Erro ao carregar pacientes do backend:', error);
      toast.error('Erro ao carregar pacientes do backend', {
        description: 'Usando dados locais'
      });
      // Fallback para dados mockados
      setPatients(initialPatients);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setCurrentPatient(emptyPatient);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    const patientToEdit = patients.find(patient => patient.id === id);
    if (patientToEdit) {
      setCurrentPatient(patientToEdit);
      setIsEditing(true);
      setIsDialogOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (backendConnected) {
      // Usar API do backend
      try {
        await PacienteService.deletarPaciente(parseInt(id));
        toast.success('Paciente deletado com sucesso!');
        loadPatientsFromAPI(); // Recarregar da API
      } catch (error) {
        console.error('Erro ao deletar paciente:', error);
        toast.error(error instanceof Error ? error.message : 'Erro ao deletar paciente');
      }
    } else {
      // Usar lógica local existente
      setPatients(patients.filter(patient => patient.id !== id));
      toast.success('Paciente removido localmente!');
    }
  };

  const handleShowInfo = (id: string) => {
    const patient = patients.find(p => p.id === id);
    if (patient) {
      setSelectedPatient(patient);
      setIsInfoDialogOpen(true);
    }
  };

  const handleSubmit = async () => {
    // Validações básicas
    if (!currentPatient.Paciente_Nome || !currentPatient.Codigo || !currentPatient.Data_Nascimento || 
        !currentPatient.Cid_Diagnostico || !currentPatient.stage || !currentPatient.treatment || 
        !currentPatient.startDate || !currentPatient.status || !currentPatient.Operadora || !currentPatient.Prestador) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (backendConnected) {
      // Usar API do backend
      setLoading(true);
      try {
        // Preparar dados com conversão de datas
        const dadosParaEnvio = {
          ...currentPatient,
          // Garantir que as datas estejam no formato correto para o backend
          Data_Nascimento: convertToISODate(currentPatient.Data_Nascimento),
          Data_Primeira_Solicitacao: convertToISODate(currentPatient.startDate),
          // Garantir que Operadora e Prestador sejam números
          Operadora: typeof currentPatient.Operadora === 'string' ? 1 : currentPatient.Operadora,
          Prestador: typeof currentPatient.Prestador === 'string' ? 1 : currentPatient.Prestador,
          // Adicionar clinica_id se não existir
          clinica_id: currentPatient.clinica_id || 1
        };
        
        console.log('🔧 Dados preparados para envio:', dadosParaEnvio);
        
        if (isEditing) {
          const updated = await PacienteService.atualizarPaciente(parseInt(currentPatient.id!), dadosParaEnvio);
          toast.success('Paciente atualizado com sucesso!');
        } else {
          const created = await PacienteService.criarPaciente(dadosParaEnvio);
          toast.success('Paciente criado com sucesso!');
        }
        
        setIsDialogOpen(false);
        loadPatientsFromAPI(); // Recarregar da API
      } catch (error) {
        console.error('Erro ao salvar paciente:', error);
        toast.error(error instanceof Error ? error.message : 'Erro ao salvar paciente');
      } finally {
        setLoading(false);
      }
    } else {
      // Usar lógica local existente
      const updatedPatient = {
        ...currentPatient,
        name: currentPatient.Paciente_Nome,
        age: calculateAge(currentPatient.Data_Nascimento),
        gender: currentPatient.Sexo,
        diagnosis: currentPatient.Cid_Diagnostico,
      };
      
      if (isEditing) {
        setPatients(patients.map(patient => 
          patient.id === updatedPatient.id ? updatedPatient : patient
        ));
        toast.success('Paciente atualizado localmente!');
      } else {
        const newPatient = {
          ...updatedPatient,
          id: Date.now().toString(),
        };
        setPatients([...patients, newPatient]);
        toast.success('Paciente criado localmente!');
      }
      
      setIsDialogOpen(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentPatient({
      ...currentPatient,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentPatient({
      ...currentPatient,
      [name]: value,
    });
  };

  const handleDateChange = (name: string, value: string) => {
    setCurrentPatient({
      ...currentPatient,
      [name]: value,
    });
  };

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Pacientes
            </h1>
            
            {/* Indicador de status */}
            {/*
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${backendConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm text-muted-foreground">
                  {backendConnected ? 'API Online' : 'API Offline'}
                </span>
              </div>
              
              {loading && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Carregando...</span>
                </div>
              )}
            </div>*/}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pacientes..."
                className="pl-8 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button 
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-105 hover:shadow-lg" 
              onClick={handleAddNew}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Paciente
            </Button>
          </div>
        </div>
      </AnimatedSection>
      
      {filteredPatients.length === 0 ? (
        <AnimatedSection delay={200}>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Nenhum paciente encontrado</h3>
            <p className="text-muted-foreground mt-2">
              Tente mudar sua busca ou adicione um novo paciente
            </p>
            
            <Button 
              variant="outline"
              className="mt-6 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              onClick={handleAddNew}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar paciente
            </Button>
          </div>
        </AnimatedSection>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient, index) => (
            <AnimatedSection key={patient.id} delay={100 * index}>
              <PatientCard 
                patient={patient} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                onShowInfo={handleShowInfo}
              />
            </AnimatedSection>
          ))}
        </div>
      )}
      
      {/* Modal de Adicionar/Editar Paciente */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Paciente' : 'Adicionar Novo Paciente'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Tabs defaultValue="dados-pessoais" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dados-pessoais">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="dados-medicos">Dados Médicos</TabsTrigger>
                <TabsTrigger value="dados-contato">Dados de Contato</TabsTrigger>
              </TabsList>

              <TabsContent value="dados-pessoais" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                    <Label htmlFor="Paciente_Nome">Nome do Paciente *</Label>
                <Input
                      id="Paciente_Nome"
                      name="Paciente_Nome"
                      value={currentPatient.Paciente_Nome}
                  onChange={handleInputChange}
                  required
                  className="transition-all duration-300 focus:border-primary"
                />
              </div>
              
                <div className="space-y-2">
                    <Label htmlFor="Codigo">Código do Paciente *</Label>
                  <Input
                      id="Codigo"
                      name="Codigo"
                      value={currentPatient.Codigo}
                    onChange={handleInputChange}
                    required
                    className="transition-all duration-300 focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      value={currentPatient.cpf}
                      onChange={handleInputChange}
                      className="transition-all duration-300 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rg">RG</Label>
                    <Input
                      id="rg"
                      name="rg"
                      value={currentPatient.rg}
                      onChange={handleInputChange}
                      className="transition-all duration-300 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="Data_Nascimento">Data de Nascimento *</Label>
                    <Input
                      id="Data_Nascimento"
                      name="Data_Nascimento"
                      value={convertFromISODate(currentPatient.Data_Nascimento)}
                      onChange={(e) => {
                        const formatted = formatDateInput(e.target.value);
                        const isoDate = convertToISODate(formatted);
                        setCurrentPatient({
                          ...currentPatient,
                          Data_Nascimento: isoDate // Armazenar sempre no formato ISO
                        });
                      }}
                      placeholder="DD/MM/AAAA"
                      required
                      maxLength={10}
                      className="transition-all duration-300 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="Sexo">Sexo</Label>
                    <Select
                      value={currentPatient.Sexo}
                      onValueChange={(value) => handleSelectChange('Sexo', value)}
                    >
                      <SelectTrigger className="transition-all duration-300 focus:border-primary">
                        <SelectValue placeholder="Selecione o sexo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dados-medicos" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="Operadora">Operadora *</Label>
                    <Select
                      value={currentPatient.Operadora}
                      onValueChange={(value) => handleSelectChange('Operadora', value)}
                    >
                      <SelectTrigger className="transition-all duration-300 focus:border-primary">
                        <SelectValue placeholder="Selecione uma operadora" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Unimed">Unimed</SelectItem>
                        <SelectItem value="Bradesco Saúde">Bradesco Saúde</SelectItem>
                        <SelectItem value="SulAmérica">SulAmérica</SelectItem>
                        <SelectItem value="Amil">Amil</SelectItem>
                        <SelectItem value="Porto Seguro">Porto Seguro</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="Prestador">Prestador *</Label>
                  <Input
                      id="Prestador"
                      name="Prestador"
                      value={currentPatient.Prestador}
                    onChange={handleInputChange}
                      placeholder="Digite o nome do prestador..."
                    required
                    className="transition-all duration-300 focus:border-primary"
                  />
                </div>

                  <div className="space-y-2">
                    <Label htmlFor="plano_saude">Plano de Saúde</Label>
                    <Input
                      id="plano_saude"
                      name="plano_saude"
                      value={currentPatient.plano_saude}
                      onChange={handleInputChange}
                      className="transition-all duration-300 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero_carteirinha">Número da Carteirinha</Label>
                    <Input
                      id="numero_carteirinha"
                      name="numero_carteirinha"
                      value={currentPatient.numero_carteirinha}
                      onChange={handleInputChange}
                      className="transition-all duration-300 focus:border-primary"
                    />
              </div>
              
              <div className="space-y-2">
                    <Label htmlFor="Cid_Diagnostico">CID Diagnóstico *</Label>
                <Input
                      id="Cid_Diagnostico"
                      name="Cid_Diagnostico"
                      value={currentPatient.Cid_Diagnostico}
                  onChange={handleInputChange}
                  required
                  className="transition-all duration-300 focus:border-primary"
                />
              </div>
              
                <div className="space-y-2">
                    <Label htmlFor="stage">Estágio *</Label>
                  <Input
                    id="stage"
                    name="stage"
                    value={currentPatient.stage}
                    onChange={handleInputChange}
                    required
                    className="transition-all duration-300 focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="treatment">Tratamento *</Label>
                  <Input
                    id="treatment"
                    name="treatment"
                    value={currentPatient.treatment}
                    onChange={handleInputChange}
                    required
                    className="transition-all duration-300 focus:border-primary"
                  />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início do Tratamento *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  value={convertFromISODate(currentPatient.startDate)}
                  onChange={(e) => {
                    const formatted = formatDateInput(e.target.value);
                    const isoDate = convertToISODate(formatted);
                    setCurrentPatient({
                      ...currentPatient,
                      startDate: isoDate // Armazenar sempre no formato ISO
                    });
                  }}
                  placeholder="DD/MM/AAAA"
                  required
                  maxLength={10}
                  className="transition-all duration-300 focus:border-primary"
                />
              </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select
                      value={currentPatient.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger className="transition-all duration-300 focus:border-primary">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Em tratamento">Em tratamento</SelectItem>
                        <SelectItem value="Em remissão">Em remissão</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Óbito">Óbito</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dados-contato" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      name="telefone"
                      value={currentPatient.telefone}
                  onChange={handleInputChange}
                  className="transition-all duration-300 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                <Input
                      id="email"
                      name="email"
                      type="email"
                      value={currentPatient.email}
                      onChange={handleInputChange}
                      className="transition-all duration-300 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Textarea
                      id="endereco"
                      name="endereco"
                      value={currentPatient.endereco}
                      onChange={handleInputChange}
                      className="transition-all duration-300 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      name="observacoes"
                      value={currentPatient.observacoes}
                  onChange={handleInputChange}
                  className="transition-all duration-300 focus:border-primary"
                />
              </div>
            </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                onClick={handleSubmit}
              >
                {isEditing ? 'Salvar Alterações' : 'Adicionar Paciente'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Informações Detalhadas */}
      <Dialog open={isInfoDialogOpen} onOpenChange={setIsInfoDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Completas do Paciente
            </DialogTitle>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">{selectedPatient.name}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant={selectedPatient.status === 'Em tratamento' ? 'default' : selectedPatient.status === 'Em remissão' ? 'secondary' : 'outline'}>
                    {selectedPatient.status}
                  </Badge>
                  <span className="text-muted-foreground">Código: {selectedPatient.Codigo}</span>
                  <span className="text-muted-foreground">Idade: {selectedPatient.age} anos</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados Pessoais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">CPF:</span>
                    <p className="font-medium">{selectedPatient.cpf || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">RG:</span>
                    <p className="font-medium">{selectedPatient.rg || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data de Nascimento:</span>
                    <p className="font-medium">{convertFromISODate(selectedPatient.Data_Nascimento)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sexo:</span>
                    <p className="font-medium">{selectedPatient.Sexo || selectedPatient.gender}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Dados Médicos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Operadora:</span>
                    <p className="font-medium">{selectedPatient.Operadora}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Prestador:</span>
                    <p className="font-medium">{selectedPatient.Prestador}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">CID Diagnóstico:</span>
                    <p className="font-medium">{selectedPatient.Cid_Diagnostico}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estágio:</span>
                    <p className="font-medium">{selectedPatient.stage}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tratamento:</span>
                    <p className="font-medium">{selectedPatient.treatment}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Início do Tratamento:</span>
                    <p className="font-medium">{selectedPatient.startDate}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Dados de Contato
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Telefone:</span>
                      <p className="font-medium">{selectedPatient.telefone || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">E-mail:</span>
                      <p className="font-medium">{selectedPatient.email || 'Não informado'}</p>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                    <div className="flex-1">
                      <span className="text-muted-foreground">Endereço:</span>
                      <p className="font-medium">{selectedPatient.endereco || 'Não informado'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedPatient.observacoes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3">Observações</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {selectedPatient.observacoes}
                    </p>
                  </div>
                </>
              )}

              {selectedPatient.authorizations && selectedPatient.authorizations.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3">Autorizações</h4>
                    <div className="space-y-3">
                      {selectedPatient.authorizations.map((auth) => (
                        <Card key={auth.id} className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{auth.protocol}</p>
                              <p className="text-sm text-muted-foreground">{auth.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">Data: {auth.date}</p>
                            </div>
                            <Badge variant={
                              auth.status === 'approved' ? 'default' : 
                              auth.status === 'pending' ? 'secondary' : 
                              'destructive'
                            }>
                              {auth.status === 'approved' ? 'Aprovado' : 
                               auth.status === 'pending' ? 'Pendente' : 
                               'Rejeitado'}
                            </Badge>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                handleEdit(selectedPatient!.id);
                setIsInfoDialogOpen(false);
              }}
            >
              Editar Paciente
            </Button>
            <Button onClick={() => setIsInfoDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Patients;