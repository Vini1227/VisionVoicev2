// descriptionService.js
// Lógica de geração de descrições de imagens

const { translateText, traduzirArray } = require("./awsServices");
const Groq = require('groq-sdk');

// Cliente Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// ================= TRADUÇÃO DE EMOÇÕES =================

/**
 * Traduz tipo de emoção do Rekognition para português
 */
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

// ================= DESCRIÇÃO DE ANIMAIS =================

/**
 * Gera descrição de animais detectados
 */
async function descreverAnimal(labels) {
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
  
  // Procura por raça específica
  const racas = [
    "Golden Retriever", "Labrador", "German Shepherd", "Bulldog", "Poodle", 
    "Beagle", "Husky", "Chihuahua", "Siamese", "Persian"
  ];
  
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

// ================= DESCRIÇÃO DE PESSOAS =================

/**
 * Gera descrição de pessoa com base em análise facial
 */
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
    sujeito = genero === "f" ? "uma mulher" : "um homem";
  }

  let partes = [];

  // Se houver múltiplas pessoas
  if (total > 1) {
    partes.push(`Pessoa ${index + 1}: ${sujeito}`);
  } else {
    partes.push(`A imagem mostra ${sujeito}`);
  }

  // Idade
  if (face.AgeRange) {
    partes.push(`com idade aparente entre ${face.AgeRange.Low} e ${face.AgeRange.High} anos`);
  }

  // Emoção
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

// ================= DESCRIÇÃO DE LABELS =================

/**
 * Gera descrição de objetos/cenas detectados
 */
async function descreverLabels(labels, temPessoas = false) {
  if (!labels || labels.length === 0) {
    return "A imagem mostra uma cena.";
  }

  // Labels genéricas que devem ser removidas quando já detectamos pessoas
  const labelsGenericas = [
    "Person", "Human", "Face", "Head", "Body Part", "Neck", 
    "Adult", "Female", "Male", "Woman", "Man", "Photography", 
    "Portrait", "Selfie", "Child", "Kid", "Baby", "Toddler", "Boy", "Girl",
    "Teen", "Teenager", "Senior", "Elderly", "Happy", "Sad", "Smile", 
    "Laughing", "Crying", "Frowning", "Dimples", "Grin", "Smiling",
    "Glasses", "Sunglasses", "Beard", "Mustache", "Hair", "Blonde", 
    "Brunette", "Redhead", "Bald"
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
    return "";
  }

  // Traduz todos os labels
  const nomesOriginais = labelsRelevantes.map(l => l.Name);
  const nomesTraduzidos = await traduzirArray(nomesOriginais);

  // Remove duplicatas
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

// ================= DESCRIÇÃO DE CELEBRIDADES =================

/**
 * Gera descrição de celebridades detectadas
 */
async function descreverCelebridades(celebrities) {
  if (!celebrities || celebrities.length === 0) return "";

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

// ================= MELHORIA COM IA =================

/**
 * Melhora descrição usando Groq AI (Llama 3.3)
 */
async function melhorarDescricaoComIA(descricaoBruta, labels = []) {
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
      model: "llama-3.3-70b-versatile",
      temperature: 0.3, // Baixa criatividade = mais fiel aos fatos
      max_tokens: 200,
      top_p: 0.9,
    });

    const descricaoMelhorada = completion.choices[0]?.message?.content?.trim() || descricaoBruta;
    
    console.log("✅ Descrição melhorada:", descricaoMelhorada);
    console.log(`⚡ Tokens usados: ${completion.usage?.total_tokens || 'N/A'}`);
    
    return descricaoMelhorada;

  } catch (err) {
    console.error("❌ Erro ao melhorar com IA:", err.message);
    return descricaoBruta;
  }
}

// ================= GERAÇÃO DE DESCRIÇÃO COMPLETA =================

/**
 * Gera descrição completa da imagem
 */
async function gerarDescricaoCompleta(labels, faces, celebrities) {
  let descricoes = [];
  const temPessoas = faces.length > 0;

  // Verifica se tem animal primeiro
  const descAnimal = await descreverAnimal(labels);
  
  if (descAnimal) {
    console.log("🐾 Animal detectado!");
    descricoes.push(descAnimal);
  } else if (temPessoas) {
    console.log(`📊 ${faces.length} pessoa(s) detectada(s)`);
    
    for (let i = 0; i < faces.length; i++) {
      const descPessoa = await descreverPessoa(faces[i], i, faces.length);
      descricoes.push(descPessoa);
    }

    // Adiciona celebridades se houver
    const descCelebs = await descreverCelebridades(celebrities);
    if (descCelebs) {
      descricoes.push(descCelebs.trim());
    }
  } else {
    console.log(`🏷️ ${labels.length} labels detectadas`);
    const descLabels = await descreverLabels(labels, false);
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

  // Melhora a descrição com IA
  const descricaoFinal = await melhorarDescricaoComIA(descricaoBruta, labels);
  
  console.log("✅ Descrição final:", descricaoFinal);
  return descricaoFinal;
}

// ================= EXPORTAÇÕES =================

module.exports = {
  traduzirEmocao,
  descreverAnimal,
  descreverPessoa,
  descreverLabels,
  descreverCelebridades,
  melhorarDescricaoComIA,
  gerarDescricaoCompleta,
};
