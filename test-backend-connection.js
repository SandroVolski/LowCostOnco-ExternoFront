// test-backend-connection.js
// Teste simples para verificar se o backend está funcionando

const testBackendConnection = async () => {
  try {
    console.log('🔧 Testando conexão com o backend...');
    
    // Teste 1: Health check
    console.log('\n📋 Teste 1: Health Check');
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData);
    
    // Teste 2: API Health
    console.log('\n📋 Teste 2: API Health');
    const apiHealthResponse = await fetch('http://localhost:3001/api/health');
    const apiHealthData = await apiHealthResponse.json();
    console.log('✅ API Health:', apiHealthData);
    
    // Teste 3: Listar clínicas (rota administrativa)
    console.log('\n📋 Teste 3: Listar Clínicas (Admin)');
    const clinicasResponse = await fetch('http://localhost:3001/api/clinicas/admin');
    const clinicasData = await clinicasResponse.json();
    console.log('✅ Clínicas:', clinicasData);
    
    console.log('\n🎉 Todos os testes passaram! Backend está funcionando.');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Dicas para resolver:');
      console.log('1. Verifique se o backend está rodando na porta 3001');
      console.log('2. Execute: cd sistema-clinicas-backend && npm run dev');
      console.log('3. Verifique se não há erros no console do backend');
    }
  }
};

// Executar teste
testBackendConnection();
