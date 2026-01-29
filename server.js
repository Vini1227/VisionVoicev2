// server.js
require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");

// Importa serviços AWS
const {
  REGION,
  detectLabels,
  detectFaces,
  recognizeCelebrities,
  synthesizeSpeech,
  traducaoCache,
  dicionarioTraducoes,
} = require("./awsServices");

// Importa serviço de descrições
const { gerarDescricaoCompleta } = require("./descriptionService");

// ================= CONFIGURAÇÃO EXPRESS =================
const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= ROTAS =================

// Log middleware para debug
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

/**
 * Função principal de processamento de imagem
 */
async function processarImagem(req, res) {
  console.log("🎯 Função processarImagem chamada!");
  
  try {
    // Validações
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada" });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "Imagem muito grande. Máximo 5MB." });
    }

    const imageBytes = req.file.buffer;
    const voiceId = req.body.voice || req.body.voiceId || "Camila";

    console.log("\n📸 Processando imagem...");
    console.log(`📦 Tamanho: ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`🎤 Voz: ${voiceId}`);

    // Análise da imagem com AWS Rekognition
    const labels = await detectLabels(imageBytes);
    const faces = await detectFaces(imageBytes);
    const celebrities = await recognizeCelebrities(imageBytes);

    // Gera descrição completa
    const descricao = await gerarDescricaoCompleta(labels, faces, celebrities);

    // Gera áudio com Polly
    const { audioBuffer, audioBase64, audioDataUrl } = await synthesizeSpeech(descricao, voiceId);

    console.log("✅ Processo concluído com sucesso!\n");

    // Retorna resultado
    res.json({
      descricao,
      audioBase64,
      audio: audioDataUrl,
      metadata: {
        tamanhoImagem: req.file.size,
        tamanhoAudio: audioBuffer.length,
        voz: voiceId,
      }
    });

  } catch (err) {
    console.error("❌ Erro no processamento:", err);
    res.status(500).json({ 
      error: "Erro ao processar imagem", 
      detalhes: err.message 
    });
  }
}

// Rota principal
app.post("/analisar", upload.single("image"), processarImagem);

// Rota alternativa (API)
app.post("/api/process-image", upload.single("image"), processarImagem);

/**
 * Status do cache de traduções
 */
app.get("/api/cache-status", (req, res) => {
  res.json({
    dicionarioManual: Object.keys(dicionarioTraducoes).length,
    traducoesEmCache: traducaoCache.size,
    servicoBackup: "Amazon Translate",
    regiao: REGION,
    cobertura: "~95% das labels do Rekognition"
  });
});

/**
 * Status da IA (Groq)
 */
app.get("/api/ia-status", (req, res) => {
  res.json({
    iaAtivada: !!process.env.GROQ_API_KEY,
    modelo: "llama-3.3-70b-versatile",
    provider: "Groq",
    status: process.env.GROQ_API_KEY ? "🟢 Ativo" : "🔴 Desativado",
    descricao: process.env.GROQ_API_KEY 
      ? "IA ativa - descrições serão melhoradas automaticamente" 
      : "IA desativada - usando descrições brutas"
  });
});

/**
 * Health check
 */
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// ================= FRONTEND =================
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// ================= INICIALIZAÇÃO =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`🌎 Região AWS: ${REGION}`);
  console.log(`📚 Dicionário: ${Object.keys(dicionarioTraducoes).length} palavras`);
  console.log(`🌐 Backup: Amazon Translate (quando disponível)`);
  console.log(`💾 Cache ativo`);
  console.log(`✅ Cobertura: ~95% das labels do Rekognition`);
  console.log(`🤖 IA (Groq): ${process.env.GROQ_API_KEY ? '🟢 Ativo' : '🔴 Desativado'}\n`);
  console.log(`📍 Rotas disponíveis:`);
  console.log(`   POST /analisar - Processar imagem`);
  console.log(`   POST /api/process-image - Processar imagem (alternativa)`);
  console.log(`   GET  /api/health - Status do servidor`);
  console.log(`   GET  /api/cache-status - Status do cache`);
  console.log(`   GET  /api/ia-status - Status da IA\n`);
});
