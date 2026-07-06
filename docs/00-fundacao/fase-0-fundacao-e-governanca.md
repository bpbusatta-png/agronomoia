# Fase 0 — Fundação e Governança
*Pré-requisito de todas as trilhas do roadmap · pasta sugerida: `00-fundacao/`*

## Objetivo
Definir, antes de qualquer linha de código, os elementos que o plano original não definia: equipe, orçamento, métricas de sucesso, framework de compliance e escopo do primeiro entregável (MVP).

---

## 1. Equipe mínima e responsabilidades

| Papel | Responsabilidade principal |
|---|---|
| Engenheiro(a) Agrônomo(a) sênior (RT) | Responsável Técnico do sistema. Valida critérios agronômicos, é o validador final em decisões críticas (ex.: eliminação de planta atípica), garante alinhamento com RENASEM/MAPA |
| Agrônomos/técnicos de campo | Coletam e validam rótulos para os modelos de visão computacional; executam inspeções piloto |
| Engenheiro(a) de dados / MLOps | Constrói o pipeline de dados (item B0), cadência de retreinamento, monitoramento de drift |
| Engenheiro(a) de ML / Visão Computacional | Desenvolve os modelos de pragas, doenças e plantas atípicas |
| Engenheiro(a) de backend e APIs | Constrói a arquitetura central (A1), banco de dados (A2), agentes conversacionais |
| Engenheiro(a) mobile | Constrói o app de campo offline-first (Trilha D) |
| Especialista em GIS/geoprocessamento | Constrói o pipeline de NDVI e demais camadas geoespaciais |
| Product owner / gestor de projeto | Prioriza o backlog entre as 4 trilhas, mantém o MVP com escopo enxuto |
| Consultoria em LGPD | Revisão pontual do tratamento de dados pessoais dos cooperados |

---

## 2. Orçamento e cronograma — itens a estimar

| Item | Por que importa |
|---|---|
| Imagens de satélite (Planet, pago) vs. Sentinel (gratuito) | Sentinel tem atraso de revisita; Planet custa por área/frequência |
| Custo de inferência de IA em produção | Escala com volume de fotos por safra — pode surpreender se não orçado |
| Armazenamento de imagens | Potencialmente terabytes ao longo de safras sucessivas |
| Dispositivos móveis para campo | Um por técnico/inspetor, com bateria e câmera adequadas ao uso a campo |
| Consultoria jurídica (LGPD) | Pontual, mas necessária antes de armazenar dados de cooperados |

*Valores específicos dependem do tamanho da cooperativa, número de talhões e safras por ano — a definir com a equipe.*

---

## 3. KPIs por trilha — sugestão inicial

| Trilha | Métrica | Meta inicial sugerida |
|---|---|---|
| A — Plataforma Central | Tempo médio de cadastro por talhão | < 5 min |
| A — Plataforma Central | Uptime da plataforma | > 99% |
| B — Inteligência Especializada | Acurácia do modelo vs. diagnóstico do agrônomo | > 85% antes de reduzir revisão humana |
| B — Inteligência Especializada | % de diagnósticos que exigem revisão humana | 100% nos primeiros 2 ciclos de safra |
| C — Confiabilidade | % de ações irreversíveis com validação humana registrada | 100%, sem exceção |
| D — Mobile e Campo | % de sincronização bem-sucedida após reconexão | > 98% |

---

## 4. Framework de compliance

### LGPD
- Mapear todo dado pessoal de cooperados: contatos, coordenadas de propriedade, documentos
- Definir base legal para cada tratamento (execução de contrato, legítimo interesse, consentimento)
- Definir prazo de retenção e política de acesso/exclusão

### RENASEM / MAPA
- Alinhar critérios de classificação/eliminação de plantas atípicas com a normativa vigente de produção de sementes
- Garantir que o Responsável Técnico (RT) permanece formalmente no fluxo de decisão, mesmo quando a IA gera a recomendação inicial
- Documentar rastreabilidade: toda decisão que afeta a certificação do lote precisa ser reconstituível

### Gate humano obrigatório
- Nenhuma ação de efeito irreversível (eliminação de planta, recomendação de aplicação) é executada sem validação humana registrada (ver tabela `validacoes_humanas` no schema do banco de dados)

---

## 5. Escopo do MVP — critérios de seleção

Escolher deliberadamente um recorte pequeno para o primeiro ciclo ponta a ponta:
- 1 safra
- 1 a 2 cultivares
- Um número limitado de talhões/fazendas (sugestão: entre 5 e 15 — suficiente para validar o fluxo sem sobrecarregar a equipe de rotulagem)
- Preferencialmente talhões com histórico de dados (safras anteriores) para servir de referência de validação

---

## 6. Checklist antes de iniciar a Onda 1 (MVP)

- [ ] Equipe mínima alocada (mesmo que parcialmente)
- [ ] Orçamento aprovado para a Onda 1
- [ ] KPIs de Onda 1 acordados com os stakeholders
- [ ] Recorte piloto (safra/cultivares/talhões) definido
- [ ] Responsável Técnico (RT) identificado e formalmente designado
- [ ] Mapeamento inicial de dados pessoais (LGPD) concluído
