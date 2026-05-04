# QuantLab · Analyst Platform

Plataforma de research financiero cuantitativo para el mercado argentino y global. Frontend Next.js que consume la API de [quantlab-back](https://github.com/Jehp23/quantlab-back).

**Demo:** [quantlab2.vercel.app](https://quantlab2.vercel.app)

---

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **Lab** | Análisis estadístico completo: performance, VaR/CVaR, normalidad (Jarque-Bera), volatilidad rolling, T-test, ACF + Ljung-Box, heatmap mensual |
| **Simulación** | Monte Carlo sobre portafolios con pesos configurables |
| **Optimización** | Frontera eficiente — máximo Sharpe, mínima varianza, risk parity |
| **Opciones** | Cadena de opciones BYMA con Greeks (delta, gamma, theta, vega, rho) vía data912 |
| **Estadísticas** | Correlaciones, drawdown y métricas comparativas entre activos |

---

## Stack

- **Next.js 14** · App Router
- **jStat** — estadística en el cliente (t-test, distribuciones, ACF)
- **Canvas** — visualizaciones custom

---

## Setup local

```bash
git clone https://github.com/Jehp23/quantlab-front
cd quantlab-front
npm install
```

Crear `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

Requiere [quantlab-back](https://github.com/Jehp23/quantlab-back) corriendo en `localhost:8000`.

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | URL del backend (ej: `https://quantlab-api.onrender.com`) |
