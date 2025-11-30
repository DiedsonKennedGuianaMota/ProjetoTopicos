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
        registerFields: ['fullname', 'email', 'phone', 'password-register'],
        loginFields: ['username', 'password']
    };
    let typingTalkbackEnabled = true;

    // --- PERFIL NO DASHBOARD (NOME, EMAIL, FOTO) ---
    (function atualizarPerfilDashboard() {
        const nome  = localStorage.getItem('perfil_nome');
        const email = localStorage.getItem('perfil_email');
        const foto  = localStorage.getItem('perfil_foto');

        const nomeEl  = document.getElementById('aluno-nome');
        const emailEl = document.getElementById('aluno-email');
        const fotoEl  = document.getElementById('aluno-foto');

        if (nome && nomeEl) nomeEl.textContent = nome;
        if (email && emailEl) emailEl.textContent = email;
        if (foto && fotoEl && foto.trim() !== '') {
            fotoEl.src = foto;
        }
    })();

    // --- 2. FUNÇÃO INICIALIZADORA PRINCIPAL ---
    initializePage(accessibilityMode || 'standard', currentPage);

    // --- 2.1 WIDGET DE ACESSIBILIDADE FLUTUANTE (itens do menu) ---
    const acWidget  = document.getElementById('accessibility-widget');
    const acClose   = document.getElementById('ac-close-btn');
    const acToggle  = document.getElementById('ac-toggle-visibility');
    const acReadBtn = document.getElementById('ac-ler-pagina');
    const acHighContrastBtn   = document.getElementById('ac-contraste-mais');
    const acSmartContrastBtn  = document.getElementById('ac-contraste-inteligente');
    const acLinksBtn          = document.getElementById('ac-links-destacados');
    const acTextBigBtn        = document.getElementById('ac-texto-maior');
    const acSpacingBtn        = document.getElementById('ac-espacamento-texto');
    const acAnimBtn           = document.getElementById('ac-animacoes');
    const acHideImgBtn        = document.getElementById('ac-ocultar-imagens');
    const acDislexiaBtn       = document.getElementById('ac-dislexia');
    const acCursorBtn         = document.getElementById('ac-cursor');
    const acToolbarBtn        = document.getElementById('ac-barra-ferramentas');
    const acStructureBtn      = document.getElementById('ac-estrutura-pagina');
    const acLineHeightBtn     = document.getElementById('ac-altura-linha');
    const acAlignBtn          = document.getElementById('ac-alinhamento-texto');
    const acSaturationBtn     = document.getElementById('ac-saturacao');
    const acResetBtn          = document.getElementById('ac-reset');

    // Aplica estados salvos de acessibilidade
    (function aplicarPreferenciasAcessibilidade() {
        const body = document.body;
        if (localStorage.getItem('ac_high_contrast') === 'true') body.classList.add('ac-high-contrast');
        if (localStorage.getItem('ac_smart_contrast') === 'true') body.classList.add('ac-smart-contrast');
        if (localStorage.getItem('ac_links') === 'true') body.classList.add('ac-links-highlight');
        if (localStorage.getItem('ac_text_big') === 'true') body.classList.add('ac-text-big');
        if (localStorage.getItem('ac_spacing') === 'true') body.classList.add('ac-text-spacing');
        if (localStorage.getItem('ac_anim_off') === 'true') body.classList.add('ac-anim-off');
        if (localStorage.getItem('ac_hide_img') === 'true') body.classList.add('ac-hide-images');
        if (localStorage.getItem('ac_dislexia') === 'true') body.classList.add('ac-dislexia-font');
        if (localStorage.getItem('ac_cursor') === 'true') body.classList.add('ac-big-cursor');
        if (localStorage.getItem('ac_toolbar') === 'true') body.classList.add('ac-toolbar-top');
        if (localStorage.getItem('ac_structure') === 'true') body.classList.add('ac-outline-structure');
        if (localStorage.getItem('ac_line_height') === 'true') body.classList.add('ac-line-height');
        if (localStorage.getItem('ac_align') === 'true') body.classList.add('ac-align-left');
        if (localStorage.getItem('ac_saturation') === 'true') body.classList.add('ac-low-saturation');
    })();

    const toggleClassPref = (btn, cls, key) => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            document.body.classList.toggle(cls);
            const ativo = document.body.classList.contains(cls);
            localStorage.setItem(key, ativo ? 'true' : 'false');
        });
    };

    // Abrir/fechar widget
    const accessibilityBtnFab = document.getElementById('accessibility-btn');
    if (accessibilityBtnFab && acWidget) {
        acWidget.classList.add('ac-hidden');
        accessibilityBtnFab.addEventListener('click', () => {
            acWidget.classList.toggle('ac-hidden');
        });
    }
    if (acClose && acWidget) {
        acClose.addEventListener('click', () => acWidget.classList.add('ac-hidden'));
    }
    if (acToggle && acWidget) {
        acToggle.addEventListener('click', () => acWidget.classList.toggle('ac-hidden'));
    }

    // Ler página
    if (acReadBtn) {
        acReadBtn.addEventListener('click', () => {
            const texto = document.body.innerText.slice(0, 1200);
            speak('Leitura da página iniciada. ' + texto);
        });
    }

    // Liga cada botão a uma classe no body
    toggleClassPref(acHighContrastBtn,  'ac-high-contrast',     'ac_high_contrast');
    toggleClassPref(acSmartContrastBtn, 'ac-smart-contrast',    'ac_smart_contrast');
    toggleClassPref(acLinksBtn,         'ac-links-highlight',   'ac_links');
    toggleClassPref(acTextBigBtn,       'ac-text-big',          'ac_text_big');
    toggleClassPref(acSpacingBtn,       'ac-text-spacing',      'ac_spacing');
    toggleClassPref(acAnimBtn,          'ac-anim-off',          'ac_anim_off');
    toggleClassPref(acHideImgBtn,       'ac-hide-images',       'ac_hide_img');
    toggleClassPref(acDislexiaBtn,      'ac-dislexia-font',     'ac_dislexia');
    toggleClassPref(acCursorBtn,        'ac-big-cursor',        'ac_cursor');
    toggleClassPref(acToolbarBtn,       'ac-toolbar-top',       'ac_toolbar');
    toggleClassPref(acStructureBtn,     'ac-outline-structure', 'ac_structure');
    toggleClassPref(acLineHeightBtn,    'ac-line-height',       'ac_line_height');
    toggleClassPref(acAlignBtn,         'ac-align-left',        'ac_align');
    toggleClassPref(acSaturationBtn,    'ac-low-saturation',    'ac_saturation');

    // Reset geral
    if (acResetBtn) {
        acResetBtn.addEventListener('click', () => {
            const body = document.body;
            body.classList.remove(
                'ac-high-contrast','ac-smart-contrast','ac-links-highlight','ac-text-big',
                'ac-text-spacing','ac-anim-off','ac-hide-images','ac-dislexia-font',
                'ac-big-cursor','ac-toolbar-top','ac-outline-structure','ac-line-height',
                'ac-align-left','ac-low-saturation'
            );
            [
                'ac_high_contrast','ac_smart_contrast','ac_links','ac_text_big','ac_spacing',
                'ac_anim_off','ac_hide_img','ac_dislexia','ac_cursor','ac_toolbar',
                'ac_structure','ac_line_height','ac_align','ac_saturation'
            ].forEach(k => localStorage.removeItem(k));
        });
    }

    // --- 3. FUNÇÃO initializePage ---
    function initializePage(mode, page) {
        const body = document.getElementById('page-body');
        if (!body) return;

        if (dashboardPages.includes(page) || page === 'login.html' || page.startsWith('cadastro-')) {
            // se quiser, pode chamar aqui funções extras do widget
        }

        switch (mode) {
            case 'visual':
                if (page.includes('cadastro-visual') || page === 'login.html') {
                    setupVisualMode(page);
                }
                break;
            case 'auditory':
                setupAuditoryMode();
                if (dashboardPages.includes(page) || page.includes('cadastro-auditivo')) {
                    setupAuditoryTalkback();
                }
                break;
            default:
                break;
        }
    }

    // --- 4. FUNÇÕES GERAIS DE ACESSIBILIDADE (fala) ---
    function speak(text, callback) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.onend = () => { if (callback) callback(); };

        let messageElement = document.getElementById('chatbot-message');
        if (!messageElement) {
            messageElement = document.getElementById('talkback-message');
        }
        if (messageElement) {
            messageElement.textContent = text;
        }

        window.speechSynthesis.speak(utterance);
    }

    function listen() {
        if (recognition) {
            try {
                recognition.start();
            } catch (e) {
                console.error('Reconhecimento já iniciado.');
            }
        }
    }

    // --- 5. VLIBRAS ---
    function setupAuditoryMode() {
        const vlibrasDiv = document.createElement('div');
        vlibrasDiv.id = 'vlibras-plugin';
        document.body.appendChild(vlibrasDiv);
        const vlibrasScript = document.createElement('script');
        vlibrasScript.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
        vlibrasScript.onload = () => { new window.VLibras.Widget('https://vlibras.gov.br/app'); };
        document.body.appendChild(vlibrasScript);
    }

    // --- 6. MODO VISUAL (CADASTRO CEGO/LOGIN) ---
    function setupVisualMode(page) {
        const chatbotContainer = document.getElementById('chatbot-container');
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
        const currentFieldElement = document.getElementById(chatbotState.currentField);
        if (currentFieldElement) {
            currentFieldElement.focus();
            startConversation(chatbotState.currentPage);
        }

        document.addEventListener('keydown', handleKeyboardInput);

        const form = document.getElementById('register-form') || document.getElementById('login-form');
        if (form) {
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                if (chatbotState.currentField === '') {
                    alert('Formulário enviado com sucesso! Redirecionando...');
                    window.location.href = form.id === 'register-form' ? 'login.html' : 'home.html';
                } else {
                    speak('Por favor, preencha o campo atual para finalizar: ' +
                        document.getElementById(chatbotState.currentField).previousElementSibling.textContent);
                }
            });
        }
    }

    function startConversation(page) {
        let initialField = page.startsWith('cadastro') ? 'fullname' : 'username';
        let welcomeMessage = '';

        if (page.startsWith('cadastro-visual')) {
            welcomeMessage = 'Olá! Bem-vindo ao cadastro acessível do EducaFácil. Você pode digitar ou falar. Use as setas para avançar ou retornar. Vamos começar. Por favor, diga ou digite seu nome completo.';
        } else if (page === 'login.html') {
            welcomeMessage = 'Você está na tela de login. Por favor, diga ou digite seu nome de usuário. Use as setas para avançar.';
        }

        chatbotState.currentField = initialField;
        speak(welcomeMessage, () => {
            if (SpeechRecognition) listen();
        });
    }

    function handleKeyboardInput(event) {
        const fields = chatbotState.currentPage.startsWith('cadastro')
            ? chatbotState.registerFields
            : chatbotState.loginFields;

        if (event.ctrlKey && (event.key === 'd' || event.key === 'D')) {
            event.preventDefault();
            typingTalkbackEnabled = !typingTalkbackEnabled;
            const msg = typingTalkbackEnabled
                ? 'Talkback de digitação ativado.'
                : 'Talkback de digitação desativado.';
            speak(msg);
            return;
        }

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

        if (typingTalkbackEnabled) {
            if (event.key.length === 1) {
                if (event.key.match(/^[a-zA-Z0-9\s@\.]*$/)) {
                    speak(event.key);
                }
            } else if (event.key === 'Backspace') {
                speak('Apagar');
            }
        }

        if (event.key === 'Enter' || event.key === 'Tab') {
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
            const correctedValue = value.toLowerCase()
                .replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
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
        if (newFieldElement && newFieldElement.parentElement.classList.contains('input-group')) {
            newFieldElement.parentElement.classList.add('active-field');
        }

        if (newFieldElement) {
            newFieldElement.focus();
            let labelText = newFieldElement.previousElementSibling.textContent;
            let finalMessage = prefixMessage + 'Campo atual: ' + labelText + '.';

            speak(finalMessage, () => {
                if (SpeechRecognition) listen();
            });
        }
    }

    // --- 7. TALKBACK AUDITIVO (DASHBOARD) ---
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
                            const label = document.querySelector('label[for="' + el.id + '"]')?.textContent;
                            textToSpeak = label ? 'Campo: ' + label + '.' : 'Campo de entrada.';
                        } else if (el.tagName === 'BUTTON') {
                            textToSpeak = 'Botão: ' + el.textContent + '.';
                        } else if (el.tagName === 'A') {
                            textToSpeak = 'Link: ' + el.textContent + '.';
                        } else if (el.classList.contains('card-simple')) {
                            const title = el.querySelector('h2, h3')?.textContent;
                            textToSpeak = title ? 'Bloco de conteúdo: ' + title + '.' : 'Bloco de informações.';
                        } else if (el.classList.contains('nav-item')) {
                            textToSpeak = 'Menu de navegação: ' + el.textContent.trim();
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

    // --- 8. SUBMISSÃO DE FORMULÁRIO PADRÃO (CADASTRO) ---
    if (registerForm && !currentPage.includes('visual')) {
        registerForm.addEventListener('submit', function (event) {
            event.preventDefault();

            const fullname = document.getElementById('fullname').value.trim();
            const email    = document.getElementById('email').value.trim();
            const password = document.getElementById('password-register').value.trim();

            if (!fullname || !email || !password) {
                const message = 'Por favor, preencha todos os campos do cadastro.';
                alert(message);
                if (accessibilityMode === 'auditory') {
                    speak(message);
                }
                return;
            }

            const successMessage = 'Cadastro efetuado com sucesso! Redirecionando para a área de login...';

            localStorage.setItem('perfil_nome', fullname);
            localStorage.setItem('perfil_email', email);

            alert(successMessage);

            if (accessibilityMode === 'auditory') {
                speak(successMessage, () => { window.location.href = 'login.html'; });
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    // --- 9. LOGIN PADRÃO ---
    if (loginForm && !currentPage.includes('visual')) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();

            if (!username || !password) {
                const message = 'Por favor, preencha seu usuário e senha.';
                alert(message);
                if (accessibilityMode === 'auditory') { speak(message); }
                return;
            }

            const successMessage = 'Login efetuado com sucesso! Bem-vindo(a) ao EducaFácil.';
            alert(successMessage);

            if (accessibilityMode === 'auditory') {
                speak(successMessage, () => { window.location.href = 'home.html'; });
            } else {
                window.location.href = 'home.html';
            }
        });
    }

    // --- 10. SELEÇÃO DE MODO (index.html) ---
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
