// Utilitários de formatação de datas, horários e doses (pt-BR).

/** Chave do dia (YYYY-MM-DD) no fuso local, usada como índice de registros. */
export function diaKey(data) {
  const d = new Date(data)
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mes}-${dia}`
}

/** Data e hora local a partir de uma data base e uma hora "HH:MM". */
export function dataComHora(data, hora) {
  const [horas, minutos] = hora.split(':').map(Number)
  const d = new Date(data)
  d.setHours(horas, minutos, 0, 0)
  return d
}

/** Ex.: "domingo, 2 de novembro". */
export function formatarDataLonga(data) {
  const texto = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(data)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** Ex.: "02/11/2026". Aceita Date ou string ISO ("YYYY-MM-DD"). */
export function formatarDataCurta(data) {
  if (!data) return '—'
  const d = typeof data === 'string' ? new Date(data) : data
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/** Ex.: "02/11/2026 14:00". Aceita string "YYYY-MM-DDTHH:mm" ou Date. */
export function formatarDataHora(dataHora) {
  if (!dataHora) return '—'
  const d = typeof dataHora === 'string' ? new Date(dataHora) : dataHora
  if (Number.isNaN(d.getTime())) return '—'
  const data = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
  const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return `${data} ${hora}`
}

/** Ex.: "50 mg", a partir de quantidade e unidade separadas. */
export function formatarDose(quantidade, unidade) {
  const q = String(quantidade ?? '').trim()
  const u = String(unidade ?? '').trim()
  if (!q && !u) return ''
  return `${q} ${u}`.trim()
}
