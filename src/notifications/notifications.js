// Utilitários da Notification API — notificações locais no navegador.

export const STATUS_INDISPONIVEL = 'indisponivel'

/** 'granted' | 'default' | 'denied' | 'indisponivel'. */
export function statusNotificacao() {
  if (typeof Notification === 'undefined') return STATUS_INDISPONIVEL
  return Notification.permission
}

/**
 * Solicita a permissão de notificação quando ela ainda não foi decidida.
 * Retorna o novo status.
 */
export async function ativarNotificacoes() {
  if (typeof Notification === 'undefined') return STATUS_INDISPONIVEL
  if (Notification.permission !== 'default') return Notification.permission
  return Notification.requestPermission()
}

/** Exibe uma notificação local; retorna false se não for possível exibi-la. */
export function exibirNotificacao(titulo, opcoes = {}) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return false
  try {
    new Notification(titulo, opcoes)
    return true
  } catch {
    return false
  }
}
