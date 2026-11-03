# Requisitos da Aplicação — Gerenciamento de Medicamentos

**Status da Fase 1:** checklist revisado contra o documento-base (Template do Estudante —
Planejamento da Ação de Extensão, UFMS Digital) e consolidado. Classificação em **F1–F8
(MVP)**, **Incrementos** e **Não-escopo**, conforme o [PLAIN.md](../PLAIN.md).

---

## 1. Requisitos funcionais (MVP) — com rastreabilidade

| ID | Requisito funcional | Origem no documento-base | Critério de aceite (resumo) | Status |
|----|---------------------|---------------------------|------------------------------|--------|
| RF-01 | Cadastrar paciente (nome, data de nascimento, observações) | Etapa 1 ("cadastro de paciente"); Objetivo geral | Salvar e listar; persiste após recarga (CT-01) | Fase 2 |
| RF-02 | Listar, editar e excluir pacientes | Necessidade de manutenção de cadastros (Obj. específico 1: organização e acompanhamento) | Alterações refletem na agenda; exclusão remove medicamentos vinculados (CT-02, CT-03) | Fase 2 |
| RF-03 | Cadastrar medicamentos vinculados a um paciente (nome, quantidade, unidade, instruções) | Etapa 1/2 ("cadastro de medicamentos vinculados ao paciente"); Objetivo geral | Medicamento aparece no detalhe do paciente com dose legível (CT-04) | Fase 2 |
| RF-04 | Registrar quantidade/dose com unidade | Etapa 1 ("registro de quantidade/dose"); Objetivo geral | Dose exibida na agenda e na notificação (CT-04) | Fase 2 |
| RF-05 | Definir múltiplos horários por medicamento (HH:MM, 24h) | Etapa 1 ("definição de horários"); Etapa 2 | Todos os horários aparecem na agenda no dia certo (CT-05, CT-06) | Fase 2 |
| RF-06 | Ativar/desativar horário individual | Gestão prática da agenda (complemento de RF-05) | Horário desativado some da agenda sem excluir o cadastro (CT-05) | Fase 2 |
| RF-07 | Visualizar agenda diária agrupada por horário | Etapa 2 ("visualização da agenda diária"); Objetivo geral | Agrupamento correto; ordem do dia coerente (CT-06) | Fase 2 |
| RF-08 | Destacar a próxima dose do dia | Apoio à rotina de toma (Resultados esperados: reduzir esquecimentos) | Próxima dose visível e distinta na agenda (CT-06) | Fase 2 |
| RF-09 | Registrar administração de dose (tomado / atrasado / pulado) | Obj. específico 1 ("acompanhamento da administração") | Registro gravado e consultável; sem duplicidade por horário/dia (CT-07) | Fase 2 |
| RF-10 | Persistir tudo em IndexedDB (recarga e reabertura preservam dados) | Objetivo geral; Etapa 2; Resultados esperados ("armazenar informações localmente") | Dados intactos após fechar/reabrir o navegador (CT-08) | Fase 2 |
| RF-11 | PWA instalável (manifest + service worker + ícones 192/512) | Etapa 3 ("manifesto e service worker, permitindo a instalação pelo navegador") | Instalação disponível a partir do localhost; uso offline (PW-01, PW-02) | Fase 3 |
| RF-12 | Emitir notificação no horário previsto de cada medicamento (Notification API local) | Objetivo geral; Etapa 3; Etapa 1 ("emissão de alertas") | Disparo no horário com a aba aberta; re-sincroniza ao editar (NT-01…04) | Fase 3 |
| RF-13 | Tela de configuração de notificações com explicação da permissão e das limitações | Etapa 3 ("testes de permissão, disparo e exibição"); Resultados esperados | Pedido de permissão explicativo; degradação visual se negada (NT-01) | Fase 3 |
| RF-14 | Aviso permanente de que o app não substitui prescrição/orientação profissional | Referencial teórico (uso racional de medicamentos) | Aviso visível no rodapé/tela inicial | Fase 2 |

