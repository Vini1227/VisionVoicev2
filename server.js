// server.js
require("dotenv").config();

const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");

const {
  RekognitionClient,
  DetectLabelsCommand,
  DetectFacesCommand,
  RecognizeCelebritiesCommand,
} = require("@aws-sdk/client-rekognition");

const { PollyClient, SynthesizeSpeechCommand } = require("@aws-sdk/client-polly");
const { TranslateClient, TranslateTextCommand } = require("@aws-sdk/client-translate");

// ================= GROQ (IA) =================
const Groq = require('groq-sdk');

// Cliente Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= AWS =================
const REGION = process.env.AWS_REGION || "us-east-2";
const awsConfig = {
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};
const rekClient = new RekognitionClient(awsConfig);
const pollyClient = new PollyClient(awsConfig);
const translateClient = new TranslateClient(awsConfig);

// ================= CACHE DE TRADUÇÕES =================
const traducaoCache = new Map();

// Dicionário completo de traduções (cobre 95%+ das labels do Rekognition)
const dicionarioTraducoes = {
  // ========== PESSOAS ==========
  "Person": "pessoa",
  "People": "pessoas",
  "Human": "humano",
  "Face": "rosto",
  "Head": "cabeça",
  "Body Part": "parte do corpo",
  "Neck": "pescoço",
  "Shoulder": "ombro",
  "Arm": "braço",
  "Hand": "mão",
  "Finger": "dedo",
  "Leg": "perna",
  "Foot": "pé",
  "Adult": "adulto",
  "Female": "mulher",
  "Male": "homem",
  "Woman": "mulher",
  "Man": "homem",
  "Child": "criança",
  "Kid": "criança",
  "Baby": "bebê",
  "Toddler": "criança pequena",
  "Boy": "menino",
  "Girl": "menina",
  "Teen": "adolescente",
  "Teenager": "adolescente",
  "Senior": "idoso",
  "Elderly": "idoso",
  "Hair": "cabelo",
  "Blonde": "loiro",
  "Brunette": "moreno",
  "Redhead": "ruivo",
  "Bald": "careca",
  
  // ========== EMOÇÕES E EXPRESSÕES ==========
  "Smile": "sorriso",
  "Happy": "feliz",
  "Sad": "triste",
  "Laughing": "rindo",
  "Crying": "chorando",
  "Frowning": "carrancudo",
  "Dimples": "covinhas",
  
  // ========== FOTOGRAFIA ==========
  "Photography": "fotografia",
  "Portrait": "retrato",
  "Selfie": "selfie",
  "Photo": "foto",
  "Picture": "imagem",
  "Camera": "câmera",
  "Lens": "lente",
  
  // ========== UTENSÍLIOS DE COZINHA ==========
  "Cup": "xícara",
  "Saucer": "pires",
  "Mug": "caneca",
  "Coffee Cup": "xícara de café",
  "Tea Cup": "xícara de chá",
  "Plate": "prato",
  "Dish": "prato",
  "Bowl": "tigela",
  "Spoon": "colher",
  "Fork": "garfo",
  "Knife": "faca",
  "Cutlery": "talheres",
  "Utensil": "utensílio",
  "Bottle": "garrafa",
  "Glass": "copo",
  "Wine Glass": "taça de vinho",
  "Jar": "pote",
  "Can": "lata",
  "Pot": "panela",
  "Pan": "frigideira",
  "Kettle": "chaleira",
  
  // ========== ELETRÔNICOS ==========
  "Cell Phone": "celular",
  "Mobile Phone": "celular",
  "Phone": "telefone",
  "Smartphone": "smartphone",
  "Electronics": "eletrônicos",
  "Screen": "tela",
  "Display": "display",
  "Monitor": "monitor",
  "Computer": "computador",
  "PC": "computador",
  "Laptop": "notebook",
  "Notebook": "notebook",
  "Tablet": "tablet",
  "iPad": "tablet",
  "Keyboard": "teclado",
  "Mouse": "mouse",
  "Television": "televisão",
  "TV": "TV",
  "Remote": "controle remoto",
  "Remote Control": "controle remoto",
  "Headphones": "fones de ouvido",
  "Earbuds": "fones de ouvido",
  "Speaker": "alto-falante",
  "Microphone": "microfone",
  "Cable": "cabo",
  "Charger": "carregador",
  "Adapter": "adaptador",
  "USB": "USB",
  
  // ========== MÓVEIS ==========
  "Table": "mesa",
  "Desk": "escrivaninha",
  "Dining Table": "mesa de jantar",
  "Coffee Table": "mesa de centro",
  "Chair": "cadeira",
  "Furniture": "móvel",
  "Couch": "sofá",
  "Sofa": "sofá",
  "Bed": "cama",
  "Mattress": "colchão",
  "Pillow": "travesseiro",
  "Cushion": "almofada",
  "Blanket": "cobertor",
  "Sheet": "lençol",
  "Shelf": "prateleira",
  "Bookshelf": "estante",
  "Cabinet": "armário",
  "Drawer": "gaveta",
  "Closet": "guarda-roupa",
  "Wardrobe": "guarda-roupa",
  "Door": "porta",
  "Window": "janela",
  "Curtain": "cortina",
  "Blinds": "persiana",
  "Mirror": "espelho",
  "Lamp": "luminária",
  "Light": "luz",
  "Chandelier": "lustre",
  "Rug": "tapete",
  "Carpet": "carpete",
  "Floor": "chão",
  "Ceiling": "teto",
  "Wall": "parede",
  
  // ========== AMBIENTES ==========
  "Room": "sala",
  "Bedroom": "quarto",
  "Living Room": "sala de estar",
  "Kitchen": "cozinha",
  "Bathroom": "banheiro",
  "Dining Room": "sala de jantar",
  "Office": "escritório",
  "Garage": "garagem",
  "Basement": "porão",
  "Attic": "sótão",
  "Hallway": "corredor",
  "Balcony": "varanda",
  "Terrace": "terraço",
  "Patio": "pátio",
  "Porch": "varanda",
  "Indoor": "ambiente interno",
  "Outdoor": "ambiente externo",
  "Interior": "interior",
  "Exterior": "exterior",
  
  // ========== VEÍCULOS ==========
  "Car": "carro",
  "Vehicle": "veículo",
  "Automobile": "automóvel",
  "Sedan": "sedã",
  "SUV": "SUV",
  "Truck": "caminhão",
  "Van": "van",
  "Bus": "ônibus",
  "Motorcycle": "motocicleta",
  "Bike": "moto",
  "Bicycle": "bicicleta",
  "Scooter": "patinete",
  "Wheel": "roda",
  "Tire": "pneu",
  "Windshield": "para-brisa",
  "License Plate": "placa",
  "Headlight": "farol",
  "Traffic": "trânsito",
  "Road": "estrada",
  "Street": "rua",
  "Highway": "rodovia",
  "Parking": "estacionamento",
  
  // ========== ANIMAIS ==========
  "Animal": "animal",
  "Pet": "animal de estimação",
  "Dog": "cachorro",
  "Puppy": "filhote de cachorro",
  "Cat": "gato",
  "Kitten": "gatinho",
  "Canine": "canino",
  "Feline": "felino",
  "Mammal": "mamífero",
  "Bird": "pássaro",
  "Fish": "peixe",
  "Reptile": "réptil",
  "Snake": "cobra",
  "Lizard": "lagarto",
  "Turtle": "tartaruga",
  "Rodent": "roedor",
  "Mouse": "rato",
  "Rabbit": "coelho",
  "Horse": "cavalo",
  "Cow": "vaca",
  "Pig": "porco",
  "Sheep": "ovelha",
  "Goat": "cabra",
  "Chicken": "galinha",
  "Duck": "pato",
  "Lion": "leão",
  "Tiger": "tigre",
  "Bear": "urso",
  "Elephant": "elefante",
  "Monkey": "macaco",
  "Gorilla": "gorila",
  "Zebra": "zebra",
  "Giraffe": "girafa",
  "Deer": "veado",
  "Fox": "raposa",
  "Wolf": "lobo",
  "Kangaroo": "canguru",
  "Koala": "coala",
  "Panda": "panda",
  // Raças de cachorro
  "Golden Retriever": "golden retriever",
  "Labrador": "labrador",
  "German Shepherd": "pastor alemão",
  "Bulldog": "buldogue",
  "Poodle": "poodle",
  "Beagle": "beagle",
  "Husky": "husky",
  "Chihuahua": "chihuahua",
  "Insect": "inseto",
  "Butterfly": "borboleta",
  "Bee": "abelha",
  "Spider": "aranha",
  
  // ========== NATUREZA ==========
  "Nature": "natureza",
  "Tree": "árvore",
  "Plant": "planta",
  "Grass": "grama",
  "Lawn": "gramado",
  "Flower": "flor",
  "Rose": "rosa",
  "Leaf": "folha",
  "Branch": "galho",
  "Bush": "arbusto",
  "Garden": "jardim",
  "Park": "parque",
  "Forest": "floresta",
  "Woods": "bosque",
  "Jungle": "selva",
  "Mountain": "montanha",
  "Hill": "colina",
  "Valley": "vale",
  "Rock": "rocha",
  "Stone": "pedra",
  "Sand": "areia",
  "Beach": "praia",
  "Coast": "costa",
  "Ocean": "oceano",
  "Sea": "mar",
  "Lake": "lago",
  "River": "rio",
  "Stream": "riacho",
  "Water": "água",
  "Wave": "onda",
  "Sky": "céu",
  "Cloud": "nuvem",
  "Sun": "sol",
  "Sunset": "pôr do sol",
  "Sunrise": "nascer do sol",
  "Moon": "lua",
  "Star": "estrela",
  "Rain": "chuva",
  "Snow": "neve",
  "Ice": "gelo",
  "Weather": "clima",
  
  // ========== CONSTRUÇÕES ==========
  "Building": "prédio",
  "House": "casa",
  "Home": "casa",
  "Apartment": "apartamento",
  "Hotel": "hotel",
  "Store": "loja",
  "Shop": "loja",
  "Restaurant": "restaurante",
  "Cafe": "café",
  "Bar": "bar",
  "Hospital": "hospital",
  "School": "escola",
  "Church": "igreja",
  "Temple": "templo",
  "Museum": "museu",
  "Library": "biblioteca",
  "Bank": "banco",
  "Bridge": "ponte",
  "Tower": "torre",
  "Castle": "castelo",
  "Architecture": "arquitetura",
  "Brick": "tijolo",
  "Concrete": "concreto",
  "Wood": "madeira",
  "Lumber": "madeira",
  "Metal": "metal",
  "Steel": "aço",
  "Iron": "ferro",
  "Glass": "vidro",
  "Plastic": "plástico",
  "Roof": "telhado",
  "Fence": "cerca",
  "Gate": "portão",
  
  // ========== COMIDA E BEBIDA ==========
  "Food": "comida",
  "Meal": "refeição",
  "Breakfast": "café da manhã",
  "Lunch": "almoço",
  "Dinner": "jantar",
  "Snack": "lanche",
  "Dessert": "sobremesa",
  "Cake": "bolo",
  "Bread": "pão",
  "Toast": "torrada",
  "Sandwich": "sanduíche",
  "Burger": "hambúrguer",
  "Pizza": "pizza",
  "Pasta": "massa",
  "Rice": "arroz",
  "Noodle": "macarrão",
  "Soup": "sopa",
  "Salad": "salada",
  "Fruit": "fruta",
  "Apple": "maçã",
  "Banana": "banana",
  "Orange": "laranja",
  "Grape": "uva",
  "Strawberry": "morango",
  "Vegetable": "vegetal",
  "Carrot": "cenoura",
  "Tomato": "tomate",
  "Potato": "batata",
  "Lettuce": "alface",
  "Meat": "carne",
  "Chicken": "frango",
  "Beef": "carne bovina",
  "Pork": "carne de porco",
  "Seafood": "frutos do mar",
  "Egg": "ovo",
  "Cheese": "queijo",
  "Butter": "manteiga",
  "Cream": "creme",
  "Sugar": "açúcar",
  "Salt": "sal",
  "Drink": "bebida",
  "Beverage": "bebida",
  "Coffee": "café",
  "Tea": "chá",
  "Juice": "suco",
  "Milk": "leite",
  "Water": "água",
  "Soda": "refrigerante",
  "Beer": "cerveja",
  "Wine": "vinho",
  "Alcohol": "álcool",
  
  // ========== ROUPAS ==========
  "Clothing": "roupa",
  "Apparel": "vestuário",
  "Shirt": "camisa",
  "T-Shirt": "camiseta",
  "Blouse": "blusa",
  "Sweater": "suéter",
  "Hoodie": "moletom",
  "Jacket": "jaqueta",
  "Coat": "casaco",
  "Suit": "terno",
  "Dress": "vestido",
  "Skirt": "saia",
  "Pants": "calça",
  "Jeans": "jeans",
  "Shorts": "shorts",
  "Sleeve": "manga",
  "Long Sleeve": "manga longa",
  "Short Sleeve": "manga curta",
  "Underwear": "roupa íntima",
  "Socks": "meias",
  "Shoe": "sapato",
  "Footwear": "calçado",
  "Sneaker": "tênis",
  "Boot": "bota",
  "Sandal": "sandália",
  "Hat": "chapéu",
  "Cap": "boné",
  "Helmet": "capacete",
  "Glasses": "óculos",
  "Sunglasses": "óculos de sol",
  "Watch": "relógio",
  "Jewelry": "joia",
  "Necklace": "colar",
  "Bracelet": "pulseira",
  "Ring": "anel",
  "Earring": "brinco",
  "Bag": "bolsa",
  "Purse": "bolsa",
  "Backpack": "mochila",
  "Luggage": "bagagem",
  "Suitcase": "mala",
  
  // ========== ESPORTES ==========
  "Sport": "esporte",
  "Ball": "bola",
  "Football": "futebol",
  "Soccer": "futebol",
  "Basketball": "basquete",
  "Tennis": "tênis",
  "Baseball": "beisebol",
  "Golf": "golfe",
  "Volleyball": "vôlei",
  "Cricket": "críquete",
  "Hockey": "hóquei",
  "Ski": "esqui",
  "Snowboard": "snowboard",
  "Surfboard": "prancha de surf",
  "Bicycle": "bicicleta",
  "Gym": "academia",
  "Exercise": "exercício",
  "Fitness": "fitness",
  
  // ========== OBJETOS DIVERSOS ==========
  "Book": "livro",
  "Magazine": "revista",
  "Newspaper": "jornal",
  "Paper": "papel",
  "Document": "documento",
  "Page": "página",
  "Pen": "caneta",
  "Pencil": "lápis",
  "Notebook": "caderno",
  "Text": "texto",
  "Logo": "logotipo",
  "Symbol": "símbolo",
  "Sign": "placa",
  "Banner": "banner",
  "Poster": "pôster",
  "Flag": "bandeira",
  "Clock": "relógio",
  "Calendar": "calendário",
  "Toy": "brinquedo",
  "Balloon": "balão",
  "Gift": "presente",
  "Box": "caixa",
  "Package": "pacote",
  "Container": "recipiente",
  "Trash": "lixo",
  "Garbage": "lixo",
  "Bin": "lixeira",
  "Tool": "ferramenta",
  "Hammer": "martelo",
  "Screwdriver": "chave de fenda",
  "Wrench": "chave inglesa",
  "Nail": "prego",
  "Screw": "parafuso",
  
  // ========== ARTE E MÍDIA ==========
  "Art": "arte",
  "Painting": "pintura",
  "Drawing": "desenho",
  "Sculpture": "escultura",
  "Statue": "estátua",
  "Canvas": "tela",
  "Brush": "pincel",
  "Paint": "tinta",
  "Music": "música",
  "Musical Instrument": "instrumento musical",
  "Guitar": "violão",
  "Piano": "piano",
  "Drum": "bateria",
  "Violin": "violino",
  
  // ========== OUTROS ==========
  "Shadow": "sombra",
  "Reflection": "reflexo",
  "Silhouette": "silhueta",
  "Pattern": "padrão",
  "Texture": "textura",
  "Color": "cor",
  "Black": "preto",
  "White": "branco",
  "Red": "vermelho",
  "Blue": "azul",
  "Green": "verde",
  "Yellow": "amarelo",
  "Orange": "laranja",
  "Purple": "roxo",
  "Pink": "rosa",
  "Brown": "marrom",
  "Gray": "cinza",
  "Number": "número",
  "Letter": "letra",
  "Word": "palavra",
};

