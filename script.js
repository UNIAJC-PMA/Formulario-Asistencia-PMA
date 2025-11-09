// ===================================
// CONFIGURACIÓN DE SUPABASE
// ===================================
const SUPABASE_URL = 'https://vkfjttukyrtiumzfmyuk.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZmp0dHVreXJ0aXVtemZteXVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NTU0MjQsImV4cCI6MjA3ODAzMTQyNH0.eU8GeI8IVazXydMDwY98TUzT9xvjhcbXBu6cruCPiEk';

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
  profesoresNorte: [],
  profesoresSur: [],
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
      profesoresNorte,
      profesoresSur,
      materias,
      temas
    ] = await Promise.all([
      supabaseQuery('facultades_carreras'),
      supabaseQuery('tutores_norte'),
      supabaseQuery('tutores_sur'),
      supabaseQuery('profesores_norte'),
      supabaseQuery('profesores_sur'),
      supabaseQuery('materias'),
      supabaseQuery('temas')
    ]);
    
    datosCache = {
      facultadesCarreras,
      tutoresNorte,
      tutoresSur,
      profesoresNorte,
      profesoresSur,
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
  
  setTimeout(() => elemento.innerHTML = '', 5000);
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

async function registrarEstudiante(event) {
  event.preventDefault();
  
  const doc = document.getElementById('regDocumento').value;
  
  const validacion = validarDocumento(doc);
  if (!validacion.valido) {
    mostrarMensaje('mensajeRegistro', validacion.mensaje, 'error');
    return;
  }
  
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
    const existing = await supabaseQuery('estudiantes', {
      eq: { field: 'documento', value: datos.documento }
    });

    if (existing.length > 0) {
      mostrarMensaje('mensajeRegistro', 'Este documento ya está registrado', 'error');
      return;
    }

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
// CARGAR INSTRUCTORES
// ===================================
function cargarInstructores() {
  const sede = document.getElementById('sedeTutoria').value;
  const tipo = document.getElementById('tipoInstructor').value;

  if (!sede || !tipo) return;

  const selectInstructor = document.getElementById('instructor');
  
  document.getElementById('grupoInstructor').classList.remove('hidden');
  document.getElementById('labelInstructor').textContent = tipo + ' *';

  let instructores = [];
  if (tipo === 'Tutor' && sede === 'Norte') {
    instructores = datosCache.tutoresNorte;
  } else if (tipo === 'Tutor' && sede === 'Sur') {
    instructores = datosCache.tutoresSur;
  } else if (tipo === 'Profesor' && sede === 'Norte') {
    instructores = datosCache.profesoresNorte;
  } else if (tipo === 'Profesor' && sede === 'Sur') {
    instructores = datosCache.profesoresSur;
  }

  const instructoresOrdenados = [...instructores].sort((a, b) => a.nombre.localeCompare(b.nombre));

  selectInstructor.innerHTML = `<option value="">Seleccione un ${tipo.toLowerCase()}</option>`;
  instructoresOrdenados.forEach(inst => {
    const option = document.createElement('option');
    option.value = inst.nombre;
    option.setAttribute('data-area', inst.area);
    option.textContent = inst.nombre;
    selectInstructor.appendChild(option);
  });
  
  actualizarProgreso(2);
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
  
  actualizarProgreso(3);
}

// ===================================
// CARGAR TEMAS
// ===================================
function cargarTemas() {
  const materia = document.getElementById('asignatura').value;
  if (!materia) return;

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
  const btnCerrar = document.querySelector('#pantallaFormulario .btn-secondary');
  btnCerrar.textContent = 'Cancelar';
  btnCerrar.onclick = confirmarCancelacion;
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
  
  const calificacionRadio = document.querySelector('input[name="calificacion"]:checked');
  
  if (!calificacionRadio) {
    const grupoCalificacion = document.getElementById('grupoCalificacion');
    
    // Hacer scroll
    grupoCalificacion.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Resaltar
    grupoCalificacion.style.background = '#fff3cd';
    grupoCalificacion.style.padding = '20px';
    grupoCalificacion.style.borderRadius = '8px';
    grupoCalificacion.style.border = '3px solid #ffc107';
    
    // Quitar resaltado después de 3 segundos
    setTimeout(() => {
      grupoCalificacion.style.background = '';
      grupoCalificacion.style.padding = '';
      grupoCalificacion.style.border = '';
    }, 3000);
    
    return;
  }
  
  mostrarCargando('mensajeFormulario');

  let tema = document.getElementById('tema').value;
  if (tema === 'Otro') {
    tema = document.getElementById('otroTema').value;
  }

  const tipoAcompanamiento = document.getElementById('tipoAcompanamiento').value;
  const tituloCurso = tipoAcompanamiento === 'Curso y/o capacitación' 
    ? document.getElementById('tituloCurso').value.toUpperCase() 
    : null;
  
  const ahora = new Date();
  const offsetColombia = -5 * 60;
  const offsetLocal = ahora.getTimezoneOffset();
  const diferencia = (offsetLocal - offsetColombia) * 60 * 1000;
  const fechaColombia = new Date(ahora.getTime() - diferencia);
  const fechaISO = fechaColombia.toISOString();
  
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
    instructor: document.getElementById('instructor').value,
    asignatura: document.getElementById('asignatura').value,
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

    const stats = {
      total: data.length,
      instructoresPorSede: { Norte: {}, Sur: {} },
      sedesTutorias: {},
      calificacionesPorInstructor: {},
      sumaCalificaciones: 0
    };

    data.forEach(item => {
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
    });

    const promedioCalificacion = (stats.sumaCalificaciones / stats.total).toFixed(2);

    const promediosPorInstructor = {};
    Object.keys(stats.calificacionesPorInstructor).forEach(instructor => {
      const info = stats.calificacionesPorInstructor[instructor];
      promediosPorInstructor[instructor] = (info.suma / info.cantidad).toFixed(2);
    });

    let mejorInstructor = { nombre: '', promedio: 0 };
    Object.keys(promediosPorInstructor).forEach(instructor => {
      const promedio = parseFloat(promediosPorInstructor[instructor]);
      if (promedio > mejorInstructor.promedio) {
        mejorInstructor = { nombre: instructor, promedio: promedio.toFixed(2) };
      }
    });

    const top2Norte = Object.entries(stats.instructoresPorSede.Norte || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
    
    const top2Sur = Object.entries(stats.instructoresPorSede.Sur || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);

    const grid = document.getElementById('statsGrid');
    grid.innerHTML = `
      <div class="stat-card">
        <h3>${stats.total}</h3>
        <p>Total Registros</p>
      </div>
      <div class="stat-card">
        <h3>${promedioCalificacion}</h3>
        <p>Calificación Promedio</p>
      </div>
      <div class="stat-card">
        <h3>${mejorInstructor.nombre}</h3>
        <p>Mejor Calificación (${mejorInstructor.promedio})</p>
      </div>
    `;

    let detalles = '';

    detalles += '<div class="chart-container"><h3 class="chart-title">Top 2 Instructores - Sede Norte</h3>';
    if (top2Norte.length > 0) {
      top2Norte.forEach(([instructor, cantidad]) => {
        detalles += `<div class="list-item"><span>${instructor}</span><strong>${cantidad} tutorías</strong></div>`;
      });
    } else {
      detalles += '<p style="text-align: center; color: #666;">No hay datos de Sede Norte</p>';
    }
    detalles += '</div>';

    detalles += '<div class="chart-container"><h3 class="chart-title">Top 2 Instructores - Sede Sur</h3>';
    if (top2Sur.length > 0) {
      top2Sur.forEach(([instructor, cantidad]) => {
        detalles += `<div class="list-item"><span>${instructor}</span><strong>${cantidad} tutorías</strong></div>`;
      });
    } else {
      detalles += '<p style="text-align: center; color: #666;">No hay datos de Sede Sur</p>';
    }
    detalles += '</div>';

    detalles += '<div class="chart-container"><h3 class="chart-title">Cantidad de Tutorías por Sede</h3>';
    Object.entries(stats.sedesTutorias).forEach(([sede, cantidad]) => {
      const porcentaje = ((cantidad / stats.total) * 100).toFixed(1);
      detalles += `<div class="list-item"><span>Sede ${sede}</span><strong>${cantidad} (${porcentaje}%)</strong></div>`;
    });
    detalles += '</div>';

    detalles += '<div class="chart-container"><h3 class="chart-title">Cantidad de Tutorías por Instructor - Sede Norte</h3>';
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
      detalles += '<p style="text-align: center; color: #666;">No hay instructores en Sede Norte</p>';
    }
    detalles += '</div>';

    detalles += '<div class="chart-container"><h3 class="chart-title">Cantidad de Tutorías por Instructor - Sede Sur</h3>';
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
      detalles += '<p style="text-align: center; color: #666;">No hay instructores en Sede Sur</p>';
    }
    detalles += '</div>';

    document.getElementById('detallesStats').innerHTML = detalles;
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
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
    
    if (data.length === 0) {
      alert('No hay registros en el rango de fechas seleccionado');
      return;
    }

    generarExcelSimplificado(data, `PMA_${desde}_a_${hasta}`);
    alert(`${data.length} registros descargados exitosamente`);
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

function generarExcelSimplificado(datos, nombreArchivo) {
  const headers = ['Fecha', 'Hora', 'Documento', 'Nombres', 'Apellidos', 'Programa', 'Instructor', 'Asignatura', 'Tema'];
  
  let csv = headers.join(',') + '\n';
  
  datos.forEach(fila => {
    const fechaUTC = new Date(fila.fecha);
    const fechaColombia = new Date(fechaUTC.getTime() - (5 * 60 * 60 * 1000));
    
    const dia = String(fechaColombia.getUTCDate()).padStart(2, '0');
    const mes = String(fechaColombia.getUTCMonth() + 1).padStart(2, '0');
    const anio = fechaColombia.getUTCFullYear();
    const fechaFormateada = `${dia}/${mes}/${anio}`;
    
    const horas = String(fechaColombia.getUTCHours()).padStart(2, '0');
    const minutos = String(fechaColombia.getUTCMinutes()).padStart(2, '0');
    const horaFormateada = `${horas}:${minutos}`;
    
    const row = [
      fechaFormateada,
      horaFormateada,
      fila.documento,
      fila.nombres,
      fila.apellidos,
      fila.programa,
      fila.instructor,
      fila.asignatura,
      fila.tema
    ];
    
    const rowFormateada = row.map(celda => {
      const celdaStr = String(celda);
      if (celdaStr.includes(',') || celdaStr.includes('"') || celdaStr.includes('\n')) {
        return '"' + celdaStr.replace(/"/g, '""') + '"';
      }
      return celdaStr;
    });
    
    csv += rowFormateada.join(',') + '\n';
  });

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const fechaHoy = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${nombreArchivo}_${fechaHoy}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function generarExcelCompleto(datos, nombreArchivo) {
  const headers = ['Fecha', 'Hora', 'Documento', 'Nombres', 'Apellidos', 'Facultad', 'Programa', 'Semestre', 'Grupo', 
                  'Tipo Acompañamiento', 'Título Curso', 'Sede Estudiante', 'Sede Tutoría', 'Tipo Instructor', 'Instructor', 'Asignatura', 'Tema', 
                  'Motivo Consulta', 'Calificación', 'Sugerencias'];
  
  let csv = headers.join(',') + '\n';
  
  datos.forEach(fila => {
    const fechaUTC = new Date(fila.fecha);
    const fechaColombia = new Date(fechaUTC.getTime() - (5 * 60 * 60 * 1000));
    
    const dia = String(fechaColombia.getUTCDate()).padStart(2, '0');
    const mes = String(fechaColombia.getUTCMonth() + 1).padStart(2, '0');
    const anio = fechaColombia.getUTCFullYear();
    const fechaFormateada = `${dia}/${mes}/${anio}`;
    
    const horas = String(fechaColombia.getUTCHours()).padStart(2, '0');
    const minutos = String(fechaColombia.getUTCMinutes()).padStart(2, '0');
    const horaFormateada = `${horas}:${minutos}`;
    
    const row = [
      fechaFormateada,
      horaFormateada,
      fila.documento,
      fila.nombres,
      fila.apellidos,
      fila.facultad,
      fila.programa,
      fila.semestre,
      fila.grupo,
      fila.tipo_acompanamiento || 'Tutoría',
      fila.titulo_curso || '',
      fila.sede_estudiante || '',
      fila.sede_tutoria,
      fila.tipo_instructor,
      fila.instructor,
      fila.asignatura,
      fila.tema,
      fila.motivo_consulta || '',
      fila.calificacion,
      fila.sugerencias || ''
    ];
    
    const rowFormateada = row.map(celda => {
      const celdaStr = String(celda);
      if (celdaStr.includes(',') || celdaStr.includes('"') || celdaStr.includes('\n')) {
        return '"' + celdaStr.replace(/"/g, '""') + '"';
      }
      return celdaStr;
    });
    
    csv += rowFormateada.join(',') + '\n';
  });

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const fechaHoy = new Date().toISOString().split('T')[0];
  link.setAttribute('href', url);
  link.setAttribute('download', `${nombreArchivo}_${fechaHoy}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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