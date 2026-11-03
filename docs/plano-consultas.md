# PLAIN Consultas — Evolução: lembretes para consultas médicas

**Projeto:** medicine-agenda (Projeto Integrador de TI I — UFMS Digital, 2026.2)
**Base:** [`PLAIN.md`](../PLAIN.md) — plano aprovado da ação de extensão
**Natureza:** evolução **aditiva e isolada** sobre o produto existente (Etapas 1–3
concluídas). Nada da parte de medicamentos (modelo, telas, agenda do dia, agendador de
doses) é alterado.
**Status:** proposta para aprovação (não implementada).

---

## 1. Decisão de documentação

O plano desta evolução fica em um **documento novo** (`docs/plano-consultas.md`) em vez de
alterar o `PLAIN.md`, porque:

- o `PLAIN.md` é o plano **aprovado** e rastreado ao documento-base da ação de extensão —
  reescrevê-lo colocaria em risco a rastreabilidade já entregue;
- a evolução é **aditiva e isolada** (novo domínio: consultas), exigindo suas próprias
  fases, riscos e testes — manter tudo em um arquivo dificultaria a leitura;
- o padrão de seções é o mesmo do PLAIN e o documento é indexado no `README.md`.

## 2. Objetivo e escopo

### 2.1 Objetivo
Dar suporte ao **agendamento de consultas médicas com alarmes de lembrete**, como nova
área funcional — decisões de negócio aprovadas pelo usuário:

1. **Vínculo obrigatório ao paciente** (toda consulta pertence a um paciente cadastrado) —
   mantém a coesão do domínio e permite exibir as consultas no detalhe do paciente.
2. **Alarme "um dia antes" = 24h exatas** antes do horário da consulta
   (ex.: 10/11 14:00 → alarme 09/11 14:00). Se o momento previsto já passou no
   cadastro/reagendamento, o alarme é **ignorado** (sem disparo retroativo).

### 2.2 Inclui (requisitos funcionais)

| # | Funcionalidade | Origem |
|---|----------------|--------|
| F9 | Cadastro de **consulta médica**: especialidade, profissional responsável, endereço do consultório, data e horário; vínculo obrigatório ao paciente | Escopo §"Deve incluir" (1) |
| F10 | **Um ou mais alarmes** por consulta, entre: 1 dia antes (24h), 1 hora antes, 15 minutos antes, no horário | Escopo §"Deve incluir" (2) |
| F11 | **Listagem** das consultas agendadas, com **edição e exclusão** | Escopo §"Deve incluir" (3) — ver §3.3 |
| F12 | **Persistência local** em IndexedDB e **notificações** via Notification API, com a limitação já documentada (navegador aberto — risco R1 do PLAIN) | Escopo §"Deve incluir" (4) |

### 2.3 Não inclui (não-escopo)
- **Qualquer alteração na parte de medicamentos**: modelagem, telas, agenda do dia,
  scheduler de doses (`verificarHorarios`) e stores existentes permanecem intocados.
- Mudança de stack, de arquitetura de banco existente ou das convenções do repositório.
- **Campos de interface além dos listados** (ex.: observações, status de comparecimento,
  consulta recorrente) — não pedidos no escopo.
- **Busca** na listagem de consultas (a lista é tipicamente curta; pacientes tem busca
  por volume de cadastros — não replicado sem necessidade).
- Consultas sem paciente ("avulsas"), alarmes configuráveis de horário customizado,
  sincronização com calendário externo.

---

## 3. Decisões principais

### 3.1 Modelagem dos dados

Nova object store `consultas` (banco `medicine-agenda`, **versão 1 → 2** — a migração é
aditiva: `onupgradeneeded` cria a store nova sem tocar nas existentes; dados atuais
preservados):

| Store | keyPath | Índices | Campos |
|-------|---------|---------|--------|
| `consultas` | `id` | `pacienteId`, `dataHora` | id, pacienteId, especialidade, profissional, endereco, dataHora, alarmes `[tipo…]`, disparos `[{ tipo, disparadoEm }]`, criadoEm, atualizadoEm |

