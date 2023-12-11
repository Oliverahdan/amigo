const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');

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

// Middleware para processar dados do corpo das requisições
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração da sessão
app.use(session({
  secret: 'suaChaveSecreta',
  resave: false,
  saveUninitialized: true,
}));

// Rota para salvar usuário host
app.post('/api/userhost', (req, res) => {
  const { nome, email, senha } = req.body;

  // Inserir os dados do usuário na tabela 'userhost' com senha em texto simples
  connection.query('INSERT INTO userhost (nome, email, senha) VALUES (?, ?, ?)', [nome, email, senha], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Erro no servidor' });
    }

    // Configurar a sessão do usuário
    req.session.userhostId = results.insertId;

    // Redirecionar para '/grupo' após inserção bem-sucedida
    res.redirect('/grupo');
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

    // Configurar a sessão do usuário
    req.session.userhostId = results[0].id;

    // Redirecione o usuário para a página de grupo
    res.redirect('/grupo');
  });
});

// Middleware para verificar autenticação
const verificarAutenticacao = (req, res, next) => {
  // Verificar se o usuário está autenticado
  if (req.session.userhostId) {
    // Se estiver autenticado, continue para a próxima rota
    next();
  } else {
    // Se não estiver autenticado, redirecione para a página de login
    res.redirect('/login');
  }
};

// Rota para criar evento
app.post('/api/criarevento', (req, res) => {
  const { nome_evento, quantidade, userhost_id } = req.body;

  // Inserir os dados do evento na tabela 'eventos'
  const sql = 'INSERT INTO events (nome_evento, quantidade, userhost_id) VALUES (?, ?, ?)';
  connection.query(sql, [nome_evento, quantidade, userhost_id], (err, result) => {
    if (err) {
      console.error('Erro ao inserir evento:', err);
      res.status(500).json({ error: 'Erro interno do servidor' });
    } else {
      // Enviar uma resposta de sucesso para o cliente
      res.status(201).json({ message: 'Evento criado com sucesso' });
    }
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
