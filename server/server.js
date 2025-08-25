
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PUBLIC_DIR = path.join(__dirname, 'public');
const UPLOADS_DIR = path.join(PUBLIC_DIR, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'content.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

fse.ensureDirSync(PUBLIC_DIR);
fse.ensureDirSync(UPLOADS_DIR);
fse.ensureDirSync(DATA_DIR);

app.use(express.static(PUBLIC_DIR));

function createToken(payload){
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
}
function auth(req,res,next){
  const h = req.headers.authorization || '';
  const t = h.replace('Bearer ', '');
  try { req.user = jwt.verify(t, process.env.JWT_SECRET || 'secret'); next(); }
  catch(e){ return res.status(401).json({ error: 'unauthorized' }); }
}

function readJson(file, fallback){
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return fallback; }
}
function writeJson(file, data){ fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8'); }

// Auth
app.post('/auth/login', (req,res)=>{
  const { email, password } = req.body || {};
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
    return res.json({ token: createToken({ email }) });
  }
  return res.status(401).json({ error: 'invalid' });
});

// Conteúdo
app.get('/content', (_req,res)=>{
  const data = readJson(DATA_FILE, { areas: [] });
  res.json(data);
});

app.post('/areas', auth, (req,res)=>{
  const data = readJson(DATA_FILE, { areas: [] });
  const area = { id: uuidv4(), nome: req.body?.nome || 'Nova área', ordem: 0, blocos: [] };
  data.areas.push(area);
  writeJson(DATA_FILE, data);
  res.json(area);
});

app.put('/areas/:id', auth, (req,res)=>{
  const data = readJson(DATA_FILE, { areas: [] });
  const area = data.areas.find(a=>a.id===req.params.id);
  if (!area) return res.status(404).json({error:'not_found'});
  if (typeof req.body?.nome === 'string') area.nome = req.body.nome;
  if (typeof req.body?.ordem === 'number') area.ordem = req.body.ordem;
  writeJson(DATA_FILE, data);
  res.json({ ok:true });
});

app.delete('/areas/:id', auth, (req,res)=>{
  const data = readJson(DATA_FILE, { areas: [] });
  const idx = data.areas.findIndex(a=>a.id===req.params.id);
  if (idx<0) return res.status(404).json({error:'not_found'});
  data.areas.splice(idx,1);
  writeJson(DATA_FILE, data);
  res.json({ ok:true });
});

app.post('/blocks', auth, (req,res)=>{
  const { areaId, titulo, conteudo } = req.body || {};
  const data = readJson(DATA_FILE, { areas: [] });
  const area = data.areas.find(a=>a.id===areaId);
  if (!area) return res.status(404).json({error:'area_not_found'});
  const bloco = { id: uuidv4(), titulo: titulo||'', conteudo: conteudo||'' };
  area.blocos.push(bloco);
  writeJson(DATA_FILE, data);
  res.json(bloco);
});

function pushHistory(blockId, snapshot){
  const hist = readJson(HISTORY_FILE, {});
  if (!hist[blockId]) hist[blockId] = [];
  hist[blockId].push({ id: uuidv4(), timestamp: Date.now(), snapshot });
  writeJson(HISTORY_FILE, hist);
}

app.put('/blocks/:id', auth, (req,res)=>{
  const { titulo, conteudo } = req.body || {};
  const data = readJson(DATA_FILE, { areas: [] });
  let bloco;
  data.areas.forEach(area => {
    const b = area.blocos.find(x=>x.id===req.params.id);
    if (b) bloco = b;
  });
  if (!bloco) return res.status(404).json({error:'block_not_found'});
  pushHistory(bloco.id, { titulo: bloco.titulo, conteudo: bloco.conteudo });
  if (typeof titulo === 'string') bloco.titulo = titulo;
  if (typeof conteudo === 'string') bloco.conteudo = conteudo;
  writeJson(DATA_FILE, data);
  res.json({ ok:true });
});

app.delete('/blocks/:id', auth, (req,res)=>{
  const data = readJson(DATA_FILE, { areas: [] });
  let removed = false;
  data.areas.forEach(area => {
    const idx = area.blocos.findIndex(b=>b.id===req.params.id);
    if (idx>=0) { area.blocos.splice(idx,1); removed = true; }
  });
  if (!removed) return res.status(404).json({error:'block_not_found'});
  writeJson(DATA_FILE, data);
  res.json({ ok:true });
});

app.get('/history/:blockId', auth, (req,res)=>{
  const hist = readJson(HISTORY_FILE, {});
  res.json({ versions: hist[req.params.blockId] || [] });
});

app.post('/restore/:blockId', auth, (req,res)=>{
  const { versionId } = req.body || {};
  const data = readJson(DATA_FILE, { areas: [] });
  const hist = readJson(HISTORY_FILE, {});
  const versions = hist[req.params.blockId] || [];
  const ver = versions.find(v=>v.id===versionId);
  if (!ver) return res.status(404).json({error:'version_not_found'});
  let bloco;
  data.areas.forEach(area => {
    const b = area.blocos.find(x=>x.id===req.params.blockId);
    if (b) bloco = b;
  });
  if (!bloco) return res.status(404).json({error:'block_not_found'});
  pushHistory(bloco.id, { titulo: bloco.titulo, conteudo: bloco.conteudo });
  bloco.titulo = ver.snapshot.titulo;
  bloco.conteudo = ver.snapshot.conteudo;
  writeJson(DATA_FILE, data);
  res.json({ ok:true });
});

// Uploads
const storagePdf = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, PUBLIC_DIR),
  filename: (_req, _file, cb) => cb(null, 'boletim-setembro-2025.pdf'),
});
const storageImg = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '.png');
    cb(null, `${uuidv4()}${ext}`);
  },
});
const uploadPdf = multer({ storage: storagePdf });
const uploadImg = multer({ storage: storageImg });

app.post('/upload/pdf', auth, uploadPdf.single('boletim'), (_req,res)=>{
  res.json({ ok:true, file: '/boletim-setembro-2025.pdf' });
});

app.post('/upload/image', auth, uploadImg.single('image'), (req,res)=>{
  const url = `/uploads/${req.file.filename}`;
  res.json({ ok:true, url });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
