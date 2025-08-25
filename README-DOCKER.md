# Igreja Site CMS — Docker Ready

## Como rodar
1. Instale Docker e Docker Compose.
2. Na raiz do projeto, rode:
   ```bash
   docker-compose up --build
   ```
3. Acesse:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:4000

## Observações
- O frontend recebe `VITE_API_URL=http://localhost:4000` via docker-compose.
- O PDF atual foi colocado em `server/public/boletim-setembro-2025.pdf` e é servido estaticamente.
- Ajustei automaticamente qualquer import do Quill:
  `react-quill/dist/quill.snow.css` → `react-quill/new/quill.snow.css`.

## Login (padrão)
- E-mail: `admin@igreja.com`
- Senha: `admin123`
- Você pode alterar no arquivo `server/.env`.

## Volumes persistidos
- `server/data` e `server/uploads` são montados como volumes para persistir dados.