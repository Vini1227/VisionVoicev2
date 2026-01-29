// awsServices.js
// Configuração e serviços AWS (Rekognition, Polly, Translate)

const {
  RekognitionClient,
  DetectLabelsCommand,
  DetectFacesCommand,
  RecognizeCelebritiesCommand,
} = require("@aws-sdk/client-rekognition");

const { PollyClient, SynthesizeSpeechCommand } = require("@aws-sdk/client-polly");
const { TranslateClient, TranslateTextCommand } = require("@aws-sdk/client-translate");

const dicionarioTraducoes = require("./dicionario");

// ================= CONFIGURAÇÃO AWS =================
const REGION = process.env.AWS_REGION || "us-east-2";

const awsConfig = {
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

// Clientes AWS
const rekClient = new RekognitionClient(awsConfig);
const pollyClient = new PollyClient(awsConfig);
const translateClient = new TranslateClient(awsConfig);

// Cache de traduções
const traducaoCache = new Map();

// ================= UTILITÁRIOS =================

/**
 * Converte stream em buffer
 */
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/**
 * Traduz texto do inglês para português
 */
async function translateText(text, usarCache = true) {
  if (!text || text.trim() === "") return text;

  // Verifica cache primeiro
  if (usarCache && traducaoCache.has(text)) {
    console.log(`💾 Cache: ${text} → ${traducaoCache.get(text)}`);
    return traducaoCache.get(text);
  }

  // Verifica dicionário manual (cobre 95% dos casos)
  if (dicionarioTraducoes[text]) {
    const resultado = dicionarioTraducoes[text];
    traducaoCache.set(text, resultado);
    console.log(`📚 Dicionário: ${text} → ${resultado}`);
    return resultado;
  }

  // Tenta Amazon Translate como fallback
  try {
    console.log(`🌐 Amazon Translate: "${text}"...`);
    
    const command = new TranslateTextCommand({
      Text: text,
      SourceLanguageCode: "en",
      TargetLanguageCode: "pt",
    });
    
    const response = await translateClient.send(command);
    const textoTraduzido = response.TranslatedText || text;
    
    if (usarCache) {
      traducaoCache.set(text, textoTraduzido);
    }
    
    console.log(`✅ Traduzido: ${text} → ${textoTraduzido}`);
    return textoTraduzido;
    
  } catch (err) {
    console.log(`⚠️ Amazon Translate indisponível para "${text}", mantendo original`);
    return text;
  }
}

/**
 * Traduz array de textos
 */
async function traduzirArray(textos) {
  console.log(`📝 Traduzindo ${textos.length} labels...`);
  const promises = textos.map(texto => translateText(texto));
  const resultados = await Promise.all(promises);
  console.log(`✅ ${resultados.length} labels traduzidas`);
  return resultados;
}

// ================= REKOGNITION =================

/**
 * Detecta labels (objetos, cenas, atividades) na imagem
 */
async function detectLabels(imageBytes) {
  console.log("🔍 Detectando labels...");
  
  const command = new DetectLabelsCommand({
    Image: { Bytes: imageBytes },
    MaxLabels: 50,
    MinConfidence: 60,
  });
  
  const response = await rekClient.send(command);
  return response.Labels || [];
}

/**
 * Detecta faces e atributos (idade, emoção, gênero, etc)
 */
async function detectFaces(imageBytes) {
  console.log("👤 Detectando faces...");
  
  try {
    const command = new DetectFacesCommand({ 
      Image: { Bytes: imageBytes }, 
      Attributes: ["ALL"] 
    });
    
    const response = await rekClient.send(command);
    return response.FaceDetails || [];
    
  } catch (err) {
    console.log("⚠️ Erro ao detectar faces:", err.message);
    return [];
  }
}

/**
 * Reconhece celebridades na imagem
 */
async function recognizeCelebrities(imageBytes) {
  console.log("⭐ Detectando celebridades...");
  
  try {
    const command = new RecognizeCelebritiesCommand({ 
      Image: { Bytes: imageBytes } 
    });
    
    const response = await rekClient.send(command);
    
    // Log de debug
    if (response.CelebrityFaces && response.CelebrityFaces.length > 0) {
      response.CelebrityFaces.forEach(c => {
        console.log(`⭐ Celebridade: ${c.Name} (${c.MatchConfidence.toFixed(1)}% confiança)`);
      });
    }
    
    return response.CelebrityFaces || [];
    
  } catch (err) {
    console.log("⚠️ Erro ao detectar celebridades:", err.message);
    return [];
  }
}

// ================= POLLY =================

/**
 * Converte texto em áudio com Amazon Polly
 */
async function synthesizeSpeech(texto, voiceId = "Camila") {
  console.log("🔊 Gerando áudio com Polly...");
  
  const command = new SynthesizeSpeechCommand({ 
    Text: texto, 
    OutputFormat: "mp3", 
    VoiceId: voiceId, 
    LanguageCode: "pt-BR",
    Engine: "neural" // Voz neural = mais natural
  });
  
  const response = await pollyClient.send(command);
  const audioBuffer = await streamToBuffer(response.AudioStream);
  const audioBase64 = audioBuffer.toString("base64");
  
  return {
    audioBuffer,
    audioBase64,
    audioDataUrl: `data:audio/mpeg;base64,${audioBase64}`,
  };
}

// ================= EXPORTAÇÕES =================

module.exports = {
  // Clientes
  rekClient,
  pollyClient,
  translateClient,
  
  // Constantes
  REGION,
  
  // Utilitários
  streamToBuffer,
  translateText,
  traduzirArray,
  
  // Rekognition
  detectLabels,
  detectFaces,
  recognizeCelebrities,
  
  // Polly
  synthesizeSpeech,
  
  // Cache
  traducaoCache,
  dicionarioTraducoes,
};
