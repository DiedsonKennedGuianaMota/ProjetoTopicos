document.addEventListener('DOMContentLoaded', () => {
    // --- PERFIL NO DASHBOARD (NOME, EMAIL, FOTO) ---
(function atualizarPerfilDashboard() {
    const nome = localStorage.getItem('perfil_nome');
    const email = localStorage.getItem('perfil_email');
    const foto = localStorage.getItem('perfil_foto');

    const nomeEl = document.getElementById('aluno-nome');
    const emailEl = document.getElementById('aluno-email');
    const fotoEl = document.getElementById('aluno-foto');

    if (nome && nomeEl) nomeEl.textContent = nome;
    if (email && emailEl) emailEl.textContent = email;
    if (foto && fotoEl && foto.trim() !== '') {
        fotoEl.src = foto;
    }
})();

    // --- 1. DECLARAÇÕES DE VARIÁVEIS GLOBAIS ---
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const currentPage = window.location.pathname.split('/').pop();
    const accessibilityMode = localStorage.getItem('accessibilityMode');
    const dashboardPages = ['home.html', 'forum.html', 'aulas.html', 'conteudos.html', 'exercicios.html', 'configuracoes.html', 'certificados.html'];

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let chatbotState = {
        currentPage: '',
        currentField: 'fullname',
        registerFields: ['fullname', 'email', 'phone', 'password-register'],
        loginFields: ['username', 'password']
    };

    // --- 2. INICIALIZAÇÃO PRINCIPAL ---
    if (accessibilityMode) {
        initializePage(accessibilityMode, currentPage);
    }

    function initializePage(mode, page) {
        const body = document.getElementById('page-body');
        if (!body) return;

        if (dashboardPages.includes(page) || page === 'login.html' || page.startsWith('cadastro-')) {
            setupAccessibilityWidget();
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
        }
    }

    // --- 3. FUNÇÕES DE VOZ ---
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

    // --- 4. WIDGET DE ACESSIBILIDADE COMPLETO ---
    // --- 4. WIDGET DE ACESSIBILIDADE COMPLETO ---
function setupAccessibilityWidget() {
    const widget = document.getElementById('accessibility-widget');
    const fabBtn = document.getElementById('accessibility-btn');
    if (!widget || !fabBtn) return;

    const body = document.body;

    // estados internos para opções com múltiplos níveis
    let contrastState = parseInt(localStorage.getItem('ac_contrastState') || '0', 10); // 0=normal,1=invertido,2=escuro,3=claro
    let textLevel = parseInt(localStorage.getItem('ac_textLevel') || '0', 10);        // 0..4
    let saturationState = parseInt(localStorage.getItem('ac_saturationState') || '0', 10); // 0=normal,1=baixa,2=alta,3=zero

    // mapeamento simples (on/off)
    const optionsMap = {
        'ac-links-destacados': 'ac-links-destacados',
        'ac-espacamento-texto': 'ac-espacamento-texto',
        'ac-ocultar-imagens': 'ac-sem-imagens'
    };

    // PERFIS (mantém o que já estava, se quiser; opcional)
    const profilesMap = {
        'deficiencia-motora': ['ac-cursor-grande', 'ac-barra-ferramentas'],
        'cego': ['ac-estrutura-pagina', 'ac-altura-linha'],
        'daltonico': [],
        'dislexia': ['ac-dislexia'],
        'baixa-visao': [],
        'cognitivo': ['ac-espacamento-texto'],
        'convulsao': [],
        'tdah': ['ac-links-destacados']
    };

    /* ---------- APLICAR ESTADOS SALVOS (CONTRASTE, TEXTO, SATURAÇÃO) ---------- */

    function applyContrastState() {
        body.classList.remove('ac-contraste-invertido', 'ac-contraste-escuro', 'ac-contraste-claro');
        if (contrastState === 1) body.classList.add('ac-contraste-invertido');
        if (contrastState === 2) body.classList.add('ac-contraste-escuro');
        if (contrastState === 3) body.classList.add('ac-contraste-claro');
        localStorage.setItem('ac_contrastState', String(contrastState));
    }

    function applyTextLevel() {
        body.classList.remove('ac-texto-n1','ac-texto-n2','ac-texto-n3','ac-texto-n4');
        if (textLevel >= 1 && textLevel <= 4) {
            body.classList.add('ac-texto-n' + textLevel);
        }
        localStorage.setItem('ac_textLevel', String(textLevel));
    }

    function applySaturationState() {
        body.classList.remove('ac-saturacao-baixa','ac-saturacao-alta','ac-saturacao-zero');
        if (saturationState === 1) body.classList.add('ac-saturacao-baixa');
        if (saturationState === 2) body.classList.add('ac-saturacao-alta');
        if (saturationState === 3) body.classList.add('ac-saturacao-zero');
        localStorage.setItem('ac_saturationState', String(saturationState));
    }

    applyContrastState();
    applyTextLevel();
    applySaturationState();

    /* ---------- BOTÕES INDIVIDUAIS ---------- */

    // LER PÁGINA
    const btnLer = document.getElementById('ac-ler-pagina');
    if (btnLer) {
        btnLer.addEventListener('click', () => {
            const active = btnLer.classList.toggle('ac-item-active');
            if (active) {
                const main = document.querySelector('.main-content-area') || document.body;
                const textToRead = main.innerText || main.textContent || '';
                speak(textToRead);
            } else {
                window.speechSynthesis.cancel();
            }
        });
    }

    // CONTRASTE (3 níveis + volta ao normal)
    const btnContraste = document.getElementById('ac-contraste-mais');
    if (btnContraste) {
        btnContraste.addEventListener('click', () => {
            contrastState = (contrastState + 1) % 4; // 0->1->2->3->0
            applyContrastState();
            btnContraste.classList.toggle('ac-item-active', contrastState !== 0);
        });
        // estado visual inicial
        btnContraste.classList.toggle('ac-item-active', contrastState !== 0);
    }

    // LINKS DESTACADOS, ESPAÇAMENTO, IMAGENS (on/off simples)
    Object.keys(optionsMap).forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        const cls = optionsMap[id];
        const storageKey = 'ac_' + id;
        const saved = localStorage.getItem(storageKey) === 'true';
        if (saved) {
            body.classList.add(cls);
            btn.classList.add('ac-item-active');
        }
        btn.addEventListener('click', () => {
            const active = btn.classList.toggle('ac-item-active');
            body.classList.toggle(cls, active);
            localStorage.setItem(storageKey, String(active));
        });
    });

    // TEXTO MAIOR (4 níveis + volta ao normal)
    const btnTexto = document.getElementById('ac-texto-maior');
    if (btnTexto) {
        btnTexto.addEventListener('click', () => {
            textLevel = (textLevel + 1) % 5; // 0..4
            applyTextLevel();
            btnTexto.classList.toggle('ac-item-active', textLevel !== 0);
        });
        btnTexto.classList.toggle('ac-item-active', textLevel !== 0);
    }

    // SATURAÇÃO (baixa, alta, zero, normal)
    const btnSat = document.getElementById('ac-saturacao');
    if (btnSat) {
        btnSat.addEventListener('click', () => {
            saturationState = (saturationState + 1) % 4; // 0..3
            applySaturationState();
            btnSat.classList.toggle('ac-item-active', saturationState !== 0);
        });
        btnSat.classList.toggle('ac-item-active', saturationState !== 0);
    }

    /* ---------- PERFIS (OPCIONAL, MANTENDO SUA LÓGICA) ---------- */

    const profileButtons = document.querySelectorAll('.ac-profile');
    profileButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const profile = btn.getAttribute('data-profile');

            // limpa perfis anteriores
            profileButtons.forEach(b => b.classList.remove('ac-profile-active'));
            Object.values(optionsMap).forEach(cls => body.classList.remove(cls));
            profileButtons.forEach(b => b.classList.remove('ac-profile-active'));

            // limpa estados especiais
            contrastState = 0; textLevel = 0; saturationState = 0;
            applyContrastState(); applyTextLevel(); applySaturationState();

            // aplica perfil
            btn.classList.add('ac-profile-active');
            const classesToApply = profilesMap[profile] || [];
            classesToApply.forEach(cls => body.classList.add(cls));

            localStorage.setItem('ac_profile', profile);
        });
    });

    const savedProfile = localStorage.getItem('ac_profile');
    if (savedProfile && document.querySelector('.ac-profile[data-profile="' + savedProfile + '"]')) {
        document.querySelector('.ac-profile[data-profile="' + savedProfile + '"]').click();
    }

    /* ---------- ABRIR / FECHAR / RESET / WIDGET VISÍVEL ---------- */

    function openWidget() {
        widget.classList.remove('ac-hidden');
        widget.setAttribute('aria-hidden', 'false');
    }
    function closeWidget() {
        widget.classList.add('ac-hidden');
        widget.setAttribute('aria-hidden', 'true');
    }

    fabBtn.addEventListener('click', () => {
        const isHidden = widget.classList.contains('ac-hidden');
        if (isHidden) openWidget(); else closeWidget();
    });

    const closeBtn = document.getElementById('ac-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeWidget);

    // CTRL+U
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
            e.preventDefault();
            const isHidden = widget.classList.contains('ac-hidden');
            if (isHidden) openWidget(); else closeWidget();
        }
    });

    // Reset geral
    const resetBtn = document.getElementById('ac-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            // simples
            Object.keys(optionsMap).forEach(id => {
                const btn = document.getElementById(id);
                if (!btn) return;
                btn.classList.remove('ac-item-active');
                body.classList.remove(optionsMap[id]);
                localStorage.removeItem('ac_' + id);
            });
            // especiais
            contrastState = 0; textLevel = 0; saturationState = 0;
            applyContrastState(); applyTextLevel(); applySaturationState();
            const btnContr = document.getElementById('ac-contraste-mais');
            const btnTxt = document.getElementById('ac-texto-maior');
            const btnS = document.getElementById('ac-saturacao');
            if (btnContr) btnContr.classList.remove('ac-item-active');
            if (btnTxt) btnTxt.classList.remove('ac-item-active');
            if (btnS) btnS.classList.remove('ac-item-active');
            profileButtons.forEach(b => b.classList.remove('ac-profile-active'));
            localStorage.removeItem('ac_profile');
            window.speechSynthesis.cancel();
        });
    }

    // mostrar/ocultar botão flutuante
    const moveBtn = document.getElementById('ac-toggle-visibility');
    if (moveBtn) {
        const visibilityKey = 'ac_widget_visible';
        const savedVisible = localStorage.getItem(visibilityKey);
        if (savedVisible === 'false') {
            fabBtn.style.display = 'none';
        }
        moveBtn.addEventListener('click', () => {
            const isVisible = fabBtn.style.display !== 'none';
            if (isVisible) {
                fabBtn.style.display = 'none';
                localStorage.setItem(visibilityKey, 'false');
            } else {
                fabBtn.style.display = 'flex';
                localStorage.setItem(visibilityKey, 'true');
            }
        });
    }
}


    // --- 5. VLIBRAS (MODO AUDITIVO) ---
    function setupAuditoryMode() {
        const vlibrasDiv = document.createElement('div');
        vlibrasDiv.id = 'vlibras-plugin';
        document.body.appendChild(vlibrasDiv);
        const vlibrasScript = document.createElement('script');
        vlibrasScript.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
        vlibrasScript.onload = () => { new window.VLibras.Widget('https://vlibras.gov.br/app'); };
        document.body.appendChild(vlibrasScript);
    }

    // --- 6. MODO VISUAL (CEGOS) ---
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
                    speak('Por favor, preencha o campo atual para finalizar: ' + document.getElementById(chatbotState.currentField).previousElementSibling.textContent);
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
        const fields = chatbotState.currentPage.startsWith('cadastro') ? chatbotState.registerFields : chatbotState.loginFields;

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

        if (event.key.length === 1) {
            if (event.key.match(/^[a-zA-Z0-9\s@\.]*$/)) {
                speak(event.key);
            }
        } else if (event.key === 'Backspace') {
            speak('Apagar');
        } else if (event.key === 'Enter' || event.key === 'Tab') {
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

    // --- 7. TALKBACK AUDITIVO ---
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

    // --- 8. SUBMISSÃO DE FORMULÁRIOS ---
    if (registerForm && !currentPage.includes('visual')) {
        registerForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const fullname = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password-register').value;

            if (!fullname || !email || !password) {
                const message = 'Por favor, preencha todos os campos do cadastro.';
                alert(message);
                if (accessibilityMode === 'auditory') { speak(message); }
                return;
            }

            const successMessage = 'Cadastro efetuado com sucesso! Redirecionando para a área de login...';
            alert(successMessage);

            if (accessibilityMode === 'auditory') {
                speak(successMessage, () => { window.location.href = 'login.html'; });
            } else {
                window.location.href = 'login.html';
            }
        });
    }

    if (loginForm && !currentPage.includes('visual')) {
        loginForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

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

    // --- 9. SELEÇÃO DE MODO (index.html) ---
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


