// ===================================
// CONFIGURACIÓN DE NOTIFICACIONES PUSH
// ===================================

// 🔑 Clave pública VAPID
const VAPID_PUBLIC_KEY = 'BIktOgjhM2TEiwx1S0r9hOrCZrQWeVjgPytVj5gzFohWjVilSxfz1ouOlrxdBxLC_DK8P8I6D7EJgjtU0McG96I';

// URL de tu proyecto Supabase
const SUPABASE_URL = 'https://vkfjttukyrtiumzfmyuk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZmp0dHVreXJ0aXVtemZteXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTU0MjQsImV4cCI6MjA3ODAzMTQyNH0.eU8GeI8IVazXydMDwY98TUzT9xvjhcbXBu6cruCPiEk';

// ===================================
// FUNCIÓN: Convertir clave VAPID a formato Uint8Array
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
    console.warn('❌ Este navegador no soporta Service Workers');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/service-worker.js');
    console.log('✅ Service Worker registrado:', registration);
    return registration;
  } catch (error) {
    console.error('❌ Error al registrar Service Worker:', error);
    return null;
  }
}

// ===================================
// FUNCIÓN: Solicitar permiso de notificaciones
// ===================================
async function solicitarPermisoNotificaciones() {
  if (!('Notification' in window)) {
    alert('Este navegador no soporta notificaciones');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('✅ Permiso de notificaciones ya concedido');
    return true;
  }

  if (Notification.permission === 'denied') {
    alert('Las notificaciones están bloqueadas. Por favor, habilítalas en la configuración de tu navegador.');
    return false;
  }

  // Mostrar mensaje personalizado antes de pedir permiso
  const aceptar = confirm(
    '📢 Activar Notificaciones del PMA\n\n' +
    'Recibirás avisos importantes sobre:\n' +
    '• Suspensión de tutorías\n' +
    '• Actividades extracurriculares\n' +
    '• Cambios de horario\n\n' +
    '¿Deseas activar las notificaciones?'
  );

  if (!aceptar) {
    console.log('❌ Usuario rechazó activar notificaciones');
    return false;
  }

  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    console.log('✅ Permiso de notificaciones concedido');
    return true;
  } else {
    console.log('❌ Permiso de notificaciones denegado');
    return false;
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

    console.log('✅ Suscripción push creada:', subscription);
    return subscription;
  } catch (error) {
    console.error('❌ Error al crear suscripción push:', error);
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
      console.log('✅ Suscripción guardada en Supabase');
      return true;
    } else {
      console.error('❌ Error al guardar suscripción:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error al guardar suscripción:', error);
    return false;
  }
}

// ===================================
// FUNCIÓN PRINCIPAL: Inicializar notificaciones
// ===================================
async function inicializarNotificaciones() {
  console.log('🔔 Inicializando sistema de notificaciones...');

  // Paso 1: Registrar Service Worker
  const registration = await registrarServiceWorker();
  if (!registration) {
    console.warn('❌ No se pudo registrar el Service Worker');
    return false;
  }

  // Esperar a que el Service Worker esté listo
  await navigator.serviceWorker.ready;

  // Paso 2: Verificar si ya existe una suscripción
  const existingSubscription = await registration.pushManager.getSubscription();
  
  if (existingSubscription) {
    console.log('✅ Ya existe una suscripción activa');
    await guardarSuscripcionEnSupabase(existingSubscription);
    return true;
  }

  // Paso 3: Solicitar permiso
  const permisoOtorgado = await solicitarPermisoNotificaciones();
  if (!permisoOtorgado) {
    return false;
  }

  // Paso 4: Crear suscripción
  const subscription = await crearSuscripcionPush(registration);
  if (!subscription) {
    console.error('❌ No se pudo crear la suscripción');
    return false;
  }

  // Paso 5: Guardar en Supabase
  const guardado = await guardarSuscripcionEnSupabase(subscription);
  
  if (guardado) {
    console.log('✅ Notificaciones activadas correctamente');
    
    // Mostrar notificación de prueba
    if (Notification.permission === 'granted') {
      new Notification('¡Notificaciones Activadas!', {
        body: 'Recibirás avisos importantes del PMA',
        icon: 'https://vkfjttukyrtiumzfmyuk.supabase.co/storage/v1/object/public/img/LOGO.png',
        badge: 'https://vkfjttukyrtiumzfmyuk.supabase.co/storage/v1/object/public/img/LOGO.png'
      });
    }
    
    return true;
  }

  return false;
}

// ===================================
// FUNCIÓN: Verificar estado de notificaciones
// ===================================
function verificarEstadoNotificaciones() {
  if (!('Notification' in window)) {
    return 'no-soportado';
  }
  
  return Notification.permission; // 'default', 'granted', 'denied'
}

// ===================================
// FUNCIÓN: Desuscribirse de notificaciones
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
// AUTO-INICIALIZACIÓN
// ===================================
// Intentar activar notificaciones al cargar la página
window.addEventListener('load', async () => {
  // Esperar 3 segundos para no interferir con la carga inicial
  setTimeout(async () => {
    const estado = verificarEstadoNotificaciones();
    
    if (estado === 'default') {
      // Primera vez, preguntar al usuario
      console.log('🔔 Primera vez detectada, preparando para solicitar permiso...');
      // No iniciamos automáticamente, esperamos interacción del usuario
    } else if (estado === 'granted') {
      // Ya tiene permiso, renovar suscripción si es necesario
      await inicializarNotificaciones();
    }
  }, 3000);
});

// Exportar funciones para uso manual
window.PushNotifications = {
  inicializar: inicializarNotificaciones,
  desuscribir: desuscribirNotificaciones,
  verificarEstado: verificarEstadoNotificaciones
};
