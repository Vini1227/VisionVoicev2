// ================= IMPORTS =================
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");

// AWS SDK v3
const {
  RekognitionClient,
  DetectLabelsCommand,
  DetectFacesCommand,
  RecognizeCelebritiesCommand
} = require("@aws-sdk/client-rekognition");
const {
  PollyClient,
  SynthesizeSpeechCommand
} = require("@aws-sdk/client-polly");

// ================= APP =================
const app = express();
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const upload = multer({ dest: "uploads/" });

// ================= AWS =================
const REGION = "us-east-1";
const rekClient = new RekognitionClient({ region: REGION });
const pollyClient = new PollyClient({ region: REGION });

// ================= UTIL =================
const has = (labels, l) => labels.includes(l);

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}

// ================= EMOÇÕES =================
function traduzirEmocao(emotionType, genero = "o") {
  switch (emotionType) {
    case "HAPPY": return "feliz";
    case "SAD": return "triste";
    case "ANGRY": return "com raiva";
    case "CALM": return genero === "a" ? "calma" : "calmo";
    case "SURPRISED": return genero === "a" ? "surpresa" : "surpreso";
    case "CONFUSED": return genero === "a" ? "confusa" : "confuso";
    case "DISGUSTED": return genero === "a" ? "desgostosa" : "desgostoso";
    case "FEAR": return "com medo";
    default: return emotionType.toLowerCase();
  }
}

// ================= ANIMAIS =================
const animalMap = {
  Cat: "gato",
  Dog: "cachorro",
  Kitten: "gato filhote",
  Puppy: "cachorro filhote",
  Bird: "pássaro",
  Rabbit: "coelho",
  Hare: "lebre",
  Kangaroo: "canguru",
  Horse: "cavalo",
  Lion: "leão",
  Tiger: "tigre",
  Bear: "urso",
  Mouse: "rato",
  Rat: "rato",
  Squirrel: "esquilo",
  Elephant: "elefante",
  Monkey: "macaco"
};

// ================= DESCRIÇÕES =================
function descreverPessoa(face) {
  const genero = face.Gender?.Value === "Female" ? "a" : "o";
  let partes = [];

  if (face.Gender?.Value === "Female") partes.push("Uma mulher");
  else if (face.Gender?.Value === "Male") partes.push("Um homem");
  else partes.push("Uma pessoa");

  if (face.AgeRange) {
    const { Low, High } = face.AgeRange;
    partes.push(`com idade aparente entre ${Low} e ${High} anos`);
  }

  if (face.Emotions) {
    const topEmotion = face.Emotions.reduce((prev, curr) =>
      curr.Confidence > (prev?.Confidence || 0) ? curr : prev
    );
    const emocaoTraduzida = traduzirEmocao(topEmotion.Type, genero);
    partes.push(`parece estar ${emocaoTraduzida}`);
  }

  if (face.Smile && face.Smile.Value) partes.push("sorrindo");
  if (face.Eyeglasses && face.Eyeglasses.Value) partes.push("usando óculos");
  else partes.push("sem óculos");

  return partes.join(", ") + ".";
}

function descreverAnimal(labels) {
  // 1️⃣ Tipo principal
  const detected = labels.find(l => Object.keys(animalMap).includes(l));
  const mainAnimal = detected ? animalMap[detected] : "animal";

  // 2️⃣ Labels secundários
  const secundario = [];

  if (labels.includes("Mammal")) secundario.push("mamífero");
  if (labels.includes("Rodent")) secundario.push("roedor");
  if (labels.includes("Bird")) secundario.push("ave");
  if (labels.includes("Reptile")) secundario.push("réptil");
  if (labels.includes("Pet")) secundario.push("aparentando ser um animal doméstico");
  if (labels.includes("Wildlife")) secundario.push("pertencente à vida selvagem");
  if (labels.includes("Kitten") || labels.includes("Puppy")) secundario.push("filhote");

  // 3️⃣ Construção da frase
  let descricao = `Um ${mainAnimal}`;
  if (secundario.length > 0) descricao += `, ${secundario.join(", ")}`;

  // 4️⃣ Ambiente
  if (labels.includes("Outdoor")) descricao += ", em um ambiente externo";
  else if (labels.includes("Indoor")) descricao += ", em um ambiente interno";

  // 5️⃣ Finaliza
  descricao += ".";

  return descricao;
}

