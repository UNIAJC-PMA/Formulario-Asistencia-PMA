// ===================================
// SISTEMA DE NOTIFICACIONES PUSH - PMA
// ===================================

const VAPID_PUBLIC_KEY = 'BIktOgjhM2TEiwx1S0r9hOrCZrQWeVjgPytVj5gzFohWjVilSxfz1ouOlrxdBxLC_DK8P8I6D7EJgjtU0McG96I';
const SUPABASE_URL = 'https://vkfjttukyrtiumzfmyuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZmp0dHVreXJ0aXVtemZteXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTU0MjQsImV4cCI6MjA3ODAzMTQyNH0.eU8GeI8IVazXydMDwY98TUzT9xvjhcbXBu6cruCPiEk';

// ===================================
// FUNCIÓN: Convertir VAPID a Uint8Array
// ===================================
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ===================================
// FUNCIÓN: Registrar Service Worker
// ===================================
async function registrarServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('❌ Service Workers no soportados');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('✅ Service Worker registrado:', registration.scope);
    
    // Esperar a que esté activo
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker listo');
    
    return registration;
  } catch (error) {
    console.error('❌ Error registrando Service Worker:', error);
    return null;
  }
}

// ===================================
// FUNCIÓN: Crear suscripción push
// ===================================
async function crearSuscripcionPush(registration) {
  try {
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    console.log('✅ Suscripción push creada');
    return subscription;
  } catch (error) {
    console.error('❌ Error creando suscripción:', error);
    return null;
  }
}

// ===================================
// FUNCIÓN: Guardar suscripción en Supabase
// ===================================
async function guardarSuscripcionEnSupabase(subscription) {
  try {
    const subscriptionJSON = subscription.toJSON();
    
    const datos = {
      endpoint: subscriptionJSON.endpoint,
      p256dh: subscriptionJSON.keys.p256dh,
      auth: subscriptionJSON.keys.auth,
      user_agent: navigator.userAgent
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'
      },
      body: JSON.stringify(datos)
    });

    if (response.ok || response.status === 409) {
      console.log('✅ Suscripción guardada en base de datos');
      return true;
    } else {
      console.error('❌ Error guardando suscripción:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

// ===================================
// FUNCIÓN PRINCIPAL: Solicitar notificaciones manualmente
// ===================================
async function solicitarNotificacionesManual() {
  console.log('🔔 Solicitando permiso de notificaciones...');

  // Verificar soporte
  if (!('Notification' in window)) {
    alert('❌ Tu navegador no soporta notificaciones');
    return { activado: false, error: 'no-soportado' };
  }

  if (!('serviceWorker' in navigator)) {
    alert('❌ Tu navegador no soporta Service Workers');
    return { activado: false, error: 'no-service-worker' };
  }

  // Si ya está denegado
  if (Notification.permission === 'denied') {
    alert('❌ Las notificaciones están bloqueadas. Por favor, actívalas en la configuración de tu navegador.');
    return { activado: false, error: 'denegado' };
  }

  // Si ya está concedido, verificar suscripción existente
  if (Notification.permission === 'granted') {
    console.log('✅ Permiso ya concedido');
    
    const registration = await registrarServiceWorker();
    if (!registration) {
      return { activado: false, error: 'service-worker-error' };
    }

    const existingSub = await registration.pushManager.getSubscription();
    
    if (existingSub) {
      console.log('✅ Ya existe suscripción activa');
      await guardarSuscripcionEnSupabase(existingSub);
      return { activado: true, yaExistia: true };
    }

    // Crear nueva suscripción
    const subscription = await crearSuscripcionPush(registration);
    if (!subscription) {
      return { activado: false, error: 'subscription-error' };
    }

    const guardado = await guardarSuscripcionEnSupabase(subscription);
    
    if (guardado) {
      // Mostrar notificación de prueba
      new Notification('¡Notificaciones Activadas! 🎉', {
        body: 'Recibirás avisos importantes del PMA',
        icon: 'https://vkfjttukyrtiumzfmyuk.supabase.co/storage/v1/object/public/img/LOGO.png'
      });
      return { activado: true, yaExistia: false };
    }
    
    return { activado: false, error: 'save-error' };
  }

  // Solicitar permiso por primera vez
  const permission = await Notification.requestPermission();
  
  if (permission !== 'granted') {
    console.log('❌ Permiso denegado por el usuario');
    return { activado: false, error: 'usuario-rechazo' };
  }

  console.log('✅ Permiso concedido');

  // Registrar Service Worker
  const registration = await registrarServiceWorker();
  if (!registration) {
    return { activado: false, error: 'service-worker-error' };
  }

  // Crear suscripción
  const subscription = await crearSuscripcionPush(registration);
  if (!subscription) {
    return { activado: false, error: 'subscription-error' };
  }

  // Guardar en base de datos
  const guardado = await guardarSuscripcionEnSupabase(subscription);
  
  if (guardado) {
    // Notificación de éxito
    new Notification('¡Notificaciones Activadas! 🎉', {
      body: 'Recibirás avisos importantes del PMA',
      icon: 'https://vkfjttukyrtiumzfmyuk.supabase.co/storage/v1/object/public/img/LOGO.png'
    });
    return { activado: true, yaExistia: false };
  }

  return { activado: false, error: 'save-error' };
}

// ===================================
// FUNCIÓN: Verificar estado actual
// ===================================
function verificarEstadoNotificaciones() {
  if (!('Notification' in window)) {
    return 'no-soportado';
  }
  return Notification.permission; // 'default', 'granted', 'denied'
}

// ===================================
// FUNCIÓN: Desuscribirse
// ===================================
async function desuscribirNotificaciones() {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const endpoint = subscription.endpoint;
      
      // Eliminar de Supabase
      await fetch(`${SUPABASE_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, {
        method: 'DELETE',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      // Cancelar suscripción local
      await subscription.unsubscribe();
      console.log('✅ Notificaciones desactivadas');
      return true;
    }
  } catch (error) {
    console.error('❌ Error al desuscribirse:', error);
    return false;
  }
}

// ===================================
// AUTO-INICIALIZACIÓN (Registrar Service Worker solamente)
// ===================================
window.addEventListener('load', async () => {
  // Solo registrar el Service Worker, NO pedir permisos automáticamente
  if ('serviceWorker' in navigator) {
    try {
      await registrarServiceWorker();
      console.log('✅ Service Worker inicializado automáticamente');
    } catch (error) {
      console.error('❌ Error inicializando Service Worker:', error);
    }
  }
});

// ===================================
// Exportar funciones para uso manual
// ===================================
window.PushNotifications = {
  solicitar: solicitarNotificacionesManual,
  desuscribir: desuscribirNotificaciones,
  verificarEstado: verificarEstadoNotificaciones
};
