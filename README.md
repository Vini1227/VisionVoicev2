# 🎙️ VisionVoicev2

VisionVoicev2 é uma aplicação que transforma imagens em **narrativas de áudio** usando **AWS Rekognition** para análise de imagens e faces e **AWS Polly** para gerar voz. Ela reconhece pessoas, animais, objetos e até celebridades, gerando uma descrição completa e falada da imagem.

---

## 📌 Visão Geral

O VisionVoicev2 permite que qualquer usuário envie uma imagem e receba:  
- Uma descrição detalhada do que está na imagem  
- Informações sobre pessoas (idade, gênero, expressão, óculos)  
- Detecção de animais (tipo, filhote ou adulto, habitat)  
- Sugestão de celebridades quando aplicável  
- Um arquivo de áudio narrando a descrição  

Tudo isso em um **frontend moderno e interativo** com suporte a múltiplas vozes.

---

## ⚙️ Funcionalidades

- 🖼️ **Upload de imagens** (JPG, PNG, GIF, até 5MB)  
- 🧑 **Reconhecimento facial e de emoções**  
- 🐶 **Detecção de animais** com detalhes de espécie e habitat  
- 🌟 **Reconhecimento de celebridades** (opcional, só se identificado com confiança)  
- 🔊 **Geração de áudio narrativo** com diferentes vozes do AWS Polly  
- 💻 **Frontend interativo** com preview de imagem, texto e áudio  

---

## 🧰 Tecnologias Utilizadas

- **Backend:** Node.js, Express  
- **AWS SDK v3:** Rekognition e Polly  
- **Frontend:** HTML5, CSS3, JavaScript  
- **Controle de versões:** Git & GitHub  
- **Outros:** Multer (upload de arquivos), dotenv (variáveis de ambiente)  

---

## 🚀 Guia de Clonagem e Execução

### ✔️ Requisitos

- Node.js >= 18  
- NPM ou Yarn  
- Conta AWS com credenciais configuradas  
- Git  

---

### 🔧 Passos para rodar o projeto

#### 1️⃣ Clonar o repositório
```bash
git clone https://github.com/vini1227/VisionVoicev2.git
cd VisionVoicev2
2️⃣ Instalar dependências
bash
Copiar código
npm install
3️⃣ Configurar variáveis de ambiente
Copie o arquivo de exemplo:

bash
Copiar código
cp .env.example .env
Abra .env e adicione suas credenciais da AWS:

ini
Copiar código
AWS_ACCESS_KEY_ID=SEU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=SUA_SECRET_KEY
AWS_REGION=us-east-1
⚠️ Nunca commit suas chaves reais! Apenas o .env.example deve estar no repositório.

4️⃣ Iniciar o servidor
bash
Copiar código
node server.js
O backend estará rodando em: http://localhost:3000

5️⃣ Acessar o frontend
Abra o navegador em http://localhost:3000

Faça upload de uma imagem

Escolha a voz do narrador e clique em "Analisar Imagem"

Veja a descrição e ouça o áudio gerado
