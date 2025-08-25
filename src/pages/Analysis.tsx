import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// Mock data for charts
const medicationData = [
  { name: 'Trastuzumabe', value: 35 },
  { name: 'Bevacizumabe', value: 25 },
  { name: 'Pembrolizumabe', value: 20 },
  { name: 'Rituximabe', value: 15 },
  { name: 'Outros', value: 5 },
];

const monthlyData = [
  { name: 'Jan', cost: 120000, patients: 35 },
  { name: 'Fev', cost: 145000, patients: 42 },
  { name: 'Mar', cost: 132000, patients: 38 },
  { name: 'Abr', cost: 170000, patients: 55 },
  { name: 'Mai', cost: 190000, patients: 65 },
];

const cancerTypeData = [
  { name: 'Mama', cases: 42 },
  { name: 'Pulmão', cases: 28 },
  { name: 'Colorretal', cases: 22 },
  { name: 'Próstata', cases: 18 },
  { name: 'Linfomas', cases: 15 },
  { name: 'Outros', cases: 30 },
];

const costReductionData = [
  { name: 'Jan', traditional: 200000, lowCost: 120000 },
  { name: 'Fev', traditional: 220000, lowCost: 145000 },
  { name: 'Mar', traditional: 210000, lowCost: 132000 },
  { name: 'Abr', traditional: 260000, lowCost: 170000 },
  { name: 'Mai', traditional: 280000, lowCost: 190000 },
];

// Custom colors that match our brand
const COLORS = ['#79d153', '#8cb369', '#e4a94f', '#f26b6b', '#f7c59f', '#575654'];

const Analysis = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Análise de Dados</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lco-card">
          <CardHeader>
            <CardTitle>Distribuição de Medicamentos</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={medicationData}
                  cx="50%"
                  cy="60%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {medicationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="lco-card">
          <CardHeader>
            <CardTitle>Tipos de Câncer Tratados</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={cancerTypeData}
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
                <Tooltip />
                <Legend />
                <Bar dataKey="cases" fill="#79d153" name="Número de Casos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="lco-card">
          <CardHeader>
            <CardTitle>Custos e Pacientes por Mês</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#79d153" />
                <YAxis yAxisId="right" orientation="right" stroke="#8cb369" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="cost" stroke="#79d153" name="Custos (R$)" />
                <Line yAxisId="right" type="monotone" dataKey="patients" stroke="#8cb369" name="Pacientes" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="lco-card">
          <CardHeader>
            <CardTitle>Economia vs. Modelo Tradicional</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={costReductionData}
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
                <Tooltip />
                <Legend />
                <Bar dataKey="traditional" fill="#f26b6b" name="Modelo Tradicional (R$)" />
                <Bar dataKey="lowCost" fill="#8cb369" name="Low Cost Onco (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <Card className="lco-card">
        <CardHeader>
          <CardTitle>Indicadores de Desempenho</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">Economia Total</h3>
              <p className="text-3xl font-bold text-support-green">R$ 523.000</p>
              <p className="text-sm text-muted-foreground mt-2">vs. modelo tradicional</p>
            </div>
            
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">Eficiência de Tratamento</h3>
              <p className="text-3xl font-bold text-primary-green">87%</p>
              <p className="text-sm text-muted-foreground mt-2">taxa de resposta positiva</p>
            </div>
            
            <div className="text-center p-6 border rounded-lg">
              <h3 className="text-lg font-medium mb-2">Satisfação do Paciente</h3>
              <p className="text-3xl font-bold text-highlight-peach">9.2/10</p>
              <p className="text-sm text-muted-foreground mt-2">baseado em pesquisas</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analysis;
