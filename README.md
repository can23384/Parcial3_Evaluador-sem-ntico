# Parcial 3 / Proyecto Evaluador semántico

Evaluador semántico de lógica de primer orden sobre interpretaciones finitas, con interfaz negra y verde neón. Implementado en JavaScript, HTML y CSS, sin bibliotecas externas ni servicios de red.

## Integrantes
- Eliazar José Pablo Canastuj Matías, 23384
- Diego Alejandro Ramírez Velásquez, 23601

## Ejecutar

1. Abre `index.html` con Chrome, Edge o Firefox actualizado.
2. La aplicación abre **1. Interpretación** y prepara el primer ejemplo. Su resultado está disponible en **3. Evaluación**. Cambia el caso en **Cargar un ejemplo** o configura tu propia interpretación.

No necesitas Python, Node.js, conexión a Internet, instalación de paquetes ni un servidor para usar la aplicación. Mantén `index.html`, `styles.css` y `src/` juntos. 

Los datos permanecen en memoria. **Exportar** descarga el caso completo a JSON; **Importar** lo restaura después de validarlo. Exporta antes de cerrar o de cambiar de ejemplo: no hay guardado automático. Solo se exportan e importan casos completos y válidos.

## Uso paso a paso

La interfaz tiene tres pestañas independientes: **1. Interpretación**, **2. Fórmula** y **3. Evaluación**. Cambiar de pestaña conserva lo escrito y muestra solo las herramientas de ese apartado. Puedes navegar entre pestañas con las flechas del teclado, Inicio y Fin, además de hacer clic.

1. **Dominio:** ingresa etiquetas separadas por comas y pulsa **Aplicar**. Por ejemplo, `1, 2, 3`. Los elementos se almacenan como etiquetas de texto, no como números con operaciones aritméticas implícitas.
2. **Lenguaje:** declara el nombre, tipo y aridad de cada símbolo. Los nombres distinguen mayúsculas y minúsculas. Una función de aridad cero es una constante.
3. **Interpretación:** abre la tarjeta de cada símbolo. Para un predicado, marca las tuplas incluidas en su relación; las demás no pertenecen a ella. Para una función, elige una salida para **cada** entrada de D^n. Las tablas grandes se paginan en grupos de 32 entradas. Al lado se muestra la misma información en notación matemática, con conjuntos y tuplas: `D = { 1, 2, 3 }`, `Pℐ = { 1, 2 }`, `Rℐ = { (1, 3), (2, 1), (3, 2) }`. Las funciones se muestran como conjuntos de pares (entrada, salida), y las constantes como `cℐ = a`. Las etiquetas que contienen puntuación se escriben entre comillas para evitar ambigüedades.
4. **Fórmula:** escribe con el teclado o inserta símbolos con los botones. Se admiten términos con funciones anidadas.
5. **Entorno:** la aplicación detecta las variables libres y ofrece campos de texto libre. Puedes escribir cualquier contenido, sin desplegables ni filtrado automático. Al evaluar, cada valor debe coincidir exactamente con una etiqueta de D; los espacios cuentan. Un campo vacío significa que falta la asignación. Las fórmulas cerradas no necesitan asignaciones. Las salidas de funciones conservan sus selectores.
6. **Evaluación:** pulsa **Evaluar fórmula** o `Ctrl+Enter` desde la pestaña Fórmula para abrir el resultado en **3. Evaluación**. Abre los nodos de la traza para ver sus razones, interpretaciones de términos y asignaciones locales. El **Árbol sintáctico** muestra la fórmula completa como raíz y conecta gráficamente sus subfórmulas y términos. Los conectivos binarios tienen ramas izquierda y derecha; los cuantificadores y la negación tienen una rama; las funciones y predicados tienen una por argumento. Puedes acercar, alejar, ajustar al ancho o recorrer el diagrama con las barras de desplazamiento.
7. **Exploración:** en **Explorar entornos**, ejecuta todas las asignaciones libres posibles para esta interpretación. **Ver traza** carga una asignación concreta.

