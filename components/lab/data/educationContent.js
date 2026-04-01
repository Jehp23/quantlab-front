export const EDUCATION = {
    hypothesis: {
        icon: '🔬',
        title: 'Test de Hipótesis — T de Student & Test de Rachas',
        objective: 'Determinar si el retorno promedio diario del activo es estadísticamente distinto de cero, o si podría atribuirse al azar. El test de rachas complementa esto verificando si los retornos son independientes entre sí.',
        concepts: [
            { term: 'H₀: μ = 0', def: 'Hipótesis nula: el activo no tiene rendimiento real. Los retornos observados son ruido aleatorio.' },
            { term: 'H₁: μ ≠ 0', def: 'Hipótesis alternativa: existe una tendencia real, positiva o negativa, en los retornos.' },
            { term: 'p-value', def: 'Probabilidad de observar estos datos (o más extremos) asumiendo que H₀ es verdadera. Cuanto menor, más evidencia en contra de H₀.' },
            { term: 'Intervalo de Confianza', def: 'Rango de valores plausibles para el retorno medio verdadero. Si no incluye el 0, hay evidencia de tendencia.' },
            { term: 'Test de Rachas', def: 'Verifica si los retornos son independientes. Pocas rachas indican momentum; muchas indican reversión a la media.' },
        ],
        formulas: [
            { name: 'Estadístico t', expr: 't = x̄ / (s / √n)' },
            { name: 'Intervalo de Confianza', expr: 'IC = x̄ ± t_crit × SE' },
            { name: 'Rachas esperadas', expr: 'μ_R = 2n₊n₋ / n + 1' },
        ],
        interpretation: 'Si p < α (ej: 0.05) rechazamos H₀ y concluimos que hay evidencia estadística de retorno real. El IC es más informativo: si no incluye el 0, el retorno es significativo. Para el test de rachas, si se rechaza H₀, los retornos tienen dependencia temporal.',
        practicalUse: 'Antes de invertir en un activo, verificar que su tendencia histórica es estadísticamente real y no un artefacto del período de muestra. También útil para evaluar estrategias de trading.',
    },

    risk: {
        icon: '🛡️',
        title: 'VaR & CVaR — Riesgo de Pérdida',
        objective: 'Cuantificar la pérdida máxima esperada de un activo bajo distintos niveles de confianza. Es la métrica de riesgo más utilizada en la industria financiera y regulación bancaria (Basilea III).',
        concepts: [
            { term: 'VaR (Value at Risk)', def: 'Pérdida máxima que no se espera superar con un nivel de confianza dado. El VaR al 95% dice: "solo el 5% de los días perdemos más que este valor."' },
            { term: 'VaR Histórico', def: 'Calculado directamente como el percentil de los retornos observados. No asume ninguna distribución.' },
            { term: 'VaR Paramétrico', def: 'Asume normalidad: VaR = μ - z_α × σ. Más simple pero puede subestimar el riesgo si hay colas pesadas.' },
            { term: 'CVaR / Expected Shortfall', def: 'Promedio de las pérdidas que sí superan el VaR. Más conservador y coherente que el VaR: mide el riesgo en el peor escenario.' },
        ],
        formulas: [
            { name: 'VaR Histórico', expr: 'VaR(α) = percentil(α, retornos)' },
            { name: 'VaR Paramétrico', expr: 'VaR(α) = μ − z_α × σ' },
            { name: 'CVaR (ES)', expr: 'CVaR = E[r | r < VaR(α)]' },
        ],
        interpretation: 'El VaR al 95% de −2% significa: "en condiciones normales, solo el 5% de los días se pierde más del 2%." El CVaR te dice cuánto se pierde en promedio en esos días malos. Un CVaR muy superior al VaR indica colas muy pesadas.',
        practicalUse: 'Dimensionar posiciones, definir stop-loss y cumplir requisitos regulatorios. El CVaR es preferido por reguladores porque no ignora el riesgo de cola.',
    },

    performance: {
        icon: '📈',
        title: 'Performance Ajustada por Riesgo',
        objective: 'Evaluar si el retorno obtenido justifica el riesgo asumido. No basta con que un activo suba: debe subir más de lo esperado dado su nivel de riesgo. Para esto existen los ratios de performance.',
        concepts: [
            { term: 'Tasa Libre de Riesgo (Rf)', def: 'Retorno de un activo sin riesgo (ej: bono del tesoro). El activo analizado debe superarla para agregar valor.' },
            { term: 'Sharpe Ratio', def: 'Retorno en exceso por unidad de volatilidad total. El ratio más universal. Sharpe > 1 es bueno; > 2 es excelente.' },
            { term: 'Sortino Ratio', def: 'Como el Sharpe pero penaliza solo la volatilidad negativa. Más justo con activos que tienen alta volatilidad al alza.' },
            { term: 'Calmar Ratio', def: 'Retorno anualizado dividido por el máximo drawdown. Mide cuánto rendimiento se obtiene por cada unidad de caída máxima.' },
            { term: 'Drawdown', def: 'Caída porcentual desde el pico histórico hasta el valle. El máximo drawdown es la peor caída sostenida del período.' },
        ],
        formulas: [
            { name: 'Sharpe', expr: 'S = (R_a − Rf) / σ_a' },
            { name: 'Sortino', expr: 'So = (R_a − Rf) / σ_baja' },
            { name: 'Calmar', expr: 'C = R_a / |MaxDrawdown|' },
        ],
        interpretation: 'Compara Sharpe vs Sortino: si Sortino > Sharpe, el activo tiene más volatilidad al alza que a la baja (positivo). El drawdown muestra el "dolor" máximo que sufrió un inversor que compró en el peor momento. Un Calmar > 1 indica que el retorno anual supera la peor caída histórica.',
        practicalUse: 'Comparar activos o estrategias en igualdad de condiciones. Un activo con mayor retorno pero menor Sharpe puede ser peor que uno con menor retorno y mayor Sharpe.',
    },

    normality: {
        icon: '🔔',
        title: 'Test de Normalidad — Jarque-Bera & QQ-Plot',
        objective: 'Evaluar si los retornos siguen una distribución normal. Esto es un supuesto implícito en el VaR paramétrico, el modelo Black-Scholes y muchos modelos financieros clásicos.',
        concepts: [
            { term: 'Asimetría (Skewness)', def: 'Mide la simetría de la distribución. Skewness < 0 (cola izquierda) significa que las pérdidas extremas son más frecuentes que las ganancias extremas.' },
            { term: 'Curtosis Exceso (Kurtosis)', def: 'Mide el "peso" de las colas. Kurtosis > 0 (leptocúrtica) indica colas más pesadas que la normal: los eventos extremos ocurren más seguido de lo esperado.' },
            { term: 'Jarque-Bera (JB)', def: 'Estadístico que combina skewness y kurtosis para testear normalidad. Sigue una distribución chi-cuadrado con 2 grados de libertad bajo H₀.' },
            { term: 'QQ-Plot', def: 'Gráfico que compara los cuantiles observados con los teóricos de una normal. Si los puntos siguen la línea diagonal, los datos son normales. Las desviaciones revelan colas pesadas o asimetría.' },
        ],
        formulas: [
            { name: 'Skewness', expr: 'S = (1/n) Σ((xᵢ−μ)/σ)³' },
            { name: 'Kurtosis exceso', expr: 'K = (1/n) Σ((xᵢ−μ)/σ)⁴ − 3' },
            { name: 'Jarque-Bera', expr: 'JB = (n/6)(S² + K²/4)' },
        ],
        interpretation: 'Si p < 0.05, se rechaza la normalidad. En la práctica, los retornos financieros casi siempre tienen kurtosis positiva (colas pesadas) y skewness negativa. En el QQ-Plot, las colas que se alejan de la línea hacia afuera indican más eventos extremos de los predichos por la normal.',
        practicalUse: 'Si los retornos no son normales, los modelos basados en normalidad subestiman el riesgo. En ese caso, el VaR histórico es más confiable que el paramétrico.',
    },

    volatility: {
        icon: '📊',
        title: 'Volatilidad Histórica Rolling',
        objective: 'Observar cómo evoluciona la volatilidad del activo en el tiempo. La volatilidad no es constante (fenómeno llamado "clustering de volatilidad"): los períodos de alta volatilidad tienden a agruparse.',
        concepts: [
            { term: 'Volatilidad Rolling', def: 'Desviación estándar de los retornos calculada en una ventana móvil (10, 20 o 30 días). Captura cambios en el régimen de riesgo.' },
            { term: 'Volatilidad Anualizada', def: 'Volatilidad diaria multiplicada por √252. Permite comparar activos y con el implícito de opciones (VIX).' },
            { term: 'Régimen de Volatilidad', def: 'Clasificación del momento actual como "alta" o "baja" volatilidad relativa al promedio histórico. Útil para dimensionar posiciones.' },
            { term: 'Clustering de Volatilidad', def: 'Fenómeno documentado por Mandelbrot: los grandes movimientos tienden a seguir a grandes movimientos. Base del modelo GARCH.' },
        ],
        formulas: [
            { name: 'Vol. Rolling', expr: 'σ_t = std(r[t−w : t])' },
            { name: 'Anualizada', expr: 'σ_anual = σ_diaria × √252' },
        ],
        interpretation: 'Los picos en la volatilidad rolling suelen coincidir con eventos específicos: resultados trimestrales, datos macro, crisis. Comparar la ventana de 10d (reactiva) vs 30d (más suavizada) revela si la volatilidad reciente es temporal o estructural.',
        practicalUse: 'Ajustar el tamaño de posiciones inversamente a la volatilidad (position sizing). En períodos de alta volatilidad, reducir exposición para mantener el riesgo absoluto constante.',
    },

    autocorr: {
        icon: '🔁',
        title: 'Autocorrelación (ACF) — Memoria de los Retornos',
        objective: 'Detectar si los retornos de hoy están correlacionados con los de días anteriores. Bajo la Hipótesis de Mercado Eficiente (forma débil), no debería existir ninguna correlación serial explotable.',
        concepts: [
            { term: 'Autocorrelación en lag k', def: 'Correlación entre el retorno de hoy y el de k días atrás. ACF > 0 = momentum; ACF < 0 = reversión a la media.' },
            { term: 'Banda de Confianza (IC 95%)', def: 'Rango ±1.96/√n. Barras que superan este umbral indican autocorrelación estadísticamente significativa.' },
            { term: 'Test de Ljung-Box', def: 'Prueba conjunta de que todos los lags hasta m son simultáneamente cero. Si p < 0.05, existe dependencia serial.' },
            { term: 'Hipótesis de Mercado Eficiente', def: 'Si los mercados son eficientes en forma débil, toda la información histórica de precios ya está reflejada. No debería haber patrones predecibles.' },
        ],
        formulas: [
            { name: 'ACF en lag k', expr: 'ρ(k) = Cov(rₜ, rₜ₋ₖ) / Var(r)' },
            { name: 'IC 95%', expr: '±1.96 / √n' },
            { name: 'Ljung-Box Q', expr: 'Q = n(n+2) Σ ρ²(k)/(n−k)' },
        ],
        interpretation: 'Si ninguna barra supera las líneas punteadas, los retornos son serialmente independientes (consistente con mercado eficiente). Si el lag 1 es significativo y positivo, hay momentum de corto plazo. Si es negativo, hay reversión a la media intradiaria.',
        practicalUse: 'Identificar si estrategias de momentum (seguir la tendencia) o de reversión (comprar caídas) podrían ser rentables con los datos históricos del activo.',
    },

    montecarlo: {
        icon: '🎲',
        title: 'Simulación Monte Carlo',
        objective: 'Simular miles de posibles trayectorias futuras del activo usando los parámetros estadísticos históricos (μ y σ). Permite obtener una distribución completa de resultados posibles, no solo un escenario único.',
        concepts: [
            { term: 'Trayectoria simulada', def: 'Secuencia de retornos diarios generados aleatoriamente siguiendo N(μ, σ) histórico. Cada trayectoria es un posible futuro.' },
            { term: 'Fan Chart (percentiles)', def: 'El gráfico muestra percentiles p5/p25/p50/p75/p95. La banda se expande con el tiempo porque la incertidumbre se acumula.' },
            { term: 'Mediana (P50)', def: 'Trayectoria central: la mitad de las simulaciones termina por encima y la mitad por debajo.' },
            { term: 'Probabilidad de Pérdida', def: 'Fracción de simulaciones que terminan con retorno negativo al horizonte elegido. Cuantifica el riesgo de forma probabilística.' },
        ],
        formulas: [
            { name: 'Retorno simulado', expr: 'rₜ = μ + σ × Z,  Z ~ N(0,1)' },
            { name: 'Retorno acumulado', expr: 'P_T/P_0 = exp(Σ rₜ)' },
            { name: 'Muestreo Box-Muller', expr: 'Z = √(−2 ln u) · cos(2π v)' },
        ],
        interpretation: 'La apertura del fan chart a lo largo del tiempo refleja la incertidumbre creciente. P50 aproxima el retorno esperado bajo log-normalidad. La diferencia entre P95 y P5 al horizonte elegido da la amplitud del rango de resultados probables.',
        practicalUse: 'Planificar escenarios de inversión, estimar la probabilidad de alcanzar un objetivo de retorno, o comunicar incertidumbre a inversores de manera visual e intuitiva.',
    },

    heatmap: {
        icon: '📅',
        title: 'Heatmap de Retornos Mensuales',
        objective: 'Visualizar el desempeño mensual del activo a lo largo de los años para identificar estacionalidad, patrones recurrentes y períodos de estrés concentrado.',
        concepts: [
            { term: 'Retorno Mensual', def: 'Suma de los retornos logarítmicos diarios del mes, convertida a retorno compuesto: exp(Σr) − 1. Refleja el rendimiento real del mes.' },
            { term: 'Estacionalidad', def: 'Patrón que se repite en los mismos meses a lo largo de los años. Ej: el fenómeno "Sell in May" sugiere retornos menores de mayo a octubre.' },
            { term: 'Intensidad del color', def: 'La saturación del verde/rojo refleja la magnitud del retorno. Un verde oscuro (+5%+) vs verde claro (+1%) permite comparación visual inmediata.' },
            { term: 'Fila de Promedios', def: 'Promedio histórico de cada mes calendario. Revela qué meses tienden a ser sistemáticamente buenos o malos para este activo.' },
        ],
        formulas: [
            { name: 'Retorno mensual', expr: 'R_mes = exp(Σ r_diarios) − 1' },
            { name: 'Retorno anual', expr: 'R_año = exp(Σ r_meses) − 1' },
        ],
        interpretation: 'Buscar columnas (meses) con color consistente a lo largo de los años: eso indica estacionalidad real. Filas (años) completamente rojas identifican años de crisis. Los promedios del pie revelan el "mejor" y "peor" mes histórico del activo.',
        practicalUse: 'Ajustar el timing de entrada/salida basado en estacionalidad histórica. Identificar períodos de alta concentración de pérdidas para evaluar el riesgo sistémico.',
    },

    correlation: {
        icon: '🔗',
        title: 'Correlación entre Activos — Beta & Alfa',
        objective: 'Medir la relación lineal entre los retornos de dos activos. Fundamental para construcción de carteras: activos poco correlacionados entre sí reducen el riesgo total sin sacrificar retorno.',
        concepts: [
            { term: 'Correlación de Pearson (ρ)', def: 'Mide la fuerza y dirección de la relación lineal. Va de −1 (perfectamente inversa) a +1 (perfectamente directa). ρ = 0 implica independencia lineal.' },
            { term: 'Beta (β)', def: 'Sensibilidad del activo A respecto al activo B (benchmark). β > 1: amplifica movimientos del benchmark. β < 0: se mueve en sentido opuesto.' },
            { term: 'Alfa (α)', def: 'Retorno del activo A no explicado por el benchmark. Un alfa positivo indica que el activo genera valor por encima de lo que su beta justifica.' },
            { term: 'R² (Coeficiente de Determinación)', def: 'Proporción de la varianza de A explicada por B. R² = 0.80 significa que el 80% del movimiento de A se explica por B.' },
        ],
        formulas: [
            { name: 'Pearson', expr: 'ρ = Cov(x,y) / (σ_x · σ_y)' },
            { name: 'Beta', expr: 'β = Cov(x,y) / Var(y)' },
            { name: 'Alfa', expr: 'α = μ_x − β · μ_y' },
        ],
        interpretation: 'ρ > 0.7: alta correlación, poco beneficio de diversificación. ρ < 0.3: buen complemento para diversificar. β > 1 con el S&P500: activo agresivo. β < 0: posible cobertura natural. Alfa positivo: el activo "genera valor propio" más allá del mercado.',
        practicalUse: 'Construir carteras diversificadas buscando activos con baja correlación entre sí. Usar beta para entender exposición al mercado. Comparar alfa para seleccionar los mejores activos dentro de una categoría.',
    },
};
