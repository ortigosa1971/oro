#!/bin/sh
set -e
mkdir -p /data
if [ ! -f "$DB_PATH" ]; then
  if [ -f "/app/db/usuarios.db" ]; then
    echo "Primera ejecución: copiando DB inicial a $DB_PATH"
    cp /app/db/usuarios.db "$DB_PATH"
  else
    echo "Primera ejecución: no hay DB inicial, se creará automáticamente"
  fi
fi
exec node server.js
