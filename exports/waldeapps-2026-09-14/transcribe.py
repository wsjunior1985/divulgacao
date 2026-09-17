from faster_whisper import WhisperModel
from pathlib import Path
import json,sys
p=Path(__file__).parent
model=WhisperModel('small',device='cpu',compute_type='int8')
f=Path(sys.argv[1]) if len(sys.argv)>1 else p/'original-voice.wav'
segments,info=model.transcribe(str(f),language='pt',beam_size=5,word_timestamps=True)
rows=[{'start':s.start,'end':s.end,'text':s.text,'words':[{'word':w.word,'start':w.start,'end':w.end} for w in s.words]} for s in segments]
f.with_suffix('.transcript.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print(json.dumps(rows,ensure_ascii=False,indent=2),flush=True)
