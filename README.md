# Agenda de Medicamentos

Aplicação **web progressiva (PWA)** para o gerenciamento de medicamentos: cadastra
pacientes, medicamentos, doses e horários, organiza a **agenda diária** e emite
**lembretes no navegador** no momento previsto de cada toma.

Desenvolvida para a ação de extensão **“Aplicação para o Gerenciamento de
Medicamentos”** (Projeto Integrador de Tecnologia da Informação I — UFMS Digital,
2026.2), com público-alvo primário na equipe de cuidado do **Residencial Vila Mendonça**
(Lar de Idosos). O planejamento completo está em [`PLAIN.md`](./PLAIN.md).

> ⚠️ **Ferramenta de apoio** — não substitui prescrição médica nem a orientação de
> profissionais de saúde.

## Funcionalidades

| | |
|---|---|
| **Pacientes** | Cadastro, edição, exclusão e busca por nome (ignora acentos) |
| **Medicamentos** | Vinculados ao paciente, com dose/quantidade, unidade, instruções e múltiplos horários por medicamento |
| **Consultas** | Agendamento de consultas médicas (especialidade, profissional, endereço, data/hora) com lembretes — 1 dia, 1 hora, 15 min antes ou no horário; edição e exclusão |
| **Agenda do dia** | Doses agrupadas por horário, próxima dose destacada, marcar como *tomada / atrasada / pulada* |
| **Notificações** | Lembrete no horário cadastrado, com a aba aberta (ativa ou em segundo plano) |
| **PWA** | Instalável, com uso offline após o primeiro carregamento |
| **Persistência** | Todos os dados gravados localmente em **IndexedDB** — sem servidor e sem envio a nuvem |

## Stack

- **React 19** + **Vite 8** (JavaScript/JSX, sem roteador externo — navegação por estado local)
- **IndexedDB puro** (sem bibliotecas de wrapper): banco `medicine-agenda` com as object stores `pacientes`, `medicamentos` e `registros`
- **Notification API** do navegador (agendador local: checagem a cada 30 s + re-sincronização ao voltar à aba)
- **`vite-plugin-pwa`** (Workbox): manifest, service worker e pré-cache do app shell
- **ESLint 10** com `eslint-plugin-react-hooks` (flat config) e ícones PWA gerados por script próprio sem dependências

## Como executar

Pré-requisito: **Node.js** com npm.

```bash
npm install        # instala as dependências
npm run dev        # servidor de desenvolvimento → http://localhost:5173
npm run lint       # ESLint (esperado: 0 problemas)
npm run build      # gera o build de produção em dist/
npm run preview    # serve o build → http://localhost:4173 (teste offline/PWA)
```

Regenerar os ícones PWA (opcional — já estão em `public/`):

```bash
node scripts/gerar-icones.mjs
```

Um caso fictício para demonstração pode ser carregado em **Configurações → Dados de
demonstração** (útil para testar lembretes em horários próximos).

## Estrutura do projeto

```
medicine-agenda/
├─ public/                  # favicon e ícones PWA (192, 512)
├─ scripts/
│  └─ gerar-icones.mjs      # gera os ícones PWA (PNG, sem dependências)
├─ src/
│  ├─ App.jsx               # navegação entre visões (estado local)
│  ├─ main.jsx              # bootstrap + service worker + agendador
│  ├─ db/                   # IndexedDB puro (schema + repositórios)
│  │  ├─ db.js              #   banco, transações e CRUD genérico
│  │  ├─ pacientes.js
│  │  ├─ medicamentos.js
│  │  ├─ registros.js       #   administração (tomado/atrasado/pulado)
│  │  ├─ agenda.js          #   montagem da agenda do dia
│  │  └─ demo.js            #   dados fictícios de demonstração
│  ├─ notifications/
│  │  ├─ notifications.js   #   permissão e exibição
│  │  └─ scheduler.js       #   checagem periódica e disparo no horário
│  ├─ utils/format.js       # datas, horários e doses (pt-BR)
│  ├─ views/                # AgendaDoDia, Pacientes, DetalhePaciente,
│  │                        # FormPaciente, FormMedicamento, Configuracoes
│  ├─ App.css
│  └─ index.css
├─ docs/                    # requisitos, estudo teórico, validação (ver abaixo)
├─ index.html
├─ vite.config.js           # + vite-plugin-pwa (manifest, workbox)
├─ eslint.config.js
└─ package.json
```

## Persistência e privacidade

- Os dados ficam **apenas neste dispositivo e navegador**, no IndexedDB (`medicine-agenda`).
- Não há contas, login, servidor ou sincronização: apagar os dados do site no navegador
  remove os cadastros.

## Limitações conhecidas

- **Notificações**: disparam quando o navegador está **aberto** (aba ativa ou em segundo
  plano). Com o navegador fechado não há disparo — limitação técnica de PWA local,
  documentada na tela de Configurações e tratada como risco R1 no plano.
- **Instalação**: distribuída em **localhost** (decisão de escopo). O build em `dist/` é
  estático e, no futuro, pode ser publicado em hospedagem estática para instalação em
  celulares — fora do escopo atual.

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [`PLAIN.md`](./PLAIN.md) | Plano de implementação: escopo MVP, arquitetura, roadmap, riscos, plano de testes |
| [`docs/requisitos.md`](./docs/requisitos.md) | Requisitos funcionais e não funcionais com rastreabilidade ao documento-base |
| [`docs/estudo-teorico.md`](./docs/estudo-teorico.md) | Estudo: adesão terapêutica, uso racional, PWA, IndexedDB, Notification API |
| [`docs/fluxo-de-uso.md`](./docs/fluxo-de-uso.md) | Visões e fluxos de uso |
| [`docs/validacao.md`](./docs/validacao.md) | Relatório de validação das Etapas 2 e 3 (testes e correções) |
| [`docs/plano-consultas.md`](./docs/plano-consultas.md) | Plano da evolução: lembretes para consultas médicas (F9–F12) |
| [`docs/roteiro-atividade.md`](./docs/roteiro-atividade.md) | Roteiro da atividade extensionista (Etapa 4) |