- **`alarmes`**: array de códigos fixos (enum), rótulos pt-BR mapeados em
  `src/db/consultas.js`:

  | Código | Rótulo | Offset (antes do horário) |
  |--------|--------|---------------------------|
  | `dia-antes` | 1 dia antes | 24 h |
  | `1h-antes` | 1 hora antes | 1 h |
  | `15min-antes` | 15 minutos antes | 15 min |
  | `no-horario` | No horário da consulta | 0 |

- **`dataHora`**: string local `YYYY-MM-DDTHH:mm` (formato do `<input type="datetime-local">`);
  `new Date(dataHora)` resolve no fuso local (sem `Z`), igual à convenção atual de
  `dataComHora`/`diaKey`.
- **`disparos`**: registro persistente de alarmes já disparados (ver §3.2). Guarda de
  tamanho: mantém no máximo as ~20 últimas entradas.

### 3.2 Extensão do agendador — sem tocar nas doses

O scheduler ganha uma **nova função isolada** `verificarConsultas()` chamada no mesmo tick
(intervalo de 30 s e janela de disparo de até 5 min, mesmos valores atuais). O corpo de
`verificarHorarios` (medicamentos) **não é alterado** — apenas `iniciarAgendador` e o
retorno de foco passam a chamar também a nova função.

**Regra de disparo (uma única vez por instância):**

- Horário previsto do alarme = `dataHora da consulta − offset do tipo`;
- Dispara quando a consulta tem `Notification.permission === 'granted'` e o relógio está
  dentro da janela (0 a 5 min **após** o horário previsto);
- **Não dispara** se a chave `(consultaId, tipo, horarioDeAlarme)` já estiver em
  `disparos` da consulta — o registro é **persistido no próprio documento**, então o
  lembrete não se repete após recarregar/reabrir (espelho da regra das doses, RN-05);
- **Edição/reagendamento**: novos horários produzem novas chaves → alarmes novos
  disparam; chaves iguais (mesmo horário já avisado) não repetem. Excluir consulta →
  nenhum registro pendente: os horários simplesmente deixam de ser checados;
- **Cadastro com horário de alarme já decorrido** → ignorado (sem disparo retroativo,
  mesmo padrão NT-03 das doses);
- `tag` da notificação: `consulta:{id}:{tipo}:{horarioAlarme}` (substituição na central),
  corpo: `especialidade · profissional · endereço (se houver) · data/hora formatada`.

### 3.3 Edição, exclusão e visualização — decisão justificada

- **Sim para edição e exclusão**, seguindo exatamente o padrão já usado em
  pacientes/medicamentos (editar via formulário preenchido; excluir com `window.confirm`
  e aviso de irreversibilidade). Reagendar consulta é rotina real (adiamento/
  antecipação) — a edição é o caminho natural, não uma tela nova.
- **Sem página de detalhe**: diferentemente de pacientes (que têm sub-entidades —
  medicamentos), a consulta tem todos os campos exibíveis num card da lista. A
  **listagem única** (`Consultas`) faz papel de visualização, com **Editar** e
  **Excluir** no card e ordenação por `dataHora` (seção **Próximas** em ordem crescente;
  seção **Passadas** ao final).
- **Consulta vinculada ao paciente**: o card mostra o nome do paciente; o cadastro tem
  `select` obrigatório (pré-selecionado quando iniciado pelo detalhe do paciente).

### 3.4 Telas e fluxo (navegação por estado local atual)

- Rota nova **`consultas`** (visão `Consultas`) + **`consulta-form`** (visão
  `FormConsulta`, comparametros `{ pacienteId?, consultaId }`); item **Consultas** no
  menu do cabeçalho (entre Pacientes e Configurações).
- Seção **Consultas** aditiva no `DetalhePaciente` (lista as consultas do paciente +
  botão "Nova consulta") — nenhuma linha da seção de medicamentos é alterada.
