export const participantPageTours = {
  overview: {
    title: "Resumen de la Página del Participante",
    description: "Diseña la experiencia de tus participantes.",
    steps: [
      {
        title: "Página del Participante",
        intro: "La página del participante es la que verán cuando sean invitados a tu estudio.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '.preview',
        title: "Panel de Vista Previa",
        intro: "Modifica los componentes en este panel para personalizar la página de inicio de tus participantes.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '.uploadImageContainer',
        title: "Agregar una Imagen",
        intro: "Agrega una imagen a tu página para que sea más atractiva.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '#studyTitle',
        title: "Título del Estudio",
        intro: "Define el título de tu estudio. Ojo, este será el título que verán los participantes.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '.description',
        title: "Descripción",
        intro: "Agrega una descripción a tu estudio para que los participantes sepan qué van a hacer.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '.infoTabsContainer',
        title: "Información Adicional",
        intro: "Agrega pestañas a tu página para entregar más información sobre el estudio.",
        position: "auto",
        disableInteraction: false
      },
      {
        element: '.timeInformationBlock',
        title: "Duración",
        intro: "Indica cuánto tiempo durará tu estudio (en minutos).",
        position: "auto",
        disableInteraction: false,
        scroll: true
      }
    ]
  },
  settings: {
    title: "Configuración del Estudio",
    description: "Personaliza los ajustes de tu estudio.",
    steps: [
      {
        element: '.settings',
        title: "Configuraciones Disponibles",
        intro: "Este panel te permite cambiar las siguientes opciones:<ul><li>Comparte este enlace con tus participantes para invitarlos al estudio.<br>Puedes personalizar el enlace acá (asegúrate de no usar caracteres especiales y prueba que funcione bien).</li><li>Permitir múltiples intentos.</li><li>Abrir o cerrar el estudio a los participantes mostrando u ocultando el botón de 'Participar'.</li><li>Pedir notificaciones por correo electrónico a los participantes.</li><li>Preguntar si el participante es estudiante en Nueva York.</li><li>Pedir el código postal.</li><li>Permitir participación como invitado.</li><li>Pedir consentimiento (si seleccionas esta opción, debes agregar un formulario de consentimiento al estudio).</li><li>Omitir la página del participante.</li><li>Agregar dispositivo externo.</li><li>Pedir el ID de Sona.</li><li>Preguntar si el participante es mayor de 18 años.</li></ul>",
        position: "auto",
        disableInteraction: false
      }
    ]
  }
};
