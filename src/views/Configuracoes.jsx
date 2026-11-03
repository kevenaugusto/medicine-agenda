import { useState } from 'react'
import { limparTudo } from '../db/db.js'
import { carregarDadosDeExemplo } from '../db/demo.js'

export default function Configuracoes() {
  const [mensagem, setMensagem] = useState('')
  const [ocupado, setOcupado] = useState(false)

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
          <p className="nota">
            A ativação das notificações de horário será implementada na próxima etapa do projeto
            (Etapa 3). Até lá, a agenda do dia é a referência principal.
          </p>
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