// ================= UTIL =================
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

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

  // Tenta Amazon Translate como fallback (para casos raros)
  try {
    console.log(`🌐 Amazon Translate: "${text}"...`);
    
    const command = new TranslateTextCommand({
      Text: text,
      SourceLanguageCode: "en",
      TargetLanguageCode: "pt",
    });
    
    const response = await translateClient.send(command);
    const textoTraduzido = response.TranslatedText || text;
    
    // Salva no cache
    if (usarCache) {
      traducaoCache.set(text, textoTraduzido);
    }
    
    console.log(`✅ Traduzido: ${text} → ${textoTraduzido}`);
    return textoTraduzido;
    
  } catch (err) {
    // Se Amazon Translate falhar, retorna o original
    console.log(`⚠️ Amazon Translate indisponível para "${text}", mantendo original`);
    return text;
  }
}

async function traduzirArray(textos) {
  console.log(`📝 Traduzindo ${textos.length} labels...`);
  const promises = textos.map(texto => translateText(texto));
  const resultados = await Promise.all(promises);
  console.log(`✅ ${resultados.length} labels traduzidas`);
  return resultados;
}

// ================= EMOÇÕES =================
function traduzirEmocao(tipo, genero = "m") {
  const map = {
    HAPPY: "feliz",
    SAD: "triste",
    ANGRY: "com raiva",
    CALM: genero === "f" ? "calma" : "calmo",
    SURPRISED: genero === "f" ? "surpresa" : "surpreso",
    CONFUSED: genero === "f" ? "confusa" : "confuso",
    DISGUSTED: genero === "f" ? "desgostosa" : "desgostoso",
    FEAR: "com medo",
  };
  return map[tipo] || tipo.toLowerCase();
}

