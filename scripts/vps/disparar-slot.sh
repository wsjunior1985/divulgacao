#!/usr/bin/env bash
# Dispara um slot de publicação no horário exato, pela VPS.
# O agendador (schedule) do GitHub atrasa 5-7 h e o guard descarta o slot;
# o workflow_dispatch não sofre esse atraso. Uso: disparar-slot.sh <publicar|publicar-carrossel> "<cron do slot>"
set -euo pipefail
WORKFLOW="${1:?workflow}"; CRON="${2:?cron}"
REPO="wsjunior1985/divulgacao"
for tentativa in 1 2 3; do
  if gh workflow run "${WORKFLOW}.yml" -R "$REPO" --ref main -f dry_run=false -f "cron=${CRON}"; then
    echo "$(date -u +%FT%TZ) ok ${WORKFLOW} [${CRON}]"; exit 0
  fi
  sleep 20
done
echo "$(date -u +%FT%TZ) FALHOU ${WORKFLOW} [${CRON}]" >&2; exit 1
