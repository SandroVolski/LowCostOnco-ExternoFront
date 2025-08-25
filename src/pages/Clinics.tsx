import { useState } from 'react';
import { Users, FileText, Calendar, Settings, SendIcon } from 'lucide-react';
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
import PatientCard from '@/components/PatientCard';

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
  authorizations: Array<{
    id: string;
    date: string;
    status: 'approved' | 'pending' | 'rejected';
    protocol: string;
    description: string;
  }>;
}

const Clinics = () => {
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: '1',
      name: 'Maria Silva',
      age: 45,
      gender: 'Feminino',
      diagnosis: 'Câncer de Mama',
      stage: 'II',
      treatment: 'Quimioterapia',
      startDate: '01/03/2024',
      status: 'ativo',
      authorizations: [
        {
          id: '1',
          date: '01/03/2024',
          status: 'approved',
          protocol: 'Protocolo AC-T',
          description: 'Quimioterapia adjuvante com Doxorrubicina e Ciclofosfamida seguida de Paclitaxel'
        }
      ]
    },
    // Adicione mais pacientes conforme necessário
  ]);

  const handleEditPatient = (id: string) => {
    // Implementar lógica de edição
    console.log('Editar paciente:', id);
  };

  const handleDeletePatient = (id: string) => {
    // Implementar lógica de exclusão
    console.log('Excluir paciente:', id);
  };

  const clinicTabs = [
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'authorizations', label: 'Solicitação de Autorização', icon: FileText },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Clínicas</h1>

      <Tabs defaultValue="patients" className="w-full">
        <TabsList className="grid grid-cols-4 w-[600px]">
          {clinicTabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="patients" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => (
              <PatientCard
                key={patient.id}
                patient={patient}
                onEdit={handleEditPatient}
                onDelete={handleDeletePatient}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="authorizations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-support-teal" />
                Solicitação de Autorização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Informações da Clínica</h3>
                    <div className="space-y-2">
                      <Label htmlFor="hospital">Hospital/Clínica Solicitante</Label>
                      <Input
                        id="hospital"
                        name="hospital"
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hospitalCode">Código Hospital/Clínica</Label>
                      <Input
                        id="hospitalCode"
                        name="hospitalCode"
                        className="lco-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Informações do Paciente</h3>
                    <div className="space-y-2">
                      <Label htmlFor="patient">Paciente</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um paciente" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                              {patient.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Diagnóstico e Estadiamento</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="diagnosisCID">CID-10</Label>
                      <Input
                        id="diagnosisCID"
                        name="diagnosisCID"
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diagnosis">Diagnóstico</Label>
                      <Input
                        id="diagnosis"
                        name="diagnosis"
                        className="lco-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Esquema Terapêutico</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="purpose">Finalidade</Label>
                      <Select>
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
                      <Label htmlFor="medications">Princípios ativos antineoplásticos</Label>
                      <Textarea
                        id="medications"
                        name="medications"
                        className="lco-input"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                  <Button type="submit" className="lco-btn-primary">
                    <SendIcon className="mr-2 h-4 w-4" />
                    Enviar Solicitação
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Clinics; 