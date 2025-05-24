
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DownloadIcon, FilterIcon } from 'lucide-react';
import { PieChart, Pie, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// Mock data for charts
const expensesByCategoryData = [
  { name: 'Medicamentos', value: 2750000 },
  { name: 'Consultas', value: 450000 },
  { name: 'Exames', value: 680000 },
  { name: 'Internações', value: 840000 },
  { name: 'Cirurgias', value: 520000 },
];

const monthlyExpensesData = [
  { name: 'Jan', value: 980000 },
  { name: 'Fev', value: 1050000 },
  { name: 'Mar', value: 920000 },
  { name: 'Abr', value: 1110000 },
  { name: 'Mai', value: 1250000 },
  { name: 'Jun', value: 1180000 },
];

const topClinicExpensesData = [
  { name: 'Clínica A', value: 850000 },
  { name: 'Clínica B', value: 720000 },
  { name: 'Clínica C', value: 680000 },
  { name: 'Clínica D', value: 520000 },
  { name: 'Clínica E', value: 450000 },
];

const medicationCostData = [
  { name: 'Trastuzumabe', cost: 620000 },
  { name: 'Pembrolizumabe', cost: 580000 },
  { name: 'Bevacizumabe', cost: 520000 },
  { name: 'Rituximabe', cost: 480000 },
  { name: 'Nivolumabe', cost: 430000 },
  { name: 'Outros', cost: 620000 },
];

// Custom colors that match our brand
const COLORS = ['#c6d651', '#8cb369', '#e4a94f', '#35524a', '#f26b6b', '#575654'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const Expenses = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Análise de Gastos</h1>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" className="flex items-center">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
          <Button variant="outline" className="flex items-center">
            <DownloadIcon className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="lco-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Gastos Totais (Ano atual)</h3>
              <p className="text-3xl font-bold">R$ 5.24M</p>
              <p className="text-sm text-support-green mt-1">↓ 12% em relação ao ano anterior</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lco-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Gasto Médio por Paciente</h3>
              <p className="text-3xl font-bold">R$ 42.500</p>
              <p className="text-sm text-support-green mt-1">↓ 8% em relação ao ano anterior</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lco-card">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Economia com LCO</h3>
              <p className="text-3xl font-bold">R$ 1.75M</p>
              <p className="text-sm text-highlight-red mt-1">↑ 15% em relação ao ano anterior</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview">
        <TabsList className="w-full max-w-md grid grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="clinics">Por Clínica</TabsTrigger>
          <TabsTrigger value="medications">Medicamentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 pt-4">
          <Card className="lco-card">
            <CardHeader>
              <CardTitle>Distribuição de Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesByCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => 
                      `${name}: ${formatCurrency(value)} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {expensesByCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="lco-card">
            <CardHeader>
              <CardTitle>Gastos Mensais</CardTitle>
              <CardDescription>Evolução dos gastos oncológicos nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={monthlyExpensesData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#c6d651"
                    activeDot={{ r: 8 }}
                    name="Gastos Mensais"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clinics" className="space-y-6 pt-4">
          <Card className="lco-card">
            <CardHeader>
              <CardTitle>Gastos por Clínica</CardTitle>
              <CardDescription>Top 5 clínicas com maiores gastos</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topClinicExpensesData}
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 100,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="value" fill="#8cb369" name="Total de Gastos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lco-card">
              <CardHeader>
                <CardTitle>Detalhes da Clínica A</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pacientes Ativos</span>
                  <span className="font-medium">78</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Custo Médio/Paciente</span>
                  <span className="font-medium">R$ 10.897,44</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total de Tratamentos</span>
                  <span className="font-medium">92</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Autorizações Pendentes</span>
                  <span className="font-medium">7</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="lco-card">
              <CardHeader>
                <CardTitle>Detalhes da Clínica B</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Pacientes Ativos</span>
                  <span className="font-medium">65</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Custo Médio/Paciente</span>
                  <span className="font-medium">R$ 11.076,92</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total de Tratamentos</span>
                  <span className="font-medium">77</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Autorizações Pendentes</span>
                  <span className="font-medium">5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="medications" className="space-y-6 pt-4">
          <Card className="lco-card">
            <CardHeader>
              <CardTitle>Gastos por Medicamento</CardTitle>
              <CardDescription>Principais medicamentos por custo total</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={medicationCostData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="cost" fill="#e4a94f" name="Custo Total">
                    {medicationCostData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card className="lco-card">
            <CardHeader>
              <CardTitle>Análise de Economia</CardTitle>
              <CardDescription>Comparação de custos entre modelos convencionais e Low Cost Onco</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Trastuzumabe</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span>Modelo Convencional</span>
                    <span className="font-medium">R$ 980.000</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Low Cost Onco</span>
                    <span className="font-medium">R$ 620.000</span>
                  </div>
                  <div className="flex justify-between items-center text-support-green">
                    <span>Economia</span>
                    <span className="font-medium">R$ 360.000 (36,7%)</span>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="text-lg font-medium mb-2">Pembrolizumabe</h3>
                  <div className="flex justify-between items-center mb-2">
                    <span>Modelo Convencional</span>
                    <span className="font-medium">R$ 860.000</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Low Cost Onco</span>
                    <span className="font-medium">R$ 580.000</span>
                  </div>
                  <div className="flex justify-between items-center text-support-green">
                    <span>Economia</span>
                    <span className="font-medium">R$ 280.000 (32,6%)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Expenses;
