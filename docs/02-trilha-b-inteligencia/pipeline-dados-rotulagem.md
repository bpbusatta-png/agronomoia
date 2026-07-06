# Pipeline de Dados e Rotulagem — Agrônomo IA
*Item B0 · Trilha B — Inteligência Especializada · pasta sugerida: `02-trilha-b-inteligencia/`*

## Objetivo
Construir a infraestrutura de coleta, armazenamento, rotulagem e versionamento de fotografias e dados de campo. **Pré-requisito técnico** para B4 (Pragas), B5 (Doenças) e B6 (Plantas Atípicas) — sem dataset rotulado e validado, nenhum desses modelos pode ser treinado ou confiável.

---

## 1. Ciclo de vida do dado

```
Captura → Armazenamento → Rotulagem → Revisão → Curadoria do dataset → Treino → Validação → Produção
```

1. **Captura** — foto tirada pelo técnico via app de campo (Trilha D), com metadados automáticos (talhão, geolocalização, timestamp, tipo pretendido)
2. **Armazenamento** — upload para object storage; registro na tabela `fotografias`
3. **Rotulagem** — agrônomo/técnico atribui o rótulo correto (qual praga, qual doença, conforme/não conforme); registrado em `dataset_rotulos`
4. **Revisão** — uma segunda pessoa (idealmente o RT) revisa uma amostra dos rótulos, obrigatória para plantas atípicas
5. **Curadoria do dataset** — antes de qualquer treino, checar balanceamento entre classes e remover duplicatas/imagens de baixa qualidade
6. **Treino** — gera uma nova entrada em `modelos_versoes`, associada ao conjunto de `dataset_rotulos` usado
7. **Validação** — métricas de acurácia/precisão calculadas contra um conjunto de validação nunca usado em treino
8. **Produção** — só entra em produção (`em_producao = true`) após validação do RT

---

## 2. Quem rotula o quê

| Tipo de rótulo | Quem rotula | Quem revisa |
|---|---|---|
| Pragas | Técnico de campo | Agrônomo (amostral) |
| Doenças | Técnico de campo | Agrônomo (amostral) |
| Plantas atípicas | Agrônomo (nunca só o técnico) | RT (sempre, 100% dos casos) |

---

## 3. Ferramenta de rotulagem
Para o MVP, uma interface simples dentro do próprio Agente de Cadastro é suficiente (foto + formulário de classificação). Para volume maior, vale considerar ferramentas especializadas de rotulagem de imagens (ex.: Label Studio, CVAT), que já resolvem fila de trabalho, controle de qualidade e exportação em formato pronto para treino.

---

## 4. Critérios de qualidade do dataset antes do treino
- Mínimo de exemplos por classe (a definir por praga/doença — pragas raras podem exigir estratégias de data augmentation)
- Diversidade de condições (luz, ângulo, estádio da cultura), para evitar overfitting a condições específicas
- Sem duplicatas ou quase-duplicatas entre o conjunto de treino e o de validação

---

## 5. Cadência de retreinamento (ver também item B7 — Aprendizado Contínuo)
- Sugestão inicial: retreinar por safra, não continuamente — permite acumular volume suficiente de rótulos validados e evita mudanças de comportamento não planejadas em plena safra
- Toda mudança de versão em produção é registrada em `modelos_versoes` com as métricas de validação, permitindo comparar versão nova vs. anterior antes de promover

---

## 6. Relação com o schema já definido
- `fotografias` — matéria-prima do pipeline
- `dataset_rotulos` — rótulos atribuídos, com `rotulado_por` e `revisado_por`
- `modelos_versoes` — cada ciclo de treino, com métricas de validação
- `log_predicoes_ia` (Trilha C) — toda predição em produção, permitindo detectar drift ao comparar com validações humanas ao longo do tempo

---

## 7. Checklist antes de treinar o primeiro modelo
- [ ] Volume mínimo de exemplos rotulados por classe definido e atingido
- [ ] Amostra de rótulos revisada pelo RT sem discordância relevante
- [ ] Conjunto de validação separado do conjunto de treino (sem vazamento)
- [ ] Critério de promoção para produção acordado (ex.: acurácia mínima) antes de rodar o treino, não depois