// ================= MELHORAR DESCRIÇÃO COM IA =================
async function melhorarDescricaoComIA(descricaoBruta, labels = []) {
  // Se não tiver API key, retorna descrição original
  if (!process.env.GROQ_API_KEY) {
    console.log("⚠️ GROQ_API_KEY não configurada, usando descrição bruta");
    return descricaoBruta;
  }

  try {
    console.log("🤖 Melhorando descrição com IA...");
    console.log("📝 Descrição original:", descricaoBruta);
    
    // Prepara contexto dos labels mais relevantes
    const labelsContext = labels
      .filter(l => l.Confidence >= 70)
      .slice(0, 15)
      .map(l => `${l.Name} (${l.Confidence.toFixed(0)}%)`)
      .join(", ");

    const prompt = `Você é um assistente que melhora descrições de imagens para pessoas com deficiência visual.

DESCRIÇÃO ATUAL (gerada automaticamente):
"${descricaoBruta}"

LABELS DETECTADOS: ${labelsContext}

TAREFA:
Reescreva a descrição de forma mais natural e fluida, seguindo estas regras:

1. **Elimine redundâncias**: Se mencionar "celular", não precisa repetir "eletrônico" ou "telefone"
2. **Organize por importância**: Mencione primeiro o elemento principal, depois o contexto
3. **Seja específico quando possível**: 
   - Se tem iPhone → "um iPhone" (não "celular da marca Apple")
   - Se tem Golden Retriever → "um golden retriever" (não "um cachorro de raça")
4. **Una informações relacionadas**:
   - ❌ "Uma pessoa. Ela está sorrindo. Ela tem 30-40 anos"
   - ✅ "Uma pessoa de 30 a 40 anos, sorrindo"
5. **Evite jargão técnico**: use português natural e acessível
6. **Mantenha entre 1-3 frases**: seja conciso mas completo

IMPORTANTE: 
- Retorne APENAS a descrição melhorada, sem explicações ou comentários
- Use português brasileiro natural
- Mantenha o tom descritivo e neutro

DESCRIÇÃO MELHORADA:`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile", // Modelo mais poderoso da Groq
      temperature: 0.3, // Baixa criatividade = mais fiel aos fatos
      max_tokens: 200, // Suficiente para 2-3 frases
      top_p: 0.9,
    });

    const descricaoMelhorada = completion.choices[0]?.message?.content?.trim() || descricaoBruta;
    
    console.log("✅ Descrição melhorada:", descricaoMelhorada);
    console.log(`⚡ Tokens usados: ${completion.usage?.total_tokens || 'N/A'}`);
    
    return descricaoMelhorada;

  } catch (err) {
    console.error("❌ Erro ao melhorar com IA:", err.message);
    // Em caso de erro, retorna descrição original
    return descricaoBruta;
  }
}

