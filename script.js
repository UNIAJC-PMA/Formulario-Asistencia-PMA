// ===================================
// CONFIGURACIÓN DE SUPABASE (OFUSCADA)
// ===================================

// URL dividida en partes
const p1 = 'https://';
const p2 = 'vkfjtt';
const p3 = 'ukyrti';
const p4 = 'umzfmy';
const p5 = 'uk.supa';
const p6 = 'base.co';
const SUPABASE_URL = p1 + p2 + p3 + p4 + p5 + p6;

// KEY dividida en partes
const k1 = 'eyJhbGciOiJIUzI1';
const k2 = 'NiIsInR5cCI6IkpXVCJ9.';
const k3 = 'eyJpc3MiOiJzdXBhYmFzZS';
const k4 = 'IsInJlZiI6InZrZmp0dHVr';
const k5 = 'eXJ0aXVtemZteXVrIiwicm';
const k6 = '9sZSI6ImFub24iLCJpYXQi';
const k7 = 'OjE3NjI0NTU0MjQsImV4cC';
const k8 = 'I6MjA3ODAzMTQyNH0.';
const k9 = 'eU8GeI8IVazXydMDwY98';
const k10 = 'TUzT9xvjhcbXBu6cruCPiEk';
const SUPABASE_KEY = k1 + k2 + k3 + k4 + k5 + k6 + k7 + k8 + k9 + k10;


// Variables globales
let datosEstudiante = null;
let instructorActual = null;
let formularioEnviandose = false;

// ===================================
// CACHE DE DATOS PRECARGADOS
// ===================================
let datosCache = {
  facultadesCarreras: [],
  tutoresNorte: [],
  tutoresSur: [],
  profesores: [],
  materias: [],
  temas: [],
  cargado: false
};

let facultadesData = {};

// ===================================
// FUNCIONES DE SUPABASE
// ===================================
async function supabaseQuery(table, options = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  
  if (options.select) url += `?select=${options.select}`;
  if (options.eq) url += `${options.select ? '&' : '?'}${options.eq.field}=eq.${options.eq.value}`;
  if (options.order) url += `${url.includes('?') ? '&' : '?'}order=${options.order}`;
  
  const response = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}

async function supabaseInsert(table, data) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  
  return await response.json();
}

// ===================================
// PRECARGA DE DATOS
// ===================================
async function precargarDatosEstaticos() {
  if (datosCache.cargado) return;
  
  try {
    console.log('Precargando datos estáticos...');
    
    const [
      facultadesCarreras,
      tutoresNorte,
      tutoresSur,
      profesores,
      materias,
      temas
    ] = await Promise.all([
      supabaseQuery('facultades_carreras'),
      supabaseQuery('tutores_norte'),
      supabaseQuery('tutores_sur'),
      supabaseQuery('profesores'),
      supabaseQuery('materias'),
      supabaseQuery('temas')
    ]);
    
    datosCache = {
      facultadesCarreras,
      tutoresNorte,
      tutoresSur,
      profesores,
      materias,
      temas,
      cargado: true
    };
    
    procesarFacultadesData();
    
    console.log('Datos precargados exitosamente');
    
  } catch (error) {
    console.error('Error precargando datos:', error);
    datosCache.cargado = false;
  }
}

function procesarFacultadesData() {
  facultadesData = {};
  
  datosCache.facultadesCarreras.forEach(item => {
    if (!facultadesData[item.facultad]) {
      facultadesData[item.facultad] = [];
    }
    facultadesData[item.facultad].push(item.programa);
  });
}

