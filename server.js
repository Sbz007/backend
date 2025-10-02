// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Cargar variables de entorno desde .env
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Puerto
const PORT = process.env.PORT || 8080;

// URL de Mongo (Railway o local)
const MONGO_URL = process.env.MONGODB_URL;

if (!MONGO_URL) {
  console.error("❌ No se encontró la variable MONGODB_URL en .env ni en Railway");
  process.exit(1); // Detener si no existe
}

// Conectar a MongoDB
mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Conectado a MongoDB");
  })
  .catch((err) => {
    console.error("❌ Error de conexión:", err);
  });

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("🚀 Backend funcionando correctamente");
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend en http://localhost:${PORT}`);
});
