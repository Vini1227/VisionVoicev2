🎤 VisionVoicev2
VisionVoicev2 é uma aplicação web que transforma imagens em **narrativas de áudio** utilizando **AWS Rekognition** para análise de imagens e **AWS Polly** para síntese de voz.  
A aplicação identifica pessoas, animais, objetos, emoções, idade aparente, gênero, roupas e até **celebridades**, e permite escolher a voz do narrador.

---

📌 Visão Geral
O usuário envia uma imagem e recebe:
- Uma descrição detalhada do que está na imagem.
- Uma narração em áudio em português com a voz selecionada.
- Reconhecimento de celebridades (quando aplicável).

O frontend é simples e intuitivo, com drag & drop ou clique para upload.

---

⚙️ Funcionalidades

👤 **Análise Facial**
- Identificação de pessoas
- Gênero e idade aparente
- Emoções (feliz, triste, calmo, surpreso, etc.)
- Sorriso, uso de óculos e outros detalhes

🐾 **Animais**
- Identificação de tipo e características
- Detecção de filhotes ou adultos

🖼️ **Objetos e Cenários**
- Reconhecimento de roupas, acessórios e objetos gerais

🌟 **Celebridades**
- Quando o Rekognition identifica, mostra:  
  `"Essa pessoa provavelmente é: [nome da celebridade]"`

🔊 **Áudio**
- Escolha da voz do narrador
- Reprodução direta no frontend

---

🧰 Tecnologias Utilizadas

**Backend**
- Node.js
- AWS Rekognition
- AWS Polly
- Express.js
- Multer (upload de arquivos)

**Frontend**
- HTML5 / CSS3
- JavaScript puro
- Layout responsivo

**Outros**
- Git & GitHub
- .env para variáveis sensíveis
- FormData para envio de arquivos

---

🚀 Guia de Clonagem e Execução

✔️ **Pré-requisitos**
- Node.js >= 18
- npm
- Conta AWS com acesso a **Rekognition** e **Polly**

✔️ **Passos**

1. Clonar o repositório:
```bash
git clone https://github.com/vini1227/VisionVoicev2.git
cd VisionVoicev2
Instalar dependências:

bash
Copiar código
npm install
Configurar variáveis de ambiente:

bash
Copiar código
cp .env.example .env
Abra .env e preencha suas credenciais AWS:

ini
Copiar código
AWS_ACCESS_KEY_ID=SEU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=SEU_SECRET_KEY
AWS_REGION=us-east-1
⚠️ Não commit suas credenciais reais.
Use .env.example para referência.

Rodar o servidor:

bash
Copiar código
node server.js
Abra http://localhost:3000 no navegador.

No frontend:

Clique ou arraste uma imagem

Escolha a voz do narrador

Clique em Analisar Imagem

Veja a descrição e ouça a narração
