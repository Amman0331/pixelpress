'use strict';
const el = id => document.getElementById(id);
const queue = [];
let working = false;
let nextId = 1;
let selectedId = null;
el('wipe').oninput = updateWipe;
const formats = /\.(png|jpe?g|avif|bmp|webp)$/i;
const prettySize = n => n < 1024 ? n+' B' : n < 1048576 ? (n/1024).toFixed(1)+' KB' : (n/1048576).toFixed(1)+' MB';
const statusMessage = message => { el('status').textContent = message; };
const integrationInfo = {
  photoshop: {title:'Photoshop plugin', text:'Export the active 8-bit RGB document to WebP from a dedicated panel in Photoshop desktop 23.3 or later.', file:'photoshop-plugin.zip', steps:['Download and extract the package. Open Photoshop and Adobe UXP Developer Tool.','Choose Add Plugin and select the included manifest.json. Click Load.','Open the plugin panel, choose lossy or lossless export, and save a WebP copy.']},
  browser: {title:'Chrome & Edge extension', text:'Run the converter offline from your browser toolbar. All processing happens on your device.', file:'browser-extension.zip', steps:['Download the ZIP and extract it into a folder.','Open chrome://extensions or edge://extensions and turn on Developer mode.','Choose Load unpacked and select the folder containing manifest.json. Click the Pixelpress toolbar icon to open the converter.']},
  canva: {title:'Canva editor app', text:'A developer-preview app for exporting Canva designs to WebP with a local companion.', file:'canva-app.zip', steps:['Extract the package and follow the included README to start the local companion.','Create a Design Editor app in the Canva Developer Portal and configure its preview as described in the README.','Open the app in a design, select your pages, and follow the export prompt.']}
};
function iconButton(key, label) {
  const button = document.createElement('button');
  button.className = 'square'; button.setAttribute('aria-label', label); button.title = label;
  const icon = document.createElement('i'); icon.dataset.icon = key; button.append(icon); return button;
}
function outputName(item) {
  const used = new Set(queue.filter(q => q !== item && q.name).map(q => q.name.toLowerCase()));
  const base = (item.file.name.replace(/\.[^.]*$/, '').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').replace(/^[. ]+|[. ]+$/g,'') || 'image').slice(0,160);
  let name = base+'.webp', n=2;
  while (used.has(name.toLowerCase())) name = base+'-'+(n++)+'.webp';
  return name;
}
function render() {
  const has = queue.length > 0;
  el('count').textContent = queue.length+' file'+(queue.length===1?'':'s');
  el('empty').hidden=has; el('items').hidden=!has; el('sample').hidden=has; el('add').hidden=!has;
  el('items').replaceChildren();
  for(const q of queue) {
    const row=document.createElement('div');row.className='row';
    const img=document.createElement('img');img.alt='';img.src=q.url;img.onerror=()=>{img.style.visibility='hidden';};
    const info=document.createElement('div');info.className='rowinfo';
    const title=document.createElement('strong');title.textContent=q.file.name;
    const detail=document.createElement('small');detail.textContent=q.error || (q.output ? prettySize(q.file.size)+' → '+prettySize(q.output.size)+' · '+q.width+' × '+q.height+' px' : prettySize(q.file.size)+' · '+(q.processing?'Converting…':'Ready to convert'));
    detail.className=q.error?'error':q.output?'ready':'';
    info.append(title,detail);row.append(img,info);
    if(q.output) {
      const compare = document.createElement('button');
      compare.className = 'compare-button'; compare.textContent = 'Compare';
      compare.setAttribute('aria-label','Compare '+q.file.name);
      compare.onclick = () => {
        selectedId = q.id;
        showComparison(q);
        el('comparison').scrollIntoView({block:'nearest'});
      };
      row.append(compare);
      const a=document.createElement('a');a.href=q.resultURL;a.download=q.name;a.className='square';a.setAttribute('aria-label','Download '+q.name);a.title='Download '+q.name;
      const icon=document.createElement('i');icon.dataset.icon='download';a.append(icon);row.append(a);
    }
    const remove=iconButton('x','Remove '+q.file.name);remove.disabled=working;
    remove.onclick=()=>{URL.revokeObjectURL(q.url);if(q.resultURL) URL.revokeObjectURL(q.resultURL);queue.splice(queue.indexOf(q),1);statusMessage('');render();};
    row.append(remove);el('items').append(row);
  }
  const selected = queue.find(q => q.id === selectedId && q.output) || queue.find(q => q.output);
  selectedId = selected?.id ?? null;
  showComparison(selected);
  paintIcons(el('items'));
  el('downloadall').hidden=!queue.some(q=>q.output);
  for(const id of ['sample','add','quality','convert','downloadall','resize','maxwidth','browse']) el(id).disabled=working;
}
function addFiles(files) {
  if(working) return;
  let skipped=0;
  for(const file of files) {
    if(!formats.test(file.name) && !['image/png','image/jpeg','image/webp','image/bmp','image/avif'].includes(file.type)){skipped++;continue;}
    const item={id:nextId++,file,url:URL.createObjectURL(file)};item.name=outputName(item);queue.push(item);
  }
  statusMessage(skipped ? skipped+' unsupported file(s) skipped. Use PNG, JPG, WebP, AVIF, or BMP.' : '');render();
}
function resetOutputs() {
  for(const q of queue){if(q.resultURL)URL.revokeObjectURL(q.resultURL);q.resultURL=null;q.output=null;q.error=null;}
  statusMessage('');render();
}
function chooseFiles(){if(!working)el('files').click();}
el('files').onchange=e=>{addFiles(e.target.files);e.target.value='';};
el('browse').onclick=chooseFiles;el('add').onclick=chooseFiles;
el('drop').ondragover=e=>{e.preventDefault();if(!working)el('drop').classList.add('drag');};
el('drop').ondragleave=e=>{if(!el('drop').contains(e.relatedTarget))el('drop').classList.remove('drag');};
el('drop').ondrop=e=>{e.preventDefault();el('drop').classList.remove('drag');addFiles(e.dataTransfer.files);};
el('sample').onclick=async()=>{try{const r=await fetch('assets/violet-peaks.png');if(!r.ok)throw Error();addFiles([new File([await r.blob()],'violet-peaks.png',{type:'image/png'})]);}catch{statusMessage('The sample could not be opened. Choose a local image.');}};
el('quality').oninput=()=>{const n=Number(el('quality').value);el('value').textContent=n+'%';el('quality').style.background='linear-gradient(to right,var(--lilac) '+n+'%,#494652 '+n+'%)';resetOutputs();};
el('resize').onchange=()=>{el('widthwrap').hidden=!el('resize').checked;resetOutputs();};
el('maxwidth').oninput=resetOutputs;
async function encode(item, quality, maxWidth) {
  const source=new Image();source.src=item.url;
  try{await source.decode();}catch{throw Error('This image could not be decoded in this browser.');}
  const width=Math.min(source.naturalWidth,maxWidth);
  const height=Math.max(1,Math.round(source.naturalHeight*width/source.naturalWidth));
  if(width*height>64000000 || Math.max(width,height)>32767) throw Error('Image exceeds canvas limits. Set a smaller maximum width.');
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  try{
    const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas is unavailable.');
    ctx.imageSmoothingQuality='high';ctx.drawImage(source,0,0,width,height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
    if(blob?.type!=='image/webp') throw Error('This browser cannot encode WebP. Try Chrome or Edge.');
    item.originalWidth=source.naturalWidth;item.originalHeight=source.naturalHeight;
    item.width=width;item.height=height;item.output=blob;item.resultURL=URL.createObjectURL(blob);
    try { item.loss = await compressionLoss(canvas,item.resultURL); } catch { item.loss = null; }
  }finally{canvas.width=canvas.height=1;}
}
el('convert').onclick=async()=>{
  if(working)return;
  if(!queue.length){statusMessage('Choose images to begin.');chooseFiles();return;}
  if(el('resize').checked && (!el('maxwidth').value || !el('maxwidth').reportValidity())){el('maxwidth').focus();return;}
  const width=el('resize').checked?Number(el('maxwidth').value):Infinity;
  working=true;render();el('convert').querySelector('span').textContent='Converting…';
  try{
    for(const [index,q] of queue.entries()){
      if(q.output)continue;
      q.processing=true;q.error=null;render();statusMessage('Converting '+(index+1)+' of '+queue.length+'…');
      try{await encode(q,Number(el('quality').value)/100,width);}catch(e){q.error=e.message||'Conversion failed.';}
      q.processing=false;
    }
    const done=queue.filter(q=>q.output), failed=queue.length-done.length;
    statusMessage((done.length ? done.length+' WebP '+(done.length===1?'file is':'files are')+' ready to download.' : '')+(failed?' '+failed+' file(s) could not be converted. See the queue for details.':''));
  }finally{working=false;render();el('convert').querySelector('span').textContent='Convert to WebP';}
};
// Store already-compressed WebP entries in a portable UTF-8 ZIP.
const crcTable=Array.from({length:256},(_,i)=>{for(let j=0;j<8;j++)i=(i&1)?(0xedb88320^(i>>>1)):(i>>>1);return i>>>0;});
async function zipFiles(items){
  const parts=[],central=[];let offset=0, directorySize=0;
  if(items.length>65535)throw Error('Download fewer than 65,536 files per ZIP.');
  function header(size){const data=new Uint8Array(size),v=new DataView(data.buffer);return {data,u16:(at,n)=>v.setUint16(at,n,true),u32:(at,n)=>v.setUint32(at,n,true)};}
  for(const item of items){
    const name=new TextEncoder().encode(item.name),bytes=new Uint8Array(await item.output.arrayBuffer());
    let crc=0xffffffff;for(const b of bytes)crc=(crc>>>8)^crcTable[(crc^b)&255];crc=(crc^0xffffffff)>>>0;
    const local=header(30);local.u32(0,0x04034b50);local.u16(4,20);local.u16(6,0x0800);local.u16(12,33);local.u32(14,crc);local.u32(18,bytes.length);local.u32(22,bytes.length);local.u16(26,name.length);
    const record=header(46);record.u32(0,0x02014b50);record.u16(4,20);record.u16(6,20);record.u16(8,0x0800);record.u16(14,33);record.u32(16,crc);record.u32(20,bytes.length);record.u32(24,bytes.length);record.u16(28,name.length);record.u32(42,offset);
    parts.push(local.data,name,item.output);central.push(record.data,name);
    offset+=30+name.length+bytes.length;directorySize+=46+name.length;
    if(offset+directorySize>=0xffffffff)throw Error('This batch exceeds 4 GB. Download the files individually.');
  }
  const end=header(22);end.u32(0,0x06054b50);end.u16(8,items.length);end.u16(10,items.length);end.u32(12,directorySize);end.u32(16,offset);
  return new Blob([...parts,...central,end.data],{type:'application/zip'});
}
el('downloadall').onclick=async()=>{if(working)return;working=true;render();try{const zip=await zipFiles(queue.filter(q=>q.output));const a=document.createElement('a');a.href=URL.createObjectURL(zip);a.download='pixelpress-webp.zip';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),60000);statusMessage('Your WebP ZIP is ready.');}catch(e){statusMessage(e.message);}finally{working=false;render();}};
for(const button of document.querySelectorAll('[data-integration]'))button.onclick=()=>{
  const info=integrationInfo[button.dataset.integration];el('dialogtitle').textContent=info.title;el('dialogdesc').textContent=info.text;
  el('steps').replaceChildren(...info.steps.map(step=>{const li=document.createElement('li');li.textContent=step;return li;}));
  el('package').href='downloads/'+info.file;el('dialog').showModal();
};
el('close').onclick=()=>el('dialog').close();
el('dialog').onclick=e=>{if(e.target===el('dialog')){const rect=el('dialog').getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)el('dialog').close();}};
function setNav(){for(const a of document.querySelectorAll('nav a'))a.classList.toggle('active',a.pathname===location.pathname && a.hash===(location.hash||'#converter'));}
window.addEventListener('hashchange',setNav);setNav();

const requestedIntegration = new URLSearchParams(location.search).get('tool');
if (Object.hasOwn(integrationInfo, requestedIntegration)) {
  document.querySelector('[data-integration="'+requestedIntegration+'"]')?.click();
}
