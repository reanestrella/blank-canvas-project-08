const VAPID_PUBLIC_KEY = 'BAAR7kOxan0oiNBTFrLC3h0jdTLqmJBMg7Yg_mFWE8Dfsc9MwPNyZm0bAJ6PVfisu7zgUSZHFuLy8ru7Fwbd9LM'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from([...atob(b64)].map(c => c.charCodeAt(0)))
}

export async function registerPush(supabase: any) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  const sw = await navigator.serviceWorker.ready

  const subscription = await sw.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  await supabase.functions.invoke('save-push-subscription', {
    body: { subscription },
  })
}