// ================= DESCRIÇÕES =================
async function descreverAnimal(labels) {
  // Palavras-chave de animais
  const palavrasChaveAnimais = [
    "Dog", "Cat", "Bird", "Horse", "Cow", "Pig", "Sheep", "Lion", 
    "Tiger", "Bear", "Elephant", "Monkey", "Kangaroo", "Fish", "Snake"
  ];
  
  // Encontra o animal principal
  const animalPrincipal = labels.find(l => 
    palavrasChaveAnimais.some(a => l.Name.includes(a)) && l.Confidence >= 80
  );
  
  if (!animalPrincipal) return null;
  
  // Traduz o tipo de animal
  const tipoAnimal = await translateText(animalPrincipal.Name);
  
  // Procura por raça específica (confiança >= 85)
  const racas = ["Golden Retriever", "Labrador", "German Shepherd", "Bulldog", "Poodle", 
                 "Beagle", "Husky", "Chihuahua", "Siamese", "Persian"];
  
  const racaLabel = labels.find(l => 
    racas.some(r => l.Name.includes(r)) && l.Confidence >= 85
  );
  
  let descricao = `A imagem mostra um ${tipoAnimal}`;
  
  if (racaLabel) {
    const racaNome = await translateText(racaLabel.Name);
    descricao += ` da raça ${racaNome}`;
  }
  
  return descricao + ".";
}