## 2. Requisitos não funcionais

| ID | Requisito | Origem | Critério |
|----|-----------|--------|----------|
| NFR-01 | Dados 100% locais no dispositivo (sem envio a servidor) | Resultados esperados | Sem chamadas de rede para dados do usuário; app usável sem internet após load |
| NFR-02 | Idioma português-BR | Contexto da ação (comunidade brasileira) | Todas as telas/mensagens em pt-BR |
| NFR-03 | Interface responsiva (celular e desktop) | PWA; atividade com a comunidade (notebook/celular) | Layout legível em ≥ 320 px de largura |
| NFR-04 | Legibilidade e contraste adequados ao público idoso | Referencial teórico (fragilidade, déficit cognitivo, baixa visão) | Fonte ≥ 16 px nos textos principais; contraste conforme DoD |
| NFR-05 | Funciona offline após o primeiro carregamento (app shell em cache) | Etapa 3; Resultados esperados | Desconectar rede → app abre e navega (PW-02) |
| NFR-06 | Sem erros no console/network em fluxos normais | DoD do PLAIN | Console limpo nos cenários CT-01…08 |
| NFR-07 | Navegadores suportados: Chrome/Edge atualizados (instalação PWA + notificações) | Recursos ("navegador atualizado, com suporte a PWA, IndexedDB e API de notificações") | Testes em Chromium; demais navegadores sem garantia de instalação |
| NFR-08 | Dados restritos ao navegador/perfil do dispositivo (sem sincronização) | Arquitetura sem servidor | Documentado ao usuário na tela de configurações |

## 3. Regras de negócio (RN)

- **RN-01** Cada medicamento pertence a exatamente um paciente.
- **RN-02** Excluir um paciente remove, em transação única no IndexedDB, seus
  medicamentos e registros de administração.
- **RN-03** Horários usam formato HH:MM (24h); horários de datas passadas não entram na
  agenda do dia.
- **RN-04** Desativar um horário o esconde da agenda e do agendamento de notificações,
  sem excluir o cadastro.
- **RN-05** Uma dose prevista (medicamento + horário + data) só pode ser registrada uma
  vez como administrada; re-registro mostra a marcação existente.
- **RN-06** A notificação é **local**: dispara com o navegador aberto (aba ativa ou em
  segundo plano); navegador fechado → sem disparo (limitação da arquitetura).
- **RN-07** O aplicativo é ferramenta de apoio e **não substitui** prescrição médica nem
  orientação de profissionais de saúde.
- **RN-08** Medicamento/horário inativos não geram notificações nem aparecem na agenda.

## 4. Rastreabilidade para as fases

| Macro-Funcionalidade | Requisitos | Fase do roadmap |
|----------------------|------------|-----------------|
| Gestão de pacientes | RF-01, RF-02 | Fase 2 |
| Gestão de medicamentos e horários | RF-03, RF-04, RF-05, RF-06 | Fase 2 |
| Agenda diária e administração | RF-07, RF-08, RF-09 | Fase 2 |
| Persistência local | RF-10 | Fase 2 |
| PWA | RF-11 | Fase 3 |
| Notificações | RF-12, RF-13 | Fase 3 |
| Transversal (aviso ético-legal, NFRs) | RF-14, NFR-01…08 | Fases 2–3 |
| Validação na comunidade | Rastreia RF-01…RF-13 pelo roteiro da atividade | Fase 4 |

## 5. Incrementos (pós-MVP) e não-escopo

- **Incremento 1:** histórico/relatório de doses por período (reusa `registros`);
  exportar/importar JSON como backup; status expandido de dose.
- **Incremento 2:** agenda imprimível; esquemas por dia da semana; modo fonte grande;
  modo escuro/contraste.
- **Não-escopo:** autenticação, sincronização entre dispositivos, Web Push/notificações
  com o navegador fechado, backend/banco externo, aplicativo nativo, integração com
  sistemas de saúde.
