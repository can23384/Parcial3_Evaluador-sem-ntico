# Verificación

Fecha: 2 de noviembre de 2026.

## Comprobado automáticamente

- **55 pruebas aprobadas, 0 fallidas**, con `node --test tests/logic.test.cjs tests/presentation.test.cjs`: 47 pruebas originales del motor y ocho adicionales para la actualización de interfaz.
- Los seis ejemplos incluidos devuelven: verdadero, falso, verdadero, falso, verdadero y verdadero.
- Tablas de verdad de negación, conjunción, disyunción, implicación y equivalencia.
- **360 evaluaciones cuantificadas** contrastadas con bucles independientes: 45 combinaciones de relaciones no vacías sobre un dominio binario, con ocho fórmulas por combinación.
- Ámbitos, sombreado de variables, conservación del entorno exterior y variables libres.
- Funciones de aridad cero, uno y dos, términos anidados, igualdad y desigualdad.
- Testigos, contraejemplos, universal verdadero completo y existencial falso completo.
- Sintaxis, símbolos, aridades, dominios, tuplas, totalización funcional y asignaciones inválidas.
- Exploración de nueve entornos con tres resultados verdaderos en el ejemplo de Entornos.
- Límites de pasos, producto cartesiano, exploración y profundidad.
- Revisión de sintaxis JavaScript mediante `node --check`.
- Generación del HTML autónomo y de los seis casos JSON a partir del código fuente; los casos exportados se validan y evalúan al generarlos.
- Notación de dominios, relaciones, constantes y funciones unarias/binarias, incluyendo borradores y etiquetas con delimitadores.
- Raíz completa, orden de los operandos izquierdo/derecho, ramas de cuantificadores, términos y constantes.
- Geometría de árboles anchos y profundos: cajas sin solapamientos por nivel, conexiones padre-hijo correctas y nodos dentro del lienzo.
- Valores escritos arbitrariamente fuera de D siguen siendo rechazados por el motor, sin recibir un valor de verdad.
- Comprobación estática del HTML: etiquetas equilibradas, identificadores únicos, una única pestaña principal visible inicialmente, controles ubicados en el apartado correspondiente y referencias de navegación existentes. Se verificó la eliminación de los cuatro textos solicitados del editor.

Las pruebas automatizadas verifican el motor y los datos de presentación independientes del navegador. La comprobación geométrica del árbol no equivale a inspeccionar el resultado de su renderizado en un navegador. No se afirma haber probado interactivamente los controles gráficos.

## Límite de la revisión gráfica

En la versión inicial, la vista previa por servidor local agotó el tiempo de espera y el control de Chrome se detuvo por no poder verificar su URL activa. Para esta actualización se intentó abrir el HTML autónomo directamente en el navegador integrado; su política rechazó el protocolo `file:` y solo permitió `http:`/`https:`. No se intentó eludir ese bloqueo ni se continuó con la automatización del navegador.

Por tanto, **no se completó la revisión visual ni la prueba interactiva de la interfaz en un navegador real**. El proyecto incluye los controles y manejadores implementados, pero no se afirma que importación/exportación, inserción con botones o el diseño adaptable hayan sido comprobados mediante interacción real.

## Lista breve de aceptación manual

1. Abrir `index.html` o `Semantic-Lab.html`; confirmar que se cargan estilos y aparece únicamente la pestaña Interpretación. Pasar a Evaluación y comprobar Verdadero en el primer ejemplo.
2. Recorrer los seis ejemplos y comparar sus resultados con la lista anterior.
3. Expandir las tablas; modificar relaciones y funciones; comprobar que el resultado anterior desaparece.
4. Insertar operadores mediante botones y evaluar con `Ctrl+Enter`.
5. Probar una fórmula abierta, escribir valores válidos e inválidos y revisar el explorador de entornos. Cambiar de pestaña y confirmar que se conserva el texto.
6. Revisar el AST con raíz, ramas y conexiones; probar zoom, ajuste y desplazamiento. Expandir los nodos de la traza semántica, incluyendo los cuantificadores anidados.
7. Exportar un caso válido, importarlo y verificar que se conservan dominio, tablas, fórmula y entorno. Probar también un JSON inválido y confirmar que no reemplaza el caso actual.
8. Cambiar el dominio y completar las nuevas filas funcionales. Intentar evaluar antes de aplicar el cambio y confirmar el mensaje de error.
9. Usar la interfaz en una ventana estrecha, navegar con Tab y abrir/cerrar la guía con Escape.
10. Comprobar que la notación matemática refleja cada modificación de las tablas y que hay separación entre Dominio y Lenguaje. Verificar que el editor no muestra las etiquetas técnicas eliminadas.

La existencia de esta lista no implica que esas acciones ya se hayan ejecutado.
