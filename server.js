// server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// 📂 Carpeta donde se guardarán los modelos
const MODELS_DIR = path.join(__dirname, "modelos");
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR);
}

// ⚙️ Configuración de multer para recibir múltiples archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const modelId = req.params.id;
    const dir = path.join(MODELS_DIR, modelId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Guarda como model.json y shards.bin
  }
});
const upload = multer({ storage: storage });

// 📌 Ruta para guardar el modelo (usa POST)
app.post("/api/guardar-modelo/:id", upload.any(), (req, res) => {
  const id = req.params.id;
  console.log(`📥 Modelo recibido y guardado en /modelos/${id}`);
  res.json({ message: `Modelo ${id} guardado correctamente` });
});

// 📌 Servir los modelos guardados
app.use("/modelos", express.static(MODELS_DIR));

// ✅ Ruta de prueba
app.get("/", (req, res) => {
  res.send("🚀 Backend activo y corriendo en Render");
});

// 🔥 Puerto dinámico para Render
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
