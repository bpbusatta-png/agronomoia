# Agrônomo IA — App de Campo

App móvel (React Native + Expo + TypeScript) para uso em campo por técnicos/agrônomos. As telas de cadastro são offline-first (salvam localmente na hora, sincronizam quando há conexão, com fila de reenvio automático em caso de falha); as telas analíticas (NDVI, produtividade) e a de validação são só leitura/ação online, com cache local para consulta:
- **Talhões**: lista somente-leitura, com cache local (funciona com a última sincronização mesmo sem conexão)
- **Inspeções**
- **Fotografias**: tira foto ou escolhe da galeria; sincroniza via upload para o storage + criação do registro
- **Aplicações**
- **Solo**: análises de solo (pH, matéria orgânica)
- **Pragas**: ocorrências de pragas, com seletor do catálogo (também cacheado localmente)
- **Doenças**: ocorrências de doenças, com seletor do catálogo
- **Colheita**: quantidade colhida, umidade e qualidade da semente, com seletor de talhão e safra (mesmo padrão offline-first das demais)
- **NDVI**: leituras por talhão (fonte, NDVI/NDRE/MSAVI médios) — somente leitura, `Tecnico_Campo` não tem permissão de escrita nessa entidade (fica a cargo do `Agronomo_RT`/pipeline de ML, via dashboard web)
- **Produtividade**: estimativas por talhão/safra (kg/ha e intervalo de confiança) — mesma restrição de escrita do NDVI
- **Validação**: lista ocorrências de plantas atípicas pendentes (`status='pendente_validacao'`) e permite decidir manter/eliminar — ação restrita a `Administrador`/`Agronomo_RT` (gate humano obrigatório, ver [schema do banco](../../docs/01-trilha-a-plataforma/schema-banco-de-dados.md)); a tela é visível a todos os papéis, mas o backend rejeita a validação (403) de quem não tiver o papel certo

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
- `src/lib/db.ts` — persistência local via `expo-sqlite` (banco real) em iOS/Android, `localStorage` no modo web (mesma ressalva acima):
  - `talhoes_cache` — cache somente-leitura específico de talhões (sobrescrito a cada sync)
  - `reference_cache` / `upsertCache()` / `getCache()` — cache de referência **genérico**, usado por `pragas_catalogo`, `doencas_catalogo`, `safras` e pelas leituras somente-leitura de NDVI/produtividade (evita uma tabela nova por catálogo/entidade)
  - `inspecoes_locais` e `fotografias_locais` — filas de cadastro offline especificas dessas duas entidades (as duas primeiras implementadas, antes de generalizar)
  - `local_queue` / `addToQueue()` / `listQueue()` / `updateQueueStatus()` — fila de cadastro offline **genérica**, usada por aplicações, análises de solo, ocorrências de pragas/doenças e colheita (mesmo `status`: `pendente`/`sincronizado`/`erro`, sem repetir tabela+funções por entidade)
- `src/lib/sync.ts` — uma função de sync por entidade; as 5 mais novas (incluindo colheita) usam `syncQueue()` internamente (mesmo laço: pendentes/erro → `POST` no endpoint → `POST /sincronizacao-log`), parametrizado por `queueKey`, endpoint e função de montagem do payload. Fotografias tem um passo a mais: sobe o arquivo para `POST /api/uploads` antes de criar o registro
- `src/components/CachePickerModal.tsx` — modal de seleção genérico (usado para escolher talhão, safra, praga ou doença a partir do cache local)
- `src/screens/` — uma tela por entidade. Telas de cadastro seguem o mesmo formato: seletor(es) via `CachePickerModal`, campos de formulário, botão "Salvar (funciona offline)", contador de pendentes + "Sincronizar agora", lista local com status. `NdviScreen`/`ProdutividadeScreen` seguem o padrão somente-leitura de `TalhoesScreen` (busca + cache local, pull-to-refresh); `PlantasAtipicasValidacaoScreen` busca a lista ao vivo (sem fila offline, já que a ação exige conexão) e reaproveita o mesmo fluxo de decisão (manter/eliminar + justificativa) do dashboard web

Navegação entre as 11 telas é uma barra de abas rolável horizontalmente em `App.tsx` (sem biblioteca de navegação).

## Próximos passos (fora desta leva)

Histórico climático e modelos de IA (ficam só no dashboard web — dado mais administrativo, `Tecnico_Campo` não tem permissão de escrita e não haveria uso de campo). Testar em emulador/dispositivo Android/iOS de verdade (só validado via Expo web até aqui).
