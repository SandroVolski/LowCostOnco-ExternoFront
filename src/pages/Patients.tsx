import { useState } from 'react';
import { Plus, Search, User, Calendar as CalendarIcon, Info, Phone, Mail, MapPin, CreditCard, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/components/ui/use-toast';
import AnimatedSection from '@/components/AnimatedSection';
import { format, parseISO, isValid } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Interface Authorization mantida do código antigo
interface Authorization {
  id: string;
  date: string;
  status: 'approved' | 'pending' | 'rejected';
  protocol: string;
  description: string;
}

// Interface Patient combinada com campos de ambos os códigos
interface Patient {
  id: string;
  // Campos do código antigo (para manter compatibilidade com PatientCard)
  name: string;
  age: number;
  gender: string;
  diagnosis: string;
  stage: string;
  treatment: string;
  startDate: string;
  status: string;
  authorizations: Authorization[];
  // Campos adicionais do código novo
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

// Mock patient data do código antigo
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
    // Campos adicionais vazios para compatibilidade
    Paciente_Nome: 'Maria Silva',
    Codigo: 'PAC001',
    cpf: '123.456.789-00',
    rg: '',
    Data_Nascimento: '1968-01-01',
    Sexo: 'Feminino',
    Operadora: 'Unimed',
    Prestador: 'Hospital ABC',
    plano_saude: '',
    numero_carteirinha: '',
    Cid_Diagnostico: 'C50',
    Data_Primeira_Solicitacao: '2024-01-15',
    telefone: '',
    email: '',
    endereco: '',
    observacoes: '',
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
    rg: '',
    Data_Nascimento: '1962-01-01',
    Sexo: 'Masculino',
    Operadora: 'Bradesco Saúde',
    Prestador: 'Clínica XYZ',
    plano_saude: '',
    numero_carteirinha: '',
    Cid_Diagnostico: 'C61',
    Data_Primeira_Solicitacao: '2024-03-02',
    telefone: '',
    email: '',
    endereco: '',
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
    rg: '',
    Data_Nascimento: '1976-01-01',
    Sexo: 'Feminino',
    Operadora: 'SulAmérica',
    Prestador: 'Hospital DEF',
    plano_saude: '',
    numero_carteirinha: '',
    Cid_Diagnostico: 'C18',
    Data_Primeira_Solicitacao: '2023-12-10',
    telefone: '',
    email: '',
    endereco: '',
    observacoes: '',
  },
  {
    id: '4',
    name: 'Carlos Santos',
    age: 71,
    gender: 'Masculino',
    diagnosis: 'Câncer de Pulmão',
    stage: 'IV',
    treatment: 'Imunoterapia',
    startDate: '20/02/2024',
    status: 'Em tratamento',
    authorizations: [],
    Paciente_Nome: 'Carlos Santos',
    Codigo: 'PAC004',
    cpf: '789.123.456-00',
    rg: '',
    Data_Nascimento: '1953-01-01',
    Sexo: 'Masculino',
    Operadora: 'Amil',
    Prestador: 'Centro Oncológico',
    plano_saude: '',
    numero_carteirinha: '',
    Cid_Diagnostico: 'C34',
    Data_Primeira_Solicitacao: '2024-02-20',
    telefone: '',
    email: '',
    endereco: '',
    observacoes: '',
  },
  {
    id: '5',
    name: 'Lúcia Oliveira',
    age: 52,
    gender: 'Feminino',
    diagnosis: 'Linfoma Não-Hodgkin',
    stage: 'III',
    treatment: 'Quimioterapia',
    startDate: '05/11/2023',
    status: 'Em remissão',
    authorizations: [],
    Paciente_Nome: 'Lúcia Oliveira',
    Codigo: 'PAC005',
    cpf: '321.654.987-00',
    rg: '',
    Data_Nascimento: '1972-01-01',
    Sexo: 'Feminino',
    Operadora: 'Porto Seguro',
    Prestador: 'Instituto de Oncologia',
    plano_saude: '',
    numero_carteirinha: '',
    Cid_Diagnostico: 'C85',
    Data_Primeira_Solicitacao: '2023-11-05',
    telefone: '',
    email: '',
    endereco: '',
    observacoes: '',
  },
];

