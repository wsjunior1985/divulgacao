#!/bin/bash
# Normaliza o áudio do render (loudnorm de 2 passes, alvo -14 LUFS, pico <= -1,5 dBTP) e grava a entrega com faststart.
# uso: finalize.sh <render.mp4> <saida.mp4>     ex.: finalize.sh video/renders/raw.mp4 /Users/wsjunior/Projetos/divulgacao/videos/nativos/<app>.mp4
set -e
IN="${1:?render de entrada}"; OUT="${2:?arquivo de saída}"
M=$(ffmpeg -hide_banner -i "$IN" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g() { echo "$M" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -hide_banner -v error -y -i "$IN" -map 0:v -map 0:a -c:v copy \
 -af "loudnorm=I=-14:TP=-2.6:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" \
 -c:a aac -b:a 192k -movflags +faststart "$OUT"
echo ok "$OUT"
ffprobe -v error -show_entries stream=codec_name,width,height -show_entries format=duration -of csv=p=0 "$OUT" | tr '\n' ' '; echo
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "I:|Peak:" | tail -2
