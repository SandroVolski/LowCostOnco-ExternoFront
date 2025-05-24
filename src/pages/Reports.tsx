
import { useState } from 'react';
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
import { Download, File, FilePlus, PencilIcon, SendIcon } from 'lucide-react';
import { toast } from 'sonner';

const Reports = () => {
  const [formData, setFormData] = useState({
    hospital: '',
    hospitalCode: '',
    clientName: '',
    clientCode: '',
    gender: '',
    birthDate: '',
    age: '',
    requestDate: '',
    diagnosisCID: '',
    diagnosis: '',
    metastasisLocation: '',
    stageT: '',
    stageN: '',
    stageM: '',
    clinicalStage: '',
    previousSurgery: '',
    previousChemoAdjuvant: '',
    previousChemo1stLine: '',
    previousChemo2ndLine: '',
    purpose: '',
    performanceStatus: '',
    acronym: '',
    plannedCycles: '',
    currentCycle: '',
    bodySurface: '',
    weight: '',
    height: '',
    medications: '',
    dosage: '',
    totalDose: '',
    applicationDays: '',
    administrationRoute: '',
    associatedMedications: '',
    doctorSignature: '',
    authorizationNumber: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, here we would generate the PDF
    toast.success('Relatório gerado com sucesso!', {
      description: 'O documento está pronto para download.',
      action: {
        label: 'Download',
        onClick: () => console.log('Download action'),
      },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="new">
            <FilePlus className="h-4 w-4 mr-2" />
            Novo Relatório
          </TabsTrigger>
          <TabsTrigger value="history">
            <File className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PencilIcon className="h-5 w-5 mr-2 text-support-teal" />
                Autorização/Processamento de Tratamento Oncológico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Informações da Clínica</h3>
                    <div className="space-y-2">
                      <Label htmlFor="hospital">Hospital/Clínica Solicitante</Label>
                      <Input
                        id="hospital"
                        name="hospital"
                        value={formData.hospital}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hospitalCode">Código Hospital/Clínica</Label>
                      <Input
                        id="hospitalCode"
                        name="hospitalCode"
                        value={formData.hospitalCode}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Informações do Paciente</h3>
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Nome do Cliente</Label>
                      <Input
                        id="clientName"
                        name="clientName"
                        value={formData.clientName}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientCode">Código do Cliente</Label>
                        <Input
                          id="clientCode"
                          name="clientCode"
                          value={formData.clientCode}
                          onChange={handleChange}
                          className="lco-input"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Sexo</Label>
                        <Select 
                          onValueChange={handleSelectChange("gender")} 
                          defaultValue={formData.gender}
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
                        <Label htmlFor="birthDate">Data de Nascimento</Label>
                        <Input
                          id="birthDate"
                          name="birthDate"
                          value={formData.birthDate}
                          onChange={handleChange}
                          className="lco-input"
                          placeholder="DD/MM/AAAA"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Idade</Label>
                        <Input
                          id="age"
                          name="age"
                          type="number"
                          value={formData.age}
                          onChange={handleChange}
                          className="lco-input"
                          required
                        />
                      </div>
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
                        value={formData.diagnosisCID}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="diagnosis">Diagnóstico</Label>
                      <Input
                        id="diagnosis"
                        name="diagnosis"
                        value={formData.diagnosis}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metastasisLocation">Local das metástases</Label>
                    <Input
                      id="metastasisLocation"
                      name="metastasisLocation"
                      value={formData.metastasisLocation}
                      onChange={handleChange}
                      className="lco-input"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stageT">T</Label>
                      <Input
                        id="stageT"
                        name="stageT"
                        value={formData.stageT}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stageN">N</Label>
                      <Input
                        id="stageN"
                        name="stageN"
                        value={formData.stageN}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stageM">M</Label>
                      <Input
                        id="stageM"
                        name="stageM"
                        value={formData.stageM}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clinicalStage">Estágio Clínico</Label>
                      <Input
                        id="clinicalStage"
                        name="clinicalStage"
                        value={formData.clinicalStage}
                        onChange={handleChange}
                        className="lco-input"
                        required
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
                      <Label htmlFor="previousSurgery">Cirurgia ou Radioterapia</Label>
                      <Textarea
                        id="previousSurgery"
                        name="previousSurgery"
                        value={formData.previousSurgery}
                        onChange={handleChange}
                        className="lco-input h-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="previousChemoAdjuvant">Quimioterapia Adjuvante</Label>
                      <Textarea
                        id="previousChemoAdjuvant"
                        name="previousChemoAdjuvant"
                        value={formData.previousChemoAdjuvant}
                        onChange={handleChange}
                        className="lco-input h-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="previousChemo1stLine">Quimioterapia 1ª linha</Label>
                      <Textarea
                        id="previousChemo1stLine"
                        name="previousChemo1stLine"
                        value={formData.previousChemo1stLine}
                        onChange={handleChange}
                        className="lco-input h-20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="previousChemo2ndLine">Quimioterapia 2ª linha ou mais</Label>
                      <Textarea
                        id="previousChemo2ndLine"
                        name="previousChemo2ndLine"
                        value={formData.previousChemo2ndLine}
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
                      <Label htmlFor="purpose">Finalidade</Label>
                      <Select 
                        onValueChange={handleSelectChange("purpose")} 
                        defaultValue={formData.purpose}
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
                      <Label htmlFor="performanceStatus">Performance status atual</Label>
                      <Input
                        id="performanceStatus"
                        name="performanceStatus"
                        value={formData.performanceStatus}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="acronym">Siglas</Label>
                      <Input
                        id="acronym"
                        name="acronym"
                        value={formData.acronym}
                        onChange={handleChange}
                        className="lco-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plannedCycles">Números de Ciclos Previstos</Label>
                      <Input
                        id="plannedCycles"
                        name="plannedCycles"
                        type="number"
                        value={formData.plannedCycles}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentCycle">Número de ciclos Atual</Label>
                      <Input
                        id="currentCycle"
                        name="currentCycle"
                        type="number"
                        value={formData.currentCycle}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bodySurface">Superfície Corporal</Label>
                      <Input
                        id="bodySurface"
                        name="bodySurface"
                        value={formData.bodySurface}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Altura (cm)</Label>
                      <Input
                        id="height"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="medications">Medicamentos antineoplásticos</Label>
                    <Textarea
                      id="medications"
                      name="medications"
                      value={formData.medications}
                      onChange={handleChange}
                      className="lco-input"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dosage">Dose por m²</Label>
                      <Input
                        id="dosage"
                        name="dosage"
                        value={formData.dosage}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="totalDose">Dose Total</Label>
                      <Input
                        id="totalDose"
                        name="totalDose"
                        value={formData.totalDose}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="administrationRoute">Via de Adm.</Label>
                      <Input
                        id="administrationRoute"
                        name="administrationRoute"
                        value={formData.administrationRoute}
                        onChange={handleChange}
                        className="lco-input"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="applicationDays">Dias de Aplicação e intervalo</Label>
                    <Input
                      id="applicationDays"
                      name="applicationDays"
                      value={formData.applicationDays}
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
                      id="associatedMedications"
                      name="associatedMedications"
                      value={formData.associatedMedications}
                      onChange={handleChange}
                      className="lco-input min-h-[100px]"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="doctorSignature">Assinatura/CRM do Médico Solicitante</Label>
                    <Input
                      id="doctorSignature"
                      name="doctorSignature"
                      value={formData.doctorSignature}
                      onChange={handleChange}
                      className="lco-input"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authorizationNumber">Número da Autorização</Label>
                    <Input
                      id="authorizationNumber"
                      name="authorizationNumber"
                      value={formData.authorizationNumber}
                      onChange={handleChange}
                      className="lco-input"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                  <Button type="submit" className="lco-btn-primary">
                    <SendIcon className="mr-2 h-4 w-4" />
                    Gerar Relatório
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Relatórios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className="flex items-center justify-between border-b pb-4 last:border-0"
                  >
                    <div>
                      <h4 className="font-medium">Autorização de Tratamento #{1270 + i}</h4>
                      <p className="text-sm text-muted-foreground">Paciente: {i === 1 ? 'Maria Silva' : i === 2 ? 'João Mendes' : 'Ana Costa'}</p>
                      <p className="text-sm text-muted-foreground">
                        Criado em: {i === 1 ? '10/05/2024' : i === 2 ? '08/05/2024' : '02/05/2024'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" className="flex items-center">
                        <Download className="mr-2 h-4 w-4" />
                        PDF
                      </Button>
                      <Button size="sm" className="lco-btn-primary">
                        <PencilIcon className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
