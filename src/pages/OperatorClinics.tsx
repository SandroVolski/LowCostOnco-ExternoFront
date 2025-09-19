import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import AnimatedSection from '@/components/AnimatedSection';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, PieChart, Pie, Cell } from 'recharts';
import { Building2, Users as UsersIcon, FileText, BarChart3 } from 'lucide-react';
import { PacienteService, SolicitacaoService, type PatientFromAPI, type SolicitacaoFromAPI } from '@/services/api';

const OperatorClinics = () => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientFromAPI[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoFromAPI[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<'todas' | number>('todas');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [pResp, sResp] = await Promise.all([
          PacienteService.listarPacientes({ page: 1, limit: 1000 }),
          SolicitacaoService.listarSolicitacoes({ page: 1, limit: 1000 }),
        ]);
        setPatients(pResp.data || []);
        setSolicitacoes(sResp.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const clinics = useMemo(() => {
    const map = new Map<number, string>();
    patients.forEach(p => { if (p.clinica_id) map.set(p.clinica_id, `Clínica #${p.clinica_id}`); });
    solicitacoes.forEach(s => { if (s.clinica_id) map.set(s.clinica_id as number, `Clínica #${s.clinica_id}`); });
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [patients, solicitacoes]);

  const filteredPatients = useMemo(() => (
    patients.filter(p => selectedClinicId === 'todas' || p.clinica_id === selectedClinicId)
  ), [patients, selectedClinicId]);

  const filteredSolic = useMemo(() => (
    solicitacoes.filter(s => selectedClinicId === 'todas' || s.clinica_id === selectedClinicId)
  ), [solicitacoes, selectedClinicId]);

  const kpis = useMemo(() => {
    const totalClinicas = clinics.length;
    const totalPacientes = filteredPatients.length;
    const totalSolic = filteredSolic.length;
    const aprovadas = filteredSolic.filter(s => s.status === 'aprovada').length;
    const taxaAprov = totalSolic ? Math.round((aprovadas / totalSolic) * 100) : 0;
    return { totalClinicas, totalPacientes, totalSolic, taxaAprov };
  }, [clinics.length, filteredPatients, filteredSolic]);

  const statusPorClinica = useMemo(() => {
    const map: Record<number, { aprovadas: number; pendentes: number; rejeitadas: number }>
      = {};
    filteredSolic.forEach(s => {
      const id = (s.clinica_id as number) || 0;
      if (!map[id]) map[id] = { aprovadas: 0, pendentes: 0, rejeitadas: 0 };
      if (s.status === 'aprovada') map[id].aprovadas++;
      else if (s.status === 'rejeitada') map[id].rejeitadas++;
      else map[id].pendentes++;
    });
    return Object.entries(map).map(([id, v]) => ({ name: `Clin ${id}`, ...v }));
  }, [filteredSolic]);

  const pacientesPorClinica = useMemo(() => {
    const map: Record<number, number> = {};
    filteredPatients.forEach(p => { const id = p.clinica_id || 0; map[id] = (map[id] || 0) + 1; });
    return Object.entries(map).map(([id, qtd]) => ({ name: `Clin ${id}`, qtd }));
  }, [filteredPatients]);

  const TREATMENT_COLORS = [
    { fill: '#79d153', stroke: '#a5e882' },
    { fill: '#8cb369', stroke: '#a8c97d' },
    { fill: '#e4a94f', stroke: '#f2c94c' },
    { fill: '#f26b6b', stroke: '#ff8f8f' },
  ];

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
        <CardContent className="relative p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Operadora • Clínicas</div>
                <div className="text-2xl font-bold">Visão das Clínicas</div>
                <div className="text-sm text-muted-foreground">Filtros por clínica impactam todos os gráficos</div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
              <div className="min-w-[240px]">
                <div className="text-xs font-medium text-muted-foreground mb-1">Clínica</div>
                <Select onValueChange={(v) => setSelectedClinicId(v === 'todas' ? 'todas' : Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas as clínicas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as clínicas</SelectItem>
                    {clinics.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <AnimatedSection delay={60}>
          <Card className="lco-card hover-lift group">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Clínicas</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-3xl font-bold">{kpis.totalClinicas}</div>
              <Building2 className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
        </AnimatedSection>
        <AnimatedSection delay={90}>
          <Card className="lco-card hover-lift group">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Pacientes</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-3xl font-bold">{kpis.totalPacientes}</div>
              <UsersIcon className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
        </AnimatedSection>
        <AnimatedSection delay={120}>
          <Card className="lco-card hover-lift group">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Solicitações</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-3xl font-bold">{kpis.totalSolic}</div>
              <FileText className="h-6 w-6 text-support-yellow" />
            </CardContent>
          </Card>
        </AnimatedSection>
        <AnimatedSection delay={150}>
          <Card className="lco-card hover-lift group">
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-muted-foreground">Taxa de Aprovação</CardTitle></CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="text-3xl font-bold">{kpis.taxaAprov}%</div>
              <BarChart3 className="h-6 w-6 text-support-green" />
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedSection delay={200}>
          <Card className="lco-card h-[380px]">
            <CardHeader>
              <CardTitle>Status por Clínica</CardTitle>
              <CardDescription>Autorizadas, em processamento e negadas</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusPorClinica}>
                  <CartesianGrid strokeDasharray="5 5" opacity={0.08} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="aprovadas" name="Autorizadas" fill="#22c55e" />
                  <Bar dataKey="pendentes" name="Em Processamento" fill="#f59e0b" />
                  <Bar dataKey="rejeitadas" name="Negadas" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedSection>
        <AnimatedSection delay={240}>
          <Card className="lco-card h-[380px]">
            <CardHeader>
              <CardTitle>Pacientes por Clínica</CardTitle>
              <CardDescription>Distribuição entre clínicas</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pacientesPorClinica}>
                  <CartesianGrid strokeDasharray="5 5" opacity={0.08} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="qtd" name="Pacientes" fill="#3b82f6" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>
    </div>
  );
};

export default OperatorClinics;


