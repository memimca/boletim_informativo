
# Igreja – Site + Admin (React + Node)

## Estrutura
- `server/` – API Node/Express com JWT, uploads (PDF/Imagens), histórico de versões, áreas e blocos.
- `frontend/` – SPA React (Vite + Tailwind + React Quill) com tema escuro, impressão do PDF, admin e previews.

## Como rodar (local)
1. **Backend**
   ```bash
   cd server
   cp .env.example .env
   # edite ADMIN_EMAIL, ADMIN_PASSWORD, JWT_SECRET
   npm install
   npm start
   ```

2. **Frontend**
   ```bash
   cd ../frontend
   npm install
   echo "VITE_API_URL=http://localhost:4000" > .env.local
   npm run dev
   ```

Acesse http://localhost:5173

## Publicação
- **Backend**: qualquer host de Node (Render, Railway, VPS). Rode `npm install` e `npm start`. Garanta persistência para a pasta `server/data`.
- **Frontend**: Vite estático. Defina `VITE_API_URL` apontando para sua API pública, depois:
  ```bash
  npm run build
  # publique a pasta dist/ em Netlify, Vercel, S3/CloudFront, etc.
  ```

## PDF do Boletim
- O PDF original é servido em `/boletim-setembro-2025.pdf`. Pelo Admin você pode enviar um novo em **Upload de novo boletim (PDF)**.
- A impressão é feita diretamente do PDF, preservando 100% da formatação.

## Acesso ao Admin
- Vá até `/login` e use as credenciais do `.env` do servidor.
- No painel você pode criar **áreas**, **blocos**, editar com **Quill** (imagens, listas, YouTube), ver **histórico** e **restaurar**.
- **Preview ao vivo** de bloco e **Pré-visualização da página inteira** sem precisar salvar.
