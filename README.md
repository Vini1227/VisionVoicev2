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
# 2. Configurar o Backend (Node.js + AWS SDK)

## Acesse a pasta do backend (raiz do projeto):

```bash
cd backend
```

## Instale as dependências do Node.js:

```bash
npm install
```

## Copie o arquivo de ambiente de exemplo para criar seu `.env`:

```bash
cp .env.example .env
```

## Abra o `.env` e adicione suas credenciais da AWS:
- `AWS_ACCESS_KEY_ID=sua_access_key`
- `AWS_SECRET_ACCESS_KEY=sua_secret_key`
- `AWS_REGION=us-east-1`

⚠️ Nunca commit o `.env` com chaves reais no GitHub.

## Inicie o servidor backend:

```bash
node server.js
```

O backend estará disponível em: [http://localhost:3000](http://localhost:3000)
