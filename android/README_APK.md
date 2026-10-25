# NEXUS AI — Gerador de Pacote Nativo Android (.APK)

Este repositório contém a configuração completa para empacotar o ecossistema **NEXUS** em um aplicativo Android nativo (.APK e .AAB para a Google Play Store).

---

## 🚀 Método 1: Gerar o APK com Bubblewrap (Oficial do Google)

O **Bubblewrap** é a ferramenta oficial do Google Chrome para transformar Progressive Web Apps (PWA) em aplicativos Android nativos com performance nativa e tela cheia (sem barra de URL).

### Pré-requisitos:
- Node.js instalado (v18+)
- Java JDK 17+ instalado
- Android Command Line Tools / Android SDK (ou Android Studio)

### Passo a Passo no Terminal:

1. **Instalar a CLI oficial do Bubblewrap:**
   ```bash
   npm install -g @bubblewrap/cli
   ```

2. **Inicializar o projeto a partir do manifesto do NEXUS:**
   ```bash
   bubblewrap init --manifest=https://nexusearthai.com/manifest.json
   ```
   *(Pressione Enter para confirmar as configurações padrão; o Bubblewrap usará `twa-manifest.json` com `packageId`: `com.nexusearthai.app`).*

3. **Compilar o APK de Instalação Direta:**
   ```bash
   bubblewrap build
   ```
   *(O comando criará o arquivo `app-release-signed.apk` na pasta raiz do projeto).*

4. **Instalar no seu Smartphone Android:**
   - Conecte o celular via cabo USB com a "Depuração USB" ativada e execute:
     ```bash
     bubblewrap install
     ```
   - Ou envie o arquivo `.apk` para o WhatsApp/Telegram/Drive e toque nele para instalar no smartphone!

---

## ⚡ Método 2: Instalação Instantânea PWA (Sem Compilar Nada)

Se você já quer ter o aplicativo no seu celular **agora mesmo**:

1. Abra o navegador do seu celular (Google Chrome, Edge ou Samsung Internet) e acesse:
   **`https://nexusearthai.com/mobile`**
2. O aplicativo exibirá automaticamente um botão superior: **`📲 Instalar Aplicativo no Celular`**.
3. Toque nele ou abra o menu do navegador (três pontinhos no canto superior direito) e toque em:
   - **"Instalar aplicativo"** ou **"Adicionar à tela inicial"**.
4. O ícone oficial do **NEXUS AI** aparecerá na sua gaveta de aplicativos do smartphone, abrindo em tela cheia, com áudio neural, microfone e sem a barra de pesquisa do navegador!

### No iPhone (iOS Safari):
1. Acesse `https://nexusearthai.com/mobile` no Safari.
2. Toque no botão central de **Compartilhar** (quadrado com seta apontando para cima).
3. Role para baixo e toque em **"Adicionar à Tela de Início"**.
4. O app será instalado como um aplicativo nativo no iOS.
