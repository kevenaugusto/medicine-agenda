import { useCallback, useEffect, useState } from 'react'
import { montarAgenda } from '../db/agenda.js'
import { listarMedicamentos } from '../db/medicamentos.js'
import { listarPacientes } from '../db/pacientes.js'
import { buscarPorDia, excluirRegistro, marcar } from '../db/registros.js'
import { diaKey, formatarDataLonga } from '../utils/format.js'

const ROTULOS_STATUS = { tomado: 'Tomada', atrasado: 'Atrasada', pulado: 'Pulada' }

export default function AgendaDoDia({ aoNavegar }) {
  const [hoje] = useState(() => new Date())
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [agenda, setAgenda] = useState(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    try {
      const [pacientes, medicamentos, registros] = await Promise.all([
        listarPacientes(),
        listarMedicamentos(),
        buscarPorDia(diaKey(hoje)),
      ])
      setAgenda(montarAgenda({ pacientes, medicamentos, registros, data: hoje }))
      setErro('')
    } catch (falha) {
      setErro(`Não foi possível carregar a agenda: ${falha.message}`)
    } finally {
      setCarregando(false)
    }
  }, [hoje])

  useEffect(() => {
    carregar()
  }, [carregar])

  const registrarDose = async (dose, status) => {
    await marcar({
      medicamentoId: dose.medicamento.id,
      horarioId: dose.horario.id,
      dia: diaKey(dose.dataPrevista),
      dataHoraPrevista: dose.dataPrevista.toISOString(),
      status,
    })
    await carregar()
  }

  const desfazerRegistro = async (dose) => {
    if (dose.registro) await excluirRegistro(dose.registro.id)
    await carregar()
  }

  if (erro) {
    return <div className="painel erro">{erro}</div>
  }
  if (carregando) {
    return <div className="painel">Carregando agenda…</div>
  }

  const vazio = !agenda || agenda.grupos.length === 0

  return (
    <section className="agenda">
      <header className="pagina-cabecalho">
        <h2>Agenda do dia</h2>
        <p className="subtitulo">{formatarDataLonga(hoje)}</p>
      </header>

      {vazio ? (
        <div className="painel vazio">
          <p>
            <strong>Nenhum medicamento agendado para hoje.</strong>
          </p>
          <p>Comece cadastrando um paciente e depois os medicamentos com seus horários.</p>
          <button type="button" className="botao primario" onClick={() => aoNavegar('pacientes')}>
            Cadastrar paciente
          </button>
        </div>
      ) : (
        <>
          {agenda.proximaDose && (
            <div className="proxima-dose">
              <span className="proxima-dose-rotulo">Próxima dose</span>
              <strong>
                {agenda.proximaDose.pacienteNome} — {agenda.proximaDose.medicamento.nome}
              </strong>
              <span>
                {agenda.proximaDose.horario.hora} ·{' '}
                {agenda.proximaDose.doseRotulo || 'dose não informada'}
              </span>
            </div>
          )}

          <div className="grupos-horario">
            {agenda.grupos.map((grupo) => (
              <div className="grupo-horario" key={grupo.chave}>
                <h3 className="grupo-horario-hora">{grupo.chave}</h3>
                <ul className="dose-lista">
                  {grupo.doses.map((dose) => (
                    <DoseItem
                      key={dose.horario.id}
                      dose={dose}
                      aoRegistrar={registrarDose}
                      aoDesfazer={desfazerRegistro}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function DoseItem({ dose, aoRegistrar, aoDesfazer }) {
  const { medicamento, pacienteNome, doseRotulo, registro, passouDoHorario } = dose
  const registrada = Boolean(registro)

  return (
    <li className={passouDoHorario && !registrada ? 'dose-item passou' : 'dose-item'}>
      <div className="dose-info">
        <strong className="dose-nome">{medicamento.nome}</strong>
        {doseRotulo && <span className="dose-medida">{doseRotulo}</span>}
        <span className="dose-paciente">{pacienteNome}</span>
        {medicamento.instrucoes && (
          <span className="dose-instrucoes">{medicamento.instrucoes}</span>
        )}
      </div>
      <div className="dose-acoes">
        {registrada ? (
          <>
            <span className={`chip chip-${registro.status}`}>{ROTULOS_STATUS[registro.status]}</span>
            <button type="button" className="botao-link" onClick={() => aoDesfazer(dose)}>
              Desfazer
            </button>
          </>
        ) : (
          <>
            <button type="button" className="botao tomada" onClick={() => aoRegistrar(dose, 'tomado')}>
              Tomada
            </button>
            <button type="button" className="botao atrasada" onClick={() => aoRegistrar(dose, 'atrasado')}>
              Atrasada
            </button>
            <button type="button" className="botao pulada" onClick={() => aoRegistrar(dose, 'pulado')}>
              Pular
            </button>
          </>
        )}
      </div>
    </li>
  )
}