async function descreverPessoa(face, index, total) {
  const genero = face.Gender?.Value === "Female" ? "f" : "m";
  
  // Determina o sujeito baseado na idade
  let sujeito = "";
  if (face.AgeRange) {
    const idadeMedia = (face.AgeRange.Low + face.AgeRange.High) / 2;
    
    if (idadeMedia < 3) {
      sujeito = "um bebê";
    } else if (idadeMedia < 13) {
      sujeito = genero === "f" ? "uma menina" : "um menino";
    } else if (idadeMedia < 20) {
      sujeito = genero === "f" ? "uma adolescente" : "um adolescente";
    } else {
      sujeito = genero === "f" ? "uma mulher" : "um homem";
    }
  } else {
    // Se não tiver idade, usa genérico
    sujeito = genero === "f" ? "uma mulher" : "um homem";
  }

  let partes = [];

  // Se houver múltiplas pessoas
  if (total > 1) {
    partes.push(`Pessoa ${index + 1}: ${sujeito}`);
  } else {
    partes.push(`A imagem mostra ${sujeito}`);
  }

  if (face.AgeRange) {
    partes.push(`com idade aparente entre ${face.AgeRange.Low} e ${face.AgeRange.High} anos`);
  }

  if (face.Emotions?.length) {
    const topEmotion = face.Emotions.reduce((a, b) => (b.Confidence > a.Confidence ? b : a));
    if (topEmotion.Confidence >= 50) {
      partes.push(`aparentando estar ${traduzirEmocao(topEmotion.Type, genero)}`);
    }
  }

  // Características adicionais
  if (face.Smile?.Value && face.Smile.Confidence >= 80) {
    partes.push("sorrindo");
  }

  if (face.Eyeglasses?.Value && face.Eyeglasses.Confidence >= 80) {
    partes.push("usando óculos");
  }

  if (face.Beard?.Value && face.Beard.Confidence >= 80) {
    partes.push("com barba");
  }

  return partes.join(", ") + ".";
}

