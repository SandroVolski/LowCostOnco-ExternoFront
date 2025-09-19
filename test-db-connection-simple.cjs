// test-db-connection-simple.cjs
// Teste simples para verificar conexão com banco

const mysql = require('mysql2/promise');

const testConnection = async () => {
  try {
    console.log('🔧 Testando conexão com banco de dados...');
    
    // Configuração do banco (igual ao backend)
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', // Senha vazia
      database: 'bd_sistema_clinicas',
      port: 3306
    });
    
    console.log('✅ Conectado ao banco de dados!');
    
    // Teste 1: Verificar se a tabela Clinicas existe
    console.log('\n📋 Teste 1: Verificando tabela Clinicas');
    const [tables] = await connection.execute('SHOW TABLES LIKE "Clinicas"');
    
    if (tables.length > 0) {
      console.log('✅ Tabela Clinicas encontrada');
    } else {
      console.log('❌ Tabela Clinicas NÃO encontrada');
      console.log('📋 Tabelas disponíveis:');
      const [allTables] = await connection.execute('SHOW TABLES');
      allTables.forEach(table => {
        console.log(`  - ${Object.values(table)[0]}`);
      });
    }
    
    // Teste 2: Contar clínicas na tabela
    if (tables.length > 0) {
      console.log('\n📋 Teste 2: Contando clínicas na tabela');
      const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM Clinicas');
      console.log('📊 Total de clínicas na tabela:', countResult[0].total);
      
      // Teste 3: Listar algumas clínicas
      if (countResult[0].total > 0) {
        console.log('\n📋 Teste 3: Listando primeiras clínicas');
        const [clinicas] = await connection.execute('SELECT id, nome, codigo FROM Clinicas LIMIT 5');
        clinicas.forEach(clinica => {
          console.log(`  - ID: ${clinica.id}, Nome: ${clinica.nome}, Código: ${clinica.codigo}`);
        });
      }
    }
    
    await connection.end();
    console.log('\n🎉 Teste concluído!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Solução: Verifique se o MySQL/XAMPP está rodando');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Solução: Verifique usuário e senha do banco');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 Solução: Verifique se o banco "bd_sistema_clinicas" existe');
    }
  }
};

testConnection();
