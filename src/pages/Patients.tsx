import { useState } from 'react';
import { PlusIcon, SearchIcon, UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import PatientCard from '@/components/PatientCard';
import AnimatedSection from '@/components/AnimatedSection';

// Mock patient data
const initialPatients = [
  {
    id: '1',
    name: 'Maria Silva',
    age: 56,
    diagnosis: 'Câncer de Mama',
    stage: 'II',
    treatment: 'Quimioterapia',
    startDate: '15/01/2024',
    status: 'Em tratamento',
  },
  {
    id: '2',
    name: 'João Mendes',
    age: 62,
    diagnosis: 'Câncer de Próstata',
    stage: 'III',
    treatment: 'Radioterapia',
    startDate: '02/03/2024',
    status: 'Em tratamento',
  },
  {
    id: '3',
    name: 'Ana Costa',
    age: 48,
    diagnosis: 'Câncer Colorretal',
    stage: 'II',
    treatment: 'Cirurgia + Quimioterapia',
    startDate: '10/12/2023',
    status: 'Em tratamento',
  },
  {
    id: '4',
    name: 'Carlos Santos',
    age: 71,
    diagnosis: 'Câncer de Pulmão',
    stage: 'IV',
    treatment: 'Imunoterapia',
    startDate: '20/02/2024',
    status: 'Em tratamento',
  },
  {
    id: '5',
    name: 'Lúcia Oliveira',
    age: 52,
    diagnosis: 'Linfoma Não-Hodgkin',
    stage: 'III',
    treatment: 'Quimioterapia',
    startDate: '05/11/2023',
    status: 'Em remissão',
  },
];

interface Patient {
  id: string;
  name: string;
  age: number;
  diagnosis: string;
  stage: string;
  treatment: string;
  startDate: string;
  status: string;
}

const emptyPatient = {
  id: '',
  name: '',
  age: 0,
  diagnosis: '',
  stage: '',
  treatment: '',
  startDate: '',
  status: '',
};

// Helper function to add staggered animations
const getAnimationDelay = (index: number) => {
  return {
    animationDelay: `${index * 100}ms`,
    style: { animationDelay: `${index * 100}ms` }
  };
};

const Patients = () => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPatient, setCurrentPatient] = useState<Patient>(emptyPatient);
  const [isEditing, setIsEditing] = useState(false);

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => {
    setCurrentPatient(emptyPatient);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleEdit = (patient: Patient) => {
    setCurrentPatient(patient);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setPatients(patients.filter(patient => patient.id !== id));
    toast({
      title: "Paciente removido",
      description: "O paciente foi removido com sucesso."
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing) {
      setPatients(patients.map(patient => 
        patient.id === currentPatient.id ? currentPatient : patient
      ));
      toast({
        title: "Paciente atualizado",
        description: "O paciente foi atualizado com sucesso."
      });
    } else {
      const newPatient = {
        ...currentPatient,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentPatient({
      ...currentPatient,
      [name]: name === 'age' ? parseInt(value) || 0 : value,
    });
  };

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 animate-entry">
          <h1 className="text-2xl font-bold">Pacientes</h1>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative max-w-xs glow-on-hover">
              <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
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
              <PlusIcon className="w-4 h-4 mr-2" />
              Novo Paciente
            </Button>
          </div>
        </div>
      </AnimatedSection>
      
      {filteredPatients.length === 0 ? (
        <AnimatedSection delay={200}>
          <div className="flex flex-col items-center justify-center py-12 text-center animate-entry">
            <UserIcon className="w-12 h-12 text-muted-foreground mb-4 animate-pulse-subtle" />
            <h3 className="text-lg font-medium">Nenhum paciente encontrado</h3>
            <p className="text-muted-foreground mt-2">
              Tente mudar sua busca ou adicione um novo paciente
            </p>
            
            <Button 
              variant="outline"
              className="mt-6 hover-lift"
              onClick={handleAddNew}
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Adicionar paciente
            </Button>
          </div>
        </AnimatedSection>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPatients.map((patient, index) => (
            <AnimatedSection key={patient.id} delay={100 * index} className="h-[340px]">
              <PatientCard 
                patient={patient} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </AnimatedSection>
          ))}
        </div>
      )}
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Paciente' : 'Adicionar Novo Paciente'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  name="name"
                  value={currentPatient.name}
                  onChange={handleInputChange}
                  required
                  className="transition-all duration-300 focus:border-primary"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Idade</Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    value={currentPatient.age || ''}
                    onChange={handleInputChange}
                    required
                    className="transition-all duration-300 focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stage">Estágio</Label>
                  <Input
                    id="stage"
                    name="stage"
                    value={currentPatient.stage}
                    onChange={handleInputChange}
                    required
                    className="transition-all duration-300 focus:border-primary"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnóstico</Label>
                <Input
                  id="diagnosis"
                  name="diagnosis"
                  value={currentPatient.diagnosis}
                  onChange={handleInputChange}
                  required
                  className="transition-all duration-300 focus:border-primary"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="treatment">Tratamento</Label>
                <Input
                  id="treatment"
                  name="treatment"
                  value={currentPatient.treatment}
                  onChange={handleInputChange}
                  required
                  className="transition-all duration-300 focus:border-primary"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    value={currentPatient.startDate}
                    onChange={handleInputChange}
                    placeholder="DD/MM/AAAA"
                    required
                    className="transition-all duration-300 focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    name="status"
                    value={currentPatient.status}
                    onChange={handleInputChange}
                    required
                    className="transition-all duration-300 focus:border-primary"
                  />
                </div>
              </div>
            </div>
            
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
              >
                {isEditing ? 'Salvar Alterações' : 'Adicionar Paciente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Patients;