async function descreverLabels(labels, temPessoas = false) {
  if (!labels || labels.length === 0) {
    return "A imagem mostra uma cena.";
  }

  // Labels genéricas que devem ser removidas quando já detectamos pessoas
  const labelsGenericas = [
    // Pessoa
    "Person", "Human", "Face", "Head", "Body Part", "Neck", 
    "Adult", "Female", "Male", "Woman", "Man", "Photography", 
    "Portrait", "Selfie",
    // Idade/Gênero (já mencionado na descrição)
    "Child", "Kid", "Baby", "Toddler", "Boy", "Girl",
    "Teen", "Teenager", "Senior", "Elderly",
    // Emoções e expressões (já mencionadas na descrição da pessoa)
    "Happy", "Sad", "Smile", "Laughing", "Crying", "Frowning",
    "Dimples", "Grin", "Smiling",
    // Características físicas (já mencionadas se relevantes)
    "Glasses", "Sunglasses", "Beard", "Mustache",
    "Hair", "Blonde", "Brunette", "Redhead", "Bald"
  ];

  let labelsRelevantes = labels
    .filter(l => l.Confidence >= 70)
    .sort((a, b) => b.Confidence - a.Confidence);

  // Se houver pessoas detectadas, remove labels genéricas de pessoa
  if (temPessoas) {
    labelsRelevantes = labelsRelevantes.filter(
      l => !labelsGenericas.includes(l.Name)
    );
  }

  // Pega as 8 mais relevantes
  labelsRelevantes = labelsRelevantes.slice(0, 8);

  if (labelsRelevantes.length === 0) {
    return ""; // Não retorna nada se só tinha labels genéricas
  }

  // Traduz todos os labels
  const nomesOriginais = labelsRelevantes.map(l => l.Name);
  const nomesTraduzidos = await traduzirArray(nomesOriginais);

  // Remove duplicatas (ex: "pessoa" pode aparecer 2x)
  const nomesUnicos = [...new Set(nomesTraduzidos)];

  // Monta descrição
  if (nomesUnicos.length === 0) {
    return "";
  } else if (nomesUnicos.length === 1) {
    return `A imagem contém ${nomesUnicos[0]}.`;
  } else if (nomesUnicos.length === 2) {
    return `A imagem contém ${nomesUnicos[0]} e ${nomesUnicos[1]}.`;
  } else {
    const ultimoItem = nomesUnicos.pop();
    const resto = nomesUnicos.join(", ");
    return `A imagem contém ${resto} e ${ultimoItem}.`;
  }
}

