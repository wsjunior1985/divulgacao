#!/usr/bin/env bash
# Post extra do Papelzinho na temporada de Natal, disparado pela VPS às 15h30 BRT até 24/12/2026.
# Usa a campanha manual por app do workflow publicar (-f app=papelzinho -f slot=N). O slot é
# 100000 + dias desde 20/11, então nunca colide com o rodízio normal (slots abaixo de 1000) e
# cada dia pega um tema natalino diferente. Depois de 24/12 o script encerra sozinho.
set -euo pipefail
REPO="wsjunior1985/divulgacao"
FIM="2026-12-24"
HOJE="$(TZ=America/Sao_Paulo date +%F)"
if [[ "$HOJE" > "$FIM" ]]; then
  echo "$(date -u +%FT%TZ) encerrado papelzinho-natal (${HOJE} > ${FIM})"; exit 0
fi
DIAS=$(( ($(date -u -d "$HOJE" +%s) - $(date -u -d "2026-11-20" +%s)) / 86400 ))
SLOT=$((100000 + DIAS))
for tentativa in 1 2 3; do
  if gh workflow run publicar.yml -R "$REPO" --ref main -f dry_run=false -f app=papelzinho -f "slot=${SLOT}"; then
    echo "$(date -u +%FT%TZ) ok papelzinho-natal slot ${SLOT}"; exit 0
  fi
  sleep 20
done
echo "$(date -u +%FT%TZ) FALHOU papelzinho-natal slot ${SLOT}" >&2; exit 1
