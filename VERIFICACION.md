# Verificación

Fecha: 2 de noviembre de 2026.

## Comprobado automáticamente

- **47 pruebas aprobadas, 0 fallidas**, con `node --test tests/logic.test.cjs`.
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

Las pruebas automatizadas verifican el motor independiente del navegador. No simulan ni prueban los controles gráficos.

## Límite de la revisión gráfica

Se intentó abrir una vista previa en el navegador integrado, pero la conexión al servidor local agotó el tiempo de espera. Posteriormente, el control de Chrome fue detenido por la herramienta porque no pudo determinar la URL activa de Windows con suficiente confianza para aplicar su política. No se continuó con la automatización del navegador.

Por tanto, **no se completó la revisión visual ni la prueba interactiva de la interfaz en un navegador real**. El proyecto incluye los controles y manejadores implementados, pero no se afirma que importación/exportación, inserción con botones o el diseño adaptable hayan sido comprobados mediante interacción real.

## Lista breve de aceptación manual

1. Abrir `index.html` o `Semantic-Lab.html`; confirmar que se cargan estilos y aparece Verdadero en el primer ejemplo.
2. Recorrer los seis ejemplos y comparar sus resultados con la lista anterior.
3. Expandir las tablas; modificar relaciones y funciones; comprobar que el resultado anterior desaparece.
4. Insertar operadores mediante botones y evaluar con `Ctrl+Enter`.
5. Probar una fórmula abierta, elegir valores y revisar el explorador de entornos.
6. Revisar el AST y expandir los nodos de la traza, incluyendo los cuantificadores anidados.
7. Exportar un caso válido, importarlo y verificar que se conservan dominio, tablas, fórmula y entorno. Probar también un JSON inválido y confirmar que no reemplaza el caso actual.
8. Cambiar el dominio y completar las nuevas filas funcionales. Intentar evaluar antes de aplicar el cambio y confirmar el mensaje de error.
9. Usar la interfaz en una ventana estrecha, navegar con Tab y abrir/cerrar la guía con Escape.

La existencia de esta lista no implica que esas acciones ya se hayan ejecutado.
