document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DECLARAÇÕES DE VARIÁVEIS GLOBAIS ---
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const currentPage = window.location.pathname.split('/').pop();
    const accessibilityMode = localStorage.getItem('accessibilityMode');
    const dashboardPages = ['home.html', 'forum.html', 'aulas.html', 'conteudos.html', 'exercicios.html', 'configuracoes.html', 'certificados.html'];

    // Variáveis para o MODO VISUAL E TALKBACK
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let chatbotState = {
        currentPage: '',
        currentField: 'fullname',
        registerFields: ['fullname', 'email', 'phone', 'password-register'], // 'phone' adicionado
        loginFields: ['username', 'password']
    };


    // --- 2. FUNÇÃO INICIALIZADORA PRINCIPAL ---
    if (accessibilityMode) {
        initializePage(accessibilityMode, currentPage);
    }

    function initializePage(mode, page) {
        const body = document.getElementById('page-body');
        if (!body) return;

        // INICIALIZAÇÃO OBRIGATÓRIA DO WIDGET DE ACESSIBILIDADE FLUTUANTE
        if (dashboardPages.includes(page) || page === 'login.html' || page.startsWith('cadastro-')) {
            setupStandardWidget();
        }

        // Configuração dos assistentes por modo
        switch (mode) {
            case 'visual':
                if (page.includes('cadastro-visual') || page === 'login.html') {
                    setupVisualMode(page); // Configura voz, digitação e setas
                }
                // Adicione a lógica de Talkback/Leitura Contextual para o dashboard visual aqui
                break;

            case 'auditory':
                setupAuditoryMode(); // VLibras em todas as telas
                // Ativa o Talkback auxiliar em todas as páginas do dashboard e formulários
                if (dashboardPages.includes(page) || page.includes('cadastro-auditivo')) {
                    setupAuditoryTalkback();
                }
                break;
        }
    }


    // --- 3. FUNÇÕES GERAIS DE ACESSIBILIDADE ---

    // A. SPEAK: Função central de voz
    function speak(text, callback) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.onend = () => { if (callback) callback(); };

        // Determina o elemento de mensagem correto (Visual, Auditivo, ou barra inferior)
        let messageElement = document.getElementById('chatbot-message');
        if (!messageElement) {
            messageElement = document.getElementById('talkback-message');
        }

        if (messageElement) {
            messageElement.textContent = text;
        }

        window.speechSynthesis.speak(utterance);
    }

    // B. LISTEN: Inicia a escuta do microfone
    function listen() {
        if (recognition) {
            try {
                recognition.start();
            } catch (e) {
                console.error("Reconhecimento já iniciado.");
            }
        }
    }

    // C. WIDGET PADRÃO (Botão Flutuante)
    function setupStandardWidget() {
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

    // D. VLIBRAS
    function setupAuditoryMode() {
        const vlibrasDiv = document.createElement('div');
        vlibrasDiv.id = 'vlibras-plugin';
        document.body.appendChild(vlibrasDiv);
        const vlibrasScript = document.createElement('script');
        vlibrasScript.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
        vlibrasScript.onload = () => { new window.VLibras.Widget('https://vlibras.gov.br/app'); };
        document.body.appendChild(vlibrasScript);
    }


    // --- 4. FUNÇÕES DO MODO VISUAL (CEGOS) ---

    function setupVisualMode(page) {
        const chatbotContainer = page === 'login.html' ? document.getElementById('chatbot-container') : null;
        if (chatbotContainer) chatbotContainer.classList.remove('hidden');

        if (SpeechRecognition) {
            recognition = new SpeechRecognition();
            recognition.lang = 'pt-BR';
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.onresult = handleVoiceCommand;
            recognition.onerror = (event) => console.error(`Erro no reconhecimento: ${event.error}`);
            recognition.onend = () => { if (chatbotState.currentField) listen(); };
        }

        chatbotState.currentPage = page;
        initializeVisualForm();
    }

    function initializeVisualForm() {
        // 1. FOCA NO PRIMEIRO CAMPO E FALA A INSTRUÇÃO
        const currentFieldElement = document.getElementById(chatbotState.currentField);
        if (currentFieldElement) {
            currentFieldElement.focus();
            startConversation(chatbotState.currentPage); // Inicia a conversa de voz
        }

        // 2. OUVINTE GERAL DE TECLADO PARA DIGITAÇÃO E NAVEGAÇÃO
        document.addEventListener('keydown', handleKeyboardInput);

        // 3. Adiciona o listener de submissão do formulário visual
        const form = document.getElementById('register-form') || document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', function(event) {
                event.preventDefault();
                // O envio por enter é tratado aqui, o fluxo de voz já chamou advanceToNextField
                if (chatbotState.currentField === '') {
                    alert('Formulário enviado com sucesso! Redirecionando...');
                    window.location.href = form.id === 'register-form' ? 'login.html' : 'home.html';
                } else {
                    speak('Por favor, preencha o campo atual para finalizar: ' + document.getElementById(chatbotState.currentField).previousElementSibling.textContent);
                }
            });
        }
    }

    function startConversation(page) {
        let initialField = page.startsWith('cadastro') ? 'fullname' : 'username';
        let welcomeMessage = '';

        if (page.startsWith('cadastro-visual')) {
            welcomeMessage = `Olá! Bem-vindo ao cadastro acessível do EducaFácil. Você pode digitar ou falar. Use as setas para avançar ou retornar. Vamos começar. Por favor, diga ou digite seu nome completo.`;
        } else if (page === 'login.html') {
            welcomeMessage = 'Você está na tela de login. Por favor, diga ou digite seu nome de usuário. Use as setas para avançar.';
        }

        chatbotState.currentField = initialField;

        speak(welcomeMessage, () => {
            if (SpeechRecognition) listen();
        });
    }

    function handleKeyboardInput(event) {
        const fields = chatbotState.currentPage.startsWith('cadastro') ? chatbotState.registerFields : chatbotState.loginFields;

        // -- 1. NAVEGAÇÃO POR SETAS --
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            advanceToNextField(chatbotState.currentPage, chatbotState.currentField);
            return;
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            advanceToPreviousField(chatbotState.currentPage, chatbotState.currentField);
            return;
        }

        // -- 2. TALKBACK POR LETRA --
        if (event.key.length === 1) {
            // Fala apenas letras, números e símbolos comuns
            if (event.key.match(/^[a-zA-Z0-9\s@\.]*$/)) {
                speak(event.key);
            }
        }
        else if (event.key === 'Backspace') {
            speak('Apagar');
        }
        else if (event.key === 'Enter' || event.key === 'Tab') {
            // Permite o Enter/Tab para submeter ou avançar
            if (fields.indexOf(chatbotState.currentField) < fields.length - 1) {
                event.preventDefault();
                advanceToNextField(chatbotState.currentPage, chatbotState.currentField);
            }
        }
    }

    function handleVoiceCommand(event) {
        const command = event.results[0][0].transcript.trim();
        if (chatbotState.currentField) {
            handleFormInput(command);
        }
    }

    function handleFormInput(value) {
        const fieldElement = document.getElementById(chatbotState.currentField);
        if (fieldElement) {
            const correctedValue = value.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
            fieldElement.value = correctedValue;
            advanceToNextField(chatbotState.currentPage, chatbotState.currentField);
        }
    }

    function advanceToNextField(page, currentFieldId) {
        const fields = page.startsWith('cadastro') ? chatbotState.registerFields : chatbotState.loginFields;
        const currentIndex = fields.indexOf(currentFieldId);

        if (currentIndex < fields.length - 1) {
            const nextFieldId = fields[currentIndex + 1];
            chatbotState.currentField = nextFieldId;
            switchFieldFocus(nextFieldId);
        } else {
            // Último campo
            chatbotState.currentField = '';
            speak('Excelente! Formulário preenchido. Você pode pressionar Enter ou o botão para finalizar.');
        }
    }

    function advanceToPreviousField(page, currentFieldId) {
        const fields = page.startsWith('cadastro') ? chatbotState.registerFields : chatbotState.loginFields;
        const currentIndex = fields.indexOf(currentFieldId);

        if (currentIndex > 0) {
            const nextFieldId = fields[currentIndex - 1];
            chatbotState.currentField = nextFieldId;
            switchFieldFocus(nextFieldId, 'Campo anterior. ');
        } else {
            speak('Você já está no primeiro campo.');
        }
    }

    function switchFieldFocus(newFieldId, prefixMessage = 'Ok. ') {
        const newFieldElement = document.getElementById(newFieldId);

        document.querySelectorAll('.input-group').forEach(group => group.classList.remove('active-field'));
        if (newFieldElement.parentElement.classList.contains('input-group')) {
            newFieldElement.parentElement.classList.add('active-field');
        }

        if (newFieldElement) {
            newFieldElement.focus();

            let labelText = newFieldElement.previousElementSibling.textContent;
            let finalMessage = prefixMessage + `Campo atual: ${labelText}.`;

            speak(finalMessage, () => {
                if (SpeechRecognition) listen();
            });
        }
    }


    // --- 5. FUNÇÕES DO TALKBACK AUDITIVO (FOCUS/MOUSEOVER) ---

    function setupAuditoryTalkback() {
        const talkbackContainer = document.getElementById('talkback-container');
        if (talkbackContainer) {
            talkbackContainer.classList.remove('hidden');

            let initialMessage = 'Assistente de voz (Talkback) ativado para navegação por teclado e mouse.';
            speak(initialMessage, () => {
                const focusableElements = document.querySelectorAll('a, button, [tabindex="0"], input, textarea, .card-simple, .nav-item');
                let lastSpokenElement = null;

                focusableElements.forEach(element => {
                    const readElement = (el) => {
                        if (el === lastSpokenElement) return;
                        lastSpokenElement = el;

                        let textToSpeak = '';
                        if (el.getAttribute('aria-label')) {
                            textToSpeak = el.getAttribute('aria-label');
                        } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                            const label = document.querySelector(`label[for="${el.id}"]`)?.textContent;
                            textToSpeak = label ? `Campo: ${label}.` : `Campo de entrada.`;
                        } else if (el.tagName === 'BUTTON') {
                            textToSpeak = `Botão: ${el.textContent}.`;
                        } else if (el.tagName === 'A') {
                            textToSpeak = `Link: ${el.textContent}.`;
                        } else if (el.classList.contains('card-simple')) {
                            const title = el.querySelector('h2, h3')?.textContent;
                            textToSpeak = title ? `Bloco de conteúdo: ${title}.` : `Bloco de informações.`;
                        } else if (el.classList.contains('nav-item')) {
                            textToSpeak = `Menu de navegação: ${el.textContent.trim()}`;
                        }

                        if (textToSpeak) { speak(textToSpeak); }
                    };

                    element.addEventListener('focus', () => readElement(element));
                    element.addEventListener('mouseover', () => readElement(element));
                    element.addEventListener('blur', () => lastSpokenElement = null);
                    element.addEventListener('mouseout', () => lastSpokenElement = null);
                });
            });
        }
    }


    // --- 6. SUBMISSÃO DE FORMULÁRIO (PADRÃO/AUDITIVO) ---

    // Cadastro Padrão/Auditivo
    if (registerForm && !currentPage.includes('visual')) {
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const fullname = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password-register').value;

            if (!fullname || !email || !password) {
                const message = "Por favor, preencha todos os campos do cadastro.";
                alert(message);
                if (accessibilityMode === 'auditory') { speak(message); }
                return;
            }

            const successMessage = "Cadastro efetuado com sucesso! Redirecionando para a área de login...";
            alert(successMessage);

            if (accessibilityMode === 'auditory') {
                speak(successMessage, () => { window.location.href = 'login.html'; });
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    // Login Padrão/Auditivo
    if (loginForm && !currentPage.includes('visual')) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (!username || !password) {
                const message = "Por favor, preencha seu usuário e senha.";
                alert(message);
                if (accessibilityMode === 'auditory') { speak(message); }
                return;
            }

            const successMessage = "Login efetuado com sucesso! Bem-vindo(a) ao EducaFácil.";
            alert(successMessage);

            if (accessibilityMode === 'auditory') {
                speak(successMessage, () => { window.location.href = 'home.html'; });
            } else {
                window.location.href = 'home.html';
            }
        });
    }

    // --- 7. FUNÇÃO DE SELEÇÃO DE MODO (index.html) ---
    window.selectAccessibility = (mode) => {
        localStorage.setItem('accessibilityMode', mode);
        if (mode === 'visual') {
            window.location.href = 'cadastro-visual.html';
        } else if (mode === 'auditory') {
            window.location.href = 'cadastro-auditivo.html';
        } else {
            window.location.href = 'cadastro-padrao.html';
        }
    };
});