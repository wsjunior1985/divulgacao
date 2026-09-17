import cv2,numpy as np,json,subprocess
from pathlib import Path
p=Path(__file__).resolve().parent
root=Path('/Users/wsjunior/Library/CloudStorage/GoogleDrive-wsjunior@gmail.com/Meu Drive/WaldeApps')
src=next(root.glob('*/Gasonol 3 - Sem*.mp4'))
assets=[next(root.glob(f'*/Gasonol/gasonol{i}.png')) for i in range(1,4)]
screens=[cv2.imread(str(f)) for f in assets]
assert all(s.shape[:2]==(2868,1320) for s in screens)
(p/'manifest.json').write_text(json.dumps({'source':str(src),'screens':[str(f) for f in assets],'brand':'Gasonol','output':'Gasonol 3 - Editado.mp4','format':'1080x1920, 24fps, 10s','audio':'original, stream copy'},ensure_ascii=False,indent=2))

def ordered(q):
 s=q.sum(1);d=np.diff(q,axis=1)[:,0]
 return np.float32([q[np.argmin(s)],q[np.argmin(d)],q[np.argmax(s)],q[np.argmax(d)]])

def quad_from_contour(cc):
 hull=cv2.convexHull(cc)[:,0,:].astype(np.float64)
 box=ordered(cv2.boxPoints(cv2.minAreaRect(cc)))
 ex=(box[1]-box[0]);ex=ex/np.linalg.norm(ex)
 ey=np.array([-ex[1],ex[0]])
 uv=hull@np.array([ex,ey]).T
 lo=uv.min(0);hi=uv.max(0);span=hi-lo
 def line(axis,side):
  dep=axis;ind=1-axis
  sel=(uv[:,ind]>lo[ind]+span[ind]*.20)&(uv[:,ind]<hi[ind]-span[ind]*.20)
  sel &= (uv[:,dep]<lo[dep]+span[dep]*.18) if side==0 else (uv[:,dep]>hi[dep]-span[dep]*.18)
  pts=uv[sel]
  if len(pts)<2:
   sel=(uv[:,ind]>lo[ind]+span[ind]*.12)&(uv[:,ind]<hi[ind]-span[ind]*.12)
   sel &= (uv[:,dep]<lo[dep]+span[dep]*.25) if side==0 else (uv[:,dep]>hi[dep]-span[dep]*.25)
   pts=uv[sel]
  if len(pts)<2:return np.array([0.,lo[dep] if side==0 else hi[dep]])
  return np.polyfit(pts[:,ind],pts[:,dep],1)
 l,r=line(0,0),line(0,1);t,b=line(1,0),line(1,1)
 def cross(v,h):
  # u = v0*vcoord+v1; vcoord = h0*u+h1
  u=(v[0]*h[1]+v[1])/(1-v[0]*h[0]);vv=h[0]*u+h[1]
  return u*ex+vv*ey
 return np.float32([cross(l,t),cross(r,t),cross(r,b),cross(l,b)])

cap=cv2.VideoCapture(str(src)); records=[];frames=[]
for i in range(240):
 ok,f=cap.read();assert ok
 frames.append(f)
 if i>106:continue
 hsv=cv2.cvtColor(f,cv2.COLOR_BGR2HSV)
 key=cv2.inRange(hsv,np.array([35,55,50]),np.array([88,255,255]))
 # Screen is separate from the green fuel pump and sign.
 roi=np.zeros(key.shape,np.uint8)
 if i<59:roi[770:1150,80:370]=255
 else:roi[480:1480,150:800]=255
 key=cv2.bitwise_and(key,roi)
 cc,_=cv2.findContours(key,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
 cc=max(cc,key=cv2.contourArea)
 if cv2.contourArea(cc)<25000:continue
 quad=quad_from_contour(cc)
 support=np.zeros(key.shape,np.uint8);cv2.drawContours(support,[cv2.convexHull(cc)],-1,255,-1)
 support=cv2.dilate(support,np.ones((9,9),np.uint8))
 fine=cv2.inRange(hsv,np.array([35,20,45]),np.array([88,255,255]))
 fine=cv2.bitwise_and(fine,support)
 contours,_=cv2.findContours(fine,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
 edge=max(contours,key=cv2.contourArea)
 mask=np.zeros(key.shape,np.uint8);cv2.drawContours(mask,[edge],-1,255,-1)
 mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5)))
 records.append({'frame':i,'quad':quad.tolist(),'mask':mask,'area':cv2.contourArea(cc)})
print('Tracked screen frames:',[r['frame'] for r in records],flush=True)
# Gentle smoothing within cuts removes threshold jitter without losing movement.
for a,b in [(0,58),(59,106)]:
 group=[r for r in records if a<=r['frame']<=b]
 raw=np.array([r['quad'] for r in group])
 for j,r in enumerate(group):
  ids=np.arange(max(0,j-1),min(len(group),j+2));weights=np.array([1 if k!=j else 4 for k in ids])
  r['quad']=np.average(raw[ids],axis=0,weights=weights).astype(np.float32)
rec={r['frame']:r for r in records}
cmd=['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','bgr24','-s','1080x1920','-r','24','-i','-','-i',str(src),'-map','0:v:0','-map','1:a:0','-c:v','libx264','-preset','medium','-crf','17','-pix_fmt','yuv420p','-c:a','copy','-movflags','+faststart',str(p/'Gasonol 3 - Editado.mp4')]
proc=subprocess.Popen(cmd,stdin=subprocess.PIPE)
qa=[]
for i,f in enumerate(frames):
 if i in rec:
  r=rec[i];q=r['quad']
  # Genuine supplied screens: initial view, entered price, then result.
  si=0 if i<59 else (1 if i<76 else 2)
  shot=screens[si]
  tw=240 if i<59 else 600
  shot=cv2.resize(shot,(tw,round(shot.shape[0]*tw/shot.shape[1])),interpolation=cv2.INTER_AREA)
  h,w=shot.shape[:2]
  H=cv2.getPerspectiveTransform(np.float32([[0,0],[w-1,0],[w-1,h-1],[0,h-1]]),q)
  warped=cv2.warpPerspective(shot,H,(1080,1920),flags=cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
  mask=r['mask']
  alpha=cv2.dilate(mask,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(3,3))).astype(np.float32)/255
  alpha=cv2.GaussianBlur(alpha,(5,5),.85)
  # Neutralize green spill at subpixel edges while retaining fingers and bezel.
  band=cv2.dilate(mask,np.ones((7,7),np.uint8))>0
  clean=f.astype(np.float32)
  excess=np.maximum(0,clean[:,:,1]-np.maximum(clean[:,:,0],clean[:,:,2]))
  clean[:,:,1]-=excess*band
  # Match the captured display to the scene, retaining a restrained glass reflection.
  refl=cv2.GaussianBlur(f[:,:,1].astype(np.float32),(0,0),12)
  refl=np.clip((refl-155)*.065,0,6)
  disp=np.clip(warped.astype(np.float32)*.94+3+refl[:,:,None],0,255)
  f=np.clip(clean*(1-alpha[:,:,None])+disp*alpha[:,:,None],0,255).astype(np.uint8)
  if i%8==0 or i in [57,58,75,76,106]:
   cv2.imwrite(str(p/f'edited-{i:03d}.jpg'),f)
  qa.append({'frame':i,'screen':si+1,'quad':q.tolist(),'area':r['area']})
 proc.stdin.write(f.tobytes())
 if i%48==0:print('Rendered',i,flush=True)
proc.stdin.close();assert proc.wait()==0
(p/'tracking.json').write_text(json.dumps(qa,indent=2))
print('DONE',flush=True)