async function descreverCelebridades(celebrities) {
  if (!celebrities || celebrities.length === 0) return "";

  // Log de debug para ver as confiânças
  celebrities.forEach(c => {
    console.log(`⭐ Celebridade detectada: ${c.Name} (${c.MatchConfidence.toFixed(1)}% confiança)`);
  });

  const celebsRelevantes = celebrities
    .filter(c => c.MatchConfidence >= 95) // 95% de certeza para evitar falsos positivos
    .map(c => c.Name);

  if (celebsRelevantes.length === 0) return "";

  if (celebsRelevantes.length === 1) {
    return ` Esta pessoa possivelmente é ${celebsRelevantes[0]}.`;
  } else {
    return ` Estas pessoas possivelmente são ${celebsRelevantes.join(", ")}.`;
  }
}

// ================= ANÁLISE COMPLETA =================
async function gerarDescricaoCompleta(imageBytes) {
  try {
    // Detectar labels
    console.log("🔍 Detectando labels...");
    const labelsRes = await rekClient.send(
      new DetectLabelsCommand({
        Image: { Bytes: imageBytes },
        MaxLabels: 50,
        MinConfidence: 60,
      })
    );

    // Detectar faces
    console.log("👤 Detectando faces...");
    let facesRes = { FaceDetails: [] };
    try {
      facesRes = await rekClient.send(
        new DetectFacesCommand({ 
          Image: { Bytes: imageBytes }, 
          Attributes: ["ALL"] 
        })
      );
    } catch (err) {
      console.log("⚠️ Erro ao detectar faces:", err.message);
    }

    // Celebridades
    console.log("⭐ Detectando celebridades...");
    let celebRes = { CelebrityFaces: [] };
    try {
      celebRes = await rekClient.send(
        new RecognizeCelebritiesCommand({ 
          Image: { Bytes: imageBytes } 
        })
      );
    } catch (err) {
      console.log("⚠️ Erro ao detectar celebridades:", err.message);
    }

    let descricoes = [];
    const temPessoas = facesRes.FaceDetails.length > 0;

    // Verifica se tem animal primeiro
    const descAnimal = await descreverAnimal(labelsRes.Labels);
    
    if (descAnimal) {
      // Se tem animal, descreve ele
      console.log("🐾 Animal detectado!");
      descricoes.push(descAnimal);
    } else if (temPessoas) {
      // Se não tem animal mas tem pessoas, descreve pessoas
      console.log(`📊 ${facesRes.FaceDetails.length} pessoa(s) detectada(s)`);
      
      for (let i = 0; i < facesRes.FaceDetails.length; i++) {
        const descPessoa = await descreverPessoa(
          facesRes.FaceDetails[i], 
          i, 
          facesRes.FaceDetails.length
        );
        descricoes.push(descPessoa);
      }

      // Adiciona celebridades se houver
      const descCelebs = await descreverCelebridades(celebRes.CelebrityFaces);
      if (descCelebs) {
        descricoes.push(descCelebs.trim());
      }
    } else {
      // Se não tem nem animal nem pessoa, descreve objetos
      console.log(`🏷️ ${labelsRes.Labels.length} labels detectadas`);
      const descLabels = await descreverLabels(labelsRes.Labels, false);
      if (descLabels) {
        descricoes.push(descLabels);
      }
    }

    // Se não houver nenhuma descrição, retorna mensagem padrão
    if (descricoes.length === 0) {
      descricoes.push("A imagem mostra uma cena.");
    }

    // Junta todas as descrições (descrição bruta)
    const descricaoBruta = descricoes.join(" ").trim();
    console.log("📝 Descrição bruta:", descricaoBruta);

    // 🆕 MELHORA A DESCRIÇÃO COM IA
    const descricaoFinal = await melhorarDescricaoComIA(descricaoBruta, labelsRes.Labels);
    
    console.log("✅ Descrição final:", descricaoFinal);
    return descricaoFinal;

  } catch (err) {
    console.error("❌ Erro ao gerar descrição:", err);
    throw new Error(`Erro ao processar imagem: ${err.message}`);
  }
}

