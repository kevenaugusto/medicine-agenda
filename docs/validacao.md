# Relatório de validação — Etapas 2 e 3

**Projeto:** Agenda de Medicamentos (ação de extensão — UFMS Digital, 2026.2)
**Ambiente:** localhost, navegador Chrome/Edge atualizado (dev server `npm run dev` e
build `npm run preview`)
**Status consolidado em:** 02/11/2026 (Etapas 2 e 3) e 03/11/2026 (evolução de
consultas médicas — F9–F12), a partir da validação manual executada em localhost.

---

## 1. Qualidade estática

| Item | Resultado |
|------|-----------|
| ESLint (`npm run lint`) | **0 problemas** |
| Artefatos gerados (`dev-dist/` do PWA) | Fora do lint (`globalIgnores`) e do versionamento (`.gitignore`) |
| Mapa funcional → requisitos | Rastreado em `docs/requisitos.md` (RF-01..14) e `PLAIN.md` §2.1 (F1–F8) |

## 2. Testes funcionais (PLAIN §8.1)

Execução manual em localhost; fluxos exercidos durante a implementação da Etapa 2 e
revisados na consolidação.

| Cenário | Resultado |
|---------|-----------|
| CT-01 Cadastro de paciente (listagem + persistência após reload) | Validado |
| CT-02 Edição de paciente (dados atualizam nos fluxos) | Validado |
| CT-03 Exclusão de paciente com medicamentos (cascata sem erro) | Validado |
| CT-04 Vínculo de medicamento com dose/unidade (legível no detalhe) | Validado |
| CT-05 Múltiplos horários por medicamento (agenda correta) | Validado |
| CT-06 Agenda diária agrupada por horário + próxima dose | Validado |
| CT-07 Marcar dose administrativa (gravado/exibido) | Validado |
| CT-08 Persistência após fechar/reabrir navegador | Validado (IndexedDB local) |

## 3. Notificações (PLAIN §8.2)

| Cenário | Resultado |
|---------|-----------|
| NT-01 Permissão aceita / negada (degrada sem quebrar o app; chip de status reflete) | Validado |
| NT-02 Disparo pontual (horário ~2 min à frente, aba aberta) | Validado |
| NT-03 Re-sincronização (edição de horário segue o novo valor; sem disparo retroativo) | Validado |
| NT-04 Aba em segundo plano (notificação dispara com o navegador em segundo plano) | Validado |

Limitação confirmada (risco R1): com o navegador fechado **não há disparo** — registros
da agenda do dia seguem como referência.

## 4. PWA (PLAIN §8.3)

| Cenário | Resultado |
|---------|-----------|
| PW-01 Instalação a partir do localhost (ícone de instalação disponível, app standalone) | Validado |
| PW-02 Offline após o primeiro carregamento (`npm run build && npm run preview` + modo Offline do DevTools + recarga) | Validado |
| PW-03 Auditoria Lighthouse | Não executado (opcional; coberto na prática por PW-01/PW-02) |

## 5. Erros encontrados e corrigidos

Registro com referência ao commit de correção (mantém rastreabilidade para o relatório):

| # | Defeito | Causa | Correção | Commit |
|---|---------|-------|----------|--------|
| 1 | Lint falhava com 36 erros em `dev-dist/` | `vite-plugin-pwa` gera service worker/Workbox em desenvolvimento; código de terceiros era lintado | `dev-dist` adicionada ao `.gitignore` e a `globalIgnores` do ESLint | `9000a89` |
| 2 | Erros `react-hooks/set-state-in-effect` em 3 visões | `setState` síncrono no corpo de efeito (regra nova do plugin react-hooks v7) | Funções `carregar` sem `setState` + chamadas `.then/.finally` no efeito com guarda de desmonte | `58702c9` |
| 3 | `RangeError: Invalid time value` ao abrir a tela de Pacientes (e DetalhePaciente) | `dataNascimento` é string ISO (`YYYY-MM-DD`); `Intl.DateTimeFormat.format()` exige `Date` e convertia a string → `NaN` | `formatarDataCurta` converte string→`Date` e devolve `'—'` para datas inválidas | `370372f` |

## 6. Pendências registradas

- **PW-03 (Lighthouse):** opcional no plano; pode ser executado em etapa futura.
- **Testes automatizados** (Vitest + Testing Library, PLAIN §8.5): pós-MVP, não
  bloqueiam a entrega.
- **Incrementos pós-MVP** (PLAIN §2.2): exportar/importar JSON, histórico por período,
  imprimibilidade e fonte grande — priorizados após a atividade com a comunidade.

## 7. Evolução — consultas médicas (F9–F12)

Evolução aditiva planejada em `docs/plano-consultas.md`; nenhuma alteração na parte de
medicamentos. Validação executada em 03/11/2026 em localhost.

### 7.1 Funcionais (consultas)

| Cenário | Resultado |
|---------|-----------|
| CT-09 Criar consulta (paciente + dados + alarmes) com persistência | Validado |
| CT-10 Editar consulta (data/hora e alarmes atualizados na lista) | Validado |
| CT-11 Excluir consulta (confirmação; some da lista e do detalhe do paciente) | Validado |
| CT-12 Validações de cadastro (paciente, campos obrigatórios, ≥1 alarme) | Validado |
| CT-13 Migração do banco para v2 (dados existentes preservados; store `consultas` criada) | Validado |

### 7.2 Notificações (consultas)

| Cenário | Resultado |
|---------|-----------|
| NT-05 Disparo "no horário" | Validado |
| NT-06 Disparo "15 minutos antes" | Validado |
| NT-07 Disparo "1 dia antes" (24 h) e "1 hora antes" | Validado |
| NT-08 Não repetição após recarga + reagendamento recalcula | Validado |
| NT-09 Sem disparo retroativo (alarme já passado) | Validado |

Limitações confirmadas (riscos do plano de consultas): com o navegador fechado não há
disparo (RN-C1); alarme com horário já decorrido é ignorado, com nota no formulário
(RN-C2); repetição pós-recarga evitada pelo `disparos` persistido na consulta (RN-C3).

### 7.3 PWA

| Cenário | Resultado |
|---------|-----------|
| PW-04 Offline com consultas cadastradas (`preview` + modo Offline do DevTools) | Validado |

### 7.4 Nota de desenho

A chave de não repetição do lembrete é o **horário previsto** do alarme (não o de
disparo) — decisão aplicada ainda no desenvolvimento (Fase C-3), necessária para o
comportamento correto de reagendamento (NT-08).
