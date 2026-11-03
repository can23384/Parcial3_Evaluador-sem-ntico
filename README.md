# Semantic / Lab — MM3032

Evaluador semántico de lógica de primer orden sobre interpretaciones finitas, con interfaz negra y verde neón. Implementado en JavaScript, HTML y CSS, sin bibliotecas externas ni servicios de red.

## Ejecutar

1. Si recibiste el ZIP, extráelo completo.
2. Abre `index.html` con Chrome, Edge o Firefox actualizado.
3. La aplicación carga y evalúa el primer ejemplo. Cambia el caso en **Cargar un ejemplo** o configura tu propia interpretación.

No necesitas Python, Node.js, conexión a Internet, instalación de paquetes ni un servidor para usar la aplicación. Mantén `index.html`, `styles.css` y `src/` juntos. También se entrega `Semantic-Lab.html`, una versión autónoma que reúne la interfaz y el código en un solo archivo.

Los datos permanecen en memoria. **Exportar** descarga el caso completo a JSON; **Importar** lo restaura después de validarlo. Exporta antes de cerrar o de cambiar de ejemplo: no hay guardado automático. Solo se exportan e importan casos completos y válidos.

## Uso paso a paso

1. **Dominio:** ingresa etiquetas separadas por comas y pulsa **Aplicar**. Por ejemplo, `1, 2, 3`. Los elementos se almacenan como etiquetas de texto, no como números con operaciones aritméticas implícitas.
2. **Lenguaje:** declara el nombre, tipo y aridad de cada símbolo. Los nombres distinguen mayúsculas y minúsculas. Una función de aridad cero es una constante.
3. **Interpretación:** abre la tarjeta de cada símbolo. Para un predicado, marca las tuplas incluidas en su relación; las demás no pertenecen a ella. Para una función, elige una salida para **cada** entrada de D^n. Las tablas grandes se paginan en grupos de 32 entradas.
4. **Fórmula:** escribe con el teclado o inserta símbolos con los botones. Se admiten términos con funciones anidadas.
5. **Entorno:** la aplicación detecta las variables libres y solicita sus valores. Las fórmulas cerradas no necesitan asignaciones.
6. **Evaluación:** pulsa **Evaluar fórmula** o `Ctrl+Enter` dentro del editor. Abre los nodos de la traza para ver sus razones, interpretaciones de términos y asignaciones locales.
7. **Exploración:** en **Explorar entornos**, ejecuta todas las asignaciones libres posibles para esta interpretación. **Ver traza** carga una asignación concreta.

Al modificar el caso, el resultado anterior se elimina para evitar mostrar una verdad desactualizada. Los cambios pendientes del dominio deben aplicarse antes de evaluar. Al cambiar D se conservan solo las tuplas y salidas que continúan en D; hay que completar las nuevas entradas funcionales. Para cambiar el nombre, tipo o aridad de un símbolo, elimínalo y vuelve a declararlo.

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

## Correspondencia con el material del curso

Se revisaron los cuatro documentos antes de implementar el motor:

| Material | Conceptos aplicados |
|---|---|
| `MM3032 - Proyecto.pdf`, p. 1 | Los siete requisitos obligatorios: lenguaje, interpretación, sintaxis, variables, interfaz, justificación y validación. |
| `MM3032 - 03 Lógica proposicional (enfoque semántico).pdf`, pp. 3–8 | Negación, conjunción, disyunción, implicación y equivalencia; los conectivos operan sobre valores de verdad. |
| `MM3032 - 10 Interpretaciones.pdf`, pp. 4–9 | Estructura ℐ = ⟨D, C, F, P⟩; constantes, funciones, relaciones y fórmulas abiertas/cerradas. |
| `MM3032 - 11 Entornos (2).pdf`, pp. 3–8 | Entorno l, actualización local l[x ↦ a], evaluación de términos, pertenencia a relaciones y reglas de verdad. |
| `MM3032 - 11 Entornos (2).pdf`, pp. 9–13 | Diferencia entre evaluación en una interpretación, satisfacibilidad y validez lógica. |

