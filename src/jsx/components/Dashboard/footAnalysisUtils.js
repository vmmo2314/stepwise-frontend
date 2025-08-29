// footAnalysisUtils.js
/**
 * Utilidades para el análisis de pisada
 * Funciones para calcular índice de arco y distribución de peso
 */

/**
 * Calcula el índice de arco basado en los datos de los sensores
 * @param {Array} features - Array de valores de los sensores
 * @returns {number} - Índice de arco calculado
 */
export function calcularIndiceArco(features) {
  // Asegurarse de que features sea un array
  const valores = Array.isArray(features) ? features : Object.values(features)

  // Extraer valores relevantes para cada zona del pie
  const antepieSensores = [valores[0], valores[1], valores[2], valores[3]]
  const mediopieSensores = [valores[5], valores[6]]
  const retropieSensores = [valores[7], valores[8]]

  // Sumar valores por zona
  const sumaAntepie = antepieSensores.reduce((sum, valor) => sum + (isNaN(valor) ? 0 : valor), 0)
  const sumaMediopie = mediopieSensores.reduce((sum, valor) => sum + (isNaN(valor) ? 0 : valor), 0)
  const sumaRetropie = retropieSensores.reduce((sum, valor) => sum + (isNaN(valor) ? 0 : valor), 0)

  // Calcular índice (evitando división por cero)
  const pesoTotal = sumaAntepie + sumaMediopie + sumaRetropie
  if (pesoTotal === 0) return 0

  // Fórmula del índice de arco
  return sumaMediopie / pesoTotal
}

/**
 * Determina la distribución de peso entre las diferentes zonas del pie
 * @param {Array} features - Array de valores de los sensores
 * @returns {Object} - Objeto con porcentajes de distribución
 */
export function determinarDistribucion(features) {
  // Asegurarse de que features sea un array
  const valores = Array.isArray(features) ? features : Object.values(features)

  // Extraer valores por zona
  const antepieSensores = [valores[0], valores[1], valores[2], valores[3]]
  const mediopieSensores = [valores[5], valores[6]]
  const retropieSensores = [valores[7], valores[8]]

  // Sumar valores por zona
  const sumaAntepie = antepieSensores.reduce((sum, valor) => sum + (isNaN(valor) ? 0 : valor), 0)
  const sumaMediopie = mediopieSensores.reduce((sum, valor) => sum + (isNaN(valor) ? 0 : valor), 0)
  const sumaRetropie = retropieSensores.reduce((sum, valor) => sum + (isNaN(valor) ? 0 : valor), 0)

  // Calcular porcentajes (evitando división por cero)
  const pesoTotal = sumaAntepie + sumaMediopie + sumaRetropie
  if (pesoTotal === 0) {
    return { antepie: 0, mediopie: 0, retropie: 0 }
  }

  return {
    antepie: (sumaAntepie / pesoTotal) * 100,
    mediopie: (sumaMediopie / pesoTotal) * 100,
    retropie: (sumaRetropie / pesoTotal) * 100,
  }
}

/**
 * Interpreta el tipo de pie basado en el índice de arco
 * @param {number} indiceArco - Índice de arco calculado
 * @returns {Object} - Objeto con información del tipo de pie
 */
export function interpretarTipoPie(indiceArco) {
  if (indiceArco < 0.21) {
    return {
      tipo: 1,
      nombre: "Pie plano",
      descripcion: "El pie tiene un arco muy bajo o ausente. Puede estar asociado con pronación excesiva.",
    }
  } else if (indiceArco >= 0.21 && indiceArco <= 0.26) {
    return {
      tipo: 2,
      nombre: "Pie normal",
      descripcion: "El pie tiene un arco bien formado y una biomecánica adecuada.",
    }
  } else {
    return {
      tipo: 3,
      nombre: "Pie cavo",
      descripcion:
        "El pie tiene un arco elevado. Puede estar asociado con supinación excesiva y menor absorción de impactos.",
    }
  }
}

/**
 * Genera recomendaciones basadas en el tipo de pie y distribución
 * @param {Object} analisis - Objeto con índice de arco y distribución
 * @returns {Array} - Array de recomendaciones
 */
export function generarRecomendaciones(analisis) {
  const { indiceArco, distribucionPeso } = analisis
  const recomendaciones = []

  // Recomendaciones según tipo de pie
  if (indiceArco < 0.21) {
    recomendaciones.push("Considere calzado con buen soporte de arco")
    recomendaciones.push("Las plantillas con soporte medial pueden ayudar a controlar la pronación")
  } else if (indiceArco > 0.26) {
    recomendaciones.push("Calzado con buena amortiguación para compensar la rigidez del pie")
    recomendaciones.push("Considere plantillas que distribuyan mejor la presión")
  }

  // Recomendaciones según distribución de peso
  if (distribucionPeso.antepie > 45) {
    recomendaciones.push("Incluir apoyo metatarsal para redistribuir la presión en el antepié")
  }

  if (distribucionPeso.retropie > 45) {
    recomendaciones.push("Considere calzado con talón amortiguado para reducir impacto")
  }

  // Recomendación general
  recomendaciones.push("Mantenga un programa regular de ejercicios para fortalecer los músculos de pies y tobillos")

  return recomendaciones
}

/**
 * Procesa una cadena de características en formato "feature1:valor1,feature2:valor2"
 * @param {string} datosString - Cadena con los datos del sensor
 * @returns {Array} - Array de valores procesados
 */
export function procesarDatosESP32(datosString) {
  const pares = datosString.split(",")
  const features = []

  for (const par of pares) {
    const [clave, valor] = par.split(":")
    if (valor !== undefined) {
      features.push(Number.parseFloat(valor))
    }
  }

  return features
}

/**
 * Función principal que realiza análisis completo de los datos
 * @param {string|Array|Object} datos - Datos a analizar (cadena, array u objeto)
 * @returns {Object} - Resultado completo del análisis
 */
export function analizarPisadaCompleto(datos) {
  // Determinar el tipo de datos y procesarlos adecuadamente
  let features

  if (typeof datos === "string") {
    // Si es una cadena en formato "feature1:valor,feature2:valor"
    features = procesarDatosESP32(datos)
  } else if (Array.isArray(datos)) {
    // Si ya es un array de valores
    features = datos
  } else if (typeof datos === "object") {
    // Si es un objeto con propiedades numeradas
    features = Object.values(datos)
  } else {
    // Si es un valor simple (como la predicción 1, 2 o 3)
    return {
      indiceArco: 0,
      distribucionPeso: { antepie: 0, mediopie: 0, retropie: 0 },
      tipoPie: interpretarTipoPie(datos === 1 ? 0.15 : datos === 3 ? 0.3 : 0.23),
    }
  }

  // Calcular los valores principales
  const indiceArco = calcularIndiceArco(features)
  const distribucionPeso = determinarDistribucion(features)
  const tipoPie = interpretarTipoPie(indiceArco)

  // Generar recomendaciones
  const recomendaciones = generarRecomendaciones({ indiceArco, distribucionPeso })

  // Retornar el análisis completo
  return {
    indiceArco,
    distribucionPeso,
    tipoPie,
    recomendaciones,
  }
}
