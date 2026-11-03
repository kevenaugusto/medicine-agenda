# PLAIN — Plano de Implementação

**Ação de extensão:** Aplicação para o Gerenciamento de Medicamentos
**Disciplina:** Projeto Integrador de Tecnologia da Informação I — UFMS Digital
**Semestre letivo:** 2026.2
**Local de realização:** Residencial Vila Mendonça (Lar de Idosos)
**Documento-base:** Template do Estudante — Planejamento da Ação de Extensão (UFMS Digital)

---

## 1. Resumo executivo

A ação de extensão desenvolve uma **aplicação web progressiva (PWA)** para o
gerenciamento de medicamentos, voltada a pacientes, cuidadores e familiares — com
foco primário na equipe de cuidado do Lar de Idosos (Residencial Vila Mendonça). O
objetivo geral do documento-base é *"desenvolver uma aplicação web progressiva para o
gerenciamento de medicamentos, que permita cadastrar pacientes e medicamentos,
registrar doses e horários de administração e emitir notificações no navegador"*.

Este plano detalha como atingir esse objetivo dentro das restrições definidas no
documento-base:

- **Stack fixa:** React, persistência local em **IndexedDB** (sem servidor e sem banco
  de dados externo) e **API de notificações** do navegador.
- **Distribuição:** PWA servida em **localhost** (decisão de escopo) — instalável na
  máquina de demonstração; a comunidade é atendida via demonstração presencial
  (notebook/projetor) e material de apoio.
- **Entregas:** MVP funcional nas Etapas 1–3 do documento, seguido de atividade
  extensionista com a comunidade (Etapa 4) para orientação de uso e coleta de feedback.

A aplicação atende ao objetivo da ação ao **organizar, em um único lugar, pacientes,
medicamentos, doses e horários**, emitindo lembretes no momento previsto da toma —
reduzindo esquecimentos e duplicidades e apoiando a adesão terapêutica e o uso
racional de medicamentos, sem substituir a orientação de profissionais de saúde.

---

## 2. Escopo

### 2.1 MVP (núcleo obrigatório — alinhado aos objetivos geral e específicos)

| # | Funcionalidade | Origem no documento-base |
|---|----------------|--------------------------|
| F1 | Cadastro, edição e exclusão de **pacientes** | Etapa 1 (cadastro de paciente); Obj. geral |
| F2 | Cadastro de **medicamentos vinculados ao paciente**, com nome, dose/quantidade, unidade e instruções | Etapa 1/2; Obj. geral |
| F3 | Definição de **múltiplos horários por medicamento** (HH:MM) e ativar/desativar horário | Etapa 1/2 (definição de horários) |
| F4 | **Agenda diária** com doses agrupadas por horário, destacando a próxima dose | Etapa 2 (visualização da agenda diária) |
| F5 | **Registrar administração** (marcar dose como tomada/não tomada) para acompanhamento | Obj. específico 1 (acompanhamento da administração) |
| F6 | **Persistência local em IndexedDB** (dados sobrevivem a recarga e reabertura) | Objetivo geral; Etapa 2 |
| F7 | **PWA instalável** (manifest + service worker + ícones) | Objetivo geral; Etapa 3 |
| F8 | **Notificações no navegador** no horário cadastrado de cada medicamento | Objetivo geral; Etapa 3 |

### 2.2 Pós-MVP (incrementos — priorizados após a atividade com a comunidade)

| Incremento | Funcionalidades |
|------------|-----------------|
| **Incremento 1 — Continuidade de dados** | Histórico/relatório simples de doses tomadas por período; **exportar/importar** cadastros em JSON (backup no mesmo dispositivo); status expandido de dose (tomado / atrasado / pulado). |
| **Incremento 2 — Usabilidade e acessibilidade** | Agenda imprimível do dia; esquemas em dias específicos da semana (intermitente); modo de **fonte grande** e contrastes reforçados para idosos; atalho "próxima dose". |
| **Incremento 3 (futuro, fora do escopo atual)** | Multi-dispositivo/sincronização e alertas com o navegador fechado — **exigem servidor/Web Push e estão excluídos** por decisão de arquitetura (ver Não-escopo). |

### 2.3 Não-escopo (decisões explícitas do documento-base)

- **Backend/servidor e banco de dados externo:** não existem. Tudo é local no navegador.
- **Autenticação/perfis de usuário:** não há login; os dados são compartilhados no
  dispositivo em que a PWA é usada.
