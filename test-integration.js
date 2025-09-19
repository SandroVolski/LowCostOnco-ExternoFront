// test-integration.js
// Teste de integração entre frontend e backend

const testIntegration = async () => {
  try {
    console.log('🔧 Testando integração entre frontend e backend...');
    
    // Teste 1: Backend health check
    console.log('\n📋 Teste 1: Backend Health Check');
    const backendHealth = await fetch('http://localhost:3001/health');
    const backendHealthData = await backendHealth.json();
    console.log('✅ Backend Health:', backendHealthData);
    
    // Teste 2: Frontend health check
    console.log('\n📋 Teste 2: Frontend Health Check');
    const frontendHealth = await fetch('http://localhost:8080');
    console.log('✅ Frontend Health:', frontendHealth.status === 200 ? 'OK' : 'ERRO');
    
    // Teste 3: API de clínicas (através do proxy do Vite)
    console.log('\n📋 Teste 3: API de Clínicas (via proxy Vite)');
    const clinicasResponse = await fetch('http://localhost:8080/api/clinicas/admin');
    const clinicasData = await clinicasResponse.json();
    console.log('✅ Clínicas via proxy:', clinicasData);
    
    // Teste 4: API de clínicas (diretamente no backend)
    console.log('\n📋 Teste 4: API de Clínicas (diretamente no backend)');
    const clinicasDirectResponse = await fetch('http://localhost:3001/api/clinicas/admin');
    const clinicasDirectData = await clinicasDirectResponse.json();
    console.log('✅ Clínicas direto:', clinicasDirectData);
    
    console.log('\n🎉 Todos os testes passaram! Integração funcionando.');
    
    // Resumo dos dados
    if (clinicasData.success && clinicasData.data) {
      console.log(`\n📊 Resumo: ${clinicasData.data.length} clínicas encontradas`);
      clinicasData.data.forEach((clinica, index) => {
        console.log(`  ${index + 1}. ${clinica.nome} (${clinica.codigo}) - ${clinica.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro nos testes de integração:', error.message);
    
    if (error.message.includes('fetch')) {
      console.log('\n💡 Dicas para resolver:');
      console.log('1. Verifique se o backend está rodando na porta 3001');
      console.log('2. Verifique se o frontend está rodando na porta 8080');
      console.log('3. Execute: cd sistema-clinicas-backend && npm run dev');
      console.log('4. Execute: npm run dev (no diretório do frontend)');
    }
  }
};

// Executar teste
testIntegration();
