const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Carpeta donde se guardarán los modelos
const MODELS_DIR = path.join(__dirname, "modelos");
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR);
}

// ------------------------
// MULTER: subir archivos de modelos
// ------------------------
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
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// ------------------------
// Crear carpeta para un modelo nuevo
// ------------------------
app.post("/api/modelos", (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "Falta nombre" });

  const id = Date.now().toString();
  const dir = path.join(MODELS_DIR, id);
  fs.mkdirSync(dir, { recursive: true });

  res.json({ modelo: { id, nombre } });
});

// ------------------------
// Guardar capturas en archivo
// ------------------------
app.post("/api/capturas", (req, res) => {
  const { modeloId, data } = req.body;
  if (!modeloId || !data) return res.status(400).json({ error: "Faltan datos" });

  const dir = path.join(MODELS_DIR, modeloId);
  if (!fs.existsSync(dir)) return res.status(404).json({ error: "Modelo no encontrado" });

  const filePath = path.join(dir, "capturas.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.json({ message: "Capturas guardadas" });
});

// ------------------------
// Subir archivos del modelo (opcional)
app.post("/api/guardar-modelo/:id", upload.any(), (req, res) => {
  const id = req.params.id;
  console.log(`📥 Modelo recibido y guardado en /modelos/${id}`);
  res.json({ message: `Modelo ${id} guardado correctamente` });
});

// ------------------------
// Endpoint para ver todos los modelos y archivos
// ------------------------
app.get("/modelos", (req, res) => {
  const carpetas = fs.readdirSync(MODELS_DIR);
  let html = "<h1>Modelos guardados</h1><ul>";

  carpetas.forEach((id) => {
    const dir = path.join(MODELS_DIR, id);
    const archivos = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
    html += `<li><strong>Modelo ${id}</strong><br>`;
    html += archivos.map(f => `<a href="/modelos/${id}/${f}" target="_blank">${f}</a>`).join(", ");
    html += `</li>`;
  });

  html += "</ul>";
  res.send(html);
});

// Servir archivos de modelos
app.use("/modelos", express.static(MODELS_DIR));

// Ruta de prueba
app.get("/", (req, res) => res.send("🚀 Backend activo y corriendo en Render"));

// Puerto dinámico
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`));