- **Sincronização entre dispositivos:** impossível sem servidor; mitigada por
  export/import (incremento 1).
- **Notificações push com o navegador fechado:** não suportadas por PWA local;
  as notificações disparam com a aba aberta (ativa ou em segundo plano). Limitação
  técnica documentada e tratada como risco (ver §7).
- **Aplicativo nativo; integrações com sistemas de saúde; substituição de prescrição
  médica:** fora do propósito da ação.

---

## 3. Funcionalidades por usuário/papel

O documento-base descreve paciente, cuidador, familiar, enfermeiro e os
estudantes/voluntários mediadores. Como não há autenticação, os papéis se distinguem
pela forma de uso, não por permissões.

| Papel | Necessidades | Funcionalidades usadas |
|-------|--------------|------------------------|
| **Paciente (idoso do Lar)** | Ver com clareza o que tomar e quando; ser lembrado no horário | F3, F4, F8 (notificações), leitura em fonte grande (inc. 2) |
| **Cuidador e familiar** | Cadastrar e corrigir pacientes e medicamentos; definir horários; acompanhar o que já foi dado | F1–F6, F8 (conferência de notificações e agenda) |
| **Enfermeiro(a) / profissional do Lar** | Organizar e revisar esquemas; conferir administrações registradas | F1–F6 (foco em revisão da agenda e histórico de F5) |
| **Estudante/voluntário (mediação)** | Demonstrar, instalar e orientar o uso na atividade extensionista | Todas, sobre um dispositivo de demonstração |

**Fluxo principal de uso (desenhado a partir do documento):**
`cadastrar paciente → vincular medicamento (dose/quantidade) → definir horários →
ativar notificações → acompanhar a agenda diária → marcar a dose como administrada`
em um único dispositivo compartilhado.

---

## 4. Arquitetura proposta

```
                         +----------------------------------------------------------+
                         |                    NAVEGADOR (Chrome/Edge)               |
                         |                                                          |
  localhost:5173  ──────► |  React SPA (Vite)                                        |
  (servidor de             |   ├─ Views: Agenda do dia · Pacientes ·                 |
   desenvolvimento)       |   │          Medicamentos · Config. de notificações     |
                          |   ├─ Módulo de dados (IndexedDB puro)                  |
                          |   │     db.js · pacientes.js · medicamentos.js         |
                          |   ├─ Módulo de notificações (Notification API local)    |
                          |   ├─ Service worker + manifest (PWA)                    |
                          |   └─ IndexedDB  ← persistência local (device)           |
                          +----------------------------------------------------------+
        (sem servidor de aplicação, sem banco externo, sem API)
```

- **Frontend:** React 18 (template `react` do Vite), JavaScript + JSX. Navegação por
  estado local entre as visões (sem dependência de roteador). Estilos CSS simples,
  responsivos e legíveis (fonte grande como padrão pensado para idosos).
- **Backend:** **inexistente** — decisão do documento-base. O dev server do Vite apenas
  serve os arquivos estáticos no desenvolvimento (`npm run dev`).
- **Banco de dados:** IndexedDB, banco `medicine-agenda` (versão 1), **IndexedDB puro**
  (decisão), embrulhado em um módulo de acesso a dados:

  | Object store | keyPath | Índices | Conteúdo |
  |--------------|---------|---------|----------|
  | `pacientes` | `id` | `nome` | id, nome, dataNascimento, observações, criadoEm, atualizadoEm |
  | `medicamentos` | `id` | `pacienteId` | id, pacienteId, nome, quantidade, unidade, instruções, **horarios** `[{id, hora, dose, ativo}]`, ativo, criadoEm |
  | `registros` (administração) | `id` | `medicamentoId`, `dataHoraRegistro` | id, medicamentoId, horarioId, dataHoraPrevista, dataHoraRegistro, status (`tomado`/`atrasado`/`pulado`) |

  Os horários são embutidos no medicamento (IndexedDB não tem _joins_; para a escala
  local — dezenas de pacientes — a leitura da agenda diária continua simples: percorrer
  medicamentos ativos e filtrar por hora). O módulo expõe API em Promises
  (`criarPaciente`, `listarPacientes`, `adicionarMedicamento`, `listarHorariosDoDia`,
  `registrarAdministracao`, …) e cuida do `onupgradeneeded`.