El ejemplo de concatenación sobre todas las cadenas de la presentación usa un dominio infinito; no se incorpora como interpretación ejecutable porque el proyecto exige un dominio finito y funciones cerradas en él. Se incluye un ejemplo finito adicional de funciones y constantes.

La diapositiva 5 de Entornos contiene una inconsistencia textual al mencionar cambiar x a `1` después de escribir l[x ↦ b]. La implementación sigue la definición formal de la diapositiva 4: x se asigna a b y el resto del entorno se conserva.

## Arquitectura y partes principales

```text
semantic-lab/
  index.html              Interfaz y guía integrada
  styles.css              Diseño adaptable, negro y verde neón
  src/
    logic.js              Motor lógico independiente del navegador
    app.js                Formularios, eventos y representación visual
    examples.js           Seis casos de demostración
  examples/               Los mismos casos en archivos JSON importables
  tests/logic.test.cjs     Pruebas automatizadas del motor
  tools/build.cjs          Generación reproducible del HTML autónomo
  README.md               Ejecución, sintaxis y arquitectura
  DEFENSA.md              Fundamentos, demostración y preguntas
  VERIFICACION.md          Alcance y resultados de la verificación
  package.json            Comandos de desarrollo, sin dependencias
```

En `logic.js` las responsabilidades están separadas en funciones:

- `language` y `validateModel` verifican nombres, aridades, dominio y tablas. Las funciones se almacenan en mapas de tupla a salida y las relaciones en mapas de pertenencia. Primero se valida **toda** la interpretación, incluidos los símbolos que la fórmula no utiliza.
- `tokenize` reconoce símbolos, identificadores y posiciones. Nunca ejecuta la entrada como código: no utiliza `eval` ni `Function`.
- `parse` implementa descenso recursivo por niveles de precedencia. Produce un árbol de sintaxis abstracta (AST) y verifica tipos de símbolos y aridades.
- `freeVariables` recorre el árbol con un conjunto de variables ligadas específico de cada ámbito.
- `evaluateAst` interpreta términos y evalúa la fórmula recursivamente. Para cuantificar copia el entorno con `{ ...local, [variable]: a }`. El entorno exterior permanece intacto.
- `evaluate` es la entrada pública principal: validación, análisis y evaluación. Devuelve valor, traza, pasos, AST y variables libres. Si hay un error, lanza `LogicError` y no devuelve verdad.
- `explore` enumera las asignaciones de las variables libres **en la interpretación actual** y evalúa cada una.

`app.js` mantiene el caso actual, genera las tablas a partir del producto cartesiano, recoge el entorno y presenta los errores y resultados. Construye el contenido dinámico con `textContent`; los nombres del usuario no se insertan como HTML. La traza visual crea sus descendientes al desplegarlos para evitar generar miles de elementos de golpe.

### Gramática simplificada

```text
formula       ::= equivalencia
equivalencia  ::= implicacion ("↔" implicacion)*
implicacion   ::= disyuncion ("→" implicacion)?
disyuncion    ::= conjuncion ("∨" conjuncion)*
conjuncion    ::= unaria ("∧" unaria)*
unaria        ::= "¬" unaria
                | ("∀" | "∃") variable "."? unaria
                | "(" formula ")"
                | predicado "(" argumentos? ")"
                | predicado_cero
                | termino ("=" | "≠") termino
termino       ::= variable | constante | funcion "(" argumentos? ")"
argumentos    ::= termino ("," termino)*
```

La declaración de cada símbolo determina cuáles identificadores pueden ocupar las posiciones de predicado, función o constante. Los paréntesis de agrupación se aplican a fórmulas; la sintaxis de términos usa los paréntesis de sus aplicaciones funcionales.

### Razones decisivas

