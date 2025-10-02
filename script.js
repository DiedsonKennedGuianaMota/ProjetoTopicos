document.addEventListener('DOMContentLoaded', () => {
    
    // --- GERENCIAMENTO DE ESTADO E INICIALIZAÇÃO ---
    const accessibilityMode = localStorage.getItem('accessibilityMode');
    const currentPage = window.location.pathname.split('/').pop();

    if (accessibilityMode) {
        initializePage(accessibilityMode, currentPage);
    }

    // Função global para selecionar o modo na index.html
    window.selectAccessibility = (mode) => {
        localStorage.setItem('accessibilityMode', mode);
        // Redireciona para a página de cadastro específica
        if (mode === 'visual') {
            window.location.href = 'cadastro-visual.html';
        } else if (mode === 'auditory') {
            window.location.href = 'cadastro-auditivo.html';
        } else {
            window.location.href = 'cadastro-padrao.html';
        }
    };

    function initializePage(mode, page) {
        const body = document.getElementById('page-body');
        if (!body) return;

        switch (mode) {
            case 'visual':
                setupVisualMode(page);
                break;
            case 'auditory':
                // Ativa o VLibras nas páginas de cadastro auditivo e login
                if (page === 'cadastro-auditivo.html' || page === 'login.html') {
                    setupAuditoryMode();
                }
                break;
            case 'standard':
                // Ativa o widget nas páginas de cadastro padrão e login
                if (page === 'cadastro-padrao.html' || page === 'login.html') {
                    setupStandardMode();
                }
                break;
        }
    }

    // --- MODO: PADRÃO (COM WIDGET) ---
    function setupStandardMode() {
        const widget = document.getElementById('accessibility-widget');
        if (widget) {
            widget.classList.remove('hidden');
            const accessibilityBtn = document.getElementById('accessibility-btn');
            const increaseFontBtn = document.getElementById('increase-font');
            const decreaseFontBtn = document.getElementById('decrease-font');
            const highContrastBtn = document.getElementById('high-contrast');
            const daltonismBtn = document.getElementById('daltonism-toggle');

            accessibilityBtn.addEventListener('click', () => widget.classList.toggle('active'));
            increaseFontBtn.addEventListener('click', () => changeFontSize(1));
            decreaseFontBtn.addEventListener('click', () => changeFontSize(-1));
            highContrastBtn.addEventListener('click', () => document.body.classList.toggle('high-contrast'));
            daltonismBtn.addEventListener('click', () => document.body.classList.toggle('daltonism'));
        }
    }
    function changeFontSize(step){const root=document.documentElement;const currentSize=parseFloat(getComputedStyle(root).getPropertyValue('--font-size'));const newSize=currentSize+step;if(newSize>=12&&newSize<=24){root.style.setProperty('--font-size',`${newSize}px`);}}

    // --- MODO: DEFICIÊNCIA AUDITIVA (VLIBRAS) ---
    function setupAuditoryMode() {
        const vlibrasDiv = document.createElement('div');
        vlibrasDiv.id = 'vlibras-plugin';
        document.body.appendChild(vlibrasDiv);
        const vlibrasScript = document.createElement('script');
        vlibrasScript.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
        vlibrasScript.onload = () => { new window.VLibras.Widget('https://vlibras.gov.br/app'); };
        document.body.appendChild(vlibrasScript);
    }

    // --- MODO: DEFICIÊNCIA VISUAL (ASSISTENTE DE VOZ) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let chatbotState = { currentPage: '', currentField: '' };

    function setupVisualMode(page) {
        if (!SpeechRecognition) {
            speak('Seu navegador não suporta a API de reconhecimento de voz. A experiência será limitada.');
            return;
        }
        
        const chatbotContainer = page === 'login.html' ? document.getElementById('chatbot-container') : null;
        if (chatbotContainer) chatbotContainer.classList.remove('hidden');

        recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onresult = handleVoiceCommand;
        recognition.onerror = (event) => console.error(`Erro no reconhecimento: ${event.error}`);
        recognition.onend = () => {
            // Reinicia a escuta automaticamente
            if (chatbotState.currentField) {
                 listen();
            }
        };
        
        chatbotState.currentPage = page;
        startConversation(page);
    }
    
    function speak(text, callback) {
        // Cancela falas anteriores para evitar sobreposição
        window.speechSynthesis.cancel(); 
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.onend = () => {
            if (callback) callback();
        };
        
        const chatbotMessage = document.getElementById('chatbot-message');
        if (chatbotMessage) chatbotMessage.textContent = text;
        
        window.speechSynthesis.speak(utterance);
    }

    function listen() {
        if (recognition) {
            try {
                recognition.start();
            } catch (e) {
                console.error("Reconhecimento já iniciado.");
            }
        }
    }
    
    function startConversation(page) {
        if (page.startsWith('cadastro-visual')) {
            const welcomeMessage = `Olá! Bem-vindo ao cadastro acessível do EducaFácil. Vou te guiar passo a passo. Vamos começar. Por favor, diga seu nome completo.`;
            speak(welcomeMessage, () => {
                chatbotState.currentField = 'fullname';
                listen();
            });
        } else if (page === 'login.html') {
            const loginMessage = 'Você está na tela de login. Por favor, diga seu nome de usuário.';
            speak(loginMessage, () => {
                chatbotState.currentField = 'username';
                listen();
            });
        }
    }

    function handleVoiceCommand(event) {
        const command = event.results[0][0].transcript.trim();
        console.log('Comando recebido:', command);

        if (chatbotState.currentField) {
            handleFormInput(command);
        }
    }

    function handleFormInput(value) {
        const fieldElement = document.getElementById(chatbotState.currentField);
        if (fieldElement) {
            // Corrige capitalização para nomes próprios
            const correctedValue = value.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
            fieldElement.value = correctedValue;
            
            // Avança para o próximo campo
            advanceToNextField(chatbotState.currentPage, chatbotState.currentField);
        }
    }

    function advanceToNextField(page, currentFieldId) {
        const registerFields = ['fullname', 'email', 'password-register'];
        const loginFields = ['username', 'password'];
        const fields = page.startsWith('cadastro') ? registerFields : loginFields;

        const currentIndex = fields.indexOf(currentFieldId);
        if (currentIndex < fields.length - 1) {
            const nextFieldId = fields[currentIndex + 1];
            chatbotState.currentField = nextFieldId;
            let nextFieldLabel;
            if (nextFieldId === 'email') nextFieldLabel = 'seu e-mail';
            else if (nextFieldId.includes('password')) nextFieldLabel = 'uma senha';
            else if (nextFieldId === 'username') nextFieldLabel = 'seu nome de usuário';
            
            speak(`Ok. Agora, por favor, diga ${nextFieldLabel}.`, () => listen());
        } else {
            chatbotState.currentField = '';
            speak('Excelente! Formulário preenchido. Enviando seu cadastro.', () => {
                 const form = document.getElementById(page.startsWith('cadastro') ? 'register-form' : 'login-form');
                 // Simula o envio, em um caso real, aqui iria uma chamada de API.
                 alert('Cadastro (ou login) realizado com sucesso! Redirecionando...');
                 window.location.href = 'index.html'; // Redireciona para a página principal pós-login
            });
        }
    }
});