- **PWA:** `vite-plugin-pwa` (padrão da comunidade Vite, baseado em Workbox) — gera
  manifesto e service worker com pré-cache do _app shell_, permitindo instalação e uso
  offline após o primeiro carregamento.
- **Notificações:** Notification API local. O agendador (re)cria os disparos ao carregar
  a página e re-sincroniza a cada intervalo (~30 s) e no retorno de foco (`visibilitychange`).
  **Limitação conhecida:** a notificação dispara com a aba aberta (ativa ou em
  segundo plano); navegador fechado, não há disparo.
- **Deploy:** **localhost apenas** (decisão de escopo). O build (`npm run build`) gera
  `dist/` estático, que posteriormente, se desejado, pode ser publicado em qualquer
  hospedagem estática (Vercel/Netlify/GitHub Pages) para instalação em celulares — fora
  do escopo atual.

---

## 5. Roadmap em fases

Fases alinhadas às quatro etapas do documento-base; datas de referência do
cronograma original. Fase 0 não consta no documento — é prática de engenharia.

### Fase 0 — Preparação do ambiente (pré-requisito)
- Inicializar repositório git e `.gitignore`; conferir Node.js/npm instalados
  (comandos em **§9 — Anexo A**).
- **Critérios de aceite:** `npm run dev` abre a aplicação padrão em `http://localhost:5173`.

### Fase 1 — Levantamento de requisitos e estudo teórico *(Etapa 1 — doc: 21/10, 2h)*
- Revisão dos requisitos F1–F8 já consolidados neste plano contra o documento-base.
- Estudo teórico (adesão terapêutica, uso racional de medicamentos, PWA, IndexedDB,
  Notification API) com anotações em `docs/` e registro das referências citadas.
- Desenho do fluxo de uso (§3) e rascunho do script da atividade extensionista.
- **Critérios de aceite:** checklist de requisitos rastreado ao documento; nota de
  estudo com referências; fluxo de telas validado (lista de visões da §4).

### Fase 2 — Modelagem e desenvolvimento da aplicação *(Etapa 2 — doc: 24/10, 8h)*
- Scaffold Vite + React e módulo de dados IndexedDB (schema das 3 stores + CRUD).
- Telas: listagem/cadastro/edição/exclusão de **pacientes**.
- Telas: cadastro de **medicamento** (nome, quantidade, unidade, instruções, vínculo ao
  paciente) e gerenciamento de **múltiplos horários**.
- **Agenda diária** agrupada por horário, com destaque da próxima dose e ação de
  **marcar como administrada** (grava em `registros`).
- **Critérios de aceite:** CRUD completo navegável; recarregar a página e reabrir o
  navegador preserva os dados (persistência validada); agenda do dia correta (ex.:
  2 medicamentos às 08:00 aparecem juntos, na ordem correta); sem erros no console.

### Fase 3 — PWA e notificações *(Etapa 3 — doc: 26/10, 3h)*
- Integrar `vite-plugin-pwa`: manifesto, service worker, ícones 192/512 e
  `installability` no localhost.
- Módulo de notificações: pedido de permissão, agendamento local e disparo no horário.
- Testes de permissão (aceita/negada), disparo pontual e exibição; ajustes de
  usabilidade.
- **Critérios de aceite:** PWA instalável a partir do localhost (ícone de instalação
  disponível; Lighthouse PWA passando instalação/offline); app abre offline após o
  primeiro carregamento; notificação dispara no horário cadastrado com a aba aberta;
  permissão negada degrada para alerta visual in-app sem quebrar o app.

### Fase 4 — Atividade com a comunidade e avaliação *(Etapa 4 — doc: 30/10, 4h)*
- Preparar roteiro de demonstração, material impresso/digital simplificado e o
  formulário de coleta de feedback (usabilidade, clareza, melhorias).
- Executar no Lar (Residencial Vila Mendonça) com cuidadores e enfermeiros:
  apresentação, orientação prática de cadastro de pacientes/medicamentos/horários e
  ativação de notificações — **demo via localhost no notebook/projetor**.
- Consolidar o feedback, priorizar e aplicar ajustes finais (ou registrá-los como
  pendências rastreadas).