- **∃ verdadero:** devuelve un testigo y la prueba del cuerpo en ese entorno.
- **∀ falso:** devuelve un contraejemplo y la explicación del cuerpo falso.
- **∀ verdadero:** comprueba todos los elementos de D y conserva todas las pruebas del cuerpo.
- **∃ falso:** comprueba todos los elementos de D y conserva todas las refutaciones del cuerpo.

La comprobación completa corresponde a todos los valores de la variable del cuantificador. Un cuantificador interno puede detenerse al hallar su propio testigo o contraejemplo, porque ya ha decidido correctamente su cuerpo. Los conectivos binarios explican ambos operandos.

## Restricciones del enunciado y límites de trabajo

El dominio debe ser no vacío. No se aceptan relaciones vacías, aunque sí sean legales en la lógica de primer orden general: es una restricción explícita de este proyecto. Toda función debe ser total, univaluada y tener salidas en D. Las constantes se representan como funciones D^0 → D, con D^0 = {()}.

Un predicado de aridad cero solo puede interpretarse como verdadero bajo la regla de no admitir relaciones vacías: su única relación no vacía es {()}. Para ejemplos de átomos falsos puede usarse un predicado de aridad positiva con una tupla fuera de la relación, manteniendo otra tupla dentro de ella.

Hay límites explícitos para que la interfaz y las explicaciones sean manejables: 20 elementos por dominio, 40 caracteres por etiqueta, 32 símbolos, aridad entre 0 y 6, 4096 tuplas posibles por símbolo, 5000 caracteres y 512 tokens por fórmula, profundidad interna de análisis de 100 niveles, 12 000 pasos por evaluación. El explorador admite 256 entornos y un presupuesto total de 100 000 pasos. La importación admite archivos de hasta 2 MB. Las etiquetas no admiten comas ni caracteres de control.

El límite de profundidad incluye llamadas internas del analizador, por lo que no equivale exactamente a 100 paréntesis. Si se alcanza cualquier límite se reporta el motivo y no se proporciona un valor parcial como resultado. La evaluación tiene costo exponencial en el peor caso respecto de la cantidad de cuantificadores anidados: aproximadamente O(|D|^q · |φ|), además del trabajo de validación de las tablas. La traza conserva los pasos visitados hasta el límite.

## Pruebas y desarrollo

Solo para ejecutar pruebas o regenerar el archivo autónomo se requiere Node.js 18 o superior. Desde la carpeta del proyecto:

```bash
npm test
node tools/build.cjs
```

También puedes ejecutar las pruebas sin npm:

```bash
node --test tests/logic.test.cjs
```

No se necesita `npm install`. El generador escribe `Semantic-Lab.html` en la carpeta superior a `semantic-lab` y actualiza los JSON de `examples/`. Después de editar el código fuente, vuelve a generar el archivo autónomo para que refleje los cambios.

La suite contiene 47 pruebas, incluyendo un contraste exhaustivo de 360 evaluaciones cuantificadas contra bucles JavaScript independientes en todas las combinaciones de una relación unaria no vacía y una relación binaria no vacía de un dominio de dos elementos. Consulta `VERIFICACION.md` para conocer lo que se comprobó y la limitación de la revisión gráfica en este entorno.

## Aportes creativos implementados

1. **Traza semántica desplegable:** conecta cada resultado con las reglas del curso; muestra valores de términos y decisiones de cuantificadores.
2. **Árbol sintáctico y fórmula normalizada:** hacen visible la precedencia y el alcance para detectar ambigüedades al escribir.
3. **Explorador de entornos:** compara todas las asignaciones libres en una interpretación y permite abrir la traza de cada fila. No confunde verdad en una estructura con validez universal.
4. **Casos portátiles:** importación/exportación JSON y ejemplos alineados con las presentaciones.

Estos aportes se entregan como funcionalidades del proyecto; su calificación y la defensa individual dependen de la rúbrica del docente.
