const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const nodemailer = require('nodemailer');

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

// Função para enviar e-mail
function enviarEmail(destinatario, assunto, corpo) {
  // Configurações do transporte de e-mail (usando Gmail como exemplo)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'dos03042003@gmail.com',
      pass: 'vpow fvyt ixjg crvq',
    },
  });

  // Configurações do e-mail
  const mailOptions = {
    from: 'dos03042003@gmail.com',
    to: destinatario,
    subject: assunto,
    text: corpo,
  };

  // Enviar o e-mail
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Erro ao enviar e-mail:', error);
    } else {
      console.log('E-mail enviado:', info.response);
    }
  });
}

// Rota para realizar sorteio e enviar e-mails
app.post('/api/sorteio', (req, res) => {
  // Consulta todos os participantes na tabela 'participants'
  connection.query('SELECT * FROM participants', (err, participants) => {
    if (err) {
      console.error('Erro ao buscar participantes:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    // Realiza o sorteio (exemplo simples, pode ser mais complexo)
    const sorteio = sortear(participants);

    // Enviar e-mails para os participantes com os resultados do sorteio
    participants.forEach(participant => {
      const destinatario = participant.email;
      const assunto = 'Resultado do Sorteio';
      const destinatarioSorteado = participants.find(p => p.id === sorteio[participant.id]);
      const corpo = `Você saiu com ${destinatarioSorteado.nome}`;

      enviarEmail(destinatario, assunto, corpo);
    });

    // Retorna a mensagem de sucesso
    res.status(200).json({ message: 'Sorteio realizado e e-mails enviados com sucesso' });
  });
});

// Função para realizar o sorteio
function sortear(participants) {
  const shuffledParticipants = [...participants]; // Para não modificar o array original
  for (let i = shuffledParticipants.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledParticipants[i], shuffledParticipants[j]] = [shuffledParticipants[j], shuffledParticipants[i]];
  }

  const sorteio = {};
  for (let i = 0; i < shuffledParticipants.length; i++) {
    sorteio[shuffledParticipants[i].id] = shuffledParticipants[(i + 1) % shuffledParticipants.length].id;
  }

  return sorteio;
}
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

  // Verifique se os dados estão presentes
  if (!nome || !email) {
    return res.status(400).json({ message: 'Nome e email são obrigatórios.' });
  }

  // Insira os dados do participante na tabela 'participants'
  connection.query('INSERT INTO participants (nome, email) VALUES (?, ?)', [nome, email], (err, results) => {
    if (err) {
      console.error('Erro ao inserir participante:', err);
      return res.status(500).json({ message: 'Erro no servidor' });
    }

    return res.status(201).json({ message: 'Participante cadastrado com sucesso' });
  });
});

// Rota para buscar participantes
app.get('/api/participants', (req, res) => {
  // Consulta todos os participantes na tabela 'participants'
  connection.query('SELECT * FROM participants', (err, results) => {
    if (err) {
      console.error('Erro ao buscar participantes:', err);
      return res.status(500).json({ message: 'Erro interno do servidor' });
    }

    // Retorna a lista de participantes
    res.status(200).json(results);
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
    res.sendFile(path.join(__dirname, '/paginas/participantes.html'));
});

// Inicia o servidor na porta 3001
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});