// Empty patient combinado
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

// Helper function para calcular idade
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

// Função para formatar data enquanto digita
const formatDateInput = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
};

// Função para converter DD/MM/YYYY para YYYY-MM-DD
const convertToISODate = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes('/')) return '';
  const [day, month, year] = dateStr.split('/');
  if (!day || !month || !year || year.length !== 4) return '';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
};

// Função para converter YYYY-MM-DD para DD/MM/YYYY
const convertFromISODate = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes('-')) return '';
  try {
    const date = parseISO(dateStr);
    return format(date, 'dd/MM/yyyy');
  } catch {
    return '';
  }
};

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient>(emptyPatient);
  const [isEditing, setIsEditing] = useState(false);
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleDelete = (id: string) => {
    setPatients(patients.filter(patient => patient.id !== id));
    toast({
      title: "Paciente removido",
      description: "O paciente foi removido com sucesso."
    });
  };

  const handleShowInfo = (id: string) => {
    const patient = patients.find(p => p.id === id);
    if (patient) {
      setSelectedPatient(patient);
      setIsInfoDialogOpen(true);
    }
  };

  const handleSubmit = () => {
    // Validações básicas
    if (!currentPatient.Paciente_Nome || !currentPatient.Codigo || !currentPatient.Data_Nascimento || 
        !currentPatient.Cid_Diagnostico || !currentPatient.stage || !currentPatient.treatment || 
        !currentPatient.startDate || !currentPatient.status || !currentPatient.Operadora || !currentPatient.Prestador) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    
    // Sincronizar campos
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
      toast({
        title: "Paciente atualizado",
        description: "O paciente foi atualizado com sucesso."
      });
    } else {
      const newPatient = {
        ...updatedPatient,
        id: Date.now().toString(),
      };
      setPatients([...patients, newPatient]);
      toast({
        title: "Paciente adicionado",
        description: "O paciente foi adicionado com sucesso."
      });
    }
    
    setIsDialogOpen(false);
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

  const handleDateChange = (name: string, date: Date | undefined) => {
    setCurrentPatient({
      ...currentPatient,
      [name]: date ? format(date, 'yyyy-MM-dd') : '',
    });
  };

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 animate-entry">
          <h1 className="text-2xl font-bold">Pacientes</h1>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative max-w-xs glow-on-hover">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pacientes..."
                className="pl-8 lco-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Button 
              className="lco-btn-primary hover-lift" 
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
          <div className="flex flex-col items-center justify-center py-12 text-center animate-entry">
            <User className="w-12 h-12 text-muted-foreground mb-4 animate-pulse-subtle" />
            <h3 className="text-lg font-medium">Nenhum paciente encontrado</h3>
            <p className="text-muted-foreground mt-2">
              Tente mudar sua busca ou adicione um novo paciente
            </p>
            
            <Button 
              variant="outline"
              className="mt-6 hover-lift"
              onClick={handleAddNew}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar paciente
            </Button>
          </div>
        </AnimatedSection>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPatients.map((patient, index) => (
            <AnimatedSection key={patient.id} delay={100 * index}>
              <Card className="h-full bg-card hover:shadow-lg transition-all duration-300 hover-lift overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold line-clamp-1">{patient.name}</CardTitle>
                      <CardDescription className="mt-1">
                        <span className="text-sm">{patient.cpf || 'CPF não informado'}</span>
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleShowInfo(patient.id)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Idade:</span>
                      <span className="font-medium">{patient.age} anos</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Diagnóstico:</span>
                      <span className="font-medium line-clamp-1">{patient.diagnosis}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Estágio:</span>
                      <span className="font-medium">{patient.stage}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tratamento:</span>
                      <span className="font-medium line-clamp-1">{patient.treatment}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Operadora:</span>
                      <span className="font-medium">{patient.Operadora}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Badge variant={patient.status === 'Em tratamento' ? 'default' : patient.status === 'Em remissão' ? 'secondary' : 'outline'}>
                        {patient.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Início: {patient.startDate}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(patient.id)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDelete(patient.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </AnimatedSection>
          ))}
        </div>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
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
                    <div className="relative">
                      <Input
                        id="Data_Nascimento"
                        name="Data_Nascimento"
                        value={convertFromISODate(currentPatient.Data_Nascimento)}
                        onChange={(e) => {
                          const formatted = formatDateInput(e.target.value);
                          const isoDate = convertToISODate(formatted);
                          setCurrentPatient({
                            ...currentPatient,
                            Data_Nascimento: isoDate
                          });
                        }}
                        placeholder="DD/MM/AAAA"
                        required
                        maxLength={10}
                        className="transition-all duration-300 focus:border-primary pr-10"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={currentPatient.Data_Nascimento && isValid(parseISO(currentPatient.Data_Nascimento)) ? parseISO(currentPatient.Data_Nascimento) : undefined}
                            onSelect={(date) => handleDateChange('Data_Nascimento', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
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
                    <Label htmlFor="Data_Primeira_Solicitacao">Data Primeira Solicitação</Label>
                    <div className="relative">
                      <Input
                        id="Data_Primeira_Solicitacao"
                        name="Data_Primeira_Solicitacao"
                        value={convertFromISODate(currentPatient.Data_Primeira_Solicitacao)}
                        onChange={(e) => {
                          const formatted = formatDateInput(e.target.value);
                          const isoDate = convertToISODate(formatted);
                          setCurrentPatient({
                            ...currentPatient,
                            Data_Primeira_Solicitacao: isoDate
                          });
                        }}
                        placeholder="DD/MM/AAAA"
                        maxLength={10}
                        className="transition-all duration-300 focus:border-primary pr-10"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={currentPatient.Data_Primeira_Solicitacao && isValid(parseISO(currentPatient.Data_Primeira_Solicitacao)) ? parseISO(currentPatient.Data_Primeira_Solicitacao) : undefined}
                            onSelect={(date) => handleDateChange('Data_Primeira_Solicitacao', date)}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data de Início do Tratamento *</Label>
                    <div className="relative">
                      <Input
                        id="startDate"
                        name="startDate"
                        value={currentPatient.startDate}
                        onChange={(e) => {
                          const formatted = formatDateInput(e.target.value);
                          setCurrentPatient({
                            ...currentPatient,
                            startDate: formatted
                          });
                        }}
                        placeholder="DD/MM/AAAA"
                        required
                        maxLength={10}
                        className="transition-all duration-300 focus:border-primary pr-10"
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          >
                            <CalendarIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={currentPatient.startDate ? new Date(currentPatient.startDate.split('/').reverse().join('-')) : undefined}
                            onSelect={(date) => setCurrentPatient({...currentPatient, startDate: date ? format(date, 'dd/MM/yyyy') : ''})}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
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
                className="hover-lift"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="lco-btn-primary hover-lift"
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Paciente
            </DialogTitle>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-6">
              {/* Header com informações principais */}
              <div className="bg-primary/5 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-2">{selectedPatient.name}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant={selectedPatient.status === 'Em tratamento' ? 'default' : selectedPatient.status === 'Em remissão' ? 'secondary' : 'outline'}>
                    {selectedPatient.status}
                  </Badge>
                  <span className="text-muted-foreground">Código: {selectedPatient.Codigo}</span>
                  <span className="text-muted-foreground">Idade: {selectedPatient.age} anos</span>
                </div>
              </div>

              {/* Dados Pessoais */}
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

              {/* Dados Médicos */}
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
                    <span className="text-muted-foreground">Plano de Saúde:</span>
                    <p className="font-medium">{selectedPatient.plano_saude || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Número da Carteirinha:</span>
                    <p className="font-medium">{selectedPatient.numero_carteirinha || 'Não informado'}</p>
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
                    <span className="text-muted-foreground">Data Primeira Solicitação:</span>
                    <p className="font-medium">{convertFromISODate(selectedPatient.Data_Primeira_Solicitacao) || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Início do Tratamento:</span>
                    <p className="font-medium">{selectedPatient.startDate}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Dados de Contato */}
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

              {/* Observações */}
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

              {/* Autorizações */}
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