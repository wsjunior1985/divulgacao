import cv2,numpy as np,json
from pathlib import Path
p=Path(__file__).resolve().parent
base=Path('/Users/wsjunior/Library/CloudStorage/GoogleDrive-wsjunior@gmail.com/Meu Drive/WaldeApps')
src=next(base.glob('*/Gasonol 3 - Sem*.mp4'))
c=cv2.VideoCapture(str(src)); stats=[];i=0
while True:
 ok,f=c.read()
 if not ok:break
 hsv=cv2.cvtColor(f,cv2.COLOR_BGR2HSV)
 mask=cv2.inRange(hsv,np.array([35,70,55]),np.array([88,255,255]))
 cont,_=cv2.findContours(mask,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
 cont=[x for x in cont if cv2.contourArea(x)>1500]
 cont=sorted(cont,key=cv2.contourArea,reverse=True)
 if cont:
  cc=cont[0]; hull=cv2.convexHull(cc);q=cv2.approxPolyDP(hull,.035*cv2.arcLength(hull,True),True)
  x,y,w,h=cv2.boundingRect(cc)
  stats.append({'frame':i,'area':cv2.contourArea(cc),'bbox':[x,y,w,h],'quad':q[:,0,:].tolist()})
  if i%12==0:
   cv2.polylines(f,[q],True,(0,0,255),2);cv2.imwrite(str(p/f'detect-{i:03d}.jpg'),f)
 i+=1
(p/'detection.json').write_text(json.dumps(stats,indent=2))
print('Frames:',i,'green:',len(stats));print(json.dumps(stats[::12]))