Al modificar el caso, el resultado anterior se elimina para evitar mostrar una verdad desactualizada. Los cambios pendientes del dominio deben aplicarse antes de evaluar. Al cambiar D se conservan solo las tuplas y salidas funcionales que continúan en D; hay que completar las nuevas entradas funcionales. Los valores escritos en el entorno se conservan y se validan al evaluar, incluso después de cambiar D. Para cambiar el nombre, tipo o aridad de un símbolo, elimínalo y vuelve a declararlo.

## Sintaxis

| Concepto | Símbolos | Alternativas de teclado |
|---|---|---|
| Negación | `¬` | `!`, `~`, `not` |
| Conjunción | `∧` | `&`, `&&`, `and` |
| Disyunción | `∨` | `\|`, `\|\|`, `or` |
| Implicación | `→` | `->`, `=>` |
| Equivalencia | `↔` | `<->`, `<=>` |
| Universal | `∀` | `forall` |
| Existencial | `∃` | `exists` |
| Igualdad / desigualdad | `=`, `≠` | `=`, `!=` |

Los identificadores siguen `[A-Za-z_][A-Za-z0-9_]*`. Las palabras `forall`, `exists`, `not`, `and` y `or` están reservadas. Los operadores escritos como palabras requieren separación del identificador siguiente. En Unicode, escribe `∀x P(x)` o `∀x(P(x))`; no `∀xP(x)`, porque `xP` sería un solo identificador.

Precedencia, de mayor a menor: negación y cuantificadores; conjunción; disyunción; implicación; equivalencia. La implicación asocia a la derecha. Conjunción, disyunción y equivalencia asocian a la izquierda. Los paréntesis sobrescriben la precedencia.

**Alcance del cuantificador:** abarca la siguiente fórmula unaria. `∀x P(x) → P(x)` tiene una aparición libre de x en el consecuente. Para cuantificar toda la implicación escribe `∀x (P(x) → P(x))`. Se admite un punto opcional, por ejemplo `forall x. (P(x))`. El árbol sintáctico muestra una lectura completamente parentizada para comprobar el alcance.

Una variable es un identificador no declarado utilizado en posición de término. Un símbolo funcional o predicado no puede usarse a la vez como variable. Un nombre utilizado con argumentos tiene que estar declarado. Los predicados de aridad cero admiten `p` o `p()`; las constantes admiten `c` o `c()`.

**Elementos y constantes son distintos:** si `D = {1, 2, 3}`, `P(1)` se rechaza porque `1` no es un término de la sintaxis. Puedes asignar `x ↦ 1` y escribir `P(x)`, o declarar una constante `c` interpretada como `1` y escribir `P(c)`. La igualdad compara las etiquetas que resultan al interpretar los términos. No hay suma, multiplicación ni orden aritmético incorporados; se pueden definir mediante tablas finitas cuando corresponda.


## Arquitectura y partes principales

```text
semantic-lab/
  index.html              Interfaz y guía integrada
  styles.css              Diseño adaptable, negro y verde neón
  src/
    logic.js              Motor lógico independiente del navegador
    app.js                Formularios, eventos y representación visual
    examples.js           Seis casos de demostración
    presentation.js       Notación matemática y distribución del árbol SVG
  examples/               Los mismos casos en archivos JSON importables
  tests/logic.test.cjs     Pruebas automatizadas del motor
  tests/presentation.test.cjs  Notación, ramas y geometría del árbol
  tools/build.cjs          Generación reproducible del HTML autónomo
  README.md               Ejecución, sintaxis y arquitectura
  package.json            Comandos de desarrollo, sin dependencias
```


## Pruebas y desarrollo

Solo para ejecutar pruebas o regenerar el archivo autónomo se requiere Node.js 18 o superior. Desde la carpeta del proyecto:

```bash
npm test
node tools/build.cjs
```

También puedes ejecutar las pruebas sin npm:

```bash
node --test tests/logic.test.cjs tests/presentation.test.cjs
```

La suite contiene 55 pruebas: las 47 originales del motor y ocho de notación, distribución del árbol y validación de valores libres. Incluye un contraste exhaustivo de 360 evaluaciones cuantificadas contra bucles JavaScript independientes en todas las combinaciones de una relación unaria no vacía y una relación binaria no vacía de un dominio de dos elementos. Consulta `VERIFICACION.md` para conocer lo que se comprobó y la limitación de la revisión gráfica en este entorno.


