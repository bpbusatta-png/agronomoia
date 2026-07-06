# Agrônomo IA — App de Campo

App móvel (React Native + Expo + TypeScript) para uso em campo por técnicos/agrônomos:
- **Talhões**: lista somente-leitura, com cache local (funciona com a última sincronização mesmo sem conexão)
- **Inspeções**: cadastro offline-first — salva localmente na hora e sincroniza com o backend quando há conexão, com fila de reenvio automático em caso de falha
- **Fotografias**: tira foto ou escolhe da galeria, salva localmente e sincroniza (upload para o storage + criação do registro) com a mesma fila offline-first das inspeções

## Rodando localmente

```
npm install
cp .env.example .env   # ajustar EXPO_PUBLIC_API_URL se o backend não estiver em localhost:8000
npx expo start
```

Escaneie o QR code com o app **Expo Go** (Android/iOS) ou pressione `w` para abrir no navegador.

> Em dispositivo físico, `localhost` não alcança o backend rodando no seu computador — use o IP da máquina na rede local (ex: `EXPO_PUBLIC_API_URL=http://192.168.0.10:8000/api`) e certifique-se de que o backend aceita conexões de fora (`uvicorn --host 0.0.0.0`).

Requer o [backend](../../backend) rodando (com o [MinIO](../../README.md#armazenamento-de-arquivos-fotos) no ar para a sincronização de fotos funcionar) e um usuário criado via `backend/scripts/seed_admin.py`.

## Arquitetura

- `src/auth/AuthContext.tsx` — login (JWT via `/api/auth/login`), estado de autenticação
- `src/lib/api.ts` — cliente Axios com injeção do token e renovação automática via refresh token em respostas 401
- `src/lib/tokenStorage.ts` — abstração de armazenamento de token: `expo-secure-store` (keychain/keystore nativo) em iOS/Android; `localStorage` no modo web, usado apenas para testar este app neste ambiente de desenvolvimento (sem emulador disponível) — a build web do `expo-secure-store` não funciona corretamente na SDK 57
- `src/lib/db.ts` — cache/fila local via `expo-sqlite` (banco real, persistido) em iOS/Android; `localStorage` no modo web, mesma ressalva acima. Três tabelas: `talhoes_cache` (somente leitura, sobrescrita a cada sync), `inspecoes_locais` e `fotografias_locais` (filas de cadastro offline, com `status`: `pendente`/`sincronizado`/`erro`)
- `src/lib/sync.ts` — `syncPendingInspecoes()` e `syncPendingFotografias()`: enviam os itens com status `pendente` **ou `erro`** (falhas de tentativas anteriores são reenviadas, não descartadas). Fotografias sobem primeiro o arquivo para `POST /api/uploads` (multipart) e só então criam o registro em `POST /api/fotografias` com a URL retornada. Ambas registram o envio em `POST /api/sincronizacao-log` (com `dispositivo_id` persistido localmente e `timestamp_local` do momento em que foi criado offline)
- `src/screens/TalhoesScreen.tsx` — ao abrir, mostra o que já está em cache local e dispara sincronização com a API em paralelo (também via pull-to-refresh); resolve fazenda/cultivar/safra pelo nome antes de gravar no cache
- `src/screens/InspecoesScreen.tsx` — formulário (talhão via seletor de cache local + data + estádio + observações) que salva offline instantaneamente e tenta sincronizar em seguida; lista local mostra o status de cada registro
- `src/screens/FotografiasScreen.tsx` — captura via `expo-image-picker` (câmera ou galeria); em iOS/Android o arquivo é copiado para o diretório de documentos do app (`expo-file-system/legacy`) antes de entrar na fila, garantindo que sobrevive a reinícios do app mesmo sem conexão

Navegação entre as três telas é uma barra de abas simples em `App.tsx` (sem biblioteca de navegação).

## Próximos passos (fora desta leva)

Telas de monitoramento (aplicações, histórico climático, análises de solo) e inteligência especializada no app mobile — hoje só inspeções e fotografias têm cadastro offline; o restante do schema só está disponível via dashboard web.
