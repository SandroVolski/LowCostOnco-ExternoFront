export type PatientStatus = 'Em tratamento' | 'Em remissão' | 'Alta' | 'Óbito' | 'Suspenso';

export interface Patient {
  id: number;
  clinica_id: number;
  Paciente_Nome: string;
  Operadora: string;
  Prestador: string;
  Codigo: string;
  Data_Nascimento: string;
  Sexo: string;
  Cid_Diagnostico: string;
  Data_Primeira_Solicitacao: string;
  cpf: string;
  rg: string;
  telefone: string;
  endereco: string;
  email: string;
  plano_saude: string;
  numero_carteirinha: string;
  status: PatientStatus;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export const emptyPatient: Omit<Patient, 'id' | 'clinica_id' | 'created_at' | 'updated_at'> = {
  Paciente_Nome: '',
  Operadora: '',
  Prestador: '',
  Codigo: '',
  Data_Nascimento: '',
  Sexo: '',
  Cid_Diagnostico: '',
  Data_Primeira_Solicitacao: '',
  cpf: '',
  rg: '',
  telefone: '',
  endereco: '',
  email: '',
  plano_saude: '',
  numero_carteirinha: '',
  status: 'ativo',
  observacoes: ''
}; 