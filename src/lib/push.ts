const VAPID_PUBLIC_KEY = 'BAAR7kOxan0oiNBTFrLC3h0jdTLqmJBMg7Yg_mFWE8Dfsc9MwPNyZm0bAJ6PVfisu7zgUSZHFuLy8ru7Fwbd9LM'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from([...atob(b64)].map(c => c.charCodeAt(0)))
}

export async function registerPush(supabase: any) {
  console.log('[Push] Iniciando registerPush')

  if (!('serviceWorker' in navigator)) {
    console.log('[Push] serviceWorker não suportado')
    return
  }

  if (!('PushManager' in window)) {
    console.log('[Push] PushManager não suportado')
    return
  }

  console.log('[Push] Pedindo permissão...')
  const permission = await Notification.requestPermission()
  console.log('[Push] Permissão:', permission)
  if (permission !== 'granted') return

  console.log('[Push] Aguardando SW ready...')
  const sw = await navigator.serviceWorker.ready
  console.log('[Push] SW ready:', sw)

  console.log('[Push] Criando subscription...')
  const subscription = await sw.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })
  console.log('[Push] Subscription criada:', JSON.stringify(subscription))

  console.log('[Push] Salvando no Supabase...')
  const { data, error } = await supabase.functions.invoke('save-push-subscription', {
    body: { subscription },
  })
  console.log('[Push] Resultado:', data, error)
}
