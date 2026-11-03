# Guía de defensa — Semantic / Lab

## Demostración de cinco minutos

1. Carga **Relaciones cíclicas**. Explica D = {1,2,3}, P = {1,2} y R = {(1,3),(2,1),(3,2)}. Evalúa `∀x (∃y R(x,y))`. Es verdadero: para x=1 el testigo es y=3; para x=2 es y=1; para x=3 es y=2. El universal comprueba los tres elementos.
2. Carga **Un contraejemplo**. `∀x P(x)` es falso porque 3 no pertenece a P. Abre el nodo del caso x=3 y distingue la variable x del elemento 3.
3. Carga **Fórmula abierta**. `P(x,y)` es verdadero con x=0, y=2; cambia a x=2, y=1 y vuelve a evaluar: es falso. La fórmula es la misma; cambió l. En el explorador aparecen nueve entornos y tres resultados verdaderos.
4. Carga **No existe testigo**. `∃x (∀y P(x,y))` es falso. El existencial prueba todos los x; para cada uno, el universal interno encuentra un contraejemplo. No basta con encontrar un x que falla para refutar un existencial.
5. Carga **Funciones y constantes**. Explica cℐ=a, f(a)=b, f(b)=a. En `f(f(x))`, primero se interpreta la aplicación interna. Para ambos elementos se obtiene x de nuevo.
6. Provoca un error: escribe `P(x,y)` en el ejemplo donde P es unario, o añade una función y deja una salida sin asignar. La aplicación rechaza la entrada sin mostrar Verdadero o Falso. Finaliza mostrando el árbol sintáctico y exportando un caso válido.

## Preguntas que conviene poder responder

**¿Qué decide el programa?**

Si ℐ ⊨ₗ φ en una interpretación finita concreta. No decide la validez de φ sobre todas las interpretaciones posibles. El explorador tampoco lo hace: mantiene ℐ fija y varía l.

**¿Qué diferencia hay entre lenguaje, interpretación y entorno?**

El lenguaje define símbolos y aridades. La interpretación asigna el dominio y el significado de constantes, funciones y predicados. El entorno asigna elementos del dominio a variables. La misma fórmula abierta puede cambiar de verdad al cambiar el entorno.

**¿Por qué una función debe tener todas las filas?**

Porque fℐ: D^n → D es una función total. Todo argumento posible tiene exactamente una salida en D. Si faltara una fila, un término podría no tener interpretación. Para |D|=3 y aridad 2 hacen falta nueve entradas.

**¿Por qué las relaciones pueden tener menos de |D|^n tuplas?**

Porque son subconjuntos de D^n. Las tuplas no seleccionadas hacen falso el átomo correspondiente. El proyecto prohíbe que la relación completa esté vacía, pero no exige que sea todo D^n.

**¿Por qué una constante es una función de aridad cero?**

D^0 contiene una sola tupla, (). Asignarle una salida equivale a elegir un elemento de D como significado de la constante.

**¿Cómo se implementa l[x ↦ a]?**

Con una copia del entorno que cambia únicamente x. En JavaScript: `{ ...local, [variable]: a }`. Si otro cuantificador interno usa también x, su cambio es local. Al regresar de la llamada recursiva el entorno externo sigue intacto.

**¿Por qué solo se piden las variables libres si l se define sobre todas las variables?**

El valor de una fórmula solo depende de la asignación de sus variables libres. Las ligadas reciben valores durante la evaluación de sus cuantificadores. Como D no es vacío, una asignación parcial suficiente puede extenderse arbitrariamente a las demás variables sin cambiar la verdad de φ.

**¿Cómo se identifican las variables libres?**

Se recorre el AST con un conjunto de ligadas. Al entrar a ∀x o ∃x se añade x en una copia del conjunto. Una aparición de variable es libre si no está en ese conjunto. En `(∀x P(x)) ∧ P(x)`, la segunda aparición sigue libre.

**¿Cuándo puede detenerse un cuantificador?**

El existencial verdadero se decide con un testigo; el universal falso, con un contraejemplo. Para confirmar un universal o refutar un existencial hay que recorrer todo D. El dominio finito permite completar esas comprobaciones, dentro de los límites de trabajo del programa.

**¿Por qué una implicación con antecedente falso es verdadera?**

La implicación material solo es falsa cuando el antecedente es verdadero y el consecuente falso. Se implementa como `!a || b`, conforme a la tabla de verdad de clase.

**¿Qué pasa si una fórmula tiene un error en una rama que no cambiaría el resultado?**

Se rechaza. La interpretación, la sintaxis y las asignaciones se validan antes de decidir verdad; una entrada mal formada no tiene un valor semántico en esta aplicación.

**¿Por qué no se usa eval?**

La entrada es un lenguaje lógico con reglas propias, no JavaScript. El analizador construye un árbol y el evaluador interpreta únicamente los tipos de nodo permitidos.

**¿Qué aporta el árbol sintáctico?**

Explica cómo se agrupó la fórmula. Por ejemplo, `P(x) ∨ P(y) ∧ P(z)` agrupa primero la conjunción. Permite ver si un cuantificador contiene la implicación o solo su antecedente.

**¿Cómo se sabe que el programa es correcto?**

Se comparan los ejemplos del curso, se prueban las tablas de verdad completas y se verifican cuantificadores mediante cálculos independientes. Hay pruebas específicas de ámbito, funciones, errores y límites. El README y VERIFICACION separan las pruebas del motor de la revisión visual pendiente.

**¿Cómo justificarías la corrección del algoritmo?**

Por inducción estructural. Las variables se interpretan con l y las aplicaciones funcionales con sus tablas totales. Un átomo es verdadero exactamente cuando su tupla interpretada pertenece a la relación. Los conectivos aplican las funciones booleanas correspondientes a sus subfórmulas. Los cuantificadores implementan las condiciones “para todo” o “existe” usando l[x ↦ a]. Si los subárboles se evalúan correctamente, cada constructor también lo hace.

**¿Qué limitaciones tiene?**

Dominios finitos ingresados explícitamente, funciones tabuladas, identificadores ASCII y límites de recursos documentados. No incorpora aritmética infinita ni demuestra validez global. Las entradas que exceden los límites reciben un mensaje y ningún valor de verdad.

## Correspondencia de requisitos con el código

| Requisito | Implementación | Evidencia principal |
|---|---|---|
| Lenguaje configurable | `language`; formulario de símbolos | Pruebas de duplicados, tipos y aridades |
| Interpretación finita | `validateModel`, `product`; tablas gráficas | Funciones parciales/multivaluadas, dominio y tuplas inválidas |
| Conectivos | `tokenize`, `parse`, `evaluateAst` | Tablas de verdad y precedencia |
| Variables y cuantificadores | `freeVariables`, entorno local | Pruebas de ámbito y 360 contrastes cuantificados |
| Interfaz gráfica | `index.html`, `styles.css`, `app.js` | Botones, teclado, tablas y entorno; revisión interactiva pendiente |
| Justificación | Traza recursiva de `evaluateAst` | Testigo, contraejemplo y dos clases de comprobación completa |
| Validación sin verdad para errores | `LogicError`, validación previa | Casos inválidos lanzan error antes de obtener un resultado |

Lee y modifica ejemplos antes de la defensa. La guía facilita explicar el programa; no sustituye comprender las funciones que implementan cada regla.
