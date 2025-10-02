// server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

// ------------------------
// 🔗 Conexión a MongoDB
// ------------------------
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ Conectado a MongoDB"))
.catch((err) => console.error("❌ Error de conexión:", err));

// ------------------------
// 📦 Esquemas y Modelos
// ------------------------
const ModeloSchema = new mongoose.Schema({
  nombre: String,
  capturas: { type: Array, default: [] },
  archivos: { type: Array, default: [] },
}, { timestamps: true });

const Modelo = mongoose.model("Modelo", ModeloSchema);

// ------------------------
// MULTER (guardar archivos en memoria)
// ------------------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ------------------------
// Crear un nuevo modelo
// ------------------------
app.post("/api/modelos", async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) return res.status(400).json({ error: "Falta nombre" });

    const modelo = new Modelo({ nombre });
    await modelo.save();

    res.json({ modelo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// Guardar capturas en Mongo
// ------------------------
app.post("/api/capturas", async (req, res) => {
  try {
    const { modeloId, data } = req.body;
    if (!modeloId || !data) return res.status(400).json({ error: "Faltan datos" });

    const modelo = await Modelo.findById(modeloId);
    if (!modelo) return res.status(404).json({ error: "Modelo no encontrado" });

    modelo.capturas = data;
    await modelo.save();

    res.json({ message: "✅ Capturas guardadas" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// Subir archivos al modelo
// ------------------------
app.post("/api/guardar-modelo/:id", upload.any(), async (req, res) => {
  try {
    const { id } = req.params;
    const modelo = await Modelo.findById(id);
    if (!modelo) return res.status(404).json({ error: "Modelo no encontrado" });

    // Guardar nombres de archivos (puedes almacenar binarios si necesitas)
    const archivos = req.files.map(file => file.originalname);
    modelo.archivos.push(...archivos);

    await modelo.save();

    res.json({ message: `✅ Archivos guardados en modelo ${id}`, archivos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// Obtener lista de modelos
// ------------------------
app.get("/api/modelos", async (req, res) => {
  try {
    const modelos = await Modelo.find();
    res.json(modelos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------------
// Ruta de prueba
// ------------------------
app.get("/", (req, res) => res.send("🚀 Backend con MongoDB activo y corriendo"));

// ------------------------
// Puerto dinámico
// ------------------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor backend en http://localhost:${PORT}`)
);
