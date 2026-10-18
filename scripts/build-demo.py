"""Create an edited walkthrough from actual browser captures, never simulated wallet footage."""
from pathlib import Path
import subprocess
import sys
ROOT=Path(__file__).resolve().parent.parent
sys.path.insert(0,str(ROOT/'tmp'/'media-tools'))
from imageio_ffmpeg import get_ffmpeg_exe

slides=[('demo-overview.jpg',10),('demo-create.jpg',12),('demo-agreement.jpg',14),('demo-ruling.jpg',16),('demo-overview.jpg',8)]
directory=ROOT/'reports'/'screenshots'
for name,_ in slides:
    if not (directory/name).exists():raise SystemExit('Capture all verified reviewer views before building the demo: '+name)
concat=ROOT/'tmp'/'demo-frames.txt'
concat.write_text(''.join("file '../reports/screenshots/"+name+"'\nduration "+str(duration)+"\n" for name,duration in slides)+"file '../reports/screenshots/"+slides[-1][0]+"'\n",encoding='utf8')
captions=[
('00:00:00,000','00:00:10,000','ClausePact. Two wallets. One frozen brief. GenLayer evaluates later scope changes.'),
('00:00:10,000','00:00:22,000','Write numbered requirements and name the contributor. Published text and wallets are public.'),
('00:00:22,000','00:00:36,000','Creator publication and contributor acceptance bind both parties to the exact agreement hash.'),
('00:00:36,000','00:00:52,000','A real testnet ruling cites original clauses. Inspect its request, reasoning, hashes and finality.'),
('00:00:52,000','00:01:00,000','Edited screen-capture walkthrough. Testnet only. No escrow. Browser wallet signing is not shown.'),
]
subtitles=ROOT/'tmp'/'demo.srt'
subtitles.write_text('\n\n'.join(str(i+1)+'\n'+start+' --> '+end+'\n'+text for i,(start,end,text) in enumerate(captions))+'\n',encoding='utf8')
command=[get_ffmpeg_exe(),'-hide_banner','-loglevel','warning','-y','-f','concat','-safe','0','-i','tmp/demo-frames.txt','-vf',"scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:800:(ow-iw)/2:0:color=0x09070F,subtitles=tmp/demo.srt:force_style='FontName=Segoe UI,FontSize=16,PrimaryColour=&H00FFEFF4,OutlineColour=&H000F0709,BorderStyle=3,Outline=1,Alignment=2,MarginV=15'",'-r','24','-c:v','libx264','-preset','medium','-crf','22','-pix_fmt','yuv420p','-movflags','+faststart','-t','60','public/demo.mp4']
subprocess.run(command,cwd=ROOT,check=True)
subprocess.run([get_ffmpeg_exe(),'-hide_banner','-i','public/demo.mp4','-f','null','-'],cwd=ROOT,check=True,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
print('Verified 60-second edited walkthrough: public/demo.mp4')