- **Critérios de aceite:** atividade realizada com registro (fotos/lista de presença,
  conforme orientação da disciplina); feedback coletado e consolidado em relatório
  curto; cada sugestão resolvida ou registrada como pendência com justificativa.

---

## 6. Definição de pronto (DoD)

Uma funcionalidade/incremento é **pronto** quando:

1. Implementada e navegável no `localhost` (dev server), com fluxo descrito em §3.
2. Persistência validada: recarregar/reabrir não perde dados; exclusões removem
   dependências corretamente (ex.: excluir paciente remove acesso aos seus
   medicamentos).
3. Sem erros no console/network; textos em **português-BR** claros e consistentes.
4. Acessível ao público-alvo: leitura legível, contraste adequado, botões exploráveis.
5. (Quando aplicável) Notificação testada em cenário real (permissão + disparo + exibição).
6. Rastreável: requisito ligado a F1–F8 do §2.1 e ao documento-base.
7. Testada segundo o plano de testes (§8) e ajustes registrados.
8. Sugerido **commit** convencional em pt-BR para o ponto concluído
   (ver diretrizes de versionamento do estudante — §9, Anexo C).

---

## 7. Riscos e premissas

### 7.1 Riscos

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| R1 | **Notificações não disparam com o navegador fechado** (limitação técnica de PWA local) | Alto | Documentar na tela e na atividade; orientar a manter o navegador aberto nos períodos críticos; agenda diária como camada visual de segurança |
| R2 | Permissão de notificação negada no dispositivo | Médio | Tela de configuração explicativa; degradação para alerta visual in-app (destaque da dose, contraste) |
| R3 | Perda de dados por limpeza de dados do navegador/cache | Médio | Incremento 1 (exportar/importar JSON); orientação de backup na atividade |
| R4 | Instalação limitada a localhost — comunidade não instala no celular (decisão assumida) | Médio | Demo presencial em notebook/projetor + material impresso; caminho futuro: hospedagem estática (fora do escopo) |
| R5 | Esquema complexo (polifarmácia) gera hesitação na operação | Médio | Agenda agrupada por horário; instruções claras; treinamento no Lar |
| R6 | Cronograma curto (8h + 3h + 4h) frente ao escopo | Alto | Corte de incrementos; MVP fechado em §2.1; incrementos ficam para após a Etapa 4 |
| R7 | Feedback da comunidade de difícil consolidação (idosos com déficit cognitivo, tempo limitado) | Médio | Entrevista com cuidadores/enfermeiros (mediadores); formulário objetivo; observação estruturada |

### 7.2 Premissas

- Stack aprovada: React + Vite, IndexedDB puro, Notification API, `vite-plugin-pwa`.
- Distribuição apenas em **localhost** (decisão); navegador atualizado (Chrome ou Edge).
- **Público-alvo primário:** cuidadores e enfermeiros do Lar de Idosos operando a
  ferramenta em um dispositivo (dados compartilhados localmente — sem login).
  Beneficiários finais: os idosos residentes. Secundário: familiares.
- Aplicativo é ferramenta de **apoio**; não substitui prescrição nem orientação
  profissional de saúde.
- Cronograma segue o documento-base; se as datas (21/10 a 30/10) precisarem de ajuste
  junto ao docente, o plano de fases permanece o mesmo — apenas re-agenda a Fase 4.

---

## 8. Plano de testes

### 8.1 Funcionais (manuais, por fluxo — executados no localhost)

| Cenário | Passos | Resultado esperado |
|---------|--------|--------------------|
| CT-01 Cadastro de paciente | Novo → preencher → salvar | Aparece na listagem; persiste após recarregar |
| CT-02 Edição de paciente | Alterar nome → salvar | Dados atualizados na listagem e no fluxo |
| CT-03 Exclusão de paciente | Excluir paciente com medicamentos | Paciente e seus medicamentos saem da agenda; sem erro |
| CT-04 Vínculo de medicamento | Criar medicamento para paciente com dose/unidade | Medicamento listado no detalhe do paciente com dose legível |
| CT-05 Horários múltiplos | Definir 2 horários no mesmo medicamento | Ambos aparecem na agenda do dia no horário certo |
| CT-06 Agenda diária | 2 medicamentos às 08:00 + 1 às 12:00 | Agrupamento por horário correto; próxima dose destacada |
| CT-07 Marcar como administrado | Marcar dose → consultar agenda/histórico | Registro gravado e exibido como tomado |
| CT-08 Persistência | Fazer cadastros → fechar/reabrir navegador | Dados intactos |