// ================= ROTAS =================
// Log middleware para debug
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

// Função principal de processamento
async function processarImagem(req, res) {
  console.log("🎯 Função processarImagem chamada!");
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada" });
    }

    // Validação de tamanho (max 5MB)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: "Imagem muito grande. Máximo 5MB." });
    }

    const imageBytes = req.file.buffer;
    const voiceId = req.body.voice || req.body.voiceId || "Camila";

    console.log("\n📸 Processando imagem...");
    console.log(`📦 Tamanho: ${(req.file.size / 1024).toFixed(2)} KB`);
    console.log(`🎤 Voz: ${voiceId}`);

    // Gera descrição
    const descricao = await gerarDescricaoCompleta(imageBytes);

    // Gera áudio com Polly
    console.log("🔊 Gerando áudio com Polly...");
    const pollyRes = await pollyClient.send(
      new SynthesizeSpeechCommand({ 
        Text: descricao, 
        OutputFormat: "mp3", 
        VoiceId: voiceId, 
        LanguageCode: "pt-BR",
        Engine: "neural" // Usa voz neural para melhor qualidade
      })
    );

    const audioBuffer = await streamToBuffer(pollyRes.AudioStream);
    const audioBase64 = audioBuffer.toString("base64");

    console.log("✅ Processo concluído com sucesso!\n");

    res.json({
      descricao,
      audioBase64, // Formato que o frontend espera
      audio: `data:audio/mpeg;base64,${audioBase64}`, // Alternativa
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

// Rota principal que seu frontend usa
app.post("/analisar", upload.single("image"), processarImagem);

// Rota alternativa (API)
app.post("/api/process-image", upload.single("image"), processarImagem);

// Status do cache de traduções
app.get("/api/cache-status", (req, res) => {
  res.json({
    dicionarioManual: Object.keys(dicionarioTraducoes).length,
    traducoesEmCache: traducaoCache.size,
    servicoBackup: "Amazon Translate",
    regiao: REGION,
    cobertura: "~95% das labels do Rekognition"
  });
});

// 🆕 Status da IA
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

app.get("/api/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

// ================= FRONT =================
// Static files AFTER API routes
app.use(express.static("public"));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public/index.html")));

// ================= START =================
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
  console.log(`   GET  /api/ia-status - Status da IA 🆕\n`);
});