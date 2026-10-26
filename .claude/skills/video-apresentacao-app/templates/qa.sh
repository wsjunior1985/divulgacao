#!/bin/bash
# uso: [FORMATO=9x16|16x9] qa.sh video.mp4 pasta-saida t1 t2 t3 ...
# Gera quadros reduzidos com guias vermelhas da área segura e folhas lado a lado (sheetNN.png). Depois olhe cada folha.
#  9x16 (padrão): 540x960, guias em y=250 e y=1520 (escala 1080x1920).
#  16x9:          960x540, guias de margem em x=48/912 e y=27/513 (margem de 96 px na escala 1920x1080).
F="${FORMATO:-9x16}"; V="$1"; D="$2"; shift 2; rm -rf "$D"; mkdir -p "$D"
if [ "$F" = "16x9" ]; then
  SC="scale=960:540,drawbox=x=48:w=1:h=540:color=red@0.9:t=fill,drawbox=x=912:w=1:h=540:color=red@0.9:t=fill,drawbox=y=27:w=960:h=1:color=red@0.9:t=fill,drawbox=y=513:w=960:h=1:color=red@0.9:t=fill"; PER=2
else
  SC="scale=540:960,drawbox=y=125:w=540:h=1:color=red@0.9:t=fill,drawbox=y=760:w=540:h=1:color=red@0.9:t=fill"; PER=4
fi
i=0; for t in "$@"; do
  ffmpeg -loglevel error -y -ss $t -i "$V" -frames:v 1 -vf "$SC" "$D/f$(printf %03d $i).png"
  i=$((i+1)); done
fs=($D/f*.png); n=${#fs[@]}; k=0
for ((a=0;a<n;a+=PER)); do g=("${fs[@]:$a:$PER}"); [ ${#g[@]} -lt 2 ] && g+=("${g[0]}")
  args=(); for f in "${g[@]}"; do args+=(-i "$f"); done
  if [ "$F" = "16x9" ]; then ffmpeg -loglevel error -y "${args[@]}" -filter_complex "vstack=inputs=${#g[@]}" "$D/sheet$(printf %02d $k).png"
  else ffmpeg -loglevel error -y "${args[@]}" -filter_complex "hstack=inputs=${#g[@]}" "$D/sheet$(printf %02d $k).png"; fi
  k=$((k+1)); done
echo "folhas em $D/sheet*.png"
