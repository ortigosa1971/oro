# Fiestas (SQLite original + Railway con Dockerfile)

## Local
```bash
npm install
npm start
# http://localhost:8080/login.html
```

## Railway (Dockerfile)
- Railway detecta el `Dockerfile` automáticamente.
- Crea un **Volume** montado en `/data`.
- Variable: `DB_PATH=/data/usuarios.db`.
- En el primer arranque copia `db/usuarios.db` al volume si no existe.

## DB original
Coloca tu base de datos en `db/usuarios.db` (opcional). Si no existe, el servidor crea la tabla `usuarios` automáticamente.

### Persistencia y sesiones
- Crea un **Volume** montado en `/data`.
- Añade variable `DB_PATH=/data/usuarios.db`.
- Las sesiones se guardan en `sessions.db` en la misma carpeta (`/data`), persistiendo entre despliegues.
