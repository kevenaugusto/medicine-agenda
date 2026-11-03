# Fluxo de uso e mapa de telas (Fase 1)

Validação do fluxo desenhado pelo documento-base (Etapa 1), para implementação nas
Fases 2–3. As visões correspondem à seção 4 do [PLAIN.md](../PLAIN.md) e aos requisitos
do [requisitos.md](requisitos.md).

---

## 1. Visões (telas) da aplicação

| ID | Visão | Objetivo (na rotina de cuidado) | Campos/ações principais | Dados lidos/gravados |
|----|-------|---------------------------------|-------------------------|----------------------|
| V1 | **Agenda do Dia** (home) | Ver, de uma olhada, o que e quando administrar hoje; registrar a toma | Lista de doses agrupadas por horário; destaque da próxima dose; botão "marcar como tomada" (e opções atrasado/pulado); aviso ético-legal (RF-14) | lê `medicamentos`(ativos) e `registros` do dia; grava `registros` |
| V2 | **Pacientes** (lista) | Localizar e gerenciar pacientes | Busca por nome; lista; ações novo/editar/excluir | lê `pacientes`; navega para V3/V4 |
| V3 | **Formulário de Paciente** | Cadastrar/editar dados do paciente | Nome (obrigatório), data de nascimento, observações | grava `pacientes` |
| V4 | **Detalhe do Paciente** | Ver dados e manter os medicamentos do paciente | Dados do paciente; lista de medicamentos com dose/horários; atalho "novo medicamento"; editar/excluir/de/ativar | lê `pacientes` + `medicamentos` (índice `pacienteId`) |
| V5 | **Formulário de Medicamento** | Cadastrar/editar medicamento, dose e horários | Nome (obrigatório), quantidade, unidade, instruções; **lista de horários** (hora HH:MM, dose opcional por horário, ativar/desativar, adicionar/remover) | grava `medicamentos` |
| V6 | **Configurações** | Ativar notificações; entender limites; conhecer o app | Status da permissão + botão "ativar notificações"; explicação PT-BR; aviso sobre navegador aberto e sobre não substituir prescrição; versão/sobre | lê `Notification.permission`; requisita permissão |

## 2. Mapa de navegação

```
                    ┌──────────────────┐
                    │  V6 Configurações│
                    └────────┬─────────┘
                             ▲
   ┌──────────────┐    ┌─────┴──────┐
   │  V1 Agenda   │◄──►│  V2 Pacientes│
   │   do Dia     │    └─────┬──────┘
   └──────────────┘          │ novo/editar │
                  ▲          ▼
                  │    ┌──────────────┐
                  │    │ V3 Form.     │──► V4 Detalhe ──► V5 Form.
                  └────┤   Paciente   │    do Paciente    Medicamento
                       └──────────────┘         ▲
                                                │ edit/excluir
```

Transições: V2→V3 (novo/editar paciente); V3→V4 (após salvar); V4→V5 (novo/editar
medicamento); qualquer registro novo volta para a V4/V1 com feedback; V1 e V6 sempre
acessíveis pela barra de navegação.

## 3. Fluxo principal (caminho feliz, documentado no template)

`V2 nova paciente` → `V3 salvar` → `V4 novo medicamento` → `V5 (nome, dose, horários,
salvar)` → (repetir medicamentos conforme prescrição) → `V6 ativar notificações` →
`V1 agenda do dia (doses agrupadas)` → marcar dose como tomada → `registros` gravados.

## 4. Fluxos alternativos e de borda

| Situação | Fluxo esperado |
|----------|----------------|
| Editar paciente/medicamento | V3/V5 com dados pré-carregados; salvar atualiza a agenda imediatamente |
| Excluir paciente com medicamentos | Confirmação; exclusão em transação única de paciente + medicamentos + registros (RN-02) |
| Desativar horário | V5 desmarca horário → some da agenda e das notificações (RN-04) |
| Permissão de notificação negada | V6 explica e degrada: aviso visual; agenda V1 é a camada de segurança (R2) |
| Navegador fechado no horário | Sem notificação (RN-06): dias seguintes a agenda mostra histórico de não marcação |
| Marcar dose fora do horário | Registro como "atrasado"; volta do dia consulta registros de hoje |
| Reabrir o app após reinstalação/limpeza | Sem dados (limitação local): orientação de backup via export/import (incremento 1) |

## 5. Rastro requisito → visão → testes

| Requisito | Visão(ões) | Cenário de teste (plano §8) |
|-----------|------------|------------------------------|
| RF-01/02 | V2, V3 | CT-01, CT-02, CT-03 |
| RF-03/04 | V4, V5 | CT-04 |
| RF-05/06 | V5, V4 | CT-05 |
| RF-07/08 | V1 | CT-06 |
| RF-09 | V1 | CT-07 |
| RF-10 | todas | CT-08 |
| RF-11 | (PWA/instalação) | PW-01…03 |
| RF-12/13 | V1, V6 | NT-01…04 |
| RF-14 | V1, V6 | inspeção visual |
