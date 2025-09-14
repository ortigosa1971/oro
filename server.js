
// --- CONFIG Y DB ---------------------------------------------------
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Rutas de DB
const DEFAULT_DB = path.join(__dirname, 'db', 'usuarios.db');
const DB_PATH = process.env.DB_PATH || DEFAULT_DB;

// Asegurar directorio de la DB
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// Abrir DB de usuarios
const db = new Database(DB_PATH);

// Crear tabla mínima si no existe (para bases nuevas)
db.prepare(`
  CREATE TABLE IF NOT EXISTS usuarios (
    usuario TEXT PRIMARY KEY,
    sesion_activa INTEGER DEFAULT 0,
    sesion_id TEXT
  )
`).run();

// Store de sesiones (persistente) en el mismo directorio de la DB
const sessionsDir = path.dirname(DB_PATH);
app.use(session({
  store: new SQLiteStore({ dir: sessionsDir, db: 'sessions.db' }),
  secret: process.env.SESSION_SECRET || 'cambia-esto',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 8, sameSite: 'lax', httpOnly: true }
}));

// --- Helmet con CSP personalizada ---
app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      "default-src": ["'self'"],
      "style-src": ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://fonts.googleapis.com"],
      "style-src-elem": ["'self'", "'unsafe-inline'", "https://www.gstatic.com", "https://fonts.googleapis.com"],
      "script-src": ["'self'", "https://translate.googleapis.com", "https://translate.google.com"],
      "frame-src": ["'self'", "https://translate.google.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com", "data:"],
      "img-src": ["'self'", "data:"],
      "connect-src": ["'self'"],
      "object-src": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"]
    }
  }
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper para verificar si una sesión del store sigue viva
function isSessionAlive(sid) {
  try {
    const storeDB = new Database(path.join(sessionsDir, 'sessions.db'));
    const row = storeDB.prepare(`SELECT sid, expire FROM sessions WHERE sid = ?`).get(sid);
    return !!(row && row.expire && Number(row.expire) > Date.now());
  } catch {
    return false;
  }
}

// --- Rutas ----------------------------------------------------------

// Login con bloqueo de segunda sesión
app.post('/login', (req, res) => {
  const { usuario } = req.body || {};
  if (!usuario) return res.redirect('/login.html?error=datos');

  const u = db.prepare(`SELECT usuario, sesion_activa, sesion_id FROM usuarios WHERE usuario = ?`).get(usuario);
  if (!u) return res.redirect('/login.html?error=usuario');

  if (u.sesion_activa && u.sesion_id && isSessionAlive(u.sesion_id)) {
    return res.redirect('/login.html?error=sesion');
  }

  req.session.usuario = usuario;
  db.prepare(`UPDATE usuarios SET sesion_activa = 1, sesion_id = ? WHERE usuario = ?`).run(req.sessionID, usuario);
  return res.redirect('/inicio.html');
});

// Logout
app.get('/logout', (req, res) => {
  const usuario = req.session?.usuario;
  if (usuario) {
    db.prepare(`UPDATE usuarios SET sesion_activa = 0, sesion_id = NULL WHERE usuario = ?`).run(usuario);
  }
  req.session.destroy(() => res.redirect('/login.html'));
});

// Verificar sesión activa
app.get('/verificar-sesion', (req, res) => {
  if (!req.session?.usuario) return res.json({ activo: false });

  const u = db.prepare(`SELECT sesion_id FROM usuarios WHERE usuario = ?`).get(req.session.usuario);
  const activo = !!(u && u.sesion_id === req.sessionID && isSessionAlive(u.sesion_id));
  res.json({ activo });
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