- `FormConsulta`: paciente (select obrigatório), especialidade*, profissional*,
  endereço (opcional), data/hora (`datetime-local`), **checkboxes dos 4 alarmes com
  validação de ao menos 1** (escopo: "um ou mais"). Nota no formulário: *alarmes cujo
  horário já passou não disparam* (RN-C2).
- Fluxo principal: `Pacientes → DetalhePaciente → Nova consulta` **ou**
  menu `Consultas → Nova consulta` → selecionar paciente → preencher → definir alarmes →
  salvar → consulta na lista e na agenda de lembretes.

---

## 4. Arquitetura (extensões, aditivas)

```
src/
├─ db/
│  ├─ db.js              # VERSAO 1→2; onupgradeneeded cria store consultas + índices
│  ├─ consultas.js       # NOVO: CRUD + enum TIPOS_ALARME + offset e rótulos
│  └─ demo.js            # adiciona consultas fictícias ao caso Maria
├─ notifications/
│  └─ scheduler.js       # verificarConsultas() nova; corpo de verificarHorarios intacto
├─ utils/format.js       # formatarDataHora (dd/mm/aaaa hh:mm) — aditivo
├─ views/
│  ├─ Consultas.jsx      # NOVA
│  ├─ FormConsulta.jsx   # NOVA
│  └─ DetalhePaciente.jsx # seção Consultas aditiva
└─ App.jsx               # rotas consultas / consulta-form + item de menu
```

Persistência de consultas também entra no `limparTudo()` (apagar todos os dados inclui a
store nova — comportamento esperado da tela de Configurações).

## 5. Roadmap em fases (com critérios de aceite)

### Fase C-1 — Dados (store `consultas` + repositório)
- `db.js`: versão 2, store `consultas` + índices `pacienteId`, `dataHora`; `limparTudo`
  passsa a limpar a store nova; `db/consultas.js` (CRUD + enum de alarmes); `demo.js`
  com 1–2 consultas fictícias (uma delas programada para daqui a ~4 min, para testar o
  alarme "no horário" — mesmo truque de teste das doses).
- **Aceite:** dados existentes preservados na migração (recarregar não perde
  pacientes/medicamentos/registros); lint 0 problemas.

### Fase C-2 — Interface (cadastro, listagem, edição, exclusão)
- Visões `Consultas` e `FormConsulta`; rota + menu; seção aditiva no `DetalhePaciente`.
- **Aceite:** criar consulta (paciente + ≥1 alarme), editar, excluir com confirmação;
  lista ordenada com Próximas/Passadas; persistência após recarregar (CT-09..CT-13).

### Fase C-3 — Lembretes (agendador de consultas)
- `scheduler.js`: `verificarConsultas()` + regra de disparo único persistido.
- **Aceite:** alarmes disparam nos horários previstos (abat), sem repetição após
  reload, sem disparo retroativo, reagendamento recalcula (NT-05..NT-09).

### Fase C-4 — Validação e fechamento
- Execução dos CT/NT/PW da §7 e atualização de `docs/validacao.md`; commit final.
- **Aceite:** checklist completo aprovado; registro das limitações (RN-C1).

## 6. Definição de pronto (DoD) — adaptada do PLAIN

1. Implementada e navegável no dev server (`localhost`), aditiva (medicamentos intactos).
2. Persistência validada: recarregar/reabrir não perde consultas; edição/exclusão corretas.
3. Textos em pt-BR consistentes; sem erros no console/network; lint 0 problemas.
4. (Quando aplicável) Notificação de consulta testada em cenário real (permissão +
   disparo + exibição + não repetição).
5. Rastreável: F9–F12 ligados ao escopo aprovado (§2.2).
6. Testado segundo o plano (§7) com resultado registrado em `docs/validacao.md`.
7. Commit sugerido em Conventional Commits pt-BR, atômico por fase (§9).

## 7. Riscos e premissas

### 7.1 Riscos

