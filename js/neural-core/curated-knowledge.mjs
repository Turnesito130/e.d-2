/** Biblioteca inicial de conocimiento de E.D.; documentos revisados y versionados localmente. */
import { createKnowledgeBase } from "./knowledge-base.mjs";
export const CURATED_KNOWLEDGE = [
  {
    "id": "kb-sci-001",
    "title": "Principio de Arquímedes",
    "domain": "science",
    "text": "El principio de Arquímedes establece que un cuerpo total o parcialmente sumergido en un fluido experimenta un empuje vertical hacia arriba igual al peso del fluido que desaloja. La flotación depende de la relación entre el peso del cuerpo y el empuje.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-002",
    "title": "Masa, peso y gravedad",
    "domain": "science",
    "text": "La masa cuantifica la inercia y se mide en kilogramos. El peso es una fuerza gravitatoria, se mide en newtons y cerca de la superficie terrestre se aproxima mediante P = m × g, con g alrededor de 9,81 m/s².",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-003",
    "title": "Velocidad de la luz y del sonido",
    "domain": "science",
    "text": "En el vacío, la luz viaja aproximadamente a 299.792.458 metros por segundo. El sonido necesita un medio material y en aire a temperatura ambiente viaja aproximadamente a 343 metros por segundo. Por eso normalmente vemos un relámpago antes de escuchar el trueno.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-math-001",
    "title": "Orden de operaciones",
    "domain": "mathematics",
    "text": "En expresiones aritméticas se resuelven primero paréntesis, después potencias y raíces, luego multiplicaciones y divisiones de izquierda a derecha, y finalmente sumas y restas de izquierda a derecha.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-hist-001",
    "title": "Revolución francesa",
    "domain": "history",
    "text": "La Revolución francesa comenzó en 1789 y transformó profundamente las instituciones políticas y sociales de Francia. La toma de la Bastilla ocurrió el 14 de julio de 1789 y se convirtió en uno de sus símbolos principales.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-tech-001",
    "title": "Qué es un sistema operativo",
    "domain": "technology",
    "text": "Un sistema operativo administra recursos de hardware como procesador, memoria, almacenamiento y periféricos. También proporciona servicios y abstracciones que permiten ejecutar aplicaciones y gestionar archivos, procesos y usuarios.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-prog-001",
    "title": "Variables let y const en JavaScript",
    "domain": "programming",
    "text": "En JavaScript, let declara una variable cuyo valor puede reasignarse. const declara un vínculo que no puede reasignarse después de inicializarse; si contiene un objeto, sus propiedades pueden seguir siendo mutables salvo que se protejan expresamente.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-lang-001",
    "title": "Metáfora y comparación",
    "domain": "language",
    "text": "Una metáfora identifica directamente un elemento con otro por una semejanza o relación, como «el tiempo es oro». Una comparación expresa explícitamente la semejanza, a menudo con palabras como «como» o «parece».",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-general-001",
    "title": "Cómo responder ante la incertidumbre",
    "domain": "general",
    "text": "Un asistente fiable debe separar hechos, inferencias y opiniones; indicar qué no sabe; evitar inventar fuentes o cifras; y proponer una comprobación cuando la información disponible sea insuficiente o pueda estar desactualizada.",
    "source": "E.D.-2 · criterio de calidad original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-004",
    "title": "Ciclo del agua",
    "domain": "science",
    "text": "El ciclo del agua describe el movimiento continuo del agua entre océanos, atmósfera y continentes. Incluye evaporación, condensación, precipitación, infiltración y escorrentía. La energía solar impulsa gran parte de este ciclo.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-005",
    "title": "Fotosíntesis",
    "domain": "science",
    "text": "La fotosíntesis es el proceso por el que plantas, algas y algunas bacterias convierten energía luminosa en energía química. En las plantas ocurre principalmente en los cloroplastos: utilizan dióxido de carbono y agua para producir azúcares y liberan oxígeno.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-006",
    "title": "La célula",
    "domain": "science",
    "text": "La célula es la unidad básica estructural y funcional de los seres vivos. Las células procariotas no tienen núcleo rodeado por membrana; las eucariotas sí tienen núcleo y orgánulos membranosos. La membrana plasmática regula el intercambio con el entorno.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-007",
    "title": "ADN y genes",
    "domain": "science",
    "text": "El ADN es una molécula que almacena información genética. Un gen es una región de ADN que contribuye a producir un ARN funcional o un producto proteico. El ADN suele organizarse en cromosomas dentro de las células.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-008",
    "title": "Leyes de Newton",
    "domain": "science",
    "text": "Las tres leyes de Newton describen el movimiento: la primera relaciona la fuerza neta nula con el mantenimiento del estado de movimiento; la segunda establece que la fuerza neta es igual a masa por aceleración; la tercera indica que las fuerzas entre dos cuerpos aparecen en pares iguales y opuestos sobre cuerpos distintos.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-009",
    "title": "Energía y conservación",
    "domain": "science",
    "text": "La energía es una magnitud que puede transferirse y transformarse. En un sistema aislado, la energía total se conserva: no se crea ni se destruye, aunque puede cambiar de forma, por ejemplo de energía potencial a cinética.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-010",
    "title": "Ley de Ohm",
    "domain": "science",
    "text": "La ley de Ohm relaciona tensión, corriente y resistencia en un conductor óhmico a temperatura constante. La tensión es igual al producto de la corriente por la resistencia. La corriente se mide en amperios, la tensión en voltios y la resistencia en ohmios.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-011",
    "title": "Sistema solar",
    "domain": "science",
    "text": "El sistema solar está formado por el Sol y los cuerpos que permanecen ligados gravitatoriamente a él, incluidos ocho planetas, planetas enanos, satélites, asteroides y cometas. Los planetas interiores son Mercurio, Venus, Tierra y Marte; los exteriores son Júpiter, Saturno, Urano y Neptuno.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-012",
    "title": "Tiempo atmosférico y clima",
    "domain": "science",
    "text": "El tiempo atmosférico describe el estado de la atmósfera en un lugar y momento, como temperatura, lluvia o viento. El clima describe patrones y promedios de esas condiciones durante periodos largos, habitualmente décadas.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-013",
    "title": "Estructura interna de la Tierra",
    "domain": "science",
    "text": "La Tierra se divide composicionalmente en corteza, manto y núcleo. El núcleo externo es líquido y el núcleo interno es sólido, principalmente por las condiciones de presión y temperatura. El movimiento del material conductor del núcleo externo contribuye al campo magnético terrestre.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-sci-014",
    "title": "Átomos y moléculas",
    "domain": "science",
    "text": "Un átomo es la unidad de un elemento químico y contiene un núcleo con protones y neutrones, rodeado por electrones. Una molécula está formada por dos o más átomos unidos mediante enlaces químicos. Los iones tienen carga eléctrica por ganar o perder electrones.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-math-002",
    "title": "Teorema de Pitágoras",
    "domain": "mathematics",
    "text": "En un triángulo rectángulo, el cuadrado de la longitud de la hipotenusa es igual a la suma de los cuadrados de los catetos. La hipotenusa es el lado opuesto al ángulo recto y es el lado más largo.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-math-003",
    "title": "Porcentajes",
    "domain": "mathematics",
    "text": "Un porcentaje expresa una cantidad como una fracción de cien. Para calcular p por ciento de una cantidad A, se multiplica A por p y se divide entre cien. Un aumento o descuento porcentual se aplica sobre la cantidad de referencia indicada.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-math-004",
    "title": "Fracciones",
    "domain": "mathematics",
    "text": "Una fracción representa partes de una unidad o el cociente entre un numerador y un denominador distinto de cero. Para sumar o restar fracciones se usa un denominador común. Para multiplicarlas se multiplican numeradores entre sí y denominadores entre sí.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-math-005",
    "title": "Probabilidad básica",
    "domain": "mathematics",
    "text": "La probabilidad de un suceso cuantifica su posibilidad de ocurrir y toma valores entre cero y uno. En un modelo de resultados equiprobables, la probabilidad es el número de resultados favorables dividido por el número total de resultados posibles.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-tech-002",
    "title": "Internet y web",
    "domain": "technology",
    "text": "Internet es una red mundial de redes que utiliza protocolos comunes para comunicar dispositivos. La World Wide Web es uno de los servicios que funciona sobre Internet y permite acceder a recursos enlazados mediante navegadores y protocolos como HTTP y HTTPS.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-tech-003",
    "title": "HTML CSS y JavaScript",
    "domain": "programming",
    "text": "HTML define la estructura y el significado del contenido de una página web. CSS controla su presentación visual. JavaScript añade comportamiento e interactividad y puede ejecutarse en el navegador.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-tech-004",
    "title": "Qué es una API",
    "domain": "technology",
    "text": "Una API es una interfaz que define cómo un programa puede solicitar funciones o datos a otro sistema. Una API web suele utilizar solicitudes HTTP y formatos como JSON. La autenticación y los permisos determinan qué operaciones puede realizar el cliente.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-tech-005",
    "title": "Inteligencia artificial y aprendizaje automático",
    "domain": "technology",
    "text": "La inteligencia artificial es un campo que desarrolla sistemas capaces de realizar tareas asociadas con capacidades inteligentes. El aprendizaje automático es una rama de la IA en la que los sistemas ajustan modelos a partir de datos. No todo sistema de IA utiliza aprendizaje automático ni toda automatización es una IA generativa.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  },
  {
    "id": "kb-lang-002",
    "title": "Diferencia entre hecho y opinión",
    "domain": "language",
    "text": "Un hecho es una afirmación que puede contrastarse con evidencias. Una opinión expresa una valoración o interpretación personal. Una inferencia es una conclusión derivada de premisas o datos y debe distinguirse de una observación directa.",
    "source": "E.D.-2 · criterio de calidad original v1",
    "status": "approved"
  },
  {
    "id": "kb-tech-006",
    "title": "Seguridad de contraseñas",
    "domain": "technology",
    "text": "Una contraseña larga y única reduce el riesgo de que una filtración en un servicio permita acceder a otros. Un gestor de contraseñas facilita usar claves diferentes. La autenticación multifactor añade una segunda prueba de identidad y ayuda a proteger cuentas.",
    "source": "E.D.-2 · ficha educativa original v1",
    "status": "approved"
  }
];
export function createCuratedKnowledgeBase(){return createKnowledgeBase(CURATED_KNOWLEDGE);}