function descreverObjeto(labels) {
  if (has(labels, "Computer") || has(labels, "Laptop")) return "Um computador em uso, em ambiente interno.";
  if (has(labels, "Plant")) return "Uma planta em destaque, em um ambiente natural.";
  if (has(labels, "Car")) return "Um carro em um ambiente urbano.";
  if (has(labels, "Building")) return "Um prédio em um ambiente urbano.";
  if (has(labels, "Food")) return "Um alimento sobre uma superfície.";
  return "Uma cena com diversos elementos visuais.";
}

// ================= DESCRIÇÃO COMPLETA =================
async function gerarDescricaoCompleta(labels, imageBytes) {
  let descricao = "";

  // Detectar faces
  let faces = [];
  try {
    const facesCmd = new DetectFacesCommand({
      Image: { Bytes: imageBytes },
      Attributes: ["ALL"]
    });
    const facesRes = await rekClient.send(facesCmd);
    faces = facesRes.FaceDetails || [];
  } catch (err) {
    console.warn("Falha ao detectar faces:", err.message);
  }

  // Detectar celebridades
  let celebs = [];
  try {
    const celebCmd = new RecognizeCelebritiesCommand({
      Image: { Bytes: imageBytes }
    });
    const celebRes = await rekClient.send(celebCmd);
    celebs = celebRes.CelebrityFaces || [];
  } catch (err) {
    console.warn("Falha ao detectar celebridades:", err.message);
  }

  // Filtra celebridades confiáveis (confiança >= 90%)
  const celebsFiltradas = celebs.filter(c => c.MatchConfidence >= 90).map(c => c.Name);

  // Checar presença de animais e pessoas
  const animalLabels = Object.keys(animalMap);
  const personLabels = ["Person", "Face"];
  const temAnimal = labels.some(l => animalLabels.includes(l));
  const temPessoa = labels.some(l => personLabels.includes(l));

  // Prioridade: animais
  if (temAnimal) descricao += descreverAnimal(labels);

  // Pessoas
  if (temPessoa && faces.length > 0) {
    const pessoasDesc = faces.map(face => descreverPessoa(face)).join(" ");
    descricao += (descricao ? " " : "") + pessoasDesc;
  }

  // Celebridades confiáveis
  if (celebsFiltradas.length > 0) {
    descricao += (descricao ? " " : "") + `Essa pessoa provavelmente é: ${celebsFiltradas.join(", ")}.`;
  }

  // Objetos / cenário
  if (!temAnimal && !temPessoa) descricao = descreverObjeto(labels);

  return descricao;
}

// ================= ROTAS =================
app.get("/ping", (req, res) => res.send("API funcionando"));

app.post("/analisar", upload.single("image"), async (req, res) => {
  try {
    const imageBytes = fs.readFileSync(req.file.path);
    const voice = req.body.voice || "Camila";

    // Detectar labels
    const labelsCmd = new DetectLabelsCommand({
      Image: { Bytes: imageBytes },
      MaxLabels: 50,
      MinConfidence: 75
    });
    const rek = await rekClient.send(labelsCmd);
    const labels = rek.Labels.map(l => l.Name);
    console.log("Labels:", labels);

    // Gerar descrição completa
    const descricao = await gerarDescricaoCompleta(labels, imageBytes);
    console.log("Descrição:", descricao);

    // Gerar áudio Polly
    const pollyCmd = new SynthesizeSpeechCommand({
      Text: descricao,
      OutputFormat: "mp3",
      VoiceId: voice,
      LanguageCode: "pt-BR"
    });
    const speech = await pollyClient.send(pollyCmd);
    const audioBuffer = await streamToBuffer(speech.AudioStream);

    res.json({
      descricao,
      audioBase64: audioBuffer.toString("base64")
    });

    fs.unlinkSync(req.file.path);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao processar imagem");
  }
});

// ================= START =================
app.listen(3000, () => console.log("Servidor rodando em http://localhost:3000"));

