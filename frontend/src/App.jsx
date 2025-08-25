
import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import ReactQuill from "react-quill";
import 'react-quill/new/quill.snow.css';

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const save = (t) => { setToken(t); localStorage.setItem("token", t); };
  const clear = () => { setToken(""); localStorage.removeItem("token"); };
  return { token, save, clear };
}

function Header({ dark, setDark }) {
  const { token, clear } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-zinc-950/70 border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <img src="/logo.png" alt="Logo da Igreja" className="w-12 h-12 object-contain" />
        <div className="flex-1">
          <Link to="/" className="block">
            <h1 className="text-xl md:text-2xl font-semibold leading-tight">Igreja Metodista Cidade Alegria</h1>
            <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-300">Boletim Informativo – Setembro de 2025</p>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDark(v=>!v)} className="px-3 py-2 rounded-2xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-sm">{dark ? "Tema claro" : "Tema escuro"}</button>
          {token ? (
            <button onClick={() => { clear(); navigate("/"); }} className="px-3 py-2 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">Sair</button>
          ) : (
            <Link to="/login" className="px-3 py-2 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">Área Administrativa</Link>
          )}
        </div>
      </div>
    </header>
  );
}

function Home({ dark, setDark, data }) {
  const pdfRef = useRef(null);
  const handlePrint = () => {
    const iframe = pdfRef.current;
    if (iframe && iframe.contentWindow) { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
    else { window.open(`${BASE_URL}/boletim-setembro-2025.pdf`, "_blank"); }
  };
  const [remoteData, setRemoteData] = useState(null);
  useEffect(() => { if(!data) axios.get(`${BASE_URL}/content`).then(r => setRemoteData(r.data)).catch(()=>setRemoteData({ areas: [] })); }, [data]);
  const content = data || remoteData;
  return (
    <div className="min-h-screen bg-white text-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <Header dark={dark} setDark={setDark} />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <section className="mb-6">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Boletim original (PDF)</h2>
              <div className="flex gap-2">
                <a href={`${BASE_URL}/boletim-setembro-2025.pdf`} download className="px-3 py-2 rounded-2xl border border-zinc-300 dark:border-zinc-700">Baixar PDF</a>
                <button onClick={handlePrint} className="px-3 py-2 rounded-2xl bg-blue-600 text-white">Imprimir</button>
              </div>
            </div>
            <iframe ref={pdfRef} src={`${BASE_URL}/boletim-setembro-2025.pdf#view=FitH&toolbar=1`} className="w-full h-[600px] border rounded-xl" />
          </div>
        </section>
        {content?.areas?.map(area => (
          <section key={area.id} className="mb-6">
            <h3 className="text-xl font-semibold mb-3">{area.nome}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {area.blocos?.map(bloco => (
                <article key={bloco.id} className="border rounded-xl p-3">
                  {bloco.titulo && <h4 className="font-semibold mb-2">{bloco.titulo}</h4>}
                  <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: bloco.conteudo }} />
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>
      <footer className="mt-10 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-zinc-600 dark:text-zinc-300">© {new Date().getFullYear()} Igreja Metodista Cidade Alegria. Todos os direitos reservados.</div>
      </footer>
    </div>
  );
}

function Login() {
  const { save, token } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  useEffect(() => { if (token) nav("/admin"); }, [token]);
  const submit = async (e) => {
    e.preventDefault(); setErro("");
    try { const r = await axios.post(`${BASE_URL}/auth/login`, { email, password: senha }); save(r.data.token); nav("/admin"); }
    catch { setErro("Credenciais inválidas"); }
  };
  return (
    <div className="min-h-screen grid place-items-center">
      <form onSubmit={submit} className="w-full max-w-sm border p-6 rounded-xl">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="Email" className="w-full mb-2 px-2 py-1 border rounded" />
        <input value={senha} onChange={e=>setSenha(e.target.value)} type="password" placeholder="Senha" className="w-full mb-2 px-2 py-1 border rounded" />
        {erro && <p className="text-red-600 text-sm mb-2">{erro}</p>}
        <button className="w-full bg-blue-600 text-white rounded px-3 py-2">Entrar</button>
      </form>
    </div>
  );
}

function Admin() {
  const { token } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!token) nav("/login"); }, [token]);
  const api = useMemo(()=>axios.create({ baseURL: BASE_URL, headers:{ Authorization:`Bearer ${token}` }}), [token]);
  const [areas, setAreas] = useState([]);
  const [editando, setEditando] = useState(null);
  const [draftTitulo, setDraftTitulo] = useState("");
  const [draftHtml, setDraftHtml] = useState("");
  const [previewPage, setPreviewPage] = useState(false);

  const quillModules = useMemo(()=>({ toolbar: [['bold','italic','underline'],[{list:'ordered'},{list:'bullet'}],['link','image','video']] }),[]);
  const quillFormats = ['bold','italic','underline','list','bullet','link','image','video'];

  useEffect(()=>{carregar();},[]);
  const carregar = async()=>{ const r = await api.get('/content'); setAreas(r.data?.areas||[]); };

  const criarArea = async () => {
    const nome = prompt("Nome da nova área:"); if (!nome) return;
    await api.post("/areas", { nome });
    await carregar();
  };

  const abrirEdicao=(area,bloco)=>{ setEditando({area,bloco}); setDraftTitulo(bloco.titulo||""); setDraftHtml(bloco.conteudo||""); };
  const salvar=async()=>{ await api.put(`/blocks/${editando.bloco.id}`,{titulo:draftTitulo,conteudo:draftHtml}); setEditando(null); carregar(); };

  const criarBloco = async (areaId) => {
    const titulo = prompt("Título do bloco (opcional):") || "";
    const conteudo = "<p>Novo conteúdo</p>";
    await api.post("/blocks", { areaId, titulo, conteudo });
    await carregar();
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Admin</h2>
        <div className="flex gap-2">
          <button onClick={criarArea} className="px-3 py-2 border rounded">Adicionar área</button>
          <button onClick={()=>setPreviewPage(true)} className="px-3 py-2 bg-green-600 text-white rounded">Pré-visualizar página inteira</button>
        </div>
      </div>

      {areas.map(area=>(
        <div key={area.id} className="mb-6 border rounded-xl p-3">
          <div className="flex items-center gap-2 mb-3">
            <strong>{area.nome}</strong>
            <button onClick={()=>criarBloco(area.id)} className="ml-auto px-3 py-1 border rounded">Adicionar bloco</button>
          </div>
          {area.blocos?.map(bloco=>(
            <div key={bloco.id} className="border rounded p-2 mb-2 flex justify-between items-center">
              <span>{bloco.titulo||"(Sem título)"}</span>
              <button onClick={()=>abrirEdicao(area,bloco)} className="px-2 py-1 border rounded">Editar</button>
            </div>
          ))}
        </div>
      ))}

      {editando && (
        <div className="fixed inset-0 bg-black/50 grid place-items-center p-4">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-xl p-4 grid md:grid-cols-2 gap-4">
            <div>
              <input value={draftTitulo} onChange={e=>setDraftTitulo(e.target.value)} className="w-full border rounded px-2 py-1 mb-2" placeholder="Título" />
              <ReactQuill value={draftHtml} onChange={setDraftHtml} modules={quillModules} formats={quillFormats} />
              <div className="flex justify-end mt-2 gap-2">
                <button onClick={()=>setEditando(null)} className="px-3 py-1 border rounded">Fechar</button>
                <button onClick={salvar} className="px-3 py-1 bg-blue-600 text-white rounded">Salvar</button>
              </div>
            </div>
            <div className="border rounded p-2 overflow-y-auto max-h-[600px]">
              <h4 className="font-semibold mb-2">Preview ao vivo</h4>
              <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{__html:draftHtml}} />
            </div>
          </div>
        </div>
      )}

      {previewPage && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 min-h-screen">
            <div className="p-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold">Pré-visualização da página inteira</h3>
              <button onClick={()=>setPreviewPage(false)} className="px-3 py-1 border rounded">Fechar</button>
            </div>
            <Home dark={false} setDark={()=>{}} data={{ areas }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppWrapper(){
  const [dark,setDark]=useState(false);
  useEffect(()=>{ if(localStorage.getItem("theme")==="dark") setDark(true); },[]);
  useEffect(()=>{ if(dark){ document.documentElement.classList.add("dark"); localStorage.setItem("theme","dark"); } else { document.documentElement.classList.remove("dark"); localStorage.setItem("theme","light"); }},[dark]);
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home dark={dark} setDark={setDark}/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
