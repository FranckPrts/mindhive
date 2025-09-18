export const projectBoardTours = {
  overview: {
    title: "Resumen del Tablero del Proyecto",
    description: "Aprende cómo navegar y usar la interfaz del tablero del proyecto",
    steps: [
      {
        element: '#menue',
        intro: "Usa este menú para cambiar entre los distintos componentes de tu proyecto.",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#switchMode',
        intro: "Usa este interruptor para cambiar entre el modo edición (columnas y tarjetas) y el modo vista previa (formato largo; aún puedes editar el contenido ahí).<br><br>También puedes descargar tu propuesta en PDF desde aquí.",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#section',
        intro: "Las columnas te ayudan a organizar tu propuesta de proyecto. Cada columna contiene tarjetas con distintos estados a los que puedes acceder.",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#card',
        intro: "Cada tarjeta contiene instrucciones sobre cómo completar tu propuesta. Puedes hacer clic en la tarjeta para ver las instrucciones y cambiar su estado.",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#cardWithTag',
        intro: "Las tarjetas con esta etiqueta enviarán su contenido al Centro de Retroalimentación para revisión una vez que las hayas enviado.<br><br>Cada tarjeta tiene etiquetas que indican en qué etapa del proceso de retroalimentación debe incluirse su contenido.<br><br>Las etiquetas amarillas indican que la tarjeta aún no ha sido enviada, mientras que las azules indican que ya fue enviada.",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#submitCard',
        intro: "Este botón te permite enviar las tarjetas asociadas a cada etapa de revisión en el Centro de Retroalimentación.",
        position: "bottom",
        disableInteraction: false
      },
      {
        element: '#connectArea',
        intro: "Haz clic aquí para agregar colaboradores a tu proyecto y vincularlo a una clase.",
        position: "bottom",
        disableInteraction: false
      }
    ]
  }
};