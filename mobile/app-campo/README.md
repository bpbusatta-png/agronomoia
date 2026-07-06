# Agrônomo IA — App de Campo

App móvel (React Native + Expo + TypeScript) para uso em campo por técnicos/agrônomos. Primeira leva: autenticação e lista de talhões (somente leitura), com cache local para funcionar com a última sincronização mesmo sem conexão.

## Rodando localmente

```
npm install
cp .env.example .env   # ajustar EXPO_PUBLIC_API_URL se o backend não estiver em localhost:8000
npx expo start
```

Escaneie o QR code com o app **Expo Go** (Android/iOS) ou pressione `w` para abrir no navegador.

> Em dispositivo físico, `localhost` não alcança o backend rodando no seu computador — use o IP da máquina na rede local (ex: `EXPO_PUBLIC_API_URL=http://192.168.0.10:8000/api`) e certifique-se de que o backend aceita conexões de fora (`uvicorn --host 0.0.0.0`).

Requer o [backend](../../backend) rodando e um usuário criado via `backend/scripts/seed_admin.py`.

## Arquitetura

- `src/auth/AuthContext.tsx` — login (JWT via `/api/auth/login`), estado de autenticação
- `src/lib/api.ts` — cliente Axios com injeção do token e renovação automática via refresh token em respostas 401
- `src/lib/tokenStorage.ts` — abstração de armazenamento de token: `expo-secure-store` (keychain/keystore nativo) em iOS/Android; `localStorage` no modo web, usado apenas para testar este app neste ambiente de desenvolvimento (sem emulador disponível) — a build web do `expo-secure-store` não funciona corretamente na SDK 57
- `src/lib/db.ts` — cache local dos talhões: `expo-sqlite` (banco real, persistido) em iOS/Android; `localStorage` no modo web, mesma ressalva acima
- `src/screens/TalhoesScreen.tsx` — ao abrir, mostra o que já está em cache local e dispara sincronização com a API em paralelo (também via pull-to-refresh); resolve fazenda/cultivar/safra pelo nome antes de gravar no cache

## Próximos passos (fora desta leva)

Cadastro offline de inspeções/fotografias com fila de sincronização contra `sincronizacao_log` (o "offline-first" completo descrito em `docs/01-trilha-a-plataforma/arquitetura-base.md`) — esta primeira leva cobre apenas leitura.
