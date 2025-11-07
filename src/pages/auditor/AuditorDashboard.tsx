import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuditorAuth } from '@/contexts/AuditorAuthContext';
import { AuditorService, RecursoGlosaAuditor } from '@/services/auditorService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCog,
  LogOut,
  ChartBar,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Calendar,
  Building2,
  DollarSign,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import AnimatedSection from '@/components/AnimatedSection';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface DashboardData {
  total_recursos: number;
  aguardando_analise: number;
  pareceres_emitidos: number;
  media_tempo_analise: number;
  recursos_recentes: any[];
  pendentes_nao_analisados?: number;
}

const AuditorDashboard = () => {
  const navigate = useNavigate();
  const { auditor, logout } = useAuditorAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recursosLista, setRecursosLista] = useState<RecursoGlosaAuditor[]>([]);
  const [pendentesNaoAnalisados, setPendentesNaoAnalisados] = useState(0);
  const pendentesSetRef = useRef<Set<number>>(new Set());
  const initialLoadRef = useRef(true);

  useEffect(() => {
    loadDashboard();
    loadRecursos();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadRecursos(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await AuditorService.getDashboard();

      if (data && typeof data === 'object') {
        setDashboard(data);
        setPendentesNaoAnalisados(data.pendentes_nao_analisados || 0);
      } else {
        const recursos = await AuditorService.listarRecursos();
        const total = recursos.length;
        const aguardando = recursos.filter(r => ['pendente', 'em_analise_auditor', 'solicitado_parecer'].includes(r.status_recurso)).length;
        const pendentes = recursos.filter(r => r.status_recurso === 'pendente').length;
        const emitidos = recursos.filter(r => r.status_recurso === 'parecer_emitido').length;
        const tempos: number[] = (recursos as any[])
          .map(r => Number(r?.tempo_analise_minutos))
          .filter((n) => Number.isFinite(n) && n > 0);
        const media = tempos.length ? Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length) : 0;

        const fallback: DashboardData = {
          total_recursos: total,
          aguardando_analise: aguardando,
          pareceres_emitidos: emitidos,
          media_tempo_analise: media,
          pendentes_nao_analisados: pendentes,
          recursos_recentes: recursos.slice(0, 5),
        };

        setDashboard(fallback);
        setPendentesNaoAnalisados(pendentes);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao carregar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleVerPendentes = () => {
    navigate('/auditor/recursos?status=pendente');
  };

  // ====== Lista e analytics ======
  const loadRecursos = async (silent = false) => {
    try {
      const lista = await AuditorService.listarRecursos();
      setRecursosLista(lista);
      const pendentes = lista.filter(r => r.status_recurso === 'pendente');
      setPendentesNaoAnalisados(pendentes.length);

      setDashboard(prev => prev ? { ...prev, pendentes_nao_analisados: pendentes.length } : prev);

      if (silent) {
        if (!initialLoadRef.current) {
          const novosPendentes = pendentes.filter(r => !pendentesSetRef.current.has(r.id));
          if (novosPendentes.length > 0) {
            toast.info(`Você tem ${novosPendentes.length} novo(s) recurso(s) pendente(s) para analisar.`);
          }
        }
      }

      pendentesSetRef.current = new Set(pendentes.map(r => r.id));
      initialLoadRef.current = false;
    } catch (e) {
      // silencioso
    }
  };

  const diffDias = (iso: string) => {
    if (!iso) return 0;
    const d = new Date(iso);
    const now = new Date();
    return Math.max(0, Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)));
  };

  // Top Operadoras
  const topOperadoras = (() => {
    const map = new Map<string, number>();
    for (const r of recursosLista) {
      const k = r.operadora_nome || '—';
      map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  })();

  // Motivos recorrentes (parse JSON ou separado por vírgulas/linhas)
  const motivosRecorrentes = (() => {
    const cnt = new Map<string, number>();
    const add = (s: string) => {
      const key = s.trim();
      if (!key) return;
      cnt.set(key, (cnt.get(key) || 0) + 1);
    };
    for (const r of recursosLista) {
      const raw = String(r.motivos_glosa || '').trim();
      if (!raw) continue;
      try {
        if (raw.startsWith('[')) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) arr.forEach((m: any) => add(String(m)));
          continue;
        }
      } catch {}
      raw.split(/[\n;,]+/).forEach(add);
    }
    return Array.from(cnt.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  })();

  // Aging buckets
  const agingBuckets = (() => {
    const buckets = { d0_1: 0, d2_3: 0, d4_5: 0, d6p: 0 };
    for (const r of recursosLista) {
      if (r.status_recurso !== 'em_analise_auditor' && r.status_recurso !== 'solicitado_parecer') continue;
      const d = diffDias(r.data_envio_clinica);
      if (d <= 1) buckets.d0_1++;
      else if (d <= 3) buckets.d2_3++;
      else if (d <= 5) buckets.d4_5++;
      else buckets.d6p++;
    }
    const total = buckets.d0_1 + buckets.d2_3 + buckets.d4_5 + buckets.d6p || 1;
    const pct = (n: number) => Math.round((n / total) * 100);
    return { buckets, pct };
  })();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-screen-2xl mx-auto px-4 md:px-6">
      {/* Header */}
      <AnimatedSection>
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8">
          <div className="absolute inset-0 bg-grid-white/10" />
          <div className="relative">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Painel do Auditor
              </h1>
              <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                Bem-vindo, <span className="font-semibold text-foreground">{auditor?.nome}</span>
                {auditor?.registro_profissional && (
                  <span className="ml-2">- {auditor.registro_profissional}</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {!loading && pendentesNaoAnalisados > 0 && (
        <AnimatedSection delay={80}>
          <Alert className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-200">
              <Bell className="h-4 w-4" />
              Recursos aguardando análise inicial
            </AlertTitle>
            <AlertDescription className="flex flex-wrap items-center gap-3 text-sm text-amber-900 dark:text-amber-100">
              Existem {pendentesNaoAnalisados} recurso(s) pendente(s) aguardando triagem.
              <Button variant="outline" size="sm" onClick={handleVerPendentes} className="border-amber-500 text-amber-700 hover:bg-amber-500/10">
                Ver pendentes
              </Button>
            </AlertDescription>
          </Alert>
        </AnimatedSection>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatedSection delay={100}>
          <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Total de Recursos
                    </p>
                    <p className="text-3xl font-extrabold text-foreground">
                      {dashboard?.total_recursos || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={150}>
            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-amber-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Aguardando Análise
                    </p>
                    <p className="text-3xl font-extrabold text-amber-500 dark:text-amber-400">
                      {dashboard?.aguardando_analise || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl">
                    <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Pareceres Emitidos
                    </p>
                    <p className="text-3xl font-extrabold text-green-500 dark:text-green-400">
                      {dashboard?.pareceres_emitidos || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-green-500/10 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>

          <AnimatedSection delay={250}>
            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Tempo Médio
                    </p>
                    <p className="text-3xl font-extrabold text-blue-500 dark:text-blue-400">
                      {dashboard?.media_tempo_analise || 0}
                      <span className="ml-1 text-sm font-semibold text-muted-foreground">min</span>
                    </p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <ChartBar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedSection>
        </div>

      {/* Recursos Recentes (substitui ações duplicadas) */}
      {dashboard?.recursos_recentes && dashboard.recursos_recentes.length > 0 && (
        <AnimatedSection delay={300}>
          <Card className="hover:shadow-xl transition-all duration-300 border-2 border-border hover:border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recursos Recentes
              </CardTitle>
              <CardDescription>
                Últimos recursos atribuídos para análise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboard.recursos_recentes.map((recurso: any) => (
                  <div
                    key={recurso.id}
                    className="flex items-center justify-between p-4 border rounded-xl hover:bg-accent/50 cursor-pointer transition-all duration-300 group"
                    onClick={() => navigate(`/auditor/recursos/${recurso.id}`)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">Guia {recurso.numero_guia_prestador}</span>
                          <Badge 
                            variant={
                              recurso.status_recurso === 'em_analise_auditor' ? 'default' :
                              recurso.status_recurso === 'parecer_emitido' ? 'secondary' :
                              'outline'
                            }
                          >
                            {recurso.status_recurso === 'em_analise_auditor' ? 'Em Análise' :
                             recurso.status_recurso === 'parecer_emitido' ? 'Parecer Emitido' :
                             recurso.status_recurso}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3" />
                          <span>{recurso.clinica_nome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3" />
                          <span>{recurso.operadora_nome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3 w-3" />
                          <span className="font-semibold text-foreground">
                            R$ {parseFloat(recurso.valor_guia).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors ml-4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </AnimatedSection>
      )}

      {/* Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatedSection delay={400}>
          <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 border-border hover:border-primary/20 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Principais Operadoras</CardTitle>
              <CardDescription>Maiores volumes no período</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[220px]">
              {topOperadoras.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
              ) : (
                <div className="space-y-3">
                  {topOperadoras.map(([nome, qtd]) => (
                    <div key={nome} className="flex items-center gap-3">
                      <div className="w-40 truncate text-sm">{nome}</div>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-2 bg-primary rounded-full" style={{ width: `${Math.min(100, (qtd / topOperadoras[0][1]) * 100)}%` }} />
                      </div>
                      <div className="w-8 text-right text-sm tabular-nums">{qtd}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>

        <AnimatedSection delay={450}>
          <Card className="hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-2 border-border hover:border-primary/20 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Motivos mais recorrentes</CardTitle>
              <CardDescription>Principais causas nas glosas</CardDescription>
            </CardHeader>
            <CardContent className="min-h-[220px]">
              {motivosRecorrentes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
              ) : (
                <div className="space-y-3">
                  {motivosRecorrentes.map(([motivo, qtd]) => (
                    <div key={motivo} className="flex items-center gap-3">
                      <div className="flex-1 text-sm truncate">{motivo}</div>
                      <Badge variant="secondary" className="text-xs">{qtd}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedSection>
      </div>

      {/* Aging da fila */}
      <AnimatedSection delay={500}>
        <Card className="hover:shadow-xl transition-all duration-300 border-2 border-border hover:border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Tempo de Espera</CardTitle>
            <CardDescription>Tempo de espera dos pendentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {([
                { label: '0–1d', value: agingBuckets.buckets.d0_1, pct: agingBuckets.pct(agingBuckets.buckets.d0_1), color: 'bg-green-500' },
                { label: '2–3d', value: agingBuckets.buckets.d2_3, pct: agingBuckets.pct(agingBuckets.buckets.d2_3), color: 'bg-amber-500' },
                { label: '4–5d', value: agingBuckets.buckets.d4_5, pct: agingBuckets.pct(agingBuckets.buckets.d4_5), color: 'bg-orange-500' },
                { label: '6+d', value: agingBuckets.buckets.d6p, pct: agingBuckets.pct(agingBuckets.buckets.d6p), color: 'bg-red-500' },
              ] as any[]).map((b) => (
                <div key={b.label} className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-2">{b.label}</p>
                  <div className="flex items-end gap-2">
                    <div className="flex-1 h-10 bg-muted rounded">
                      <div className={`${b.color} h-full rounded`} style={{ width: `${b.pct}%` }} />
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold tabular-nums">{b.value}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">{b.pct}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      {/* Recursos Recentes removido conforme solicitado */}
    </div>
  );
};

export default AuditorDashboard;
