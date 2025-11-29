// URL y KEY optimizadas - Construcción más eficiente
const SUPABASE_URL = `https://vkfjttukyrtiumzfmyuk.supabase.co`;
const SUPABASE_KEY = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZmp0dHVreXJ0aXVtemZteXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTU0MjQsImV4cCI6MjA3ODAzMTQyNH0.eU8GeI8IVazXydMDwY98TUzT9xvjhcbXBu6cruCPiEk`;

// OneSignal Credentials
const ONESIGNAL_APP_ID = "af1f6666-7815-49df-b39f-b29ca8ecfad2";
const ONESIGNAL_REST_API_KEY = "os_v2_app_v4pwmztycve57m47wkokr3h22k6wpstpfmcun2uhdec3wbwaq55t63cbgmhflyyq3vcoumaswqq4dambk3jfza3k5tvaassrgbn7uaa";


// Variables globales
let datosEstudiante = null;
let instructorActual = null;
let formularioEnviandose = false;
let graficoTutorias = null;
// Variable para controlar la página actual del formulario
let paginaFormularioActual = 1;

// NUEVO: Variable para el estudiante que está actualizando
let estudianteActualizando = null;

// Cache de datos precargados
const datosCache = {
  facultadesCarreras: [],
  tutoresNorte: [],
  tutoresSur: [],
  profesores: [],
  materias: [],
  temas: []
};

let facultadesData = {};


// ===================================
// FUNCIÓN DE REINTENTOS AUTOMÁTICOS
// ===================================
async function fetchConReintentos(url, options, intentos = 3) {
  for (let i = 0; i < intentos; i++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.log(`Intento ${i + 1} de ${intentos} falló:`, error.message);
      
      if (i === intentos - 1) {
        throw new Error('No pudimos conectar con el servidor después de varios intentos. Por favor verifica tu conexión a internet e intenta de nuevo.');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      console.log('Reintentando...');
    }
  }
}

// ===================================
// FUNCIONES DE SUPABASE
// ===================================
async function supabaseQuery(table, options = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  
  if (options.select) url += `?select=${options.select}`;
  if (options.eq) url += `${options.select ? '&' : '?'}${options.eq.field}=eq.${options.eq.value}`;
  if (options.order) url += `${url.includes('?') ? '&' : '?'}order=${options.order}`;
  
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };
  
  return await fetchConReintentos(url, { headers });
}

async function supabaseInsert(table, data) {
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  
  return await fetchConReintentos(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  });
}

// ===================================
// PRECARGA OPTIMIZADA POR MÓDULO
// ===================================
async function precargarDatosFormulario() {
  if (datosCache.tutoresNorte.length > 0) return; // Ya cargados
  
  try {
    console.log('Precargando datos del formulario...');
    
    const [tutoresNorte, tutoresSur, profesores, materias, temas] = await Promise.all([
      supabaseQuery('tutores_norte'),
      supabaseQuery('tutores_sur'),
      supabaseQuery('profesores'),
      supabaseQuery('materias'),
      supabaseQuery('temas')
    ]);
    
    datosCache.tutoresNorte = tutoresNorte;
    datosCache.tutoresSur = tutoresSur;
    datosCache.profesores = profesores;
    datosCache.materias = materias;
    datosCache.temas = temas;
    
    console.log('Datos del formulario cargados');
  } catch (error) {
    console.error('Error precargando datos del formulario:', error);
    throw error;
  }
}

async function precargarDatosRegistro() {
  if (datosCache.facultadesCarreras.length > 0) return; // Ya cargados
  
  try {
    console.log('Precargando datos del registro...');
    
    const facultadesCarreras = await supabaseQuery('facultades_carreras');
    
    datosCache.facultadesCarreras = facultadesCarreras;
    procesarFacultadesData();
    
    console.log('Datos del registro cargados');
  } catch (error) {
    console.error('Error precargando datos del registro:', error);
    throw error;
  }
}

async function precargarDatosEstadisticas() {
  // Para estadísticas necesitamos tutores y profesores
  if (datosCache.tutoresNorte.length > 0 && datosCache.profesores.length > 0) return; // Ya cargados
  
  try {
    console.log('Precargando datos de estadísticas...');
    
    const [tutoresNorte, tutoresSur, profesores] = await Promise.all([
      supabaseQuery('tutores_norte'),
      supabaseQuery('tutores_sur'),
      supabaseQuery('profesores')
    ]);
    
    datosCache.tutoresNorte = tutoresNorte;
    datosCache.tutoresSur = tutoresSur;
    datosCache.profesores = profesores;
    
    console.log('Datos de estadísticas cargados');
  } catch (error) {
    console.error('Error precargando datos de estadísticas:', error);
    throw error;
  }
}



function procesarFacultadesData() {
  facultadesData = {};
  
  for (const item of datosCache.facultadesCarreras) {
    if (!facultadesData[item.facultad]) {
      facultadesData[item.facultad] = [];
    }
    facultadesData[item.facultad].push(item.programa);
  }
}


function limpiarEspacios(input) {
  const valorOriginal = input.value;
  
  // Limpiar espacios
  let valor = input.value.trim();
  valor = valor.replace(/\s+/g, ' ');
  
  // Si cambió algo, hacer un pequeño efecto
  if (valorOriginal !== valor) {
    input.value = valor;
    input.style.backgroundColor = '#e8f4fd';
    setTimeout(() => {
      input.style.backgroundColor = '';
    }, 300);
  }
}

// ===================================
// TOGGLE NOTIFICACIONES
// ===================================
function toggleNotificaciones() {
  const sede = document.getElementById('regSede').value;
  const grupoNotificaciones = document.getElementById('grupoNotificaciones');
  const selectNotificaciones = document.getElementById('regNotificaciones');
  
  if (sede === 'Norte') {
    grupoNotificaciones.classList.remove('hidden');
    selectNotificaciones.setAttribute('required', 'required');
  } else {
    grupoNotificaciones.classList.add('hidden');
    selectNotificaciones.removeAttribute('required');
    selectNotificaciones.value = '';
  }
}

// ===================================
// FUNCIONES DE NAVEGACIÓN
// ===================================
function mostrarPantalla(id) {
  document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function mostrarLogin() {
  mostrarPantalla('pantallaLogin');
  document.getElementById('mensajeLogin').innerHTML = '';
  
  // PRECARGAR DATOS DEL FORMULARIO
  if (datosCache.tutoresNorte.length === 0) {
    const mensajeLogin = document.getElementById('mensajeLogin');
    mensajeLogin.innerHTML = '<div class="loader"></div><p style="text-align: center; color: #666; font-size: 13px; margin-top: 10px;">Cargando datos del formulario...</p>';
    
    try {
      await precargarDatosFormulario();
      mensajeLogin.innerHTML = '';
    } catch (error) {
      mensajeLogin.innerHTML = '';
      console.error('Error precargando datos:', error);
    }
  }
}


async function mostrarRegistro() {
  mostrarPantalla('pantallaRegistro');
  document.getElementById('mensajeRegistro').innerHTML = '';
  document.getElementById('confirmacionDatos').classList.add('hidden');
  document.getElementById('btnConfirmarRegistro').classList.add('hidden');
  
  // Mostrar paso de verificación de documento
  document.getElementById('pasoDocumento').classList.remove('hidden');
  document.getElementById('formRegistro').classList.add('hidden');
  document.getElementById('regDocumento').value = '';
  
  // CARGAR DATOS DEL REGISTRO
  if (datosCache.facultadesCarreras.length === 0) {
    mostrarCargando('mensajeRegistro');
    try {
      await precargarDatosRegistro();
      document.getElementById('mensajeRegistro').innerHTML = '';
      cargarFacultades();
    } catch (error) {
      mostrarMensaje('mensajeRegistro', 'Error al cargar los datos. Por favor intenta de nuevo.', 'error');
    }
  } else {
    cargarFacultades();
  }
}


function mostrarLoginAdmin() {
  mostrarPantalla('pantallaAdminLogin');
  document.getElementById('mensajeAdminLogin').innerHTML = '';
}

function toggleHorarios() {
  const contenedor = document.getElementById('contenedorHorarios');
  contenedor.classList.toggle('hidden');
  
  if (contenedor.classList.contains('hidden')) {
    document.getElementById('horarioNorte').classList.add('hidden');
    document.getElementById('horarioSur').classList.add('hidden');
    document.getElementById('horarioVirtual').classList.add('hidden');
  }
}

function toggleHorario(sede) {
  document.getElementById('horarioNorte').classList.add('hidden');
  document.getElementById('horarioSur').classList.add('hidden');
  document.getElementById('horarioVirtual').classList.add('hidden');
  
  if (sede === 'norte') {
    document.getElementById('horarioNorte').classList.toggle('hidden');
  } else if (sede === 'sur') {
    document.getElementById('horarioSur').classList.toggle('hidden');
  } else if (sede === 'virtual') {
    document.getElementById('horarioVirtual').classList.toggle('hidden');
  }
}

function volverInicio() {
  mostrarPantalla('pantallaInicio');
  limpiarFormularios();
  formularioEnviandose = false;
  document.getElementById('btnContinuar').classList.remove('hidden');
  document.getElementById('btnConfirmarRegistro').classList.add('hidden');
  document.getElementById('confirmacionDatos').classList.add('hidden');
  document.getElementById('contenedorHorarios').classList.add('hidden');
  document.getElementById('horarioNorte').classList.add('hidden');
  document.getElementById('horarioSur').classList.add('hidden');
  document.getElementById('horarioVirtual').classList.add('hidden');


// REACTIVAR BOTONES
  const btnEnviar = document.getElementById('btnEnviar');
  if (btnEnviar) {
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar Formulario';
    btnEnviar.style.opacity = '1';
    btnEnviar.style.cursor = 'pointer';
  }
  
  const btnRegistro = document.getElementById('btnConfirmarRegistro');
  if (btnRegistro) {
    btnRegistro.disabled = false;
    btnRegistro.textContent = 'Confirmar y Registrarme';
    btnRegistro.style.opacity = '1';
    btnRegistro.style.cursor = 'pointer';
  }
}

function limpiarFormularios() {
  document.getElementById('formRegistro').reset();
  document.getElementById('formLogin').reset();
  document.getElementById('formTutoria').reset();
  document.getElementById('formAdminLogin').reset();
}

function mostrarMensaje(elementId, mensaje, tipo) {
  const elemento = document.getElementById(elementId);
  elemento.innerHTML = `<div class="mensaje ${tipo}">${mensaje}</div>`;
  
  setTimeout(() => {
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
  
  setTimeout(() => elemento.innerHTML = '', 10000);
}

function mostrarCargando(elementId) {
  const elemento = document.getElementById(elementId);
  elemento.innerHTML = '<div class="loader"></div>';
  
  setTimeout(() => {
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

// ===================================
// VALIDACIÓN DE DOCUMENTO
// ===================================
function validarDocumento(documento) {
  const longitud = documento.length;
  
  if (longitud < 7 || longitud > 12) {
    return {
      valido: false,
      mensaje: 'Documento no válido'
    };
  }
  
  return { valido: true };
}

// ===================================
// CARGAR FACULTADES Y PROGRAMAS
// ===================================
function cargarFacultades() {
  const select = document.getElementById('regFacultad');
  select.innerHTML = '<option value="">Seleccione una facultad</option>';
  
  const facultadesOrdenadas = Object.keys(facultadesData).sort();
  const fragment = document.createDocumentFragment();
  
  for (const facultad of facultadesOrdenadas) {
    const option = document.createElement('option');
    option.value = facultad;
    option.textContent = facultad;
    fragment.appendChild(option);
  }
  
  select.appendChild(fragment);
}

function cargarProgramas() {
  const facultad = document.getElementById('regFacultad').value;
  const selectPrograma = document.getElementById('regPrograma');
  
  if (!facultad) {
    selectPrograma.disabled = true;
    selectPrograma.innerHTML = '<option value="">Primero seleccione una facultad</option>';
    return;
  }
  
  selectPrograma.disabled = false;
  selectPrograma.innerHTML = '<option value="">Seleccione un programa</option>';
  
  const programas = facultadesData[facultad] || [];
  const programasOrdenados = programas.sort();
  const fragment = document.createDocumentFragment();
  
  for (const programa of programasOrdenados) {
    const option = document.createElement('option');
    option.value = programa;
    option.textContent = programa;
    fragment.appendChild(option);
  }
  
  selectPrograma.appendChild(fragment);
}

// ===================================
// CONFIRMACIÓN Y REGISTRO
// ===================================
function mostrarConfirmacion() {
  // Validar que el formulario sea válido antes de continuar
  const form = document.getElementById('formRegistro');
  if (!form.checkValidity()) {
    form.reportValidity(); // Muestra los mensajes de required del navegador
    return;
  }
  
  const doc = document.getElementById('regDocumento').value;
  
  const validacion = validarDocumento(doc);
  if (!validacion.valido) {
    mostrarMensaje('mensajeRegistro', validacion.mensaje, 'error');
    return;
  }
    
  const primerNombre = document.getElementById('regPrimerNombre').value.toUpperCase();
  const segundoNombre = document.getElementById('regSegundoNombre').value.toUpperCase();
  const primerApellido = document.getElementById('regPrimerApellido').value.toUpperCase();
  const segundoApellido = document.getElementById('regSegundoApellido').value.toUpperCase();
  const facultad = document.getElementById('regFacultad').value;
  const programa = document.getElementById('regPrograma').value;
  const sede = document.getElementById('regSede').value;
  
  const nombreCompleto = `${primerNombre} ${segundoNombre} ${primerApellido} ${segundoApellido}`.replace(/\s+/g, ' ');
  const semestre = document.getElementById('regSemestre').value;
  const grupo = document.getElementById('regGrupo').value.toUpperCase();

  const html = `
    <div class="confirmation-item">
      <div class="confirmation-label">Documento:</div>
      <div class="confirmation-value">${doc}</div>
    </div>
    <div class="confirmation-item">
      <div class="confirmation-label">Nombre Completo:</div>
      <div class="confirmation-value">${nombreCompleto}</div>
    </div>
    <div class="confirmation-item">
      <div class="confirmation-label">Facultad:</div>
      <div class="confirmation-value">${facultad}</div>
    </div>
    <div class="confirmation-item">
      <div class="confirmation-label">Programa:</div>
      <div class="confirmation-value">${programa}</div>
    </div>
    <div class="confirmation-item">
      <div class="confirmation-label">Sede:</div>
      <div class="confirmation-value">${sede}</div>
    </div>
    <div class="confirmation-item">
      <div class="confirmation-label">Semestre:</div>
      <div class="confirmation-value">${semestre}</div>
    </div>
    <div class="confirmation-item">
      <div class="confirmation-label">Grupo:</div>
      <div class="confirmation-value">${grupo}</div>
    </div>
  `;

  document.getElementById('datosConfirmacion').innerHTML = html;
  document.getElementById('confirmacionDatos').classList.remove('hidden');
  document.getElementById('btnConfirmarRegistro').classList.remove('hidden');
  document.getElementById('btnContinuar').classList.add('hidden');
  
  setTimeout(() => {
    document.getElementById('confirmacionDatos').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
}

// NUEVA FUNCIÓN: Verificar documento antes de mostrar el formulario
async function verificarDocumento(event) {
  event.preventDefault();
  
  const doc = document.getElementById('regDocumento').value;
  
  const validacion = validarDocumento(doc);
  if (!validacion.valido) {
    mostrarMensaje('mensajeRegistro', validacion.mensaje, 'error');
    return;
  }
  
  mostrarCargando('mensajeRegistro');

  try {
    const existing = await supabaseQuery('estudiantes', {
      eq: { field: 'documento', value: doc }
    });

    if (existing.length > 0) {
      mostrarMensaje('mensajeRegistro', 'Este documento ya está registrado en el sistema. Si necesita actualizar sus datos, contacte al administrador.', 'error');
      return;
    }

    // Si el documento NO está registrado, mostrar el formulario completo
    document.getElementById('mensajeRegistro').innerHTML = '';
    document.getElementById('pasoDocumento').classList.add('hidden');
    document.getElementById('formRegistro').classList.remove('hidden');
    document.getElementById('regDocumentoMostrar').value = doc;
    
    // Hacer scroll al inicio del formulario
    setTimeout(() => {
      document.getElementById('formRegistro').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

  } catch (error) {
    mostrarMensaje('mensajeRegistro', 'Error al verificar el documento: ' + error.message, 'error');
  }
}

async function registrarEstudiante(event) {
  event.preventDefault();
  
  if (!estudianteActualizando) {
    const doc = document.getElementById('regDocumentoMostrar').value;
    const btnRegistro = document.getElementById('btnConfirmarRegistro');
    
    // Desactivar botón para evitar doble click
    btnRegistro.disabled = true;
    btnRegistro.textContent = '⏳ Registrando...';
    btnRegistro.style.opacity = '0.6';
    btnRegistro.style.cursor = 'not-allowed';
    
    mostrarCargando('mensajeRegistro');

    const datos = {
      documento: doc,
      primer_nombre: document.getElementById('regPrimerNombre').value.toUpperCase(),
      segundo_nombre: document.getElementById('regSegundoNombre').value.toUpperCase() || null,
      primer_apellido: document.getElementById('regPrimerApellido').value.toUpperCase(),
      segundo_apellido: document.getElementById('regSegundoApellido').value.toUpperCase(),
      facultad: document.getElementById('regFacultad').value,
      programa: document.getElementById('regPrograma').value,
      sede: document.getElementById('regSede').value,
      semestre: parseInt(document.getElementById('regSemestre').value),
      grupo: document.getElementById('regGrupo').value.toUpperCase(),
      notificaciones: document.getElementById('regSede').value === 'Norte' ? document.getElementById('regNotificaciones').value : null,
      fecha_actualizacion: new Date(Date.now() - (5 * 60 * 60 * 1000)).toISOString()
    };

    try {
      const resultado = await supabaseInsert('estudiantes', datos);
      
      if (resultado && resultado.length > 0) {
        // ✅ NUEVO: Suscribir a notificaciones push si aceptó
        if (datos.notificaciones === 'Si') {
          try {
            await suscribirNotificaciones(doc);
          } catch (error) {
            console.error('Error al suscribir notificaciones:', error);
            // No bloqueamos el registro si falla la suscripción
          }
        }
        
        document.getElementById('mensajeRegistro').innerHTML = '';
        
        const modal = document.getElementById('modalExitoRegistro');
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
        
        setTimeout(() => {
          modal.style.display = 'none';
          modal.classList.add('hidden');
          volverInicio();
        }, 3000);
      } else {
        mostrarMensaje('mensajeRegistro', 'Error: No se pudo completar el registro', 'error');
        btnRegistro.disabled = false;
        btnRegistro.textContent = 'Confirmar y Registrarme';
        btnRegistro.style.opacity = '1';
        btnRegistro.style.cursor = 'pointer';
      }
    } catch (error) {
      mostrarMensaje('mensajeRegistro', error.message, 'error');
      btnRegistro.disabled = false;
      btnRegistro.textContent = 'Confirmar y Registrarme';
      btnRegistro.style.opacity = '1';
      btnRegistro.style.cursor = 'pointer';
    }
  }
}

// ===================================
// SUSCRIPCIÓN A NOTIFICACIONES PUSH
// ===================================
async function suscribirNotificaciones(documento) {
  try {
    console.log('🔔 Iniciando suscripción a notificaciones...');
    
    // Verificar que OneSignal esté cargado
    if (typeof OneSignal === 'undefined') {
      console.error('❌ OneSignal no está cargado');
      return;
    }
    
    // Solicitar permiso para notificaciones
    await OneSignal.Slidedown.promptPush();
    
    // Esperar a que el usuario acepte
    const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
    
    if (isPushEnabled) {
      // Obtener el Player ID (ID único del dispositivo)
      const playerId = await OneSignal.User.PushSubscription.id;
      
      console.log('✅ Suscripción exitosa. Player ID:', playerId);
      
      // Asociar el documento del estudiante con el Player ID
      await OneSignal.User.addTag('documento', documento);
      await OneSignal.User.addTag('acepta_notificaciones', 'Si');
      
      console.log('✅ Tags agregados correctamente');
    } else {
      console.log('❌ Usuario rechazó las notificaciones');
    }
  } catch (error) {
    console.error('❌ Error en suscripción:', error);
    throw error;
  }
}

// ===================================
// LOGIN
// ===================================
function censurarNombre(nombreCompleto) {
  const partes = nombreCompleto.split(' ');
  return partes.map(parte => {
    if (parte.length <= 2) return parte;
    return parte.substring(0, 2) + '*'.repeat(parte.length - 2);
  }).join(' ');
}

async function iniciarSesion(event) {
  event.preventDefault();
  
  const documento = document.getElementById('loginDocumento').value;
  
  const validacion = validarDocumento(documento);
  if (!validacion.valido) {
    mostrarMensaje('mensajeLogin', validacion.mensaje, 'error');
    return;
  }
  
  mostrarCargando('mensajeLogin');

  // Asegurar que datos del formulario estén cargados
  if (datosCache.tutoresNorte.length === 0) {
    try {
      await precargarDatosFormulario();
    } catch (error) {
      mostrarMensaje('mensajeLogin', 'Error al cargar los datos del formulario. Por favor intenta de nuevo.', 'error');
      return;
    }
  }

  try {
    const data = await supabaseQuery('estudiantes', {
      eq: { field: 'documento', value: documento }
    });

    if (data.length === 0) {
      mostrarMensaje('mensajeLogin', 'Documento no encontrado. Por favor regístrese primero.', 'error');
      return;
    }

    const estudiante = data[0];
    
    // NUEVO: Verificar si necesita actualizar datos
    const necesitaActualizacion = verificarActualizacionSemestral(estudiante);
    
    if (necesitaActualizacion) {
      estudianteActualizando = estudiante;
      mostrarFormularioActualizacion(estudiante);
      return;
    }

    // Continuar con el flujo normal
    const nombres = `${estudiante.primer_nombre} ${estudiante.segundo_nombre || ''}`.trim();
    const apellidos = `${estudiante.primer_apellido} ${estudiante.segundo_apellido}`.trim();
    const nombreCompleto = `${nombres} ${apellidos}`;

datosEstudiante = {
      documento: estudiante.documento,
      nombres: nombres,
      apellidos: apellidos,
      nombreCensurado: censurarNombre(nombreCompleto),
      facultad: estudiante.facultad,
      programa: estudiante.programa,
      sede: estudiante.sede || '',
      semestre: estudiante.semestre,
      grupo: estudiante.grupo
    };

    // ✅ AGREGAR ESTAS LÍNEAS AQUÍ:
    // Verificar si el usuario ya había aceptado notificaciones y suscribirlo si es necesario
    if (estudiante.notificaciones === 'Si') {
      try {
        const isPushEnabled = await OneSignal.User.PushSubscription.optedIn;
        if (!isPushEnabled) {
          // Si no está suscrito, intentar suscribir
          await suscribirNotificaciones(estudiante.documento);
        } else {
          // Si ya está suscrito, actualizar tags por si acaso
          await OneSignal.User.addTag('documento', estudiante.documento);
          await OneSignal.User.addTag('acepta_notificaciones', 'Si');
        }
      } catch (error) {
        console.error('Error al verificar/suscribir notificaciones:', error);
      }
    }

    formularioEnviandose = false;
    mostrarPantalla('pantallaFormulario');
    document.getElementById('nombreUsuario').textContent = 'Bienvenido(a): ' + datosEstudiante.nombreCensurado;
    document.getElementById('mensajeFormulario').innerHTML = '';
    actualizarBotonCerrarSesion();
    actualizarProgreso(1);

  } catch (error) {
    mostrarMensaje('mensajeLogin', 'Error de conexión: ' + error.message, 'error');
  }
}


// ===================================
// VERIFICAR REGISTRO RECIENTE CON INSTRUCTOR ESPECÍFICO
// ===================================
async function verificarRegistroRecenteConInstructor(documento, instructorSeleccionado) {
  try {
    // Obtener la fecha y hora actual en Colombia (UTC-5)
    const ahora = new Date();
    const ahoraColombia = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    
    // Calcular hace 1 hora y 30 minutos (90 minutos)
    const hace90Minutos = new Date(ahoraColombia.getTime() - (90 * 60 * 1000));
    const hace90MinutosISO = hace90Minutos.toISOString();
    
    // Consultar registros de los últimos 90 minutos CON EL MISMO INSTRUCTOR
    const url = `${SUPABASE_URL}/rest/v1/formularios?documento=eq.${documento}&instructor=eq.${encodeURIComponent(instructorSeleccionado)}&fecha=gte.${hace90MinutosISO}&order=fecha.desc`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    const registrosRecientes = await response.json();
    
    if (registrosRecientes.length === 0) {
      // No hay registros recientes con este instructor, puede registrar
      return { puedeRegistrar: true };
    }
    
    // Obtener el registro más reciente con este instructor
    const registroMasReciente = registrosRecientes[0];
    const fechaRegistro = new Date(registroMasReciente.fecha);
    const fechaRegistroColombia = new Date(fechaRegistro.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    
    // Calcular tiempo transcurrido en minutos
    const tiempoTranscurrido = Math.floor((ahoraColombia - fechaRegistroColombia) / (1000 * 60));
    const tiempoRestanteMinutos = 90 - tiempoTranscurrido;
    
    // Formatear tiempo restante
    let tiempoRestante;
    if (tiempoRestanteMinutos >= 60) {
      const horas = Math.floor(tiempoRestanteMinutos / 60);
      const minutos = tiempoRestanteMinutos % 60;
      tiempoRestante = minutos > 0 ? `${horas} hora y ${minutos} minutos` : `${horas} hora`;
    } else {
      tiempoRestante = `${tiempoRestanteMinutos} minutos`;
    }
    
    return {
      puedeRegistrar: false,
      tiempoRestante: tiempoRestante,
      instructor: instructorSeleccionado
    };
    
  } catch (error) {
    console.error('Error verificando registro reciente:', error);
    // En caso de error, permitir el registro
    return { puedeRegistrar: true };
  }
}


// ===================================
// CARGAR INSTRUCTORES - MODIFICADO
// ===================================
function cargarInstructores() {
  const sede = document.getElementById('sedeTutoria').value;
  const tipo = document.getElementById('tipoInstructor').value;

  if (!sede || !tipo) return;

  const grupoFacultad = document.getElementById('grupoFacultadDepartamento');
  const selectFacultad = document.getElementById('facultadDepartamento');
  
  grupoFacultad.classList.add('hidden');
  document.getElementById('grupoInstructor').classList.add('hidden');
  selectFacultad.value = '';
  document.getElementById('instructor').value = '';
  
  selectFacultad.removeAttribute('required');

  if (tipo === 'Tutor') {
    const selectInstructor = document.getElementById('instructor');
    document.getElementById('grupoInstructor').classList.remove('hidden');
    document.getElementById('labelInstructor').textContent = 'Tutor *';

    let instructores = [];
    
    if (sede === 'Virtual') {
      instructores = [...datosCache.tutoresNorte, ...datosCache.tutoresSur];
    } else if (sede === 'Norte') {
      instructores = datosCache.tutoresNorte;
    } else if (sede === 'Sur') {
      instructores = datosCache.tutoresSur;
    }

    const instructoresOrdenados = [...instructores].sort((a, b) => a.nombre.localeCompare(b.nombre));
    selectInstructor.innerHTML = '<option value="">Seleccione un tutor</option>';
    
    const instructoresUnicos = [];
    const nombresVistos = new Set();
    
    for (const inst of instructoresOrdenados) {
      if (!nombresVistos.has(inst.nombre)) {
        nombresVistos.add(inst.nombre);
        instructoresUnicos.push(inst);
      }
    }
    
    const fragment = document.createDocumentFragment();
    for (const inst of instructoresUnicos) {
      const option = document.createElement('option');
      option.value = inst.nombre;
      option.textContent = inst.nombre;
      fragment.appendChild(option);
    }
    selectInstructor.appendChild(fragment);
    
    actualizarProgreso(2);
  } else if (tipo === 'Profesor') {
    grupoFacultad.classList.remove('hidden');
    selectFacultad.setAttribute('required', 'required');
    actualizarProgreso(2);
  }
}

// ===================================
// CARGAR PROFESORES POR FACULTAD/DEPARTAMENTO
// ===================================
function cargarProfesoresPorFacultad() {
  const facultadDepartamento = document.getElementById('facultadDepartamento').value;

  if (!facultadDepartamento) return;

  const selectInstructor = document.getElementById('instructor');
  document.getElementById('grupoInstructor').classList.remove('hidden');
  document.getElementById('labelInstructor').textContent = 'Profesor *';

  const profesores = datosCache.profesores.filter(
    prof => prof.facultad_departamento === facultadDepartamento
  );

  const profesoresOrdenados = [...profesores].sort((a, b) => a.nombre.localeCompare(b.nombre));

  selectInstructor.innerHTML = '<option value="">Seleccione un profesor</option>';
  
  const fragment = document.createDocumentFragment();
  for (const prof of profesoresOrdenados) {
    const option = document.createElement('option');
    option.value = prof.nombre;
    option.setAttribute('data-area', prof.area);
    option.textContent = prof.nombre;
    fragment.appendChild(option);
  }
  selectInstructor.appendChild(fragment);
}

// ===================================
// CARGAR MATERIAS
// ===================================
function cargarMaterias() {
  const selectInstructor = document.getElementById('instructor');
  const selectedOption = selectInstructor.options[selectInstructor.selectedIndex];
  
  if (!selectedOption || !selectedOption.value) return;

  const instructorNombre = selectedOption.value;
  
  let areasInstructor = [];
  
  if (document.getElementById('tipoInstructor').value === 'Tutor') {
    const sede = document.getElementById('sedeTutoria').value;
    let tutores = [];
    
    if (sede === 'Virtual') {
      tutores = [...datosCache.tutoresNorte, ...datosCache.tutoresSur];
    } else if (sede === 'Norte') {
      tutores = datosCache.tutoresNorte;
    } else if (sede === 'Sur') {
      tutores = datosCache.tutoresSur;
    }
    
    for (const tutor of tutores) {
      if (tutor.nombre === instructorNombre && !areasInstructor.includes(tutor.area)) {
        areasInstructor.push(tutor.area);
      }
    }
  } else {
    for (const prof of datosCache.profesores) {
      if (prof.nombre === instructorNombre && !areasInstructor.includes(prof.area)) {
        areasInstructor.push(prof.area);
      }
    }
  }

  instructorActual = { nombre: instructorNombre, areas: areasInstructor };

  document.getElementById('grupoMateria').classList.remove('hidden');

  const materiasFiltradas = datosCache.materias.filter(mat => 
    areasInstructor.includes(mat.area)
  );
  
  const materiasOrdenadas = materiasFiltradas.sort((a, b) => a.materia.localeCompare(b.materia));

  const selectMateria = document.getElementById('asignatura');
  selectMateria.innerHTML = '<option value="">Seleccione una asignatura</option>';
  
  const fragment = document.createDocumentFragment();
  for (const mat of materiasOrdenadas) {
    const option = document.createElement('option');
    option.value = mat.materia;
    option.textContent = mat.materia;
    fragment.appendChild(option);
  }
  
  const optionOtra = document.createElement('option');
  optionOtra.value = 'Otra';
  optionOtra.textContent = 'Otra: ¿Cuál?';
  optionOtra.style.fontWeight = 'bold';
  fragment.appendChild(optionOtra);
  
  selectMateria.appendChild(fragment);
  
  actualizarProgreso(3);
}

// ===================================
// CARGAR TEMAS
// ===================================
function cargarTemas() {
  const materia = document.getElementById('asignatura').value;
  if (!materia) return;

  const containerAsignatura = document.getElementById('otraAsignaturaContainer');
  const inputAsignatura = document.getElementById('otraAsignatura');
  
  if (materia === 'Otra') {
    containerAsignatura.classList.remove('hidden');
    inputAsignatura.required = true;
    
    document.getElementById('grupoTema').classList.remove('hidden');
    
    const selectTema = document.getElementById('tema');
    selectTema.style.display = 'none';
    selectTema.required = false;
    
    const containerTema = document.getElementById('otroTemaContainer');
    const inputTema = document.getElementById('otroTema');
    containerTema.classList.remove('hidden');
    inputTema.required = true;
    
    const labelTema = document.querySelector('#grupoTema label');
    labelTema.textContent = 'Tema *';
    
document.getElementById('grupoMotivo').classList.remove('hidden');
// NO mostrar calificación y sugerencias aquí, están en página 2
    
    formularioEnviandose = true;
    actualizarBotonCerrarSesion();
    actualizarProgreso(4);
    return;
  } else {
    containerAsignatura.classList.add('hidden');
    inputAsignatura.required = false;
    inputAsignatura.value = '';
  }

  document.getElementById('grupoTema').classList.remove('hidden');

  const temasFiltrados = datosCache.temas.filter(tem => tem.materia === materia);
  
  const selectTema = document.getElementById('tema');
  const containerTema = document.getElementById('otroTemaContainer');
  const inputTema = document.getElementById('otroTema');
  const labelTema = document.querySelector('#grupoTema label');

  if (temasFiltrados.length === 0) {
    selectTema.style.display = 'none';
    selectTema.required = false;
    
    containerTema.classList.remove('hidden');
    inputTema.required = true;
    inputTema.value = '';
    
    labelTema.textContent = 'Tema *';
  } else {
    const temasOrdenados = temasFiltrados.sort((a, b) => a.tema.localeCompare(b.tema));
    
    selectTema.style.display = '';
    selectTema.required = true;
    selectTema.innerHTML = '<option value="">Seleccione un tema</option>';
    
    const fragment = document.createDocumentFragment();
    for (const tem of temasOrdenados) {
      const option = document.createElement('option');
      option.value = tem.tema;
      option.textContent = tem.tema;
      fragment.appendChild(option);
    }

    const optionOtro = document.createElement('option');
    optionOtro.value = 'Otro';
    optionOtro.textContent = 'Otro: ¿Cuál?';
    optionOtro.style.fontWeight = 'bold';
    fragment.appendChild(optionOtro);
    
    selectTema.appendChild(fragment);
    
    containerTema.classList.add('hidden');
    inputTema.required = false;
    inputTema.value = '';
    
    labelTema.textContent = 'Tema de la tutoría *';
  }

document.getElementById('grupoMotivo').classList.remove('hidden');
// NO mostrar calificación y sugerencias aquí, están en página 2
  
  formularioEnviandose = true;
  actualizarBotonCerrarSesion();
  actualizarProgreso(4);
}

function toggleOtroTema() {
  const tema = document.getElementById('tema').value;
  const container = document.getElementById('otroTemaContainer');
  const input = document.getElementById('otroTema');
  
  if (tema === 'Otro') {
    container.classList.remove('hidden');
    input.required = true;
  } else {
    container.classList.add('hidden');
    input.required = false;
    input.value = '';
  }
}

function toggleSugerencias() {
  const checkbox = document.getElementById('ningunaSugerencia');
  const textarea = document.getElementById('sugerencias');
  
  if (checkbox.checked) {
    textarea.value = 'Ninguna';
    textarea.disabled = true;
  } else {
    textarea.value = '';
    textarea.disabled = false;
  }
}

// Agregar listener para calificación
document.addEventListener('DOMContentLoaded', function() {
  const calificaciones = document.querySelectorAll('input[name="calificacion"]');
  calificaciones.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('step4').classList.add('completed');
        document.getElementById('step4').classList.remove('active');
      }
    });
  });
});


function toggleTituloCurso() {
  const tipoAcompanamiento = document.getElementById('tipoAcompanamiento').value;
  const grupoTituloCurso = document.getElementById('grupoTituloCurso');
  const inputTituloCurso = document.getElementById('tituloCurso');
  
  if (tipoAcompanamiento === 'Curso y/o capacitación') {
    grupoTituloCurso.classList.remove('hidden');
    inputTituloCurso.required = true;
  } else {
    grupoTituloCurso.classList.add('hidden');
    inputTituloCurso.required = false;
    inputTituloCurso.value = '';
  }
}

// ===================================
// BOTÓN CANCELAR Y CONFIRMACIÓN
// ===================================
function actualizarBotonCerrarSesion() {
  const btnCerrar = document.getElementById('btnCancelarFormulario');
  if (btnCerrar) {
    btnCerrar.textContent = 'Cancelar';
    btnCerrar.onclick = confirmarCancelacion;
  }
}

function confirmarCancelacion() {
  mostrarModalConfirmacion(
    '¿Estás seguro que deseas cancelar?',
    'Se perderán todos los datos del formulario que has ingresado.',
    function() {
      cerrarSesion();
    }
  );
}

function mostrarModalConfirmacion(titulo, mensaje, callbackConfirmar) {
  const modal = document.getElementById('modalConfirmacion');
  document.getElementById('tituloConfirmacion').textContent = titulo;
  document.getElementById('mensajeConfirmacion').textContent = mensaje;
  
  modal.style.display = 'flex';
  modal.classList.remove('hidden');
  
  document.getElementById('btnConfirmarModal').onclick = function() {
    modal.style.display = 'none';
    modal.classList.add('hidden');
    if (callbackConfirmar) callbackConfirmar();
  };
  
  document.getElementById('btnCancelarModal').onclick = function() {
    modal.style.display = 'none';
    modal.classList.add('hidden');
  };
}

// ===================================
// GUARDAR FORMULARIO
// ===================================
async function guardarFormulario(event) {
  event.preventDefault();
  
  const btnEnviar = document.getElementById('btnEnviar');
  
  // ===================================
  // VALIDACIÓN DE TODAS LAS CALIFICACIONES
  // ===================================
  const calificacionRadio = document.querySelector('input[name="calificacion"]:checked');
  const dudasResueltasRadio = document.querySelector('input[name="dudas_resueltas"]:checked');
  const dominioTemaRadio = document.querySelector('input[name="dominio_tema"]:checked');
  const ambienteRadio = document.querySelector('input[name="ambiente"]:checked');
  const recomendaPmaRadio = document.querySelector('input[name="recomienda_pma"]:checked');
  
  // Validar que todas las calificaciones estén respondidas
  if (!calificacionRadio || !dudasResueltasRadio || !dominioTemaRadio || !ambienteRadio || !recomendaPmaRadio) {
    let camposFaltantes = [];
    
    if (!calificacionRadio) camposFaltantes.push('Calificación de la tutoría');
    if (!dudasResueltasRadio) camposFaltantes.push('¿Se resolvieron tus dudas?');
    if (!dominioTemaRadio) camposFaltantes.push('¿El tutor demostró dominio del tema?');
    if (!ambienteRadio) camposFaltantes.push('¿Ambiente adecuado para concentrarte?');
    if (!recomendaPmaRadio) camposFaltantes.push('¿Recomendarías el PMA?');
    
    mostrarMensaje('mensajeFormulario', 
      `Por favor responde todas las preguntas de calificación: ${camposFaltantes.join(', ')}`, 
      'error');
    
    // Scroll al mensaje de error
    setTimeout(() => {
      document.getElementById('mensajeFormulario').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 100);
    
    return;
  }
  
  // Desactivar botón para evitar doble envío
  btnEnviar.disabled = true;
  btnEnviar.textContent = '⏳ Enviando...';
  btnEnviar.style.opacity = '0.6';
  btnEnviar.style.cursor = 'not-allowed';
  
  mostrarCargando('mensajeFormulario');
  
  // NUEVO: Verificar si el instructor seleccionado ya fue usado en los últimos 90 minutos
  const instructorSeleccionado = document.getElementById('instructor').value;
  
  const verificacion = await verificarRegistroRecenteConInstructor(datosEstudiante.documento, instructorSeleccionado);
  
 if (!verificacion.puedeRegistrar) {
    const mensajeElement = document.getElementById('mensajeFormulario');
    
    mostrarMensaje('mensajeFormulario', 
      `Ya tienes una tutoría reciente con este tutor. Podrás registrar otra en ${verificacion.tiempoRestante}, o puedes realizarla con otro tutor si lo prefieres.`, 
      'error');
    
    // Reactivar botón
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar Formulario';
    btnEnviar.style.opacity = '1';
    btnEnviar.style.cursor = 'pointer';
    
    setTimeout(() => {
      mensajeElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 100);
    
    return;
  }

  // Obtener asignatura (puede ser personalizada)
  let asignatura = document.getElementById('asignatura').value;
  if (asignatura === 'Otra') {
    asignatura = document.getElementById('otraAsignatura').value.trim().toUpperCase();
    if (!asignatura) {
      mostrarMensaje('mensajeFormulario', 'Por favor especifique la asignatura', 'error');
      btnEnviar.disabled = false;
      btnEnviar.textContent = 'Enviar Formulario';
      btnEnviar.style.opacity = '1';
      btnEnviar.style.cursor = 'pointer';
      return;
    }
  }

  // Obtener tema (puede ser personalizado)
const selectTema = document.getElementById('tema');
const inputTema = document.getElementById('otroTema');
let tema = '';

// Caso 1: Select visible y con valor "Otro"
if (selectTema.value === 'Otro') {
  tema = inputTema.value.trim().toUpperCase();
  if (!tema) {
    mostrarMensaje('mensajeFormulario', 'Por favor especifique el tema', 'error');
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar Formulario';
    btnEnviar.style.opacity = '1';
    btnEnviar.style.cursor = 'pointer';
    return;
  }
}
// Caso 2: Select oculto (no hay temas en BD o asignatura es "Otra")
else if (selectTema.style.display === 'none') {
  tema = inputTema.value.trim().toUpperCase();
  if (!tema) {
    mostrarMensaje('mensajeFormulario', 'Por favor ingrese el tema de la tutoría', 'error');
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar Formulario';
    btnEnviar.style.opacity = '1';
    btnEnviar.style.cursor = 'pointer';
    return;
  }
}
// Caso 3: Select visible con tema normal seleccionado
else {
  tema = selectTema.value;
}

  const tipoAcompanamiento = document.getElementById('tipoAcompanamiento').value;
  const tituloCurso = tipoAcompanamiento === 'Curso y/o capacitación' 
    ? document.getElementById('tituloCurso').value.toUpperCase() 
    : null;
  
  // Obtener fecha y hora actual en Colombia (UTC-5)
  const ahora = new Date();
  const fechaColombia = new Date(ahora.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
  const fechaISO = fechaColombia.toISOString();
  
  // Obtener el valor de facultad_departamento (puede estar vacío si es tutor)
  const facultadDepartamentoValue = document.getElementById('facultadDepartamento').value || null;
  
const datos = {
    documento: datosEstudiante.documento,
    nombres: datosEstudiante.nombres,
    apellidos: datosEstudiante.apellidos,
    facultad: datosEstudiante.facultad,
    programa: datosEstudiante.programa,
    semestre: datosEstudiante.semestre,
    grupo: datosEstudiante.grupo,
    tipo_acompanamiento: tipoAcompanamiento,
    titulo_curso: tituloCurso,
    sede_estudiante: datosEstudiante.sede,
    sede_tutoria: document.getElementById('sedeTutoria').value,
    tipo_instructor: document.getElementById('tipoInstructor').value,
    facultad_departamento: facultadDepartamentoValue,
    instructor: instructorSeleccionado,
    asignatura: asignatura,
    tema: tema,
    motivo_consulta: document.getElementById('motivoConsulta').value,
    calificacion: parseInt(calificacionRadio.value),
    dudas_resueltas: parseInt(dudasResueltasRadio.value),
    dominio_tema: parseInt(dominioTemaRadio.value),
    ambiente: parseInt(ambienteRadio.value),
    recomienda_pma: parseInt(recomendaPmaRadio.value),
    sugerencias: document.getElementById('sugerencias').value.toUpperCase() || 'Ninguna',
    fecha: fechaISO
  };

  try {
    await supabaseInsert('formularios', datos);
    
    document.getElementById('mensajeFormulario').innerHTML = '';
    
    const modal = document.getElementById('modalExitoFormulario');
    modal.style.display = 'flex';
    modal.classList.remove('hidden');
    
    document.getElementById('formTutoria').reset();
    document.getElementById('grupoTituloCurso').classList.add('hidden');
    document.getElementById('grupoFacultadDepartamento').classList.add('hidden');
    document.getElementById('grupoInstructor').classList.add('hidden');
    document.getElementById('grupoMateria').classList.add('hidden');
    document.getElementById('grupoTema').classList.add('hidden');
    document.getElementById('grupoCalificacion').classList.add('hidden');
    document.getElementById('grupoMotivo').classList.add('hidden');
    document.getElementById('grupoSugerencias').classList.add('hidden');
    document.getElementById('btnEnviar').classList.add('hidden');
    formularioEnviandose = false;
    
    setTimeout(() => {
      location.reload(); // Recargar página para limpiar todo
    }, 3000);
  } catch (error) {
    mostrarMensaje('mensajeFormulario', error.message, 'error');
    // Reactivar botón si hay error
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar Formulario';
    btnEnviar.style.opacity = '1';
    btnEnviar.style.cursor = 'pointer';
  }
}

// ===================================
// ACTUALIZACIÓN DE DATOS SEMESTRALES
// ===================================

// ⏱️ CONFIGURACIÓN TEMPORAL PARA PRUEBAS: 2 MINUTOS
// 📅 Para cambiar a fechas específicas, ver instrucciones al final del archivo
function verificarActualizacionSemestral(estudiante) {
  // Si no hay fecha de última actualización, usar fecha de creación o considerar que necesita actualizar
  if (!estudiante.fecha_actualizacion && !estudiante.created_at) {
    console.log('⚠️ No hay fecha de actualización ni creación, pidiendo actualización');
    return true; // Primera vez, pedir actualización
  }
  
  // 🕐 USAR HORA DE COLOMBIA PARA TODO EL CÁLCULO
const ultimaActualizacion = estudiante.fecha_actualizacion 
  ? new Date(estudiante.fecha_actualizacion) 
  : new Date(estudiante.created_at);

const ahoraColombia = new Date(Date.now() - (5 * 60 * 60 * 1000));
const ultimaActualizacionColombia = new Date(ultimaActualizacion.getTime() - (5 * 60 * 60 * 1000));
  
  // ⏱️ PARA PRUEBAS: 2 MINUTOS (120 segundos)
  const segundosTranscurridos = (ahoraColombia - ultimaActualizacionColombia) / 1000;
  const LIMITE_SEGUNDOS = 120; // 2 minutos
  
  console.log('🕐 Última actualización (Colombia):', ultimaActualizacionColombia.toLocaleString('es-CO'));
  console.log('🕐 Ahora (Colombia):', ahoraColombia.toLocaleString('es-CO'));
  console.log(`🕐 Tiempo transcurrido: ${Math.floor(segundosTranscurridos)} segundos de ${LIMITE_SEGUNDOS}`);
  console.log(`🕐 ¿Necesita actualizar? ${segundosTranscurridos > LIMITE_SEGUNDOS ? 'SÍ' : 'NO'}`);
  
  return segundosTranscurridos > LIMITE_SEGUNDOS;
  
  // 📅 PARA PRODUCCIÓN: DESCOMENTAR ESTAS LÍNEAS Y COMENTAR LAS DE ARRIBA
  /*
  const mesesTranscurridos = (ahoraColombia - ultimaActualizacionColombia) / (1000 * 60 * 60 * 24 * 30);
  const LIMITE_MESES = 4; // 4 meses
  
  console.log('🕐 Última actualización (Colombia):', ultimaActualizacionColombia.toLocaleString('es-CO'));
  console.log('🕐 Ahora (Colombia):', ahoraColombia.toLocaleString('es-CO'));
  console.log(`📅 Meses transcurridos: ${mesesTranscurridos.toFixed(1)} de ${LIMITE_MESES}`);
  console.log(`📅 ¿Necesita actualizar? ${mesesTranscurridos > LIMITE_MESES ? 'SÍ' : 'NO'}`);
  
  return mesesTranscurridos > LIMITE_MESES;
  */
}

function mostrarFormularioActualizacion(estudiante) {
  mostrarPantalla('pantallaActualizacion');
  document.getElementById('mensajeActualizacion').innerHTML = '';
  
  // Pre-llenar con datos actuales (SOLO semestre y grupo)
  document.getElementById('actualizarSemestre').value = estudiante.semestre || '';
  document.getElementById('actualizarGrupo').value = estudiante.grupo || '';
  
  // Mostrar nombre censurado
  const nombres = `${estudiante.primer_nombre} ${estudiante.segundo_nombre || ''}`.trim();
  const apellidos = `${estudiante.primer_apellido} ${estudiante.segundo_apellido}`.trim();
  const nombreCompleto = `${nombres} ${apellidos}`;
  document.getElementById('nombreEstudianteActualizacion').textContent = censurarNombre(nombreCompleto);
}

async function actualizarDatosEstudiante(event) {
  event.preventDefault();
  
  if (!estudianteActualizando) {
    mostrarMensaje('mensajeActualizacion', 'Error: No se encontró el estudiante', 'error');
    return;
  }
  
  const nuevoSemestre = parseInt(document.getElementById('actualizarSemestre').value);
  const nuevoGrupo = document.getElementById('actualizarGrupo').value.toUpperCase().trim();
  
  if (!nuevoSemestre || !nuevoGrupo) {
    mostrarMensaje('mensajeActualizacion', 'Por favor complete todos los campos', 'error');
    return;
  }
  
  mostrarCargando('mensajeActualizacion');
  
  try {
    // Fecha en Colombia (UTC-5)
    const fechaColombiaISO = new Date(Date.now() - (5 * 60 * 60 * 1000)).toISOString();
    
    // Actualizar en Supabase
    const url = `${SUPABASE_URL}/rest/v1/estudiantes?documento=eq.${estudianteActualizando.documento}`;
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        semestre: nuevoSemestre,
        grupo: nuevoGrupo,
        fecha_actualizacion: fechaColombiaISO
      })
    });
    
    if (!response.ok) {
      throw new Error('Error al actualizar en la base de datos');
    }
    
    const resultado = await response.json();
    console.log('✅ Datos actualizados:', resultado);
    
    // Continuar con el login
    const nombres = `${estudianteActualizando.primer_nombre} ${estudianteActualizando.segundo_nombre || ''}`.trim();
    const apellidos = `${estudianteActualizando.primer_apellido} ${estudianteActualizando.segundo_apellido}`.trim();
    const nombreCompleto = `${nombres} ${apellidos}`;
    
    datosEstudiante = {
      documento: estudianteActualizando.documento,
      nombres: nombres,
      apellidos: apellidos,
      nombreCensurado: censurarNombre(nombreCompleto),
      facultad: estudianteActualizando.facultad,
      programa: estudianteActualizando.programa,
      sede: estudianteActualizando.sede,
      semestre: nuevoSemestre,
      grupo: nuevoGrupo
    };
    
    formularioEnviandose = false;
    mostrarPantalla('pantallaFormulario');
    document.getElementById('nombreUsuario').textContent = 'Bienvenido(a): ' + datosEstudiante.nombreCensurado;
    document.getElementById('mensajeFormulario').innerHTML = '';
    actualizarBotonCerrarSesion();
    actualizarProgreso(1);
    
  } catch (error) {
    console.error('❌ Error:', error);
    mostrarMensaje('mensajeActualizacion', 'Error al actualizar: ' + error.message, 'error');
  }
}
function cerrarSesion() {
  datosEstudiante = null;
  instructorActual = null;
  formularioEnviandose = false;
  
  // REACTIVAR BOTÓN DE ENVIAR
  const btnEnviar = document.getElementById('btnEnviar');
  if (btnEnviar) {
    btnEnviar.disabled = false;
    btnEnviar.textContent = 'Enviar Formulario';
    btnEnviar.style.opacity = '1';
    btnEnviar.style.cursor = 'pointer';
  }
  
  // Resetear paginación
  paginaFormularioActual = 1;
  document.getElementById('paginaFormulario1').classList.remove('hidden');
  document.getElementById('paginaFormulario2').classList.add('hidden');
  document.getElementById('btnEnviar').classList.add('hidden');
  
  document.querySelectorAll('.progress-step').forEach(step => {
    step.classList.remove('active', 'completed');
  });
  
  const primerPaso = document.getElementById('step1');
  if (primerPaso) {
    primerPaso.classList.add('active');
  }
  
  // Recargar la página para limpiar todo
  setTimeout(() => {
    location.reload();
  }, 300);
}

// ===================================
// ADMINISTRADOR
// ===================================
async function loginAdmin(event) {
  event.preventDefault();
  mostrarCargando('mensajeAdminLogin');

  const documento = document.getElementById('adminDocumento').value;
  const contrasena = document.getElementById('adminContrasena').value;

  try {
    const data = await supabaseQuery('administradores', {
      eq: { field: 'documento', value: documento }
    });

    // Verificar que el documento existe Y que la contraseña coincida
    if (data.length === 0 || data[0].contra !== contrasena) {
      mostrarMensaje('mensajeAdminLogin', 'Acceso denegado.', 'error');
      return;
    }

    document.getElementById('nombreAdmin').textContent = 'Administrador: ' + data[0].nombre;
    mostrarPantalla('pantallaAdmin');
    // Ya NO cargamos estadísticas aquí, se cargan cuando el admin hace clic
  } catch (error) {
    mostrarMensaje('mensajeAdminLogin', 'Error de conexión: ' + error.message, 'error');
  }
}

async function cambiarTab(event, tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  document.getElementById('tabEstadisticas').classList.add('hidden');
  document.getElementById('tabGraficas').classList.add('hidden');
  document.getElementById('tabNotificaciones').classList.add('hidden');
  document.getElementById('tabDescargas').classList.add('hidden');
  
  if (tab === 'estadisticas') {
    document.getElementById('tabEstadisticas').classList.remove('hidden');
    
    // CARGAR DATOS DE ESTADÍSTICAS
    if (datosCache.tutoresNorte.length === 0) {
      document.getElementById('statsGrid').innerHTML = '<div class="loader"></div><p style="text-align: center; color: #666; margin-top: 15px;">Cargando datos...</p>';
      try {
        await precargarDatosEstadisticas();
      } catch (error) {
        document.getElementById('statsGrid').innerHTML = '<p style="text-align: center; color: #dc3545;">Error al cargar datos. Por favor intenta de nuevo.</p>';
        return;
      }
    }
    
    // Cargar estadísticas si no existen
    if (!window.datosFormulariosGlobal) {
      await cargarEstadisticas();
    }
    
  } else if (tab === 'graficas') {
    document.getElementById('tabGraficas').classList.remove('hidden');
    
    // CARGAR DATOS PARA GRÁFICAS (solo necesita formularios)
    if (!window.datosFormulariosGlobal) {
      const container = document.querySelector('#tabGraficas .chart-container');
      const contenidoOriginal = container.innerHTML;
      container.innerHTML = '<div class="loader"></div><p style="text-align: center; color: #666; margin-top: 15px;">Cargando datos para gráficas...</p>';
      
      try {
        const data = await supabaseQuery('formularios');
        window.datosFormulariosGlobal = data;
        container.innerHTML = contenidoOriginal;
      } catch (error) {
        container.innerHTML = '<p style="text-align: center; color: #dc3545;">Error al cargar datos. Por favor intenta de nuevo.</p>';
        return;
      }
    }
    
    // Crear/actualizar gráfica
    if (!graficoTutorias) {
      actualizarGrafica();
    }
    
  } else if (tab === 'notificaciones') {
    document.getElementById('tabNotificaciones').classList.remove('hidden');
    
  } else if (tab === 'descargas') {
    document.getElementById('tabDescargas').classList.remove('hidden');
  }
}

// ===================================
// ACTUALIZAR ESTADÍSTICAS
// ===================================
async function actualizarEstadisticas() {
  const btnActualizar = document.querySelector('.btn-actualizar');
  
  // Deshabilitar botón mientras carga
  btnActualizar.disabled = true;
  btnActualizar.style.opacity = '0.6';
  
  try {
    await cargarEstadisticas();
    
    // Cambiar a check
    btnActualizar.textContent = '✓';
    
    // Volver al icono original después de 1.5 segundos
    setTimeout(() => {
      btnActualizar.textContent = '🔄';
    }, 1500);
    
  } catch (error) {
    console.error('Error actualizando estadísticas:', error);
    
    // Mostrar X en caso de error
    btnActualizar.textContent = '✗';
    
    setTimeout(() => {
      btnActualizar.textContent = '🔄';
    }, 1500);
  } finally {
    btnActualizar.disabled = false;
    btnActualizar.style.opacity = '1';
  }
}


async function cargarEstadisticas() {
  // Mostrar loader mientras carga
  document.getElementById('statsGrid').innerHTML = '<div class="loader"></div><p style="text-align: center; color: #666; margin-top: 15px;">Cargando estadísticas...</p>';
  document.getElementById('detallesStats').innerHTML = '';
  
  try {
    const data = await supabaseQuery('formularios');

    if (data.length === 0) {
      document.getElementById('statsGrid').innerHTML = '<p style="text-align: center; color: #666;">No hay datos disponibles aún.</p>';
      return;
    }

    // Crear HTML con estructura correcta
    const contenidoHTML = `
      <div class="estadisticas-menu-wrapper">
        <button class="btn btn-sede activo" onclick="mostrarEstadisticas('general', this)">
          General
        </button>
        <button class="btn btn-sede" onclick="mostrarEstadisticas('tutores', this)">
          Tutores
        </button>
        <button class="btn btn-sede" onclick="mostrarEstadisticas('profesores', this)">
          Profesores
        </button>
      </div>
      <div id="contenidoEstadisticas"></div>
    `;

    document.getElementById('statsGrid').innerHTML = contenidoHTML;
    document.getElementById('detallesStats').innerHTML = '';

    // Guardar datos globalmente para uso posterior
    window.datosFormulariosGlobal = data;

    // Mostrar estadísticas generales por defecto
    mostrarEstadisticas('general');

  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    document.getElementById('statsGrid').innerHTML = '<p style="text-align: center; color: #dc3545;">Error al cargar estadísticas. Por favor intenta de nuevo.</p>';
  }

  const ahora = new Date().toLocaleString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  document.getElementById('statsGrid').insertAdjacentHTML('afterbegin', 
    `<p style="text-align: right; color: #666; font-size: 12px;">
      Última actualización: ${ahora}
    </p>`
  );
}


function mostrarEstadisticas(tipo, botonClickeado) {
  // Remover clase activo de todos los botones
  document.querySelectorAll('.estadisticas-menu-wrapper .btn-sede').forEach(btn => {
    btn.classList.remove('activo');
  });
  
  // Agregar clase activo al botón clickeado (si existe)
  if (botonClickeado) {
    botonClickeado.classList.add('activo');
  } else {
    // Si se llama sin botón (carga inicial), activar el botón de General
    const btnGeneral = document.querySelector('.estadisticas-menu-wrapper .btn-sede');
    if (btnGeneral) btnGeneral.classList.add('activo');
  }
  
  const data = window.datosFormulariosGlobal;
  
  let datosFiltrados;
  
  if (tipo === 'tutores') {
    datosFiltrados = data.filter(item => item.tipo_instructor === 'Tutor');
  } else if (tipo === 'profesores') {
    datosFiltrados = data.filter(item => item.tipo_instructor === 'Profesor');
  } else {
    // General: todos los datos
    datosFiltrados = data;
  }

  if (datosFiltrados.length === 0) {
    document.getElementById('contenidoEstadisticas').innerHTML = `<p style="text-align: center; color: #666;">No hay datos de ${tipo} disponibles aún.</p>`;
    document.getElementById('detallesStats').innerHTML = '';
    return;
  }

  const stats = {
    total: datosFiltrados.length,
    instructoresPorSede: { Norte: {}, Sur: {} },
    sedesTutorias: {},
    calificacionesPorInstructor: {},
    facultadDepartamento: {},
    sumaCalificacionesTotal: 0
  };

  datosFiltrados.forEach(item => {
    const sede = item.sede_tutoria;
    const instructor = item.instructor;
    
    if (!stats.instructoresPorSede[sede]) {
      stats.instructoresPorSede[sede] = {};
    }
    stats.instructoresPorSede[sede][instructor] = (stats.instructoresPorSede[sede][instructor] || 0) + 1;

    stats.sedesTutorias[sede] = (stats.sedesTutorias[sede] || 0) + 1;

    // NUEVO CÁLCULO: Promedio de 3 preguntas por tutoría
    const calificacionTutoria = item.calificacion || 0;
    const dudasResueltas = item.dudas_resueltas || 0;
    const dominioTema = item.dominio_tema || 0;
    
    const promedioTutoria = (calificacionTutoria + dudasResueltas + dominioTema) / 3;
    
    if (!stats.calificacionesPorInstructor[instructor]) {
      stats.calificacionesPorInstructor[instructor] = { suma: 0, cantidad: 0 };
    }
    stats.calificacionesPorInstructor[instructor].suma += promedioTutoria;
    stats.calificacionesPorInstructor[instructor].cantidad += 1;

    stats.sumaCalificacionesTotal += promedioTutoria;

    // Para profesores: contar por facultad/departamento
    if (tipo === 'profesores' && item.facultad_departamento) {
      stats.facultadDepartamento[item.facultad_departamento] = (stats.facultadDepartamento[item.facultad_departamento] || 0) + 1;
    }
  });

  const promedioCalificacion = (stats.sumaCalificacionesTotal / stats.total).toFixed(2);

  const promediosPorInstructor = {};
  Object.keys(stats.calificacionesPorInstructor).forEach(instructor => {
    const info = stats.calificacionesPorInstructor[instructor];
    promediosPorInstructor[instructor] = (info.suma / info.cantidad).toFixed(2);
  });

  // Encontrar el mejor instructor con mejor promedio
  let mejorInstructor = { nombre: '', promedio: 0, cantidad: 0 };
  
  Object.keys(stats.calificacionesPorInstructor).forEach(instructor => {
    const info = stats.calificacionesPorInstructor[instructor];
    const promedio = parseFloat((info.suma / info.cantidad).toFixed(2));
    
    if (promedio > mejorInstructor.promedio || 
       (promedio === mejorInstructor.promedio && info.cantidad > mejorInstructor.cantidad)) {
      mejorInstructor = { 
        nombre: instructor, 
        promedio: promedio.toFixed(2),
        cantidad: info.cantidad
      };
    }
  });

  const grid = document.getElementById('contenidoEstadisticas');
  
  // GENERAL: 4 cards (agregando Beneficiados)
  if (tipo === 'general') {
    // Calcular estudiantes únicos (beneficiados)
    const estudiantesUnicos = new Set(datosFiltrados.map(item => item.documento));
    const cantidadBeneficiados = estudiantesUnicos.size;
    
    grid.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>${stats.total}</h3>
          <p>Total de Registros</p>
        </div>
        <div class="stat-card">
          <h3>${cantidadBeneficiados}</h3>
          <p>Beneficiados</p>
        </div>
        <div class="stat-card">
          <h3>${promedioCalificacion}</h3>
          <p>Calificación Promedio</p>
        </div>
        <div class="stat-card">
          <h3>${mejorInstructor.nombre}</h3>
          <p>Mejor Calificación (${mejorInstructor.promedio})</p>
        </div>
      </div>
    `;
    document.getElementById('detallesStats').innerHTML = '';
    return;
  }

  // TUTORES y PROFESORES: Cards completos
  const tituloTipo = tipo === 'tutores' ? 'Tutorías' : 'Asesorías con Profesores';

  grid.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <h3>${stats.total}</h3>
        <p>Total ${tituloTipo}</p>
      </div>
      <div class="stat-card">
        <h3>${promedioCalificacion}</h3>
        <p>Calificación Promedio</p>
      </div>
      <div class="stat-card">
        <h3>${mejorInstructor.nombre}</h3>
        <p>Mejor Calificación (${mejorInstructor.promedio})</p>
      </div>
    </div>
  `;

  let detalles = '';


// TUTORES: Mostrar por sede
  if (tipo === 'tutores') {
    detalles += '<div class="chart-container"><h3 class="chart-title">Cantidad de Tutorías por Sede</h3>';
    Object.entries(stats.sedesTutorias).forEach(([sede, cantidad]) => {
      const porcentaje = ((cantidad / stats.total) * 100).toFixed(1);
      detalles += `<div class="list-item"><span>${sede}</span><strong>${cantidad} (${porcentaje}%)</strong></div>`;
    });
    detalles += '</div>';

    // Contar tutorías totales por instructor (sin importar dónde las dio)
    const tutoriasPorInstructor = {};
    datosFiltrados.forEach(item => {
      const instructor = item.instructor;
      tutoriasPorInstructor[instructor] = (tutoriasPorInstructor[instructor] || 0) + 1;
    });

    // Agrupar tutores por SEDE DE ORIGEN (tabla donde están registrados)
    // Si un tutor está en ambas tablas, aparece en ambas sedes con el mismo total
    const tutoresPorSedeOrigen = { Norte: {}, Sur: {} };
    
    // Verificar si los datos están cargados
    if (datosCache.tutoresNorte.length > 0 && datosCache.tutoresSur.length > 0) {
      Object.keys(tutoriasPorInstructor).forEach(instructor => {
        const cantidadTotal = tutoriasPorInstructor[instructor];
        
        // Verificar en qué tabla de ORIGEN está el tutor
        const esTutorNorte = datosCache.tutoresNorte.some(t => t.nombre === instructor);
        const esTutorSur = datosCache.tutoresSur.some(t => t.nombre === instructor);
        
        // Agregar a las sedes de origen con el TOTAL de tutorías
        if (esTutorNorte) {
          tutoresPorSedeOrigen.Norte[instructor] = cantidadTotal;
        }
        if (esTutorSur) {
          tutoresPorSedeOrigen.Sur[instructor] = cantidadTotal;
        }
      });
    }

    detalles += `<div class="chart-container">
      <h3 class="chart-title">Cantidad de Tutorías por Tutor</h3>
      
      <div class="botones-sedes">
        <button class="btn btn-secondary btn-sede" onclick="toggleInstructoresSede('norte')">
          Sede Norte
        </button>
        <button class="btn btn-secondary btn-sede" onclick="toggleInstructoresSede('sur')">
          Sede Sur
        </button>
      </div>

      <div id="instructoresNorteAdmin" class="horario-info hidden">
        <h4 class="horario-titulo">Tutores de Sede Norte</h4>`;
    
    const instructoresNorte = Object.entries(tutoresPorSedeOrigen.Norte)
      .sort((a, b) => b[1] - a[1]); // Ordenar de mayor a menor cantidad
    
    if (instructoresNorte.length > 0) {
      instructoresNorte.forEach(([instructor, cantidad]) => {
        const promedio = promediosPorInstructor[instructor] || 'N/A';
        detalles += `<div class="list-item">
          <span>${instructor}</span>
          <strong>${cantidad} tutoría${cantidad !== 1 ? 's' : ''}<br><span style="font-size: 12px; font-weight: normal;">Calificación: ${promedio}</span></strong>
        </div>`;
      });
    } else {
      detalles += '<p style="text-align: center; color: #666;">No hay tutores registrados en Sede Norte</p>';
    }
    
    detalles += `</div>

      <div id="instructoresSurAdmin" class="horario-info hidden">
        <h4 class="horario-titulo">Tutores de Sede Sur</h4>`;
    
    const instructoresSur = Object.entries(tutoresPorSedeOrigen.Sur)
      .sort((a, b) => b[1] - a[1]); // Ordenar de mayor a menor cantidad
    
    if (instructoresSur.length > 0) {
      instructoresSur.forEach(([instructor, cantidad]) => {
        const promedio = promediosPorInstructor[instructor] || 'N/A';
        detalles += `<div class="list-item">
          <span>${instructor}</span>
          <strong>${cantidad} tutoría${cantidad !== 1 ? 's' : ''}<br><span style="font-size: 12px; font-weight: normal;">Calificación: ${promedio}</span></strong>
        </div>`;
      });
    } else {
      detalles += '<p style="text-align: center; color: #666;">No hay tutores registrados en Sede Sur</p>';
    }
    
    detalles += '</div></div>';
  }

  
  
  // PROFESORES: Mostrar por facultad/departamento con profesores agrupados
if (tipo === 'profesores') {
  detalles += '<div class="chart-container"><h3 class="chart-title">Cantidad de Asesorías por Facultad/Departamento</h3>';
  
  const facultadesOrdenadas = Object.entries(stats.facultadDepartamento)
    .sort((a, b) => b[1] - a[1]);
  
  if (facultadesOrdenadas.length > 0) {
    facultadesOrdenadas.forEach(([facultad, cantidad]) => {
      const nombreCompleto = obtenerNombreFacultad(facultad);
      const porcentaje = ((cantidad / stats.total) * 100).toFixed(1);
      detalles += `<div class="list-item"><span>${nombreCompleto}</span><strong>${cantidad} (${porcentaje}%)</strong></div>`;
    });
  } else {
    detalles += '<p style="text-align: center; color: #666;">No hay datos por facultad</p>';
  }
  
  detalles += '</div>';

  // Cantidad de Asesorías por Profesor agrupados por Facultad/Departamento
  detalles += `<div class="chart-container">
    <h3 class="chart-title">Cantidad de Asesorías por Profesor</h3>`;

  // Agrupar profesores por facultad/departamento
  const profesoresPorFacultad = {};
  
  datosFiltrados.forEach(item => {
    const facultad = item.facultad_departamento || 'Sin Facultad';
    const profesor = item.instructor;
    
    if (!profesoresPorFacultad[facultad]) {
      profesoresPorFacultad[facultad] = {};
    }
    
    profesoresPorFacultad[facultad][profesor] = (profesoresPorFacultad[facultad][profesor] || 0) + 1;
  });

  const facultadesConProfesores = Object.keys(profesoresPorFacultad).sort();
  
  // Crear botones para cada facultad/departamento
  if (facultadesConProfesores.length > 0) {
    detalles += '<div class="botones-sedes">';
    
    facultadesConProfesores.forEach(facultad => {
      const facultadId = facultad.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const nombreCompleto = obtenerNombreFacultad(facultad);
      const facultadCorta = nombreCompleto.replace('Facultad de ', '').replace('Departamento de ', '');
      detalles += `
        <button class="btn btn-secondary btn-sede" onclick="toggleProfesoresFacultad('${facultadId}')">
          ${facultadCorta}
        </button>`;
    });
    
    detalles += '</div>';

    // Crear secciones ocultas para cada facultad con sus profesores
    facultadesConProfesores.forEach(facultad => {
      const facultadId = facultad.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const profesores = profesoresPorFacultad[facultad];
      const profesoresOrdenados = Object.entries(profesores).sort((a, b) => b[1] - a[1]);
      
      const nombreCompletoTitulo = obtenerNombreFacultad(facultad);
      detalles += `
        <div id="profesores${facultadId}" class="horario-info hidden">
          <h4 class="horario-titulo">${nombreCompletoTitulo}</h4>`;
      
      if (profesoresOrdenados.length > 0) {
        profesoresOrdenados.forEach(([profesor, cantidad]) => {
          const promedio = promediosPorInstructor[profesor] || 'N/A';
          detalles += `<div class="list-item">
            <span>${profesor}</span>
            <strong>${cantidad} asesorías<br><span style="font-size: 12px; font-weight: normal;">Calificación: ${promedio}</span></strong>
          </div>`;
        });
      } else {
        detalles += '<p style="text-align: center; color: #666;">No hay profesores en esta facultad</p>';
      }
      
      detalles += '</div>';
    });
  } else {
    detalles += '<p style="text-align: center; color: #666;">No hay datos de profesores disponibles</p>';
  }
  
  detalles += '</div>';
}

  document.getElementById('detallesStats').innerHTML = detalles;
}


// ===================================
// DESCARGAR DATOS
// ===================================
async function descargarDatos() {
  const desde = document.getElementById('fechaDesde').value;
  const hasta = document.getElementById('fechaHasta').value;

  if (!desde || !hasta) {
    alert('Por favor seleccione ambas fechas');
    return;
  }

  if (new Date(desde) > new Date(hasta)) {
    alert('La fecha inicial no puede ser mayor que la fecha final');
    return;
  }

  const btnDescarga = event.target;
  const textoOriginal = btnDescarga.textContent;
  btnDescarga.disabled = true;
  btnDescarga.textContent = '⏳ Preparando descarga...';

  try {
    // CARGAR DATOS SOLO CUANDO SE VA A DESCARGAR
    let url = `${SUPABASE_URL}/rest/v1/formularios?fecha=gte.${desde}T00:00:00&fecha=lte.${hasta}T23:59:59&order=fecha.asc`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    const data = await response.json();
    const datosTutores = data.filter(item => item.tipo_instructor === 'Tutor');
    
    if (datosTutores.length === 0) {
      alert('No hay registros de tutores en el rango de fechas seleccionado');
      return;
    }

    generarExcelSimplificado(datosTutores, `PMA_Tutores_${desde}_a_${hasta}`);
    alert(`${datosTutores.length} registros de tutores descargados exitosamente`);
  } catch (error) {
    alert('Error al descargar datos: ' + error.message);
  } finally {
    btnDescarga.disabled = false;
    btnDescarga.textContent = textoOriginal;
  }
}

async function descargarTodo() {
  if (!confirm('¿Descargar todos los registros?')) {
    return;
  }

  const btnDescarga = event.target;
  const textoOriginal = btnDescarga.textContent;
  btnDescarga.disabled = true;
  btnDescarga.textContent = '⏳ Preparando descarga completa...';

  try {
    // CARGAR TODOS LOS DATOS SOLO CUANDO SE VA A DESCARGAR
    const data = await supabaseQuery('formularios', { order: 'fecha.asc' });
    
    if (data.length === 0) {
      alert('No hay registros para descargar');
      return;
    }

    generarExcelCompleto(data, 'PMA_Completo');
    alert(`${data.length} registros descargados exitosamente`);
  } catch (error) {
    alert('Error al descargar datos: ' + error.message);
  } finally {
    btnDescarga.disabled = false;
    btnDescarga.textContent = textoOriginal;
  }
}


async function descargarDocentes() {
  const desde = document.getElementById('fechaDesde').value;
  const hasta = document.getElementById('fechaHasta').value;

  if (!desde || !hasta) {
    alert('Por favor seleccione ambas fechas');
    return;
  }

  if (new Date(desde) > new Date(hasta)) {
    alert('La fecha inicial no puede ser mayor que la fecha final');
    return;
  }

  const btnDescarga = event.target;
  const textoOriginal = btnDescarga.textContent;
  btnDescarga.disabled = true;
  btnDescarga.textContent = '⏳ Preparando descarga...';

  try {
    // CARGAR DATOS SOLO CUANDO SE VA A DESCARGAR
    let url = `${SUPABASE_URL}/rest/v1/formularios?fecha=gte.${desde}T00:00:00&fecha=lte.${hasta}T23:59:59&order=fecha.asc`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    const data = await response.json();
    const datosDocentes = data.filter(item => item.tipo_instructor === 'Profesor');
    
    if (datosDocentes.length === 0) {
      alert('No hay registros de docentes en el rango de fechas seleccionado');
      return;
    }

    generarExcelDocentes(datosDocentes, `PMA_Docentes_${desde}_a_${hasta}`);
    alert(`${datosDocentes.length} registros de docentes descargados exitosamente`);
  } catch (error) {
    alert('Error al descargar datos: ' + error.message);
  } finally {
    btnDescarga.disabled = false;
    btnDescarga.textContent = textoOriginal;
  }
}


function generarExcelSimplificado(datos, nombreArchivo) {
  const datosExcel = datos.map(fila => {
    // Convertir fecha UTC a hora de Colombia
    const fechaUTC = new Date(fila.fecha);
    const fechaColombia = new Date(fechaUTC.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    
    const horas = String(fechaColombia.getHours()).padStart(2, '0');
    const minutos = String(fechaColombia.getMinutes()).padStart(2, '0');
    const horaFormateada = `${horas}:${minutos}`;
    
    // Convertir Date a número de serie de Excel
    const serialDate = (fechaColombia - new Date(1899, 11, 30)) / (86400000);
    return {
      'Fecha': serialDate,
      'Hora': horaFormateada,
      'Documento': parseInt(fila.documento),
      'Nombres': fila.nombres,
      'Apellidos': fila.apellidos,
      'Programa': fila.programa,
      'Instructor': fila.instructor,
      'Asignatura': fila.asignatura,
      'Tema': fila.tema
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosExcel);

  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Aplicar formato de fecha DD/MM/YYYY a la columna Fecha
  for (let row = 1; row <= range.e.r; row++) {
    const fechaCell = XLSX.utils.encode_cell({ r: row, c: 0 }); // Columna Fecha
    if (ws[fechaCell] && row > 0) {
      ws[fechaCell].t = 'n'; // Tipo numérico (Excel maneja fechas como números)
      ws[fechaCell].z = 'dd/mm/yyyy'; // Formato día/mes/año
    }
  }
  
  // Aplicar formato a documento como número
  for (let row = 1; row <= range.e.r; row++) {
    const docCell = XLSX.utils.encode_cell({ r: row, c: 2 }); // Columna Documento
    if (ws[docCell] && row > 0) {
      ws[docCell].t = 'n'; // Tipo numérico
      ws[docCell].z = '0'; // Formato sin decimales
    }
  }

  ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

  ws['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 20 }, { wch: 20 },
    { wch: 35 }, { wch: 25 }, { wch: 30 }, { wch: 30 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Tutores");

  const fechaHoy = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${nombreArchivo}_${fechaHoy}.xlsx`);
}

