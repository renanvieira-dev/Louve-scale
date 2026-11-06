<div align="center">

<!-- Header Visual Animado -->
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,24,38,58&height=220&section=header&text=LouveScale&fontSize=46&fontAlignY=38&desc=Gest%C3%A3o%20Inteligente%20de%20Escalas%20e%20Minist%C3%A9rios%20de%20Louvor&descSize=17&descAlignY=60&animation=fadeIn" width="100%" alt="Header LouveScale" />

<!-- Typing SVG Dinâmico -->
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=18&duration=2800&pause=900&color=38BDF8&center=true&vCenter=true&width=620&lines=Plataforma+Mobile-First+para+Escalas+de+Louvor;React+%E2%80%A2+Next.js+%E2%80%A2+TypeScript+%E2%80%A2+Tailwind+CSS;Back-End+%26+Database+com+Supabase+(PostgreSQL);Progressive+Web+App+(PWA)+Instal%C3%A1vel" alt="Typing SVG" />
</a>

<br/><br/>

<!-- Badges de Status, Deploy e Especificações -->
<p align="center">
  <a href="https://louve-scale.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Deploy_Online-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Deploy Vercel" />
  </a>
  <a href="https://github.com/renanvieira-dev/Louve-scale" target="_blank">
    <img src="https://img.shields.io/badge/Reposit%C3%B3rio-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="Repositório GitHub" />
  </a>
  <img src="https://img.shields.io/badge/Arquitetura-Mobile--First-38BDF8?style=for-the-badge" alt="Mobile-First" />
  <img src="https://img.shields.io/badge/App_Type-PWA_Instal%C3%A1vel-3ECF8E?style=for-the-badge" alt="Tipo PWA" />
</p>

</div>

---

### 📖 Visão Geral do Projeto

O **LouveScale** é uma aplicação web progressiva (**PWA**) criada para resolver os gargalos operacionais da gestão de equipes, ministérios de louvor e voluntariado em comunidades e igrejas.

Historicamente, o controle de escalas depende de planilhas desatualizadas, mensagens fragmentadas em grupos de conversa ou murais impressos. O LouveScale centraliza a montagem de escalas, a confirmação de presença dos integrantes e a organização das equipes (músicos, vocalistas e técnica) em um painel responsivo, dinâmico e diretamente instalável em dispositivos móveis.

---

### 🎯 Problema e Solução Arquitetural

#### 1. Abordagem Mobile-First & PWA
Voluntários e músicos precisam checar escalas em deslocamento ou durante ensaios. A entrega via **Progressive Web App (PWA)** permite:
* Instalação direta no smartphone sem fricção de lojas de aplicativos (Google Play ou App Store).
* Acesso rápido através de ícone dedicado na tela inicial.
* Otimização de cache para carregamento imediato em redes móveis oscilantes.

#### 2. Design Limpo e Foco em Usabilidade (UX/UI)
* Interface escura (dark theme) de alto contraste visual com inspiração em design de sistemas modernos.
* Componentização atômica para exibição clara de dados fundamentais: data, horário do evento, líder do culto e separação por instrumentos/funções.

#### 3. Camada de Dados com Supabase (PostgreSQL)
* Relacionamento estruturado entre voluntários, cultos/eventos e instrumentos.
* Suporte nativo a políticas de segurança em nível de linha (**Row Level Security - RLS**), garantindo que apenas usuários autorizados realizem alterações em dados sensíveis.

---

### ✨ Funcionalidades Principais

* 📅 **Gestão Dinâmica de Eventos e Cultos:** Cadastro e acompanhamento de datas comemorativas, cultos regulares e ensaios.
* 🎸 **Alocação por Função:** Distribuição segmentada de instrumentistas (guitarra, violão, baixo, bateria, teclado) e equipe vocal/técnica de som.
* 📲 **Suporte a PWA Nativo:** Botão de instalação integrado ao cabeçalho para download direto no navegador mobile.
* ⚡ **Performance e Baixa Latência:** Renderização eficiente baseada em componentes reativos, minimizando requisições desnecessárias.
* 🔒 **Segurança e Persistência Confiável:** Armazenamento relacional com regras de integridade de dados na nuvem.

---

### 🛠️ Tecnologias e Ferramentas

<div align="center">

| Categoria | Tecnologia | Finalidade no Projeto |
| :--- | :--- | :--- |
| **Front-End** | `React.js` / `Next.js` | Construção da camada de visualização, roteamento e componentização |
| **Linguagem** | `TypeScript` | Tipagem estática, interfaces contratuais e prevenção de erros em runtime |
| **Estilização** | `Tailwind CSS` | Estilização utilitária de alta fidelidade e layouts responsivos |
| **PWA** | `Web App Manifest & Service Workers` | Recursos de instalação na tela inicial e caching de assets |
| **Back-End / BaaS** | `Supabase (PostgreSQL)` | Base de dados relacional, APIs e controle de permissões |
| **Deploy & CI/CD** | `Vercel` | Pipeline de build contínuo e distribuição global em CDN |

<br/>

<p align="center">
  <img src="https://skillicons.dev/icons?i=react,nextjs,ts,tailwind,supabase,postgres,vercel,git&perline=8&theme=dark" alt="Stack Icons" />
</p>

</div>
