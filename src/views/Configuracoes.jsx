import { useEffect, useState } from 'react'
import { limparTudo } from '../db/db.js'
import { carregarDadosDeExemplo } from '../db/demo.js'
import { ativarNotificacoes, statusNotificacao } from '../notifications/notifications.js'

const ROTULO_STATUS = {
  granted: 'Ativadas',
  default: 'Não solicitadas',
  denied: 'Negadas',
  indisponivel: 'Não suportadas',
}

export default function Configuracoes() {
  const [status, setStatus] = useState(() => statusNotificacao())
  const [solicitando, setSolicitando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    let ativo = true
    function aoMudarPermissao() {
      if (ativo) setStatus(statusNotificacao())
    }
    // Acompanha mudanças de permissão feitas fora do aplicativo (em navegadores que suportam).
    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'notifications' })
        .then((permissao) => permissao?.addEventListener('change', aoMudarPermissao))
        .catch(() => {})
    }
    return () => {
      ativo = false
    }
  }, [])

  const solicitar = async () => {
    setSolicitando(true)
    const novo = await ativarNotificacoes()
    setStatus(novo)
    setSolicitando(false)
    if (novo === 'granted') {
      setMensagem(
        'Notificações ativadas. Dica de teste: defina um horário 2 minutos à frente no medicamento e aguarde o lembrete.',
      )
    } else if (novo === 'denied') {
      setMensagem('Permissão negada. Autorize nas configurações do navegador para receber lembretes.')
    }
  }

  const executar = async (acao, confirmacao, sucesso) => {
    if (confirmacao && !window.confirm(confirmacao)) return
    setOcupado(true)
    setMensagem('')
    try {
      await acao()
      setMensagem(sucesso)
    } catch (falha) {
      setMensagem(`Erro: ${falha.message}`)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <section>
      <header className="pagina-cabecalho">
        <h2>Configurações</h2>
      </header>

      <div className="lista-cards">
        <article className="card bloco-config">
          <h3>Sobre esta aplicação</h3>
          <p>
            Aplicação web progressiva para organizar medicamentos, doses e horários, com
            lembretes no navegador. Desenvolvida para a ação de extensão “Aplicação para o
            Gerenciamento de Medicamentos” (UFMS Digital).
          </p>
          <p className="nota">
            Aplicativo de <strong>apoio</strong> — não substitui prescrição médica nem a
            orientação de profissionais de saúde.
          </p>
        </article>

        <article className="card bloco-config">
          <h3>Como os dados são guardados</h3>
          <p>
            Todos os dados ficam gravados <strong>apenas neste dispositivo e navegador</strong>,
            no armazenamento local do IndexedDB — não são enviados a nenhum servidor. Por isso,
            não há sincronização entre aparelhos; se os dados deste navegador forem apagados, os
            cadastros serão perdidos.
          </p>
        </article>

        <article className="card bloco-config">
          <h3>Lembretes de medicação</h3>
          <p>
            O lembrete é exibido quando o navegador está <strong>aberto</strong> (aba ativa ou em
            segundo plano) no horário previsto de cada dose. Com o navegador fechado, não há
            disparo — a agenda do dia é a referência.
          </p>

          {status === 'indisponivel' ? (
            <p className="nota">Este navegador não suporta a API de notificações.</p>
          ) : status === 'granted' ? (
            <p className="sucesso-campo">✓ Notificações ativadas para este dispositivo.</p>
          ) : status === 'denied' ? (
            <p className="erro-campo">
              Permissão negada neste navegador. Autorize pela configuração de notificações do
              navegador (para “localhost”) e recarregue esta página.
            </p>
          ) : (
            <button type="button" className="botao primario" onClick={solicitar} disabled={solicitando}>
              {solicitando ? 'Solicitando…' : 'Ativar notificações'}
            </button>
          )}

          <span className="chip chip-hora">Status: {ROTULO_STATUS[status]}</span>
        </article>

        <article className="card bloco-config">
          <h3>Dados de demonstração</h3>
          <p>
            Carregue um caso fictício (útil para testes e para a demonstração na comunidade) ou
            limpe todos os dados gravados.
          </p>
          <div className="acoes-config">
            <button
              type="button"
              className="botao-secundario"
              disabled={ocupado}
              onClick={() =>
                executar(
                  carregarDadosDeExemplo,
                  'Substituir os dados atuais pelos dados de exemplo?',
                  'Dados de exemplo carregados. Verifique a agenda do dia.',
                )
              }
            >
              Carregar dados de exemplo
            </button>
            <button
              type="button"
              className="botao-perigo"
              disabled={ocupado}
              onClick={() =>
                executar(
                  limparTudo,
                  'Apagar TODOS os pacientes, medicamentos e registros deste dispositivo?',
                  'Todos os dados foram apagados.',
                )
              }
            >
              Limpar todos os dados
            </button>
          </div>
        </article>
      </div>

      {mensagem && <p className="sucesso-campo">{mensagem}</p>}
    </section>
  )
}