// ===================================
// FUNCIONES DE NAVEGACIÓN
// ===================================
function mostrarPantalla(id) {
  document.querySelectorAll('.container > div').forEach(div => div.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarLogin() {
  mostrarPantalla('pantallaLogin');
  document.getElementById('mensajeLogin').innerHTML = '';
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
  
  if (!datosCache.cargado) {
    mostrarCargando('mensajeRegistro');
    await precargarDatosEstaticos();
    document.getElementById('mensajeRegistro').innerHTML = '';
  }
  
  cargarFacultades();
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
  
  facultadesOrdenadas.forEach(facultad => {
    const option = document.createElement('option');
    option.value = facultad;
    option.textContent = facultad;
    select.appendChild(option);
  });
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
  
  programasOrdenados.forEach(programa => {
    const option = document.createElement('option');
    option.value = programa;
    option.textContent = programa;
    selectPrograma.appendChild(option);
  });
}

// ===================================
// CONFIRMACIÓN Y REGISTRO
// ===================================
function mostrarConfirmacion() {
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

  if (!doc || !primerNombre || !primerApellido || !segundoApellido || !facultad || !programa || !sede) {
    mostrarMensaje('mensajeRegistro', 'Por favor complete todos los campos obligatorios', 'error');
    return;
  }

  const nombreCompleto = `${primerNombre} ${segundoNombre} ${primerApellido} ${segundoApellido}`.replace(/\s+/g, ' ');

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

// FUNCIÓN MODIFICADA: Registrar estudiante (sin verificación de documento duplicado)
async function registrarEstudiante(event) {
  event.preventDefault();
  
  const doc = document.getElementById('regDocumentoMostrar').value;
  
  mostrarCargando('mensajeRegistro');

  const datos = {
    documento: doc,
    primer_nombre: document.getElementById('regPrimerNombre').value.toUpperCase(),
    segundo_nombre: document.getElementById('regSegundoNombre').value.toUpperCase() || null,
    primer_apellido: document.getElementById('regPrimerApellido').value.toUpperCase(),
    segundo_apellido: document.getElementById('regSegundoApellido').value.toUpperCase(),
    facultad: document.getElementById('regFacultad').value,
    programa: document.getElementById('regPrograma').value,
    sede: document.getElementById('regSede').value
  };

  try {
    const resultado = await supabaseInsert('estudiantes', datos);
    
    if (resultado && resultado.length > 0) {
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
    }
  } catch (error) {
    mostrarMensaje('mensajeRegistro', 'Error en el registro: ' + error.message, 'error');
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

  if (!datosCache.cargado) {
    await precargarDatosEstaticos();
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
      sede: estudiante.sede || ''
    };

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

  // Ocultar campos al cambiar sede o tipo
  const grupoFacultad = document.getElementById('grupoFacultadDepartamento');
  const selectFacultad = document.getElementById('facultadDepartamento');
  
  grupoFacultad.classList.add('hidden');
  document.getElementById('grupoInstructor').classList.add('hidden');
  selectFacultad.value = '';
  document.getElementById('instructor').value = '';
  
  // IMPORTANTE: Remover required del campo de facultad cuando está oculto
  selectFacultad.removeAttribute('required');

  if (tipo === 'Tutor') {
    // Si es tutor, mostrar directamente los tutores según la sede
    const selectInstructor = document.getElementById('instructor');
    document.getElementById('grupoInstructor').classList.remove('hidden');
    document.getElementById('labelInstructor').textContent = 'Tutor *';

    let instructores = [];
    
    // Si es Virtual, mostrar TODOS los tutores (Norte + Sur)
    if (sede === 'Virtual') {
      instructores = [...datosCache.tutoresNorte, ...datosCache.tutoresSur];
    } else if (sede === 'Norte') {
      instructores = datosCache.tutoresNorte;
    } else if (sede === 'Sur') {
      instructores = datosCache.tutoresSur;
    }

    const instructoresOrdenados = [...instructores].sort((a, b) => a.nombre.localeCompare(b.nombre));

    selectInstructor.innerHTML = '<option value="">Seleccione un tutor</option>';
    instructoresOrdenados.forEach(inst => {
      const option = document.createElement('option');
      option.value = inst.nombre;
      option.setAttribute('data-area', inst.area);
      option.textContent = inst.nombre;
      selectInstructor.appendChild(option);
    });
    
    actualizarProgreso(2);
  } else if (tipo === 'Profesor') {
    // Si es profesor, mostrar el selector de Facultad/Departamento
    // INDEPENDIENTE de la sede
    grupoFacultad.classList.remove('hidden');
    // IMPORTANTE: Agregar required cuando se muestra
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

  // Filtrar por facultad_departamento sin considerar la sede
  const profesores = datosCache.profesores.filter(
    prof => prof.facultad_departamento === facultadDepartamento
  );

  const profesoresOrdenados = [...profesores].sort((a, b) => a.nombre.localeCompare(b.nombre));

  selectInstructor.innerHTML = '<option value="">Seleccione un profesor</option>';
  profesoresOrdenados.forEach(prof => {
    const option = document.createElement('option');
    option.value = prof.nombre;
    option.setAttribute('data-area', prof.area);
    option.textContent = prof.nombre;
    selectInstructor.appendChild(option);
  });
}

// ===================================
// CARGAR MATERIAS
// ===================================
function cargarMaterias() {
  const selectInstructor = document.getElementById('instructor');
  const selectedOption = selectInstructor.options[selectInstructor.selectedIndex];
  
  if (!selectedOption || !selectedOption.value) return;

  const area = selectedOption.getAttribute('data-area');
  instructorActual = { nombre: selectedOption.value, area: area };

  document.getElementById('grupoMateria').classList.remove('hidden');

  const materiasFiltradas = datosCache.materias.filter(mat => mat.area === area);
  const materiasOrdenadas = materiasFiltradas.sort((a, b) => a.materia.localeCompare(b.materia));

  const selectMateria = document.getElementById('asignatura');
  selectMateria.innerHTML = '<option value="">Seleccione una asignatura</option>';
  
  materiasOrdenadas.forEach(mat => {
    const option = document.createElement('option');
    option.value = mat.materia;
    option.textContent = mat.materia;
    selectMateria.appendChild(option);
  });
  
  // Agregar opción "Otra"
  const optionOtra = document.createElement('option');
  optionOtra.value = 'Otra';
  optionOtra.textContent = 'Otra: ¿Cuál?';
  optionOtra.style.fontWeight = 'bold';
  selectMateria.appendChild(optionOtra);
  
  actualizarProgreso(3);
}


// ===================================
// CARGAR TEMAS
// ===================================
function cargarTemas() {
  const materia = document.getElementById('asignatura').value;
  if (!materia) return;

  // Verificar si seleccionó "Otra"
  const containerAsignatura = document.getElementById('otraAsignaturaContainer');
  const inputAsignatura = document.getElementById('otraAsignatura');
  
  if (materia === 'Otra') {
    // Mostrar campo para especificar la asignatura
    containerAsignatura.classList.remove('hidden');
    inputAsignatura.required = true;
    
    // Mostrar grupo de tema
    document.getElementById('grupoTema').classList.remove('hidden');
    
    // Ocultar el select de tema y mostrar el input de texto
    const selectTema = document.getElementById('tema');
    selectTema.style.display = 'none';
    selectTema.required = false;
    
    // Mostrar campo de texto para tema personalizado
    const containerTema = document.getElementById('otroTemaContainer');
    const inputTema = document.getElementById('otroTema');
    containerTema.classList.remove('hidden');
    inputTema.required = true;
    
    // Cambiar el label de tema
    const labelTema = document.querySelector('#grupoTema label');
    labelTema.textContent = 'Tema *';
    
    document.getElementById('grupoMotivo').classList.remove('hidden');
    document.getElementById('grupoCalificacion').classList.remove('hidden');
    document.getElementById('grupoSugerencias').classList.remove('hidden');
    document.getElementById('btnEnviar').classList.remove('hidden');
    
    formularioEnviandose = true;
    actualizarBotonCerrarSesion();
    actualizarProgreso(4);
    return;
  } else {
    // Si NO es "Otra", ocultar el campo de asignatura personalizada
    containerAsignatura.classList.add('hidden');
    inputAsignatura.required = false;
    inputAsignatura.value = '';
    
    // Restaurar el select de tema
    const selectTema = document.getElementById('tema');
    selectTema.style.display = '';
    selectTema.required = true;
    
    // Ocultar el campo de tema personalizado
    const containerTema = document.getElementById('otroTemaContainer');
    const inputTema = document.getElementById('otroTema');
    containerTema.classList.add('hidden');
    inputTema.required = false;
    inputTema.value = '';
    
    // Restaurar el label original
    const labelTema = document.querySelector('#grupoTema label');
    labelTema.textContent = 'Tema de la tutoría *';
  }

  document.getElementById('grupoTema').classList.remove('hidden');

  const temasFiltrados = datosCache.temas.filter(tem => tem.materia === materia);
  const temasOrdenados = temasFiltrados.sort((a, b) => a.tema.localeCompare(b.tema));

  const selectTema = document.getElementById('tema');
  selectTema.innerHTML = '<option value="">Seleccione un tema</option>';
  
  temasOrdenados.forEach(tem => {
    const option = document.createElement('option');
    option.value = tem.tema;
    option.textContent = tem.tema;
    selectTema.appendChild(option);
  });

  const optionOtro = document.createElement('option');
  optionOtro.value = 'Otro';
  optionOtro.textContent = 'Otro: ¿Cuál?';
  optionOtro.style.fontWeight = 'bold';
  selectTema.appendChild(optionOtro);

  document.getElementById('grupoMotivo').classList.remove('hidden');
  document.getElementById('grupoCalificacion').classList.remove('hidden');
  document.getElementById('grupoSugerencias').classList.remove('hidden');
  document.getElementById('btnEnviar').classList.remove('hidden');
  
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
  
  // Validar la calificación
  const calificacionRadio = document.querySelector('input[name="calificacion"]:checked');
  
  if (!calificacionRadio) {
    const grupoCalificacion = document.getElementById('grupoCalificacion');
    
    if (grupoCalificacion.classList.contains('hidden')) {
      mostrarMensaje('mensajeFormulario', 'Debe completar el formulario hasta la sección de calificación', 'error');
      return;
    }
    
    mostrarMensaje('mensajeFormulario', 'seleccione una calificación para la tutoría', 'error');
    
    setTimeout(() => {
      grupoCalificacion.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 100);
    
    setTimeout(() => {
      grupoCalificacion.style.background = '#fff3cd';
      grupoCalificacion.style.padding = '20px';
      grupoCalificacion.style.borderRadius = '8px';
      grupoCalificacion.style.border = '3px solid #ffffffff';
      grupoCalificacion.style.transition = 'all 0.3s';
      grupoCalificacion.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.5)';
      
      setTimeout(() => {
        grupoCalificacion.style.background = '';
        grupoCalificacion.style.padding = '';
        grupoCalificacion.style.border = '';
        grupoCalificacion.style.boxShadow = '';
      }, 2000);
    }, 600);
    
    return;
  }
  
  mostrarCargando('mensajeFormulario');
  
  // NUEVO: Verificar si el instructor seleccionado ya fue usado en los últimos 90 minutos
  const instructorSeleccionado = document.getElementById('instructor').value;
  
  const verificacion = await verificarRegistroRecenteConInstructor(datosEstudiante.documento, instructorSeleccionado);
  
  if (!verificacion.puedeRegistrar) {
    mostrarMensaje('mensajeFormulario', 
      `Ya tienes una tutoría reciente con este tutor. Podrás registrar otra en ${verificacion.tiempoRestante}, o puedes realizarla con otro tutor si lo prefieres.`, 
      'error');
    
    setTimeout(() => {
      const mensajeElement = document.getElementById('mensajeFormulario');
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
  asignatura = document.getElementById('otraAsignatura').value;
}

// Obtener tema (puede ser personalizado)
let tema = document.getElementById('tema').value;
if (tema === 'Otro') {
  tema = document.getElementById('otroTema').value;
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
    semestre: parseInt(document.getElementById('semestre').value),
    grupo: document.getElementById('grupo').value.toUpperCase(),
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
    sugerencias: document.getElementById('sugerencias').value || 'Ninguna',
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
      modal.style.display = 'none';
      modal.classList.add('hidden');
      cerrarSesion();
    }, 3000);
  } catch (error) {
    mostrarMensaje('mensajeFormulario', 'Error al guardar: ' + error.message, 'error');
  }
}

function cerrarSesion() {
  datosEstudiante = null;
  instructorActual = null;
  formularioEnviandose = false;
  
  document.querySelectorAll('.progress-step').forEach(step => {
    step.classList.remove('active', 'completed');
  });
  
  const primerPaso = document.getElementById('step1');
  if (primerPaso) {
    primerPaso.classList.add('active');
  }
  
  volverInicio();
}

// ===================================
// ADMINISTRADOR
// ===================================
async function loginAdmin(event) {
  event.preventDefault();
  mostrarCargando('mensajeAdminLogin');

  const documento = document.getElementById('adminDocumento').value;

  try {
    const data = await supabaseQuery('administradores', {
      eq: { field: 'documento', value: documento }
    });

    if (data.length === 0) {
      mostrarMensaje('mensajeAdminLogin', 'Acceso denegado. Documento no autorizado.', 'error');
      return;
    }

    document.getElementById('nombreAdmin').textContent = 'Administrador: ' + data[0].nombre;
    mostrarPantalla('pantallaAdmin');
    await cargarEstadisticas();
  } catch (error) {
    mostrarMensaje('mensajeAdminLogin', 'Error de conexión: ' + error.message, 'error');
  }
}

function cambiarTab(event, tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  
  document.getElementById('tabEstadisticas').classList.add('hidden');
  document.getElementById('tabDescargas').classList.add('hidden');
  
  if (tab === 'estadisticas') {
    document.getElementById('tabEstadisticas').classList.remove('hidden');
  } else if (tab === 'descargas') {
    document.getElementById('tabDescargas').classList.remove('hidden');
  }
}

async function cargarEstadisticas() {
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
  }
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
    sumaCalificaciones: 0
  };

  datosFiltrados.forEach(item => {
    const sede = item.sede_tutoria;
    const instructor = item.instructor;
    
    if (!stats.instructoresPorSede[sede]) {
      stats.instructoresPorSede[sede] = {};
    }
    stats.instructoresPorSede[sede][instructor] = (stats.instructoresPorSede[sede][instructor] || 0) + 1;

    stats.sedesTutorias[sede] = (stats.sedesTutorias[sede] || 0) + 1;

    if (!stats.calificacionesPorInstructor[instructor]) {
      stats.calificacionesPorInstructor[instructor] = { suma: 0, cantidad: 0 };
    }
    stats.calificacionesPorInstructor[instructor].suma += item.calificacion;
    stats.calificacionesPorInstructor[instructor].cantidad += 1;

    stats.sumaCalificaciones += item.calificacion;

    // Para profesores: contar por facultad/departamento
    if (tipo === 'profesores' && item.facultad_departamento) {
      stats.facultadDepartamento[item.facultad_departamento] = (stats.facultadDepartamento[item.facultad_departamento] || 0) + 1;
    }
  });

  const promedioCalificacion = (stats.sumaCalificaciones / stats.total).toFixed(2);

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
  
  // GENERAL: Solo 3 cards
  if (tipo === 'general') {
    grid.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <h3>${stats.total}</h3>
          <p>Total de Registros</p>
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
      detalles += `<div class="list-item"><span>Sede ${sede}</span><strong>${cantidad} (${porcentaje}%)</strong></div>`;
    });
    detalles += '</div>';

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
        <h4 class="horario-titulo">Sede Norte</h4>`;
    
    const instructoresNorte = Object.entries(stats.instructoresPorSede.Norte || {})
      .sort((a, b) => b[1] - a[1]);
    if (instructoresNorte.length > 0) {
      instructoresNorte.forEach(([instructor, cantidad]) => {
        const promedio = promediosPorInstructor[instructor] || 'N/A';
        detalles += `<div class="list-item">
          <span>${instructor}</span>
          <strong>${cantidad} tutorías<br><span style="font-size: 12px; font-weight: normal;">Calificación: ${promedio}</span></strong>
        </div>`;
      });
    } else {
      detalles += '<p style="text-align: center; color: #666;">No hay tutores en Sede Norte</p>';
    }
    
    detalles += `</div>

      <div id="instructoresSurAdmin" class="horario-info hidden">
        <h4 class="horario-titulo">Sede Sur</h4>`;
    
    const instructoresSur = Object.entries(stats.instructoresPorSede.Sur || {})
      .sort((a, b) => b[1] - a[1]);
    if (instructoresSur.length > 0) {
      instructoresSur.forEach(([instructor, cantidad]) => {
        const promedio = promediosPorInstructor[instructor] || 'N/A';
        detalles += `<div class="list-item">
          <span>${instructor}</span>
          <strong>${cantidad} tutorías<br><span style="font-size: 12px; font-weight: normal;">Calificación: ${promedio}</span></strong>
        </div>`;
      });
    } else {
      detalles += '<p style="text-align: center; color: #666;">No hay tutores en Sede Sur</p>';
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

  try {
    let url = `${SUPABASE_URL}/rest/v1/formularios?fecha=gte.${desde}T00:00:00&fecha=lte.${hasta}T23:59:59&order=fecha.asc`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    const data = await response.json();
    
    // Filtrar solo tutores
    const datosTutores = data.filter(item => item.tipo_instructor === 'Tutor');
    
    if (datosTutores.length === 0) {
      alert('No hay registros de tutores en el rango de fechas seleccionado');
      return;
    }

    generarExcelSimplificado(datosTutores, `PMA_Tutores_${desde}_a_${hasta}`);
    alert(`${datosTutores.length} registros de tutores descargados exitosamente`);
  } catch (error) {
    alert('Error al descargar datos: ' + error.message);
  }
}

async function descargarTodo() {
  if (!confirm('¿Está seguro de descargar todos los registros?')) {
    return;
  }

  try {
    const data = await supabaseQuery('formularios', { order: 'fecha.asc' });
    
    if (data.length === 0) {
      alert('No hay registros para descargar');
      return;
    }

    generarExcelCompleto(data, 'PMA_Completo');
    alert(`${data.length} registros descargados exitosamente`);
  } catch (error) {
    alert('Error al descargar datos: ' + error.message);
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

  try {
    let url = `${SUPABASE_URL}/rest/v1/formularios?fecha=gte.${desde}T00:00:00&fecha=lte.${hasta}T23:59:59&order=fecha.asc`;
    
    const response = await fetch(url, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    
    const data = await response.json();
    
    // Filtrar solo profesores
    const datosDocentes = data.filter(item => item.tipo_instructor === 'Profesor');
    
    if (datosDocentes.length === 0) {
      alert('No hay registros de docentes en el rango de fechas seleccionado');
      return;
    }

    generarExcelDocentes(datosDocentes, `PMA_Docentes_${desde}_a_${hasta}`);
    alert(`${datosDocentes.length} registros de docentes descargados exitosamente`);
  } catch (error) {
    alert('Error al descargar datos: ' + error.message);
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
    const serialDate = (fechaColombia - new Date(1899, 11, 30)) / (24 * 60 * 60 * 1000);
    
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
    const serialDate = (fechaColombia - new Date(1899, 11, 30)) / (24 * 60 * 60 * 1000);
    
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
    { wch: 25 }, { wch: 30 }, { wch: 30 }, { wch: 25 }, { wch: 12 }, { wch: 40 }
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
    const serialDate = (fechaColombia - new Date(1899, 11, 30)) / (24 * 60 * 60 * 1000);
    
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
window.onload = async function() {
  console.log('Sistema PMA con Supabase iniciado');
  console.log('Iniciando precarga de datos estáticos en segundo plano...');
  
  precargarDatosEstaticos().then(() => {
    console.log('Precarga completada. Sistema listo para uso instantáneo.');
  }).catch(error => {
    console.error('Error en precarga inicial:', error);
  });
};