| # | Risco | Impacto | Mitigação |
|---|-------|---------|-----------|
| RN-C1 | **Alarme "um dia antes" com o navegador fechado no momento** — 24h antes pode cair fora do uso do aparelho | Alto | Mesma limitação documentada (R1 do PLAIN); múltiplos alarmes por consulta reduzem a exposição (ao menos um provavelmente encontra o navegador aberto); agenda de consultas na tela é a camada visual de segurança |
| RN-C2 | Alarme **cadastrado/reagendado com horário já decorrido** | Baixo | Ignorado sem disparo retroativo (padrão NT-03); nota explicativa no formulário |
| RN-C3 | **Repetição** de lembrete após recarregar/reabrir (janela de 5 min) | Médio | `disparos` persistido na própria consulta; chave `(consulta, tipo, horário de alarme)` |
| RN-C4 | Duplo vínculo: consulta exclusão de paciente → consultas órfãs | Médio | Exclusão de paciente em **cascata** também remove suas consultas (transação única, padrão atual de `excluirPaciente`) |

### 7.2 Premissas
- Mesmas do PLAIN (stack, localhost, navegador atualizado); alarmes são lembretes de
  **apoio**, não substituem a agenda do paciente/cuidador.
- Migração de banco 1→2 validada em dev antes do merge de fases.

## 8. Plano de testes

### 8.1 Funcionais (manuais, localhost)

| Cenário | Passos | Resultado esperado |
|---------|--------|--------------------|
| CT-09 Criar consulta | Paciente + especialidade + profissional + data/hora + 2 alarmes → salvar | Consulta na lista (Próximas) e na seção do DetalhePaciente; persiste após reload |
| CT-10 Editar consulta | Alterar data/hora e alarmes → salvar | Lista atualizada; alarmes recalculados (ver NT-08) |
| CT-11 Excluir consulta | Excluir com confirmação | Some da lista, do detalhe do paciente e de futuros lembretes |
| CT-12 Listagem | Criar consultas em datas distintas | Ordenação por data/hora; Próximas antes de Passadas; validação ≥1 alarme |
| CT-13 Migração/persistência | Dados existentes + consultas → fechar/reabrir navegador | Pacientes/medicamentos/registros intactos; consultas presentes |

### 8.2 Notificações

- **NT-05 Disparo "no horário":** consulta com horário ~2 min à frente, alarme
  `no-horario` → notificação no momento (aba aberta/segundo plano).
- **NT-06 Disparo "15 minutos":** consulta daqui a ~17 min → lembrete ~15 min antes.
- **NT-07 Disparo "1 dia"/"1 hora":** truque de teste — consulta programada para
  daqui a 24h+3 min com alarme `dia-antes` → disparo em ~3 min; análogo para 1h+3 min.
- **NT-08 Não repetição e reagendamento:** recarregar a página na janela → sem novo
  disparo; **adiar** a consulta 1 dia → alarme volta a disparar para o novo horário;
  mover dentro do mesmo dia → novo horário de alarme dispara.
- **NT-09 Sem disparo retroativo:** criar consulta com alarme em horário já decorrido →
  nenhum disparo.

### 8.3 PWA

- **PW-04 Offline com consultas:** `npm run build && npm run preview` → cadastrar
  consulta → Offline no DevTools → recarregar → consultas visíveis do cache.

## 9. Impacto no versionamento

Commits atômicos (Conventional Commits pt-BR, `git add` explícito), um por
fase/ponto — sugestão:

```text
docs: planeja evolução de consultas médicas com alarmes         # este doc + índice do README
feat(db): grava consultas médicas no IndexedDB (versão 2 do banco)
feat(consultas): cadastra, lista, edita e exclui consultas com alarmes
feat(consultas): emite lembretes de consulta no horário dos alarmes
docs: registra validação das consultas (CT-09..13, NT-05..09, PW-04)
```

Cada commit segue o formato do usuário: título + corpo (*Por que / Como / Relacionado a*)
em pt-BR, sem trailer de coautoria.
