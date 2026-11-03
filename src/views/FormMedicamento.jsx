import { useEffect, useState } from 'react'
import { atualizarMedicamento, buscarMedicamento, criarMedicamento } from '../db/medicamentos.js'
import { uid } from '../db/db.js'

const UNIDADES_SUGERIDAS = ['mg', 'mcg', 'g', 'mL', 'gotas', 'comprimido', 'comprimidos', 'cápsula', 'sachê']

const novoHorario = () => ({ id: uid(), hora: '', dose: '', ativo: true })

function FORM_VAZIO() {
  return { nome: '', quantidade: '', unidade: '', instrucoes: '', horarios: [novoHorario()] }
}

/** Mantém um horário por hora (o último preenchido vence) e ordena por hora. */
function normalizarHorarios(horarios) {
  const porHora = new Map()
  for (const h of horarios) {
    if (!h.hora.trim()) continue
    porHora.set(h.hora.trim(), { id: h.id, hora: h.hora.trim(), dose: String(h.dose ?? '').trim(), ativo: h.ativo })
  }
  return [...porHora.values()].sort((a, b) => a.hora.localeCompare(b.hora))
}

export default function FormMedicamento({ pacienteId, medicamentoId, aoVoltar }) {
  const editando = Boolean(medicamentoId)
  const [form, setForm] = useState(FORM_VAZIO)
  const [carregando, setCarregando] = useState(editando)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!medicamentoId) return
    let ativo = true
    buscarMedicamento(medicamentoId).then((m) => {
      if (!ativo) return
      setForm({
        nome: m?.nome || '',
        quantidade: m?.quantidade || '',
        unidade: m?.unidade || '',
        instrucoes: m?.instrucoes || '',
        horarios: m?.horarios?.length ? m.horarios : [novoHorario()],
      })
      setCarregando(false)
    })
    return () => {
      ativo = false
    }
  }, [medicamentoId])

  const alterarCampo = (campo, valor) => setForm((f) => ({ ...f, [campo]: valor }))
  const alterarHorario = (id, campo, valor) =>
    setForm((f) => ({
      ...f,
      horarios: f.horarios.map((h) => (h.id === id ? { ...h, [campo]: valor } : h)),
    }))
  const adicionarHorario = () => setForm((f) => ({ ...f, horarios: [...f.horarios, novoHorario()] }))
  const removerHorario = (id) => setForm((f) => ({ ...f, horarios: f.horarios.filter((h) => h.id !== id) }))

  const salvar = async (e) => {
    e.preventDefault()
    if (!form.nome.trim()) {
      setErro('Informe o nome do medicamento.')
      return
    }
    const horarios = normalizarHorarios(form.horarios)
    if (horarios.length === 0) {
      setErro('Adicione pelo menos um horário de administração.')
      return
    }
    const dados = {
      nome: form.nome,
      quantidade: form.quantidade,
      unidade: form.unidade,
      instrucoes: form.instrucoes,
      horarios,
    }
    setSalvando(true)
    setErro('')
    try {
      if (editando) {
        await atualizarMedicamento(medicamentoId, dados)
      } else {
        await criarMedicamento({ ...dados, pacienteId })
      }
      aoVoltar()
    } catch (falha) {
      setErro(falha.message)
      setSalvando(false)
    }
  }

  if (carregando) {
    return <div className="painel">Carregando…</div>
  }

  return (
    <section>
      <button type="button" className="botao-link voltar" onClick={aoVoltar}>
        ← Paciente
      </button>

      <header className="pagina-cabecalho">
        <h2>{editando ? 'Editar medicamento' : 'Novo medicamento'}</h2>
      </header>

      <form className="formulario" onSubmit={salvar}>
        <label className="campo-formulario">
          <span className="rotulo">
            Nome <em className="obrigatorio">obrigatório</em>
          </span>
          <input
            className="entrada"
            value={form.nome}
            onChange={(e) => alterarCampo('nome', e.target.value)}
            autoFocus
            placeholder="Ex.: Losartana"
          />
        </label>

        <div className="linha-campos">
          <label className="campo-formulario">
            <span className="rotulo">Quantidade</span>
            <input
              className="entrada"
              inputMode="decimal"
              value={form.quantidade}
              onChange={(e) => alterarCampo('quantidade', e.target.value)}
              placeholder="Ex.: 50"
            />
          </label>
          <label className="campo-formulario">
            <span className="rotulo">Unidade</span>
            <input
              className="entrada"
              list="unidades-sugeridas"
              value={form.unidade}
              onChange={(e) => alterarCampo('unidade', e.target.value)}
              placeholder="Ex.: mg"
            />
            <datalist id="unidades-sugeridas">
              {UNIDADES_SUGERIDAS.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </label>
        </div>

        <label className="campo-formulario">
          <span className="rotulo">Instruções</span>
          <textarea
            className="entrada"
            rows="2"
            value={form.instrucoes}
            onChange={(e) => alterarCampo('instrucoes', e.target.value)}
            placeholder="Ex.: tomar após o almoço"
          />
        </label>

        <fieldset className="campo-formulario horarios">
          <legend className="rotulo">
            Horários de administração <em className="obrigatorio">pelo menos 1</em>
          </legend>

          {form.horarios.map((h) => (
            <div className="linha-horario" key={h.id}>
              <label className="campo-hora">
                <span className="sr-only">Horário</span>
                <input
                  className="entrada hora"
                  type="time"
                  value={h.hora}
                  onChange={(e) => alterarHorario(h.id, 'hora', e.target.value)}
                />
              </label>
              <label className="campo-hora">
                <span className="sr-only">Dose neste horário (opcional)</span>
                <input
                  className="entrada"
                  value={h.dose}
                  onChange={(e) => alterarHorario(h.id, 'dose', e.target.value)}
                  placeholder="Dose (opcional)"
                />
              </label>
              <label className="chave horario-ativo">
                <input
                  type="checkbox"
                  checked={h.ativo}
                  onChange={(e) => alterarHorario(h.id, 'ativo', e.target.checked)}
                />
                Ativo
              </label>
              <button
                type="button"
                className="botao-perigo pequeno"
                onClick={() => removerHorario(h.id)}
                aria-label="Remover horário"
              >
                Remover
              </button>
            </div>
          ))}

          <button type="button" className="botao-secundario" onClick={adicionarHorario}>
            + Adicionar horário
          </button>
        </fieldset>

        {erro && <p className="erro-campo">{erro}</p>}

        <div className="acoes-form">
          <button type="submit" className="botao primario" disabled={salvando}>
            {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Salvar medicamento'}
          </button>
          <button type="button" className="botao-secundario" onClick={aoVoltar}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