function generarExcelCompleto(datos, nombreArchivo) {
  const datosExcel = datos.map(fila => {
    // Convertir fecha UTC a hora de Colombia
    const fechaUTC = new Date(fila.fecha);
    const fechaColombia = new Date(fechaUTC.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    
    const horas = String(fechaColombia.getHours()).padStart(2, '0');
    const minutos = String(fechaColombia.getMinutes()).padStart(2, '0');
    const horaFormateada = `${horas}:${minutos}`;
    
    // Convertir Date a número de serie de Excel
    const serialDate = (fechaColombia - new Date(1899, 11, 30)) / (86400000);
    
    return {
      'Fecha': serialDate,
      'Hora': horaFormateada,
      'Documento': parseInt(fila.documento),
      'Nombres': fila.nombres,
      'Apellidos': fila.apellidos,
      'Facultad': fila.facultad,
      'Programa': fila.programa,
      'Semestre': fila.semestre,
      'Grupo': fila.grupo,
      'Tipo Acompañamiento': fila.tipo_acompanamiento || 'Tutoría',
      'Título Curso': fila.titulo_curso || '',
      'Sede Estudiante': fila.sede_estudiante || '',
      'Sede Tutoría': fila.sede_tutoria,
      'Tipo Instructor': fila.tipo_instructor,
      'Facultad/Departamento': fila.facultad_departamento || '',
      'Instructor': fila.instructor,
      'Asignatura': fila.asignatura,
      'Tema': fila.tema,
      'Motivo Consulta': fila.motivo_consulta || '',
      'Calificación': fila.calificacion,
      'Dudas Resueltas': fila.dudas_resueltas || '',
      'Dominio del Tema': fila.dominio_tema || '',
      'Ambiente': fila.ambiente || '',
      'Recomienda PMA': fila.recomienda_pma || '',
      'Sugerencias': fila.sugerencias || ''
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosExcel);

  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Aplicar formato de fecha DD/MM/YYYY a la columna Fecha
  for (let row = 1; row <= range.e.r; row++) {
    const fechaCell = XLSX.utils.encode_cell({ r: row, c: 0 }); // Columna Fecha
    if (ws[fechaCell] && row > 0) {
      ws[fechaCell].t = 'n'; // Tipo numérico (Excel maneja fechas como números)
      ws[fechaCell].z = 'dd/mm/yyyy'; // Formato día/mes/año
    }
  }
  
  // Aplicar formato a documento como número
  for (let row = 1; row <= range.e.r; row++) {
    const docCell = XLSX.utils.encode_cell({ r: row, c: 2 }); // Columna Documento
    if (ws[docCell] && row > 0) {
      ws[docCell].t = 'n'; // Tipo numérico
      ws[docCell].z = '0'; // Formato sin decimales
    }
  }

  ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

ws['!cols'] = [
    { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 20 }, { wch: 20 },
    { wch: 35 }, { wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 20 },
    { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 40 },
    { wch: 25 }, { wch: 30 }, { wch: 30 }, { wch: 25 }, { wch: 12 },
    { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 40 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Registros Completos");

  const fechaHoy = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${nombreArchivo}_${fechaHoy}.xlsx`);
}



function generarExcelDocentes(datos, nombreArchivo) {
  const datosExcel = datos.map(fila => {
    // Convertir fecha UTC a hora de Colombia
    const fechaUTC = new Date(fila.fecha);
    const fechaColombia = new Date(fechaUTC.toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    
    const horas = String(fechaColombia.getHours()).padStart(2, '0');
    const minutos = String(fechaColombia.getMinutes()).padStart(2, '0');
    const horaFormateada = `${horas}:${minutos}`;
    
    // Convertir Date a número de serie de Excel
    const serialDate = (fechaColombia - new Date(1899, 11, 30)) / (86400000);
    
    return {
      'Fecha': serialDate,
      'Hora': horaFormateada,
      'Documento': parseInt(fila.documento),
      'Nombres': fila.nombres,
      'Apellidos': fila.apellidos,
      'Programa': fila.programa,
      'Facultad/Departamento': fila.facultad_departamento || '',
      'Instructor': fila.instructor,
      'Asignatura': fila.asignatura,
      'Tema': fila.tema
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(datosExcel);

  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Aplicar formato de fecha DD/MM/YYYY a la columna Fecha
  for (let row = 1; row <= range.e.r; row++) {
    const fechaCell = XLSX.utils.encode_cell({ r: row, c: 0 }); // Columna Fecha
    if (ws[fechaCell] && row > 0) {
      ws[fechaCell].t = 'n'; // Tipo numérico (Excel maneja fechas como números)
      ws[fechaCell].z = 'dd/mm/yyyy'; // Formato día/mes/año
    }
  }
  
  // Aplicar formato a documento como número
  for (let row = 1; row <= range.e.r; row++) {
    const docCell = XLSX.utils.encode_cell({ r: row, c: 2 }); // Columna Documento
    if (ws[docCell] && row > 0) {
      ws[docCell].t = 'n'; // Tipo numérico
      ws[docCell].z = '0'; // Formato sin decimales
    }
  }

  ws['!autofilter'] = { ref: XLSX.utils.encode_range(range) };

  ws['!cols'] = [
    { wch: 12 }, // Fecha
    { wch: 8 },  // Hora
    { wch: 12 }, // Documento
    { wch: 20 }, // Nombres
    { wch: 20 }, // Apellidos
    { wch: 35 }, // Programa
    { wch: 20 }, // Facultad/Departamento
    { wch: 25 }, // Instructor
    { wch: 30 }, // Asignatura
    { wch: 30 }  // Tema
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Docentes");

  const fechaHoy = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${nombreArchivo}_${fechaHoy}.xlsx`);
}



function cerrarSesionAdmin() {
  volverInicio();
}

// ===================================
// ACTUALIZAR INDICADOR DE PROGRESO
// ===================================
function actualizarProgreso(paso) {
  document.querySelectorAll('.progress-step').forEach(step => {
    step.classList.remove('active');
  });
  
  for (let i = 1; i < paso; i++) {
    document.getElementById(`step${i}`).classList.add('completed');
  }
  
  document.getElementById(`step${paso}`).classList.add('active');
}

// ===================================
// TOGGLE INSTRUCTORES POR SEDE EN ADMIN
// ===================================
function toggleInstructoresSede(sede) {
  document.getElementById('instructoresNorteAdmin').classList.add('hidden');
  document.getElementById('instructoresSurAdmin').classList.add('hidden');
  
  if (sede === 'norte') {
    document.getElementById('instructoresNorteAdmin').classList.toggle('hidden');
  } else if (sede === 'sur') {
    document.getElementById('instructoresSurAdmin').classList.toggle('hidden');
  }
}

// ===================================
// TOGGLE PROFESORES POR FACULTAD EN ADMIN
// ===================================
function toggleProfesoresFacultad(facultadId) {
  // Ocultar todas las secciones de profesores
  const todasLasSecciones = document.querySelectorAll('[id^="profesores"]');
  todasLasSecciones.forEach(seccion => {
    if (seccion.id.startsWith('profesores')) {
      seccion.classList.add('hidden');
    }
  });
  
  // Mostrar/ocultar la sección clickeada
  const seccionActual = document.getElementById('profesores' + facultadId);
  if (seccionActual) {
    seccionActual.classList.toggle('hidden');
  }
}



// ===================================
// FUNCIÓN AUXILIAR PARA NOMBRES DE FACULTAD
// ===================================
function obtenerNombreFacultad(codigo) {
  const nombres = {
    'DCB': 'Departamento de Ciencias Básicas',
    'FCE': 'Facultad de Ciencias Empresariales',
    'FCSH': 'Facultad de Ciencias Sociales y Humanas',
    'FEDV': 'Facultad de Educación a Distancia y Virtual',
    'FI': 'Facultad de Ingeniería'
  };
  return nombres[codigo] || codigo;
}

// ===================================
// INICIALIZACIÓN
// ===================================
window.onload = function() {
  console.log('Sistema PMA con Supabase iniciado');
  console.log('Los datos se cargarán solo cuando sean necesarios.');
  
  // Agregar event listener al botón Continuar
  document.getElementById('btnContinuar').addEventListener('click', mostrarConfirmacion);
};

// ===================================
// MOSTRAR/OCULTAR CONTRASEÑA
// ===================================
function togglePassword() {
  const input = document.getElementById('adminContrasena');
  const button = input.nextElementSibling;
  
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '--';
  } else {
    input.type = 'password';
    button.textContent = '👁️';
  }
}

// ===================================
// MOSTRAR/OCULTAR USUARIO
// ===================================
function toggleUsername() {
  const input = document.getElementById('adminDocumento');
  const button = input.nextElementSibling;
  
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '--';
  } else {
    input.type = 'password';
    button.textContent = '👁️';
  }
}


// ===================================
// GRÁFICAS
// ===================================
function actualizarGrafica() {
  const periodo = document.getElementById('filtroGraficaPeriodo').value;
  const tipoInstructor = document.getElementById('filtroGraficaTipo').value;
  
  const data = window.datosFormulariosGlobal;
  if (!data || data.length === 0) return;
  
  // Filtrar por tipo de instructor si no es "todos"
  let datosFiltrados = data;
  if (tipoInstructor !== 'todos') {
    datosFiltrados = data.filter(item => item.tipo_instructor === tipoInstructor);
  }
  
  if (datosFiltrados.length === 0) {
    // Si no hay datos filtrados, mostrar gráfico vacío
    if (graficoTutorias) {
      graficoTutorias.destroy();
    }
    const ctx = document.getElementById('graficaTutorias').getContext('2d');
    graficoTutorias = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Sin datos'],
        datasets: [{
          label: 'Cantidad de tutorías',
          data: [0],
          backgroundColor: 'rgba(30, 60, 114, 0.7)',
          borderColor: 'rgba(30, 60, 114, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
    return;
  }
  
  let labels = [];
  let valores = [];
  
  if (periodo === 'semanal') {
    // Agrupar por semanas (Domingo a Sábado)
    
    // Encontrar la fecha más antigua y más reciente
    const fechas = datosFiltrados.map(item => new Date(item.fecha));
    const fechaMin = new Date(Math.min(...fechas));
    const fechaMax = new Date(Math.max(...fechas));
    
    // Función para obtener el domingo de una fecha
    function obtenerDomingo(fecha) {
      const dia = fecha.getDay();
      const diff = fecha.getDate() - dia; // Restar días para llegar al domingo
      const domingo = new Date(fecha);
      domingo.setDate(diff);
      domingo.setHours(0, 0, 0, 0);
      return domingo;
    }
    
    // Obtener el domingo de la primera semana
    let domingoActual = obtenerDomingo(fechaMin);
    
    // Iterar por cada semana hasta cubrir todas las fechas
    const semanas = {};
    
    while (domingoActual <= fechaMax) {
      const sabado = new Date(domingoActual);
      sabado.setDate(sabado.getDate() + 6);
      sabado.setHours(23, 59, 59, 999);
      
      // Formatear las fechas para el label (SIN AÑO)
      const diaD = String(domingoActual.getDate()).padStart(2, '0');
      const mesD = String(domingoActual.getMonth() + 1).padStart(2, '0');
      
      const diaS = String(sabado.getDate()).padStart(2, '0');
      const mesS = String(sabado.getMonth() + 1).padStart(2, '0');
      
      const label = `${diaD}/${mesD} - ${diaS}/${mesS}`;
      
      // Contar registros en esta semana
      const cantidad = datosFiltrados.filter(item => {
        const fechaItem = new Date(item.fecha);
        return fechaItem >= domingoActual && fechaItem <= sabado;
      }).length;
      
      semanas[label] = cantidad;
      
      // Avanzar a la siguiente semana (siguiente domingo)
      domingoActual = new Date(domingoActual);
      domingoActual.setDate(domingoActual.getDate() + 7);
    }
    
    labels = Object.keys(semanas);
    valores = Object.values(semanas);
    
  } else if (periodo === 'mensual') {
    // Agrupar por meses completos
    
    const meses = {};
    const nombresMesesCortos = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    datosFiltrados.forEach(item => {
      const fecha = new Date(item.fecha);
      const mes = fecha.getMonth();
      const año = fecha.getFullYear();
      const claveMes = `${año}-${String(mes + 1).padStart(2, '0')}`; // Para ordenar
      const labelMes = `${nombresMesesCortos[mes]} ${año}`;
      
      if (!meses[claveMes]) {
        meses[claveMes] = {
          label: labelMes,
          cantidad: 0
        };
      }
      
      meses[claveMes].cantidad++;
    });
    
    // Ordenar por fecha (año-mes)
    const clavesMesesOrdenadas = Object.keys(meses).sort();
    
    labels = clavesMesesOrdenadas.map(clave => meses[clave].label);
    valores = clavesMesesOrdenadas.map(clave => meses[clave].cantidad);
  }
  
  // Destruir gráfico anterior si existe
  if (graficoTutorias) {
    graficoTutorias.destroy();
  }
  
  // Crear nuevo gráfico
  const ctx = document.getElementById('graficaTutorias').getContext('2d');
  graficoTutorias = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Cantidad de tutorías',
        data: valores,
        backgroundColor: 'rgba(30, 60, 114, 0.7)',
        borderColor: 'rgba(30, 60, 114, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.parsed.y + ' tutoría' + (context.parsed.y !== 1 ? 's' : '');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        },
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
}


// ===================================
// MANEJO DEL BOTÓN DE RETROCESO (BACK BUTTON)
// ===================================

// Variable para rastrear la pantalla actual
let pantallaActual = 'pantallaInicio';
let historialNavegacion = ['pantallaInicio'];

// Actualizar el historial cuando cambia la pantalla
function actualizarHistorialNavegacion(nuevaPantalla) {
  pantallaActual = nuevaPantalla;
  
  // Agregar al historial del navegador
  const estadoActual = {
    pantalla: nuevaPantalla,
    timestamp: Date.now()
  };
  
  window.history.pushState(estadoActual, '', window.location.href);
}

// Modificar la función mostrarPantalla existente
const mostrarPantallaOriginal = mostrarPantalla;
mostrarPantalla = function(id) {
  mostrarPantallaOriginal(id);
  actualizarHistorialNavegacion(id);
};

// Manejador del evento popstate (botón de retroceso)
window.addEventListener('popstate', function(event) {
  event.preventDefault();
  
  // Si no hay estado, estamos en la página inicial
  if (!event.state) {
    if (pantallaActual !== 'pantallaInicio') {
      manejarRetroceso();
    }
    return;
  }
  
  manejarRetroceso();
});

// Función principal que maneja la lógica de retroceso
function manejarRetroceso() {
  
  // REGLA 1: Si estoy en "Llenar Formulario" → Volver a "Bienvenido"
  if (pantallaActual === 'pantallaLogin') {
    volverInicio();
    return;
  }
  
  // REGLA 2: Si estoy en "Registro de Asistencia" → Mostrar confirmación
  if (pantallaActual === 'pantallaFormulario') {
    // Prevenir el retroceso real del navegador
    window.history.pushState({ pantalla: pantallaActual }, '', window.location.href);
    
    confirmarCancelacion();
    return;
  }
  
  // REGLA 3: Si estoy en "Registro de Estudiante" → Mostrar confirmación
  if (pantallaActual === 'pantallaRegistro') {
    // Prevenir el retroceso real del navegador
    window.history.pushState({ pantalla: pantallaActual }, '', window.location.href);
    
    confirmarCancelacion();
    return;
  }
  
  // REGLA 4: Si estoy en "Acceso de Administrador" → Volver a "Bienvenido"
  if (pantallaActual === 'pantallaAdminLogin') {
    volverInicio();
    return;
  }
  
  // REGLA 5: Si estoy en "Panel de Administración" → Volver a "Acceso de Administrador"
  if (pantallaActual === 'pantallaAdmin') {
    mostrarLoginAdmin();
    return;
  }
  
  // Por defecto, volver al inicio
  volverInicio();
}

// Inicializar el estado del historial al cargar la página
window.addEventListener('load', function() {
  // Establecer el estado inicial
  const estadoInicial = {
    pantalla: 'pantallaInicio',
    timestamp: Date.now()
  };
  
  window.history.replaceState(estadoInicial, '', window.location.href);
  pantallaActual = 'pantallaInicio';
});

// Prevenir que el navegador restaure el scroll al usar el botón de retroceso
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

// ===================================
// FUNCIONES DE PAGINACIÓN
// ===================================
function validarPagina1() {
  const tipoAcompanamiento = document.getElementById('tipoAcompanamiento').value;
  const sedeTutoria = document.getElementById('sedeTutoria').value;
  const tipoInstructor = document.getElementById('tipoInstructor').value;
  const instructor = document.getElementById('instructor').value;
  const asignatura = document.getElementById('asignatura').value;
  const motivoConsulta = document.getElementById('motivoConsulta').value;

  // Validar campos básicos
  if (!tipoAcompanamiento || !sedeTutoria || !tipoInstructor || !instructor || !asignatura || !motivoConsulta) {
    return { valido: false, mensaje: 'Por favor complete todos los campos obligatorios de esta sección' };
  }

  // Validar título del curso si es necesario
  if (tipoAcompanamiento === 'Curso y/o capacitación') {
    const tituloCurso = document.getElementById('tituloCurso').value.trim();
    if (!tituloCurso) {
      return { valido: false, mensaje: 'Por favor ingrese el título del curso/capacitación' };
    }
  }

  // Validar facultad/departamento si es profesor
  if (tipoInstructor === 'Profesor') {
    const facultadDepartamento = document.getElementById('facultadDepartamento').value;
    if (!facultadDepartamento) {
      return { valido: false, mensaje: 'Por favor seleccione una facultad/departamento' };
    }
  }

  // Validar asignatura personalizada si es necesaria
  if (asignatura === 'Otra') {
    const otraAsignatura = document.getElementById('otraAsignatura').value.trim();
    if (!otraAsignatura) {
      return { valido: false, mensaje: 'Por favor especifique la asignatura' };
    }
  }

  // Validar tema
  const selectTema = document.getElementById('tema');
  const inputTema = document.getElementById('otroTema');
  
  if (selectTema.style.display === 'none') {
    // Si el select está oculto, validar el input
    if (!inputTema.value.trim()) {
      return { valido: false, mensaje: 'Por favor ingrese el tema de la tutoría' };
    }
  } else {
    // Si el select está visible
    const tema = selectTema.value;
    if (!tema) {
      return { valido: false, mensaje: 'Por favor seleccione un tema' };
    }
    
    if (tema === 'Otro') {
      if (!inputTema.value.trim()) {
        return { valido: false, mensaje: 'Por favor especifique el tema' };
      }
    }
  }

  return { valido: true };
}

function avanzarPagina() {
  if (paginaFormularioActual === 1) {
    // Validar página 1 antes de avanzar
    const validacion = validarPagina1();
    
    if (!validacion.valido) {
      mostrarMensaje('mensajeFormulario', validacion.mensaje, 'error');
      return;
    }
    
    // Ocultar página 1, mostrar página 2
    document.getElementById('paginaFormulario1').classList.add('hidden');
    document.getElementById('paginaFormulario2').classList.remove('hidden');
    document.getElementById('btnEnviar').classList.remove('hidden');
    document.getElementById('mensajeFormulario').innerHTML = '';
    
    paginaFormularioActual = 2;
    
   // Scroll al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    actualizarProgreso(4);
  }
}

function retrocederPagina() {
  if (paginaFormularioActual === 2) {
    // Ocultar página 2, mostrar página 1
    document.getElementById('paginaFormulario2').classList.add('hidden');
    document.getElementById('paginaFormulario1').classList.remove('hidden');
    document.getElementById('btnEnviar').classList.add('hidden');
    document.getElementById('mensajeFormulario').innerHTML = '';
    
    paginaFormularioActual = 1;
    
// Scroll al inicio de la página
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    actualizarProgreso(3);
  }
}

// ===================================
// ENVIAR NOTIFICACIÓN PUSH DESDE ADMIN
// ===================================
async function enviarNotificacionPush(event) {
  event.preventDefault();
  
  const btnEnviar = document.getElementById('btnEnviarNotificacion');
  const titulo = document.getElementById('notifTitulo').value.trim();
  const mensaje = document.getElementById('notifMensaje').value.trim();
  const url = document.getElementById('notifUrl').value.trim() || window.location.origin;
  
  // Validaciones
  if (!titulo || !mensaje) {
    mostrarMensaje('mensajeNotificacion', 'Por favor complete todos los campos obligatorios', 'error');
    return;
  }
  
  if (titulo.length > 50) {
    mostrarMensaje('mensajeNotificacion', 'El título no puede superar los 50 caracteres', 'error');
    return;
  }
  
  if (mensaje.length > 200) {
    mostrarMensaje('mensajeNotificacion', 'El mensaje no puede superar los 200 caracteres', 'error');
    return;
  }
  
  // Confirmar envío
  if (!confirm(`¿Enviar notificación a todos los usuarios de Sede Norte?\n\nTítulo: ${titulo}\nMensaje: ${mensaje}`)) {
    return;
  }
  
  // Desactivar botón
  btnEnviar.disabled = true;
  btnEnviar.textContent = '⏳ Enviando...';
  btnEnviar.style.opacity = '0.6';
  mostrarCargando('mensajeNotificacion');
  
  try {
    // Enviar notificación usando OneSignal REST API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        headings: { en: titulo },
        contents: { en: mensaje },
        url: url,
        chrome_web_icon: 'https://vkfjttukyrtiumzfmyuk.supabase.co/storage/v1/object/public/img/LOGO.png',
        chrome_web_badge: 'https://vkfjttukyrtiumzfmyuk.supabase.co/storage/v1/object/public/img/LOGO.png',
        // Enviar solo a usuarios que aceptaron notificaciones
        filters: [
          { field: 'tag', key: 'acepta_notificaciones', relation: '=', value: 'Si' }
        ]
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.id) {
      mostrarMensaje('mensajeNotificacion', 
        `✅ Notificación enviada exitosamente a ${data.recipients || 0} usuario(s)`, 
        'success');
      
      // Limpiar formulario
      document.getElementById('formNotificacion').reset();
    } else {
      throw new Error(data.errors ? data.errors.join(', ') : 'Error desconocido al enviar notificación');
    }
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    mostrarMensaje('mensajeNotificacion', 
      `❌ Error al enviar notificación: ${error.message}`, 
      'error');
  } finally {
    // Reactivar botón
    btnEnviar.disabled = false;
    btnEnviar.textContent = '📤 Enviar Notificación';
    btnEnviar.style.opacity = '1';
  }
}
