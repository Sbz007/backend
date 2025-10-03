import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";

// Cargar variables de entorno
dotenv.config();

const app = express();

// Configurar CORS para permitir llamadas desde tu frontend
app.use(
  cors({
    origin: ["http://localhost:3000", "https://TU_FRONTEND_DEPLOYADO.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const PORT = process.env.PORT || 8080;
const MONGO_URL = process.env.MONGODB_URL;

if (!MONGO_URL) {
  console.error("❌ No se encontró la variable MONGODB_URL en .env ni en Railway");
  process.exit(1);
}

// Conexión Mongo
mongoose
  .connect(MONGO_URL)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => console.error("❌ Error de conexión:", err));

// --- Directorio local para modelos (Railway permite usar /app/modelos)
const MODELS_DIR = path.join(process.cwd(), "modelos");
if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR);

// --- Configuración de Multer (para subir archivos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const modelId = req.params.id;
    const dir = path.join(MODELS_DIR, modelId);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// ------------------- RUTAS -------------------

// Crear nuevo modelo
app.post("/api/modelos", (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "Falta nombre" });

  const id = Date.now().toString();
  const dir = path.join(MODELS_DIR, id);
  fs.mkdirSync(dir, { recursive: true });

  const info = { id, nombre };
  fs.writeFileSync(path.join(dir, "info.json"), JSON.stringify(info, null, 2));

  res.json({ modelo: info });
});

// Guardar capturas
app.post("/api/capturas", (req, res) => {
  const { modeloId, data } = req.body;
  if (!modeloId || !data) return res.status(400).json({ error: "Faltan datos" });

  const dir = path.join(MODELS_DIR, modeloId);
  if (!fs.existsSync(dir)) return res.status(404).json({ error: "Modelo no encontrado" });

  const filePath = path.join(dir, "capturas.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.json({ message: "Capturas guardadas" });
});

// Subir modelo TensorFlow (model.json + .bin)
app.post("/api/guardar-modelo/:id", upload.array("files"), (req, res) => {
  const id = req.params.id;
  const dir = path.join(MODELS_DIR, id);

  if (!fs.existsSync(dir)) {
    return res.status(404).json({ error: "Modelo no encontrado" });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No se subieron archivos" });
  }

  res.json({ message: `Modelo ${id} guardado correctamente`, files: req.files.map(f => f.originalname) });
});

// Listar modelos
app.get("/api/modelos", (req, res) => {
  const carpetas = fs.readdirSync(MODELS_DIR);
  const modelos = carpetas.map((id) => {
    const infoPath = path.join(MODELS_DIR, id, "info.json");
    let nombre = `Modelo ${id}`;
    if (fs.existsSync(infoPath)) {
      const data = JSON.parse(fs.readFileSync(infoPath, "utf-8"));
      nombre = data.nombre;
    }

    const archivos = fs.existsSync(path.join(MODELS_DIR, id))
      ? fs.readdirSync(path.join(MODELS_DIR, id))
      : [];
    let capturas = [];
    const capturasPath = path.join(MODELS_DIR, id, "capturas.json");
    if (fs.existsSync(capturasPath)) {
      capturas = JSON.parse(fs.readFileSync(capturasPath, "utf-8"));
    }

    return { id, nombre, archivos, capturas };
  });

  res.json(modelos);
});

// Servir modelos TensorFlow directamente
app.use("/modelos", express.static(MODELS_DIR));

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("🚀 Backend activo y corriendo con Mongo + Modelos TF");
});

// Iniciar server
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend en http://localhost:${PORT}`);
});