### 8.2 Notificações (Etapa 3)

- **NT-01 Permissão aceita/negada:** ambas as vias não quebram o app; negada exibe
  aviso visual.
- **NT-02 Disparo pontual:** horário agendado para daqui a 1–2 min → notificação exibida
  com a aba aberta.
- **NT-03 Re-sincronização:** cadastrar horário já decorrido → não dispara retroativamente;
  editar horário → novo disparo segue o horário atualizado.
- **NT-04 Aba em segundo plano:** mudar de aba → notificação continua disparando
  (limitação de timer documentada — validar no navegador real).

### 8.3 PWA (Etapa 3)

- **PW-01** Instalação a partir do localhost (ícone instalável disponível).
- **PW-02** Uso offline após o primeiro carregamento (desconectar rede/DevTools).
- **PW-03** Auditória Lighthouse: categorias PWA-instalação e offline aprovadas.

### 8.4 Usabilidade (Etapa 4, com a comunidade)

- Tarefas observadas: cadastrar medicamento, ajustar horário, identificar a próxima
  dose, marcar como tomada.
- Coleta: questionário objetivo (clareza, facilidade, utilidade) + campo aberto de
  melhorias; medição de conclusão de tarefa (sim/não/ajuda).
- Consolidação: relatório curto com acertos, dificuldades e sugestões priorizadas.

### 8.5 Automatizados (opcional / pós-MVP)

- **Vitest + Testing Library** para a camada de lógica pura (formatação de horários,
  montagem da agenda do dia) e repositórios IndexedDB (com `fake-indexeddb`), se o
  estudante optar. Não bloqueia o MVP.

---

## 9. Anexos

### Anexo A — Comandos de setup e execução (executados **manualmente** pelo estudante)

> Restrição do plano: o agente não executa comandos de instalação/build. Os comandos
> abaixo devem ser rodados pelo usuário, que informa o resultado antes de prosseguir.

```bash
cd /Users/kevenaugusto/Documents/Projetos/medicine-agenda
git init
npm create vite@latest . -- --template react     # se perguntar sobre pasta não vazia: "Ignore files and continue"
npm install
npm install -D vite-plugin-pwa
npm run dev                                       # http://localhost:5173
```

Uso diário: `npm run dev` para desenvolver; `npm run build` + `npm run preview`
para validar o build local.

### Anexo B — Estrutura de pastas prevista

```
medicine-agenda/
├─ public/                 # ícones PWA (192, 512, favicon)
├─ src/
│  ├─ main.jsx             # bootstrap + registro do service worker
│  ├─ App.jsx              # navegação entre visões
│  ├─ components/          # FormPaciente, FormMedicamento, ListaHorarios, DoseItem…
│  ├─ views/               # AgendaDoDia, Pacientes, DetalhePaciente, Configuracoes
│  ├─ db/                  # db.js, pacientes.js, medicamentos.js, registros.js (IndexedDB puro)
│  └─ notifications/       # notifications.js, scheduler.js
├─ docs/                   # estudo teórico, roteiro da atividade, relatório de feedback
├─ index.html
├─ vite.config.js          # + vite-plugin-pwa
└─ package.json
```

### Anexo C — Estratégia de versionamento (sugestão ao estudante)

Commits atômicos em Conventional Commits (pt-BR), um por ponto concluído — o Git Flow
com branches `feature/` é sugerido se o docente não exigir outra organização:

- `docs: adiciona planejamento da ação de extensão` → após a Fase 1 (este PLAN.md + estudo).
- `feat: implementa cadastro e listagem de pacientes` → Fase 2 (F1).
- `feat: implementa medicamentos com horários e dose` → Fase 2 (F2, F3).
- `feat: implementa agenda diária e registro de administração` → Fase 2 (F4, F5).
- `feat: configura PWA instalável` → Fase 3 (F7).
- `feat: implementa notificações de medicamento` → Fase 3 (F8).
- `chore: aplica ajustes pós-feedback da comunidade` → Fase 4.

Cada commit segue o formato: `<tipo>(<escopo>): <resumo> em pt-BR` com corpo
(*Por que / Como / Relacionado a*), e o `git add` lista os arquivos explicitamente —
nunca `git add .`/`git add -A`.
