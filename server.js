const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = 3001;

// Configuração do MySQL
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'acesso123',
  database: 'amigo',
});

// Conectar ao MySQL
connection.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
  } else {
    console.log('Conectado ao MySQL');
  }
});

// Serve arquivos estáticos do diretório 'public'
app.use(express.static('public'));

// Middleware para processar dados do corpo das requisições
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Rota para salvar usuário host
app.post('/api/userhost', (req, res) => {
  const { nome, email, senha } = req.body;

  // Inserir os dados do usuário na tabela 'userhost' com senha em texto simples
  connection.query('INSERT INTO userhost (nome, email, senha) VALUES (?, ?, ?)', [nome, email, senha], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erro no servidor' });
    }

    // Redirecionar para '/grupo' após inserção bem-sucedida
    res.redirect('/login');
  });
});

// API endpoint for user login
app.post('/login', (req, res) => {
    const { nome, email } = req.body;
  
    // Retrieve user data from the 'users' table
    connection.query('SELECT * FROM userhost WHERE nome = ? AND senha = ?', [nome, email], (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Erro no servidor' });
      }
  
      if (results.length === 0) {
        return res.status(401).json({ message: 'Credenciais inválidas' });
      }
  
      // Redirecione o usuário para a página halloween.html
      res.redirect('/grupo');
    });
  });
  
// Rota para salvar participante
app.post('/api/participants', (req, res) => {
    const { nome, email } = req.body;
    
    const sql = 'INSERT INTO participants (nome, email) VALUES (?, ?)';
    
    connection.query(sql, [nome, email], (err, result) => {
        if (err) {
            console.error('Erro ao inserir participante:', err);
            res.status(500).json({ error: 'Erro interno do servidor' });
        } else {
            res.status(201).json({ message: 'Participante cadastrado com sucesso' });
        }
    });
});

// Rotas para as páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/cadastro', (req, res) => {
    res.sendFile(path.join(__dirname, '/paginas/cadastro.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/paginas/login.html'));
});

app.get('/grupo', (req, res) => {
    res.sendFile(path.join(__dirname, '/paginas/grupo.html'));
});

app.get('/inscricao', (req, res) => {
    res.sendFile(path.join(__dirname, '/paginas/inscricao.html'));
});

app.get('/participantes', (req, res) => {
    res.sendFile(path.join(__dirname, 'participantes.html'));
});

// Inicia o servidor na porta 3001
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
