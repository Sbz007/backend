// server.js
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

// Base de datos en memoria (temporal)
let modelos = [];

// ------------------------
// MULTER: para subir archivos de modelos
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
    cb(null, file.originalname); // Guarda como model.json y shards.bin
  }
});
const upload = multer({ storage });

// ------------------------
// Rutas API
// ------------------------

// Crear modelo
app.post("/api/modelos", (req, res) => {
  const { nombre } = req.body;
  if (!nombre) return res.status(400).json({ error: "Falta nombre" });

  const modelo = { id: Date.now().toString(), nombre, capturas: [] };
  modelos.push(modelo);

  // Crear carpeta física del modelo
  const dir = path.join(MODELS_DIR, modelo.id);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  res.json({ modelo });
});

// Guardar capturas
app.post("/api/capturas", (req, res) => {
  const { modeloId, data } = req.body;
  const modelo = modelos.find((m) => m.id === modeloId);
  if (!modelo) return res.status(404).json({ error: "Modelo no encontrado" });

  modelo.capturas.push(...data);

  // Guardar capturas en archivo JSON
  const filePath = path.join(MODELS_DIR, modeloId, "capturas.json");
  fs.writeFileSync(filePath, JSON.stringify(modelo.capturas, null, 2));

  res.json({ message: "Capturas guardadas", modelo });
});

// Subir modelo de ML (opcional, usando multer)
app.post("/api/guardar-modelo/:id", upload.any(), (req, res) => {
  const id = req.params.id;
  console.log(`📥 Modelo recibido y guardado en /modelos/${id}`);
  res.json({ message: `Modelo ${id} guardado correctamente` });
});

// ------------------------
// Endpoint para ver todos los modelos en el navegador
// ------------------------
app.get("/modelos", (req, res) => {
  const modelosData = modelos.map((m) => {
    const dir = path.join(MODELS_DIR, m.id);
    let archivos = [];
    if (fs.existsSync(dir)) {
      archivos = fs.readdirSync(dir); // lista los archivos dentro del modelo
    }
    return {
      id: m.id,
      nombre: m.nombre,
      capturas: m.capturas.length,
      archivos
    };
  });

  // Crear HTML con links clicables
  let html = "<h1>Modelos guardados</h1><ul>";
  modelosData.forEach((m) => {
    html += `<li>
      <strong>${m.nombre}</strong> (ID: ${m.id}) - Capturas: ${m.capturas} <br>
      Archivos: `;
    html += m.archivos
      .map((f) => `<a href="/modelos/${m.id}/${f}" target="_blank">${f}</a>`)
      .join(", ");
    html += `</li>`;
  });
  html += "</ul>";

  res.send(html);
});

// Servir modelos guardados (archivos físicos)
app.use("/modelos", express.static(MODELS_DIR));

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("🚀 Backend activo y corriendo en Render");
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});
