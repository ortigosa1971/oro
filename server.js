const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const Database = require('better-sqlite3');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

const DEFAULT_DB = path.join(__dirname, 'db', 'usuarios.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB;

try {
  const targetDir = path.dirname(DB_PATH);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  if (!fs.existsSync(DB_PATH) && fs.existsSync(DEFAULT_DB)) {
    fs.copyFileSync(DEFAULT_DB, DB_PATH);
    console.log(`📦 Copiada base de datos a ${DB_PATH}`);
  }
} catch (e) {
  console.warn('No se pudo preparar la DB:', e?.message || e);
}

let db;
try {
  db = new Database(DB_PATH);
  console.log(`🗄️  Conectado a SQLite en: ${DB_PATH}`);
} catch (e) {
  console.error('Error abriendo la base de datos:', e);
  process.exit(1);
}

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: path.dirname(DB_PATH),
  }),
  secret: 'clave-secreta',
  resave: false,
  saveUninitialized: false
}));

app.get('/', (req, res) => {
  if (!req.session.usuario) return res.redirect('/login.html');
  res.sendFile(path.join(__dirname, 'public', 'inicio.html'));
});

app.post('/login', (req, res) => {
  let { usuario } = req.body;
  usuario = (usuario || '').trim();
  if (!usuario) return res.redirect('/login.html?error=campos');
  try {
    const row = db.prepare('SELECT username FROM users WHERE username = ? LIMIT 1').get(usuario);
    if (!row) return res.redirect('/login.html?error=credenciales');
    req.session.usuario = row.username;
    return res.redirect('/');
  } catch (e) {
    console.error('Error DB /login:', e);
    return res.redirect('/login.html?error=server');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login.html'));
});

app.get('/verificar-sesion', (req, res) => {
  res.json({ activo: !!req.session.usuario });
});

app.use((req, res) => res.status(404).send('Página no encontrada'));

app.listen(PORT, () => console.log(`🚀 Servidor corriendo en el puerto ${PORT}`));
