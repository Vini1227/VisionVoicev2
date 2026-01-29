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
#### 2\. **Configurar o Backend (Node.js + AWS SDK)**

1.  Acesse a pasta do backend (raiz do projeto):
    

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   cd backend   `

1.  Instale as dependências do Node.js:
    

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   npm install   `

1.  Copie o arquivo de ambiente de exemplo para criar seu .env:
    

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   cp .env.example .env   `

1.  Abra o .env e adicione suas credenciais da AWS:
    

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   AWS_ACCESS_KEY_ID=sua_access_key  AWS_SECRET_ACCESS_KEY=sua_secret_key  AWS_REGION=us-east-1   `

> ⚠️ Nunca commit o .env com chaves reais no GitHub.

1.  Inicie o servidor backend:
    

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   node server.js   `

O backend estará disponível em: [http://localhost:3000](http://localhost:3000)

#### 3\. **Configurar o Frontend**

O frontend já está incluso na pasta public/ do backend. Basta abrir o servidor backend e acessar:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   http://localhost:3000   `

*   Faça upload da imagem.
    
*   Escolha a voz do narrador.
    
*   Clique em **“Analisar Imagem”** para gerar a narração.
    

#### 4\. **Uso do .env em outros computadores**

*   Sempre copie .env.example para .env antes de rodar o projeto:
    

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   cp .env.example .env   `

*   Preencha suas credenciais da AWS no novo .env.
    
*   O arquivo .env **não deve** ser enviado ao GitHub.
    

### 📝 Observações

*   O projeto utiliza **AWS Rekognition** para análise de imagens e **AWS Polly** para gerar narração em áudio.
    
*   Upload de imagens e escolha da voz são feitos diretamente no frontend.
    
*   Certifique-se de que sua **chave AWS tenha permissões para Rekognition e Polly**.
    
*   Não compartilhe suas credenciais em repositórios públicos.
