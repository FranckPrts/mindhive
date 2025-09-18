export const builderTours = {
  overview: {
    title: "Resumen del Constructor de Estudios",
    description: "Aprende lo básico de la interfaz del Constructor de Estudios",
    steps: [
      {
        element: '#menue',
        title: "¡Exploremos el Constructor de Estudios!",
        intro: "Usa este menú para cambiar entre los distintos componentes de tu proyecto.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#canvas',
        title: "Lienzo del Constructor de Estudios",
        intro: "Este es tu lienzo del constructor. Aquí puedes arrastrar y soltar bloques para crear tu estudio.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#commentButton',
        title: "Botón de Comentarios",
        intro: "Aquí puedes agregar comentarios a tu estudio.<br><br> Úsalo para discutir tu estudio con colaboradores, profes o tutores.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#sidepanel',
        title: "Panel Lateral",
        intro: "Este panel lateral contiene todo lo necesario para construir tu estudio.<br><br>Explora cada parte con sus respectivos recorridos.",
        position: "auto",
        disableInteraction: false,
      }
    ]
  },
  addBlock: {
    title: "Explora la pestaña 'Agregar un bloque'",
    description: "Asegúrate de seleccionar la pestaña 'Agregar un bloque' antes de comenzar.",
    steps: [
      {
        element: '#addBlock',
        intro: "Haz clic aquí para ver los bloques que puedes usar en tu estudio.",
        position: "auto",
        disableInteraction: false,
      },
      {
        element: '#search',
        intro: "Aquí puedes buscar bloques ...",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#createdBy',
        intro: "... y filtrar los bloques por creador aquí.<br><br>Asegúrate de seleccionar 'Propiedad mía' para ver los bloques que tú creaste.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#sidepanel',
        intro: "Este es el menú de bloques que puedes usar en tu estudio.<ul><li>Bloques Básicos: Ofrecen una experiencia totalmente personalizable para tus participantes.</li><li>Tareas: Usa tareas para medir el comportamiento de los participantes.</li><li>Encuestas: Utiliza estos cuestionarios para recolectar datos.</li><li>Diseño del estudio: Selecciona un bloque de esta categoría para controlar el diseño del estudio, por ejemplo, si estás creando un diseño entre sujetos.</li><li>Plantillas: Aquí puedes encontrar los mismos estudios prediseñados que están en el Área de Descubrimiento.</li></ul>",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#board',
        title: "¡Probémoslo!",
        intro: "Agrega un bloque a tu lienzo:<br><img src='/assets/develop/add-block-to-study-builder.gif' alt='agregar bloque al lienzo' style='max-width: 100%; height: auto;'><br><br>Presiona 'Siguiente' una vez que hayas agregado un bloque.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#block',
        intro: "¡Bien! Ahora que agregaste un bloque, puedes hacer lo siguiente ...<br>Si no lo has hecho, vuelve un paso atrás y agrega un bloque.",
        position: "top",
        disableInteraction: false
      },
      {
        element: '#blockSettings',
        intro: 'Haz clic en este ícono de engranaje para cambiar la configuración del bloque (idioma, parámetros, etc.)',
        position: "top",
        disableInteraction: false
      },
      {
        element: '#blockInfo',
        intro: 'Haz clic en este ícono de exclamación para:<ul><li>Conocer para qué sirve este bloque</li><li>Ver qué variables recoge y qué significan</li><li>Encontrar recursos adicionales</li><ul>',
        position: "top",
        disableInteraction: false
      },
      {
        element: '#blockPlay',
        intro: 'Haz clic en este botón de reproducir para previsualizar el bloque (tip: ¡no olvides probarlo después de cambiar su configuración!)',
        position: "top",
        disableInteraction: false
      }
    ]
  },
  studyFlow: {
    title: "Explora la pestaña 'Flujo del estudio'",
    description: "Asegúrate de seleccionar la pestaña 'Flujo del estudio' antes de comenzar.",
    steps: [
      {
        element: '#flow',
        intro: "La pestaña 'Flujo del estudio' es donde puedes verificar que la estructura del estudio esté como esperas.<br><br>Si no estás conforme con la estructura, siempre puedes volver atrás y modificarla en el lienzo.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#studyFlow',
        intro: "Aquí puedes ver cada una de las condiciones que creaste.<br><br>Bajo cada columna de condición, verás los bloques que la componen.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#firstLine',
        intro: "Aquí puedes ver la probabilidad de que se seleccione cada condición.<br><br>Pasa el mouse sobre la condición para leer una explicación de la probabilidad.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#taskBlocks',
        intro: "Aquí están los bloques que forman parte de cada condición.",
        position: "auto",
        disableInteraction: false
      }
    ]
  },
  studySettings: {
    title: "Explora la pestaña 'Configuración del estudio'",
    description: "Asegúrate de seleccionar la pestaña 'Configuración del estudio' antes de comenzar.",
    steps: [
      {
        element: '#studySettings',
        intro: "En la pestaña 'Configuración del estudio' puedes ajustar la configuración general de tu estudio.",
        position: "left",
        disableInteraction: false
      },
      {
        element: '#studyStatus',
        intro: "Cambia el estado de tu estudio aquí.",
        position: "left",
        disableInteraction: false,
      },
      {
        element: '#studyVersion',
        intro: "Cambia la versión de tu estudio aquí.",
        position: "left",
        disableInteraction: false,
      },
      {
        element: '.studyDescription',
        intro: "Obtén la descripción de tu estudio desde tu propuesta aquí.",
        position: "left",
        disableInteraction: false,
      },
      {
        element: '#studyTags',
        intro: "Agrega etiquetas a tu estudio aquí.",
        position: "left",
        disableInteraction: false,
      }
    ]
  }
};
