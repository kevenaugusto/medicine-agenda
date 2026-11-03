# Estudo teórico — nota de Fase 1

**Tema:** adesão terapêutica, uso racional de medicamentos e as tecnologias da solução
(PWA, IndexedDB, Notification API).
**Objetivo desta nota:** fundamentar as decisões de produto e de arquitetura do
[PLAIN.md](../PLAIN.md) e do [fluxo de uso](fluxo-de-uso.md).

---

## 1. Adesão terapêutica

A Organização Mundial da Saúde define **adesão ao tratamento** como o grau em que o
comportamento da pessoa — incluindo a tomada da medicação — corresponde às
recomendações acordadas com o profissional de saúde (OMS *apud* documento-base).

- Fator multidimensional: aspectos socioeconômicos, condições de saúde, **complexidade
  do esquema terapêutico**, apoio social e características individuais.
- Em idosos, polifarmácia, déficit cognitivo, dificuldades de compreensão e fragilidade
  estão associados à não adesão (Silva et al., 2022).
- Uma revisão integrativa relativa a idosos destaca a organização da rotina e a
  simplificação do esquema como fatores protetores (Silva et al., 2022).

**Implicações para o produto**
- Esquemas com **muitos fármacos e horários** são o caso típico → agenda agrupada por
  horário e destaque da próxima dose (RF-07, RF-08).
- O apoio de cuidador/enfermeiro é central → cadastros e conferência simples (RF-01…05).
- O público pode ter **baixa compreensão/visão** → fonte grande, linguagem curta, ícones
  e cores de apoio (NFR-04).

## 2. Uso racional de medicamentos

O uso racional envolve disponibilizar o **medicamento adequado às necessidades clínicas,
em doses e períodos apropriados** (Ministério da Saúde; INCA — adesão como fator que
passa pela vontade/apoi, do paciente e pelo acompanhamento profissional).

**Implicação:** o cadastro deve registrar **dose e horário de forma explícita e legível**
(RF-04, RF-05) e o produto deixa claro que **não substitui a orientação profissional**
(RF-14, RN-07).

## 3. Progressive Web Apps (PWA)

PWA são aplicações web instaláveis no dispositivo, com experiência próxima a apps
nativos, combinando três pilares (MDN; Microsoft):

1. **Confiável:** funciona offline ou em rede instável via *service worker* (cache do
   *app shell*).
2. **Rápida:** responde à navegação com conteúdo em cache.
3. **Engajadora:** instalável, com ícone e tela cheia.

Requisitos técnicos: páginas servidas por **HTTPS** (ou `localhost`), **manifest** com
nome, ícones (192 e 512 px) e tema, e um **service worker** que controla fetch/cache e
permite o prompt de instalação (MDN; Microsoft).

**Implicação:** em **localhost** a instalação funciona na máquina de desenvolvimento;
para instalar em celulares da comunidade seria necessário servidor HTTPS (Vercel/Netlify)
— fora do escopo atual (decisão §2.3 do PLAIN). O service worker será gerado pelo
`vite-plugin-pwa` (Workbox) com pré-cache do app shell (NFR-05).

## 4. IndexedDB

IndexedDB é uma API do navegador para **armazenamento local de dados estruturados**
(objetos), adequada a volumes significativos, assíncrona por natureza (MDN).

- Modelo: banco por origem → *object stores* (como tabelas) → registros indexados por
  `keyPath`; **índices** para consultas secundárias; **transações** para leituras/gravações.
- É assíncrona e baseada em eventos (`success`/`error`), diferente de APIs síncronas
  como `localStorage`; na solução será **embrulhada em Promises** por um módulo próprio
  (`src/db/`), sem dependência externa (decisão "IndexedDB puro").
- **Limitações relevantes:** sem *joins* (relacionamentos precisam ser desenhados no
  modelo — horários embutidos no medicamento); escopo por origem/navegador/perfil
  (não sincroniza entre dispositivos; NFR-08).

**Modelo de dados da solução** (banco `medicine-agenda` v1):

| Store | keyPath | Índices | Uso |
|-------|---------|---------|-----|
| `pacientes` | `id` | `nome` | passos do RF-01/RF-02 |
| `medicamentos` | `id` | `pacienteId` | RF-03…06; `horarios` embutido |
| `registros` | `id` | `medicamentoId`, `dataHoraRegistro` | RF-09 (tomado/atrasado/pulado) |

## 5. Notification API

A Notification API permite ao site **mostrar notificações do sistema** no dispositivo
(MDN):

- Permissão por origem via `Notification.requestPermission()` e consulta a
  `Notification.permission` (API de Permissões).
- Criação com `new Notification(título, { body, tag, icon })`.
- **Escopo local:** dispara no dispositivo em que a aba está aberta (ativa ou em segundo
  plano). **Não é Web Push** — não há entrega via servidor, portanto **não dispara com o
  navegador fechado** (RN-06, risco R1 do PLAIN). Navegadores também podem **reduzir
  timers** em abas em segundo plano, por isso o agendador re-sincroniza a cada ~30 s e no
  retorno de foco (`visibilitychange`).

**Implicação:** a agenda diária é a "camada de segurança" visual caso a notificação não
possa ser exibida; a tela de configurações explica a permissão e a limitação (RF-13).

## 6. Síntese — decisões de design derivadas do estudo

| Tema | Decisão de design | Requisito |
|------|-------------------|-----------|
| Adesão / polifarmácia | Agenda por horário + próxima dose em destaque | RF-07, RF-08 |
| Adesão / idade avançada | Fonte grande, contraste, linguagem curta | NFR-04 |
| Uso racional | Dose, unidade e horário explícitos + aviso ético-legal | RF-04, RF-14 |
| PWA local | Instalável e offline no localhost; sem servidor | RF-11, NFR-05 |
| IndexedDB | Stores já definidas; horários embutidos; Promises próprias | RF-10, NFR-01 |
| Notification local | Agendador com re-sincronização; degradação visual | RF-12, RF-13 |

## 7. Referências

Documento-base (referências do template):

- BRASIL. Ministério da Saúde. **Uso racional de medicamentos.** Brasília. Disponível em:
  https://www.gov.br/saude/pt-br/composicao/sectics/daf/uso-racional-de-medicamentos
- INSTITUTO NACIONAL DE CÂNCER. **A adesão ao tratamento é um desafio que tem na vontade
  do paciente seu principal fator.** Rio de Janeiro: INCA.
- MICROSOFT. **Documentação dos PWAs (Aplicativos Web Progressivos).**
  https://learn.microsoft.com/pt-br/microsoft-edge/progressive-web-apps/landing/
- MOZILLA DEVELOPER NETWORK. **IndexedDB – APIs da Web.**
  https://developer.mozilla.org/pt-BR/docs/Web/API/IndexedDB_API
- MOZILLA DEVELOPER NETWORK. **Progressive Web Apps.**
  https://developer.mozilla.org/pt-BR/docs/Web/Progressive_web_apps
- SILVA, D. et al. **Adesão ao tratamento farmacológico em idosos: uma revisão
  integrativa da literatura.** Biblioteca Virtual em Saúde, 2022.
  https://pesquisa.bvsalud.org/portal/resource/pt/biblio-1369117

Acessos e verificações: out./nov. 2026. Referências complementares desta nota:
MDN — Notification API e Permissions API; Workbox (estratégia de pré-cache de app shell).
