import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UsersIcon, Search, BarChart3, Filter } from 'lucide-react';
import { PacienteService, type PatientFromAPI } from '@/services/api';
import AnimatedSection from '@/components/AnimatedSection';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, PieChart, Pie, Legend } from 'recharts';

const OperatorPatients = () => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<PatientFromAPI[]>([]);
  const [search, setSearch] = useState('');
  const [selectedClinicId, setSelectedClinicId] = useState<'todas' | number>('todas');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await PacienteService.listarPacientes({ page: 1, limit: 1000 });
        setPatients(res.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Mock de clínicas a partir dos próprios pacientes
  const clinics = useMemo(() => {
    const map = new Map<number, string>();
    patients.forEach(p => {
      if (p.clinica_id) map.set(p.clinica_id, `Clínica #${p.clinica_id}`);
    });
    return Array.from(map.entries()).map(([id, nome]) => ({ id, nome }));
  }, [patients]);

  const filtered = useMemo(() => {
    return patients.filter(p => {
      const byClinic = selectedClinicId === 'todas' || p.clinica_id === selectedClinicId;
      const term = search.trim().toLowerCase();
      const bySearch = !term || `${p.Paciente_Nome || ''} ${p.Cid_Diagnostico || ''}`.toLowerCase().includes(term);
      return byClinic && bySearch;
    });
  }, [patients, selectedClinicId, search]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const emTratamento = filtered.filter(p => (p.status || '').toLowerCase().includes('trat')).length;
    const alta = filtered.filter(p => (p.status || '').toLowerCase().includes('alta')).length;
    return { total, emTratamento, alta };
  }, [filtered]);

  const porCid = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(p => {
      const key = p.Cid_Diagnostico || 'N/A';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).slice(0, 10).map(([name, qtd]) => ({ name, qtd }));
  }, [filtered]);

  const porClinica = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(p => {
      const key = p.clinica_id ? `Clin ${p.clinica_id}` : 'N/A';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, qtd]) => ({ name, qtd }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10" />
        <CardContent className="relative p-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <UsersIcon className="h-7 w-7 text-primary" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Operadora • Visão de Pacientes</div>
                <div className="text-2xl font-bold">Pacientes das Clínicas</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
              <div className="min-w-[220px]">
                <div className="text-xs font-medium text-muted-foreground mb-1">Clínica</div>
                <Select onValueChange={(v) => setSelectedClinicId(v === 'todas' ? 'todas' : Number(v))}>
                  <SelectTrigger>
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
              <div className="min-w-[220px]">
                <div className="text-xs font-medium text-muted-foreground mb-1">Buscar</div>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nome ou CID" className="pl-8" />
                </div>
              </div>
              <div className="flex items-end">
                <Button variant="outline" className="w-full"><Filter className="h-4 w-4 mr-2"/>Filtros</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AnimatedSection delay={60}>
          <Card className="lco-card hover-lift">
            <CardHeader className="pb-2"><CardTitle>Total de Pacientes</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{kpis.total}</div></CardContent>
          </Card>
        </AnimatedSection>
        <AnimatedSection delay={100}>
          <Card className="lco-card hover-lift">
            <CardHeader className="pb-2"><CardTitle>Em Tratamento</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{kpis.emTratamento}</div></CardContent>
          </Card>
        </AnimatedSection>
        <AnimatedSection delay={140}>
          <Card className="lco-card hover-lift">
            <CardHeader className="pb-2"><CardTitle>Altas</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold">{kpis.alta}</div></CardContent>
          </Card>
        </AnimatedSection>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedSection delay={200}>
          <Card className="lco-card h-[380px]">
            <CardHeader>
              <CardTitle>Pacientes por Clínica</CardTitle>
              <CardDescription>Distribuição entre clínicas</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porClinica}>
                  <CartesianGrid strokeDasharray="5 5" opacity={0.08} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="qtd" name="Pacientes" fill="#22c55e" radius={[8,8,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </AnimatedSection>

        <AnimatedSection delay={240}>
          <Card className="lco-card h-[380px]">
            <CardHeader>
              <CardTitle>Top CIDs</CardTitle>
              <CardDescription>Concentração por diagnóstico</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porCid}>
                  <CartesianGrid strokeDasharray="5 5" opacity={0.08} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" interval={0} angle={-15} textAnchor="end" height={60} />
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

export default OperatorPatients;


