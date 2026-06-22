import { createApp } from './app.js'

const PORT = Number(process.env.PORT) || 3000

createApp().listen(PORT, () => {
  console.log(`demo-shop-app listening on http://localhost:${PORT}`)
  console.log(`Swagger UI:  http://localhost:${PORT}/api/docs`)
  console.log(`Health:      http://localhost:${PORT}/health`)
})
