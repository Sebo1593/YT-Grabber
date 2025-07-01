// content.js - RZECZYWISTE ROZWIĄZANIE problemu polskich napisów automatycznych
class YouTubeTranscriptExtractor {
  constructor() {
    this.modalOpen = false;
    this.buttonPosition = 'middle-right';
    this.buttonStyle = 'gradient';
    this.retryCount = 0;
    this.maxRetries = 3;
    this.init();
  }

  async init() {
    console.log('🚀 Inicjalizuję ZT-Youtube...');
    this.setupMessageListener();
    await this.loadButtonSettings();
    this.setupStorageListener();
    this.setupFullscreenListener();
    this.waitForPageLoad();
    this.setupNavigationListener();
    console.log('✅ ZT-Youtube zainicjalizowany');
  }

  waitForPageLoad() {
    const checkAndAdd = () => {
      const hasButton = document.getElementById('transcript-summary-btn');
      if (this.shouldAddButton() && !hasButton) {
        console.log('🔄 Dodaję przycisk...');
        setTimeout(() => this.addSummaryButton(), 1000);
      }
    };

    checkAndAdd();
    const observer = new MutationObserver(checkAndAdd);
    observer.observe(document.body, { childList: true, subtree: true });

    const appNode = document.querySelector('ytd-app');
    if (appNode) {
      const appObserver = new MutationObserver(checkAndAdd);
      appObserver.observe(appNode, { childList: true, subtree: true });
    }

    setInterval(checkAndAdd, 5000);
  }

  shouldAddButton() {
    const isYouTube = window.location.href.includes('youtube.com');
    const isWatchPage = window.location.href.includes('/watch');
    const result = isYouTube && isWatchPage;
    console.log('🔍 shouldAddButton:', { isYouTube, isWatchPage, result });
    return result;
  }

  async loadButtonSettings() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get(['button_position', 'button_style'], (res) => {
          if (chrome.runtime.lastError) {
            console.log('⚠️ Chrome storage error, używam domyślnych ustawień');
            resolve();
            return;
          }
          this.buttonPosition = res.button_position || 'middle-right';
          this.buttonStyle = res.button_style || 'gradient';
          console.log('⚙️ Ustawienia załadowane:', { position: this.buttonPosition, style: this.buttonStyle });
          resolve();
        });
      } catch (error) {
        console.log('⚠️ Chrome storage niedostępne, używam domyślnych ustawień');
        resolve();
      }
    });
  }

  setupStorageListener() {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync' && (changes.button_position || changes.button_style)) {
          if (changes.button_position) this.buttonPosition = changes.button_position.newValue;
          if (changes.button_style) this.buttonStyle = changes.button_style.newValue;
          
          const oldBtn = document.getElementById('transcript-summary-btn');
          if (oldBtn) oldBtn.remove();
          
          if (this.shouldAddButton()) {
            this.addSummaryButton();
          }
        }
      });
    } catch (error) {
      console.log('⚠️ Storage listener setup failed, but continuing...');
    }
  }

  setupFullscreenListener() {
    document.addEventListener('fullscreenchange', () => {
      const btn = document.getElementById('transcript-summary-btn');
      if (!btn) return;
      
      if (document.fullscreenElement) {
        btn.style.display = 'none';
      } else {
        btn.style.display = 'flex';
      }
    });
  }

  getPositionStyles() {
    switch (this.buttonPosition) {
      case 'top-right':
        return 'top: 20px !important; right: 20px !important;';
      case 'top-left':
        return 'top: 20px !important; left: 20px !important;';
      case 'bottom-right':
        return 'bottom: 20px !important; right: 20px !important;';
      case 'bottom-left':
        return 'bottom: 20px !important; left: 20px !important;';
      case 'middle-left':
        return 'top: 80px !important; left: 20px !important;';
      case 'middle-right':
      default:
        return 'top: 80px !important; right: 20px !important;';
    }
  }

  addSummaryButton() {
    if (document.getElementById('transcript-summary-btn')) {
      console.log('⚠️ Przycisk już istnieje, pomijam');
      return;
    }

    console.log('✅ Dodaję przycisk Analizuj');

    const summaryButton = document.createElement('button');
    summaryButton.id = 'transcript-summary-btn';
    summaryButton.innerHTML = `
      <span style="font-size: 16px;">🧠</span>
      <span>Analizuj</span>
    `;
    summaryButton.title = 'Analizuj wideo i wyślij do AI';
    
    const positionStyles = this.getPositionStyles();
    const baseBg = this.buttonStyle === 'gray'
      ? '#6b7280'
      : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';

    summaryButton.style.cssText = `
      position: fixed !important;
      ${positionStyles}
      z-index: 999999 !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 12px 20px !important;
      background: ${baseBg} !important;
      color: white !important;
      border: none !important;
      border-radius: 25px !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4) !important;
      font-family: "Roboto", Arial, sans-serif !important;
      transition: all 0.3s ease !important;
      min-width: 120px !important;
      justify-content: center !important;
      backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
    `;
    
    summaryButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('🖱️ Przycisk kliknięty');
      this.showModelSelection();
    });
    
    // Hover effects
    summaryButton.addEventListener('mouseenter', () => {
      summaryButton.style.transform = 'translateY(-2px) scale(1.05)';
      summaryButton.style.boxShadow = '0 8px 30px rgba(79, 70, 229, 0.6)';
      summaryButton.style.background = this.buttonStyle === 'gray'
        ? '#4b5563'
        : 'linear-gradient(135deg, #5b21b6 0%, #8b5cf6 100%)';
    });

    summaryButton.addEventListener('mouseleave', () => {
      summaryButton.style.transform = 'translateY(0) scale(1)';
      summaryButton.style.boxShadow = '0 4px 20px rgba(79, 70, 229, 0.4)';
      summaryButton.style.background = baseBg;
    });
    
    document.body.appendChild(summaryButton);
    console.log('✅ Przycisk dodany do DOM');
    
    setTimeout(() => {
      this.showNotification('🎯 Przycisk "Analizuj" jest gotowy!', 'success');
    }, 500);
  }

  showModelSelection() {
    if (this.modalOpen) return;
    this.modalOpen = true;

    console.log('📱 Otwieranie modalu wyboru');

    const modalPanel = document.createElement('div');
    modalPanel.id = 'ai-model-panel';
    modalPanel.style.cssText = `
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      background: white !important;
      border: 1px solid #e9ecef !important;
      border-radius: 12px !important;
      padding: 24px !important;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3) !important;
      font-family: "Roboto", Arial, sans-serif !important;
      z-index: 1000000 !important;
      max-width: 450px !important;
      width: 90vw !important;
      max-height: 90vh !important;
      overflow-y: auto !important;
      animation: modalFadeIn 0.3s ease-out !important;
    `;

    if (!document.getElementById('modal-styles')) {
      const style = document.createElement('style');
      style.id = 'modal-styles';
      style.textContent = `
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }

    modalPanel.innerHTML = this.getModalHTML();

    const backdrop = document.createElement('div');
    backdrop.id = 'modal-backdrop';
    backdrop.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 0, 0, 0.5) !important;
      z-index: 999999 !important;
    `;
    
    backdrop.addEventListener('click', () => this.closeModal());

    document.body.appendChild(backdrop);
    document.body.appendChild(modalPanel);

    this.setupModalEventListeners(modalPanel);
  }

  getModalHTML() {
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
        <div>
          <h3 style="margin: 0; color: #333; font-size: 20px; display: flex; align-items: center; gap: 8px;">
            🧠 ZT-Youtube AI
          </h3>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">Wybierz platformę i typ analizy</p>
        </div>
        <button id="close-modal" style="
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
          padding: 8px;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        " title="Zamknij">×</button>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 12px 0; color: #333; font-size: 15px; font-weight: 600;">Typ analizy:</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
          <button class="analysis-type" data-type="summary" style="
            padding: 12px 10px;
            border: 2px solid #10a37f;
            border-radius: 8px;
            background: #10a37f;
            color: white;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 13px;
          ">
            📄 Podsumowanie
          </button>
          <button class="analysis-type" data-type="analysis" style="
            padding: 12px 10px;
            border: 2px solid #7c3aed;
            border-radius: 8px;
            background: white;
            color: #7c3aed;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 13px;
          ">
            🔍 Analiza
          </button>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <button class="analysis-type" data-type="bullet" style="
            padding: 12px 10px;
            border: 2px solid #f59e0b;
            border-radius: 8px;
            background: white;
            color: #f59e0b;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 13px;
          ">
            • Punkty kluczowe
          </button>
          <button class="analysis-type" data-type="custom" style="
            padding: 12px 10px;
            border: 2px solid #6b7280;
            border-radius: 8px;
            background: white;
            color: #6b7280;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-size: 13px;
          ">
            ✨ Własny
          </button>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 12px 0; color: #333; font-size: 15px; font-weight: 600;">Platforma AI:</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <button class="platform-choice" data-platform="chatgpt" style="
            padding: 14px;
            border: 2px solid #10a37f;
            border-radius: 8px;
            background: #10a37f;
            color: white;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 14px;
          ">
            🤖 ChatGPT
          </button>
          <button class="platform-choice" data-platform="claude" style="
            padding: 14px;
            border: 2px solid #d97706;
            border-radius: 8px;
            background: white;
            color: #d97706;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-size: 14px;
          ">
            🧠 Claude
          </button>
        </div>
      </div>

      <div id="model-selection-area" style="margin-bottom: 20px;">
        <h4 style="margin: 0 0 12px 0; color: #333; font-size: 15px; font-weight: 600;">Model ChatGPT:</h4>
        <select id="model-dropdown" style="
          width: 100%;
          padding: 12px;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 14px;
          background: white;
          cursor: pointer;
        ">
          <option value="gpt-4o">GPT-4o (najnowszy)</option>
          <option value="o3">o3 (szybki)</option>
        </select>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: flex; align-items: center; gap: 10px; font-size: 14px; color: #333; cursor: pointer;">
          <input type="checkbox" id="auto-send-checkbox" checked style="
            width: 18px;
            height: 18px;
            accent-color: #4f46e5;
          ">
          <span>Automatycznie wyślij prompt (Enter)</span>
        </label>
      </div>

      <div style="display: flex; gap: 12px; justify-content: stretch;">
        <button id="cancel-btn" style="
          flex: 1;
          padding: 12px;
          border: 2px solid #6b7280;
          border-radius: 8px;
          background: white;
          color: #6b7280;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          font-size: 14px;
        ">
          Anuluj
        </button>
        <button id="proceed-btn" style="
          flex: 2;
          padding: 12px;
          border: none;
          border-radius: 8px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
          font-size: 14px;
        ">
          🚀 Rozpocznij analizę
        </button>
      </div>

      <div id="progress-area" style="display: none; margin-top: 20px; padding: 16px; background: #f8f9fa; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 12px; color: #333;">
          <div style="
            width: 20px;
            height: 20px;
            border: 2px solid #4f46e5;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
          <span id="progress-text">Pobieranie transkrypcji...</span>
        </div>
        <div id="method-info" style="margin-top: 8px; font-size: 12px; color: #666;">
          Metoda: <span id="current-method">DOM</span>
        </div>
      </div>
    `;
  }

  setupModalEventListeners(modalPanel) {
    const analysisTypeBtns = modalPanel.querySelectorAll('.analysis-type');
    const platformBtns = modalPanel.querySelectorAll('.platform-choice');
    const modelArea = modalPanel.querySelector('#model-selection-area');
    const modelDropdown = modalPanel.querySelector('#model-dropdown');
    
    let selectedAnalysisType = 'summary';
    let selectedPlatform = 'chatgpt';

    // Załaduj domyślne ustawienia
    this.loadModalSettings().then(settings => {
      selectedAnalysisType = settings.analysis_type || 'summary';
      selectedPlatform = settings.ai_platform || 'chatgpt';
      
      // Ustaw domyślne wybory
      this.setModalDefaults(modalPanel, settings);
    });

    analysisTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        analysisTypeBtns.forEach(b => {
          const type = b.dataset.type;
          const colors = {
            summary: '#10a37f',
            analysis: '#7c3aed',
            bullet: '#f59e0b',
            custom: '#6b7280'
          };
          
          if (b.dataset.type === btn.dataset.type) {
            b.style.background = colors[type];
            b.style.color = 'white';
          } else {
            b.style.background = 'white';
            b.style.color = colors[type];
          }
        });
        
        selectedAnalysisType = btn.dataset.type;
        console.log('🔍 Wybrano typ analizy:', selectedAnalysisType);
      });
    });

    platformBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        platformBtns.forEach(b => {
          b.style.background = b.dataset.platform === btn.dataset.platform ? 
            (b.dataset.platform === 'chatgpt' ? '#10a37f' : '#d97706') : 'white';
          b.style.color = b.dataset.platform === btn.dataset.platform ? 'white' : 
            (b.dataset.platform === 'chatgpt' ? '#10a37f' : '#d97706');
        });
        
        selectedPlatform = btn.dataset.platform;
        console.log('🎯 Wybrano platformę:', selectedPlatform);
        
        if (selectedPlatform === 'claude') {
          modelArea.style.display = 'none';
        } else {
          modelArea.style.display = 'block';
        }
      });
    });

    modalPanel.querySelector('#close-modal').addEventListener('click', () => {
      this.closeModal();
    });

    modalPanel.querySelector('#cancel-btn').addEventListener('click', () => {
      this.closeModal();
    });

    modalPanel.querySelector('#proceed-btn').addEventListener('click', () => {
      const selectedModel = modelDropdown.value;
      const autoSend = modalPanel.querySelector('#auto-send-checkbox').checked;
      
      console.log('🚀 Rozpoczynam analizę:', { selectedPlatform, selectedModel, selectedAnalysisType, autoSend });
      
      this.showProgress(modalPanel);
      this.handleSummaryRequest(selectedPlatform, selectedModel, selectedAnalysisType, autoSend, modalPanel);
    });
  }

  async loadModalSettings() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get([
          'ai_platform', 
          'ai_model', 
          'analysis_type',
          'auto_send'
        ], (result) => {
          if (chrome.runtime.lastError) {
            console.log('⚠️ Storage error, using defaults');
            resolve({});
            return;
          }
          resolve(result);
        });
      } catch (error) {
        console.log('⚠️ Storage unavailable, using defaults');
        resolve({});
      }
    });
  }

  setModalDefaults(modalPanel, settings) {
    // Ustaw domyślny typ analizy
    const analysisType = settings.analysis_type || 'summary';
    const analysisBtn = modalPanel.querySelector(`[data-type="${analysisType}"]`);
    if (analysisBtn) {
      analysisBtn.click();
    }

    // Ustaw domyślną platformę
    const platform = settings.ai_platform || 'chatgpt';
    const platformBtn = modalPanel.querySelector(`[data-platform="${platform}"]`);
    if (platformBtn) {
      platformBtn.click();
    }

    // Ustaw domyślny model
    const modelDropdown = modalPanel.querySelector('#model-dropdown');
    if (modelDropdown && settings.ai_model) {
      modelDropdown.value = settings.ai_model;
    }

    // Ustaw auto-send
    const autoSendCheckbox = modalPanel.querySelector('#auto-send-checkbox');
    if (autoSendCheckbox && settings.auto_send !== undefined) {
      autoSendCheckbox.checked = settings.auto_send;
    }
  }

  showProgress(modalPanel) {
    const progressArea = modalPanel.querySelector('#progress-area');
    const proceedBtn = modalPanel.querySelector('#proceed-btn');
    const cancelBtn = modalPanel.querySelector('#cancel-btn');
    
    progressArea.style.display = 'block';
    proceedBtn.disabled = true;
    proceedBtn.style.opacity = '0.6';
    cancelBtn.disabled = true;
    cancelBtn.style.opacity = '0.6';
  }

  closeModal() {
    const modal = document.getElementById('ai-model-panel');
    const backdrop = document.getElementById('modal-backdrop');
    
    if (modal) modal.remove();
    if (backdrop) backdrop.remove();
    
    this.modalOpen = false;
    this.retryCount = 0;
    console.log('🔒 Modal zamknięty');
  }

  async handleSummaryRequest(platform, model, analysisType, autoSend, modalPanel) {
    const progressText = modalPanel.querySelector('#progress-text');
    const currentMethod = modalPanel.querySelector('#current-method');
    
    try {
      progressText.textContent = 'Pobieranie transkrypcji...';
      console.log('🚀 Rozpoczynam pobieranie transkrypcji...');

      let transcript = null;
      this.retryCount = 0;

      while (!transcript && this.retryCount < this.maxRetries) {
        this.retryCount++;
        
        if (this.retryCount > 1) {
          progressText.textContent = `Próba ${this.retryCount}/3...`;
        }

        transcript = await this.getTranscript(currentMethod);
        
        if (!transcript && this.retryCount < this.maxRetries) {
          console.log(`⚠️ Próba ${this.retryCount} nieudana, czekam 2s przed kolejną...`);
          await this.sleep(2000);
        }
      }

      if (!transcript) {
        throw new Error('Nie udało się pobrać transkrypcji po 3 próbach. Sprawdź czy wideo ma dostępne napisy.');
      }

      console.log(`✅ Pobrano transkrypcję (${transcript.length} znaków) po ${this.retryCount} próbach`);
      progressText.textContent = 'Przygotowywanie promptu...';

      const settings = await this.getSettings();
      const platformName = platform === 'claude' ? 'Claude' : 'ChatGPT';

      const prompt = this.createAIPrompt(
        transcript,
        document.title,
        window.location.href,
        platform,
        analysisType,
        settings
      );

      console.log(`📝 Utworzono prompt (${prompt.length} znaków)`);
      progressText.textContent = 'Kopiowanie do schowka...';

      try {
        await navigator.clipboard.writeText(prompt);
        console.log('✅ Prompt skopiowany do schowka');
      } catch (e) {
        console.log('⚠️ Nie udało się skopiować do schowka:', e);
      }

      progressText.textContent = `Otwieranie ${platformName}...`;

      // Wyślij do background script
      try {
        chrome.runtime.sendMessage({
          action: 'openAI',
          platform: platform,
          model: model,
          prompt: prompt,
          autoSend: autoSend,
          settings: settings
        });
      } catch (error) {
        console.log('⚠️ Runtime message failed, opening manually:', error);
        // Fallback - otwórz w nowej karcie
        const urls = {
          chatgpt: 'https://chatgpt.com/',
          claude: 'https://claude.ai/'
        };
        window.open(urls[platform], '_blank');
      }

      progressText.textContent = `✅ ${platformName} zostanie otwarty!`;
      
      setTimeout(() => {
        this.closeModal();
      }, 2000);

    } catch (error) {
      console.error('❌ Błąd:', error);
      progressText.textContent = `❌ ${error.message}`;
      progressText.style.color = '#dc2626';
      
      setTimeout(() => {
        const progressArea = modalPanel.querySelector('#progress-area');
        const proceedBtn = modalPanel.querySelector('#proceed-btn');
        const cancelBtn = modalPanel.querySelector('#cancel-btn');
        
        progressArea.style.display = 'none';
        proceedBtn.disabled = false;
        proceedBtn.style.opacity = '1';
        cancelBtn.disabled = false;
        cancelBtn.style.opacity = '1';
      }, 5000);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getTranscript(currentMethod) {
    const methods = [
      // Metoda 1: YouTube InnerTube API (najnowsza)
      () => this.getTranscriptFromInnerTubeAPI(currentMethod),
      
      // Metoda 2: Kompletne dane z playerResponse z podpisami
      () => this.getTranscriptFromPlayerResponseWithSignatures(currentMethod),
      
      // Metoda 3: Szukanie w DOM (napisy już załadowane)
      () => this.getTranscriptFromDOMReal(currentMethod),
      
      // Metoda 4: Backup przez window.fetch z wszystkimi parametrami
      () => this.getTranscriptWithCompleteParameters(currentMethod)
    ];

    const methodNames = ['InnerTube API', 'PlayerResponse+Signatures', 'DOM Real', 'Complete Parameters'];

    for (let i = 0; i < methods.length; i++) {
      try {
        console.log(`🔄 Próbuję metodę ${i + 1}: ${methodNames[i]}`);
        if (currentMethod) currentMethod.textContent = methodNames[i];
        
        const transcript = await methods[i]();
        
        if (transcript && transcript.length > 200) {
          console.log(`✅ Sukces z metodą: ${methodNames[i]} (${transcript.length} znaków)`);
          return transcript;
        } else {
          console.log(`⚠️ Metoda ${methodNames[i]} zwróciła za krótką transkrypcję: ${transcript?.length || 0} znaków`);
        }
      } catch (error) {
        console.log(`❌ Błąd w metodzie ${methodNames[i]}:`, error.message);
      }
      
      if (i < methods.length - 1) {
        await this.sleep(1000);
      }
    }

    return null;
  }

  async getTranscriptFromInnerTubeAPI(currentMethod) {
    try {
      console.log('🔍 Próbuję YouTube InnerTube API...');
      
      const videoId = this.extractVideoId();
      if (!videoId) {
        throw new Error('Nie można wyodrębnić videoId');
      }

      // YouTube InnerTube API endpoint
      const innerTubeUrl = 'https://www.youtube.com/youtubei/v1/player';
      
      // Pozyskaj klucz API i parametry kontekstu z strony
      const apiKey = this.extractAPIKey();
      const context = this.getYouTubeContext();
      
      const requestBody = {
        videoId: videoId,
        context: context,
        params: ''
      };

      console.log('📡 InnerTube request:', { videoId, context });

      const response = await fetch(`${innerTubeUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': navigator.userAgent,
          'Referer': window.location.href,
          'Origin': 'https://www.youtube.com'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`InnerTube API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('📄 InnerTube response otrzymana');

      // Wyodrębnij captionTracks z odpowiedzi
      const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (!captionTracks || captionTracks.length === 0) {
        throw new Error('Brak captionTracks w InnerTube API');
      }

      console.log('📋 InnerTube napisy:', captionTracks.map(c => ({
        vssId: c.vssId,
        languageCode: c.languageCode,
        name: c.name?.simpleText,
        kind: c.kind,
        isTranslatable: c.isTranslatable
      })));

      // Wybierz najlepsze napisy z priorytetem dla polskich
      const bestCaption = this.selectBestCaptionReal(captionTracks);
      if (!bestCaption) {
        throw new Error('Nie znaleziono odpowiednich napisów w InnerTube');
      }

      console.log('🎯 InnerTube wybrane napisy:', {
        language: bestCaption.languageCode || bestCaption.vssId,
        name: bestCaption.name?.simpleText,
        kind: bestCaption.kind,
        isTranslatable: bestCaption.isTranslatable
      });

      // Pobierz transkrypcję używając baseUrl z podpisem
      return await this.fetchTranscriptFromBaseUrl(bestCaption.baseUrl);

    } catch (error) {
      console.error('❌ Błąd w getTranscriptFromInnerTubeAPI:', error);
      throw error;
    }
  }

  async getTranscriptFromPlayerResponseWithSignatures(currentMethod) {
    try {
      console.log('🔍 Szukam playerResponse z podpisami...');
      
      // Szukaj w różnych miejscach na stronie
      const scripts = document.querySelectorAll('script');
      let playerResponse = null;
      
      for (const script of scripts) {
        const content = script.textContent || '';
        
        // Różne wzorce dla playerResponse
        const patterns = [
          /var\s+ytInitialPlayerResponse\s*=\s*(\{.*?\});/s,
          /ytInitialPlayerResponse\s*=\s*(\{.*?\});/s,
          /window\["ytInitialPlayerResponse"\]\s*=\s*(\{.*?\});/s,
          /"playerResponse":\s*(\{.*?\})(?:,|\})/s,
          /playerResponse['"]:\s*(\{.*?\})/s
        ];

        for (const pattern of patterns) {
          const match = content.match(pattern);
          if (match) {
            try {
              const response = JSON.parse(match[1]);
              if (response.captions?.playerCaptionsTracklistRenderer?.captionTracks) {
                playerResponse = response;
                console.log('✅ Znaleziono playerResponse z napisami');
                break;
              }
            } catch (e) {
              continue;
            }
          }
        }
        
        if (playerResponse) break;
      }

      if (!playerResponse) {
        throw new Error('Nie znaleziono playerResponse z napisami');
      }

      const captionTracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;
      
      console.log('📋 PlayerResponse napisy:', captionTracks.map(c => ({
        vssId: c.vssId,
        languageCode: c.languageCode,
        name: c.name?.simpleText,
        hasBaseUrl: !!c.baseUrl,
        kind: c.kind
      })));

      // Wybierz najlepsze napisy
      const bestCaption = this.selectBestCaptionReal(captionTracks);
      if (!bestCaption || !bestCaption.baseUrl) {
        throw new Error('Nie znaleziono napisów z baseUrl');
      }

      console.log('🎯 PlayerResponse wybrane napisy:', {
        language: bestCaption.languageCode || bestCaption.vssId,
        name: bestCaption.name?.simpleText,
        baseUrlLength: bestCaption.baseUrl.length
      });

      // baseUrl już zawiera signature i wszystkie potrzebne parametry
      return await this.fetchTranscriptFromBaseUrl(bestCaption.baseUrl);

    } catch (error) {
      console.error('❌ Błąd w getTranscriptFromPlayerResponseWithSignatures:', error);
      throw error;
    }
  }

  async getTranscriptFromDOMReal(currentMethod) {
    console.log('🔍 Szukanie rzeczywistych napisów w DOM...');
    
    // Selektory dla rzeczywistych napisów YouTube
    const realSelectors = [
      // Panel transkrypcji YouTube
      'ytd-transcript-renderer .segment-text',
      'ytd-transcript-segment-renderer .segment-text',
      
      // Napisy w odtwarzaczu  
      '.ytp-caption-segment',
      '.caption-window .ytp-caption-segment',
      
      // Najnowsze selektory YouTube 2024
      '[class*="transcript"] [class*="segment-text"]',
      '[class*="transcript"] [class*="cue-text"]',
      
      // Automatyczne napisy
      '[aria-label*="Caption"] .segment-text',
      '[role="button"][aria-label*="transcript"] .segment-text'
    ];

    let transcript = '';
    let foundElements = 0;

    for (const selector of realSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        console.log(`🔍 Selektor "${selector}": ${elements.length} elementów`);
        
        if (elements.length > 5) { // Minimum 5 elementów dla sensownej transkrypcji
          foundElements = elements.length;
          const textParts = [];
          
          elements.forEach((element, index) => {
            const text = this.extractTextFromElementReal(element);
            if (text && text.length > 1) {
              textParts.push(text);
              
              if (index < 3) {
                console.log(`📝 Element ${index}: "${text.substring(0, 50)}..."`);
              }
            }
          });
          
          if (textParts.length > 5) {
            transcript = textParts.join(' ');
            
            if (transcript.trim().length > 200) {
              console.log(`✅ DOM Real sukces: ${foundElements} elementów, ${transcript.length} znaków`);
              return this.normalizeText(transcript.trim());
            }
          }
        }
      } catch (e) {
        console.log(`❌ Błąd selektora ${selector}:`, e.message);
      }
    }

    console.log(`⚠️ DOM Real nie znalazł wystarczających napisów`);
    return null;
  }

  async getTranscriptWithCompleteParameters(currentMethod) {
    try {
      console.log('🔍 Próba z kompletnymi parametrami...');
      
      const videoId = this.extractVideoId();
      if (!videoId) {
        throw new Error('Brak videoId');
      }

      // Pozyskaj wszystkie potrzebne parametry z strony
      const params = this.extractYouTubeParameters();
      
      // URLs z kompletnymi parametrami dla różnych języków
      const urls = [
        // Polskie automatyczne napisy
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=pl&kind=asr&${params}`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=pl-PL&kind=asr&${params}`,
        
        // Tłumaczone napisy en->pl
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&tlang=pl&kind=asr&${params}`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&tlang=pl-PL&kind=asr&${params}`,
        
        // Angielskie automatyczne napisy jako fallback
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&${params}`,
        `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&${params}`
      ];

      for (const url of urls) {
        try {
          console.log(`📡 Próbuję: ${url.substring(0, 100)}...`);
          
          const response = await fetch(url, {
            headers: {
              'Accept': 'text/xml,application/xml,text/vtt,text/plain,*/*',
              'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
              'User-Agent': navigator.userAgent,
              'Referer': window.location.href,
              'Origin': 'https://www.youtube.com'
            }
          });

          if (response.ok) {
            const text = await response.text();
            console.log(`📄 Odpowiedź: ${text.length} znaków`);
            
            if (text.length > 100 && !text.includes('error') && !text.includes('<error>')) {
              const parsed = this.parseSubtitleContent(text);
              if (parsed && parsed.length > 200) {
                console.log(`✅ Complete Parameters sukces: ${parsed.length} znaków`);
                return parsed;
              }
            }
          } else {
            console.log(`❌ HTTP ${response.status}`);
          }
        } catch (e) {
          console.log(`❌ Błąd URL:`, e.message);
          continue;
        }
      }

      throw new Error('Wszystkie URLs z kompletnymi parametrami zawiodły');

    } catch (error) {
      console.error('❌ Błąd w getTranscriptWithCompleteParameters:', error);
      throw error;
    }
  }

  extractAPIKey() {
    // Pozyskaj klucz API YouTube z strony
    const scripts = document.querySelectorAll('script');
    
    for (const script of scripts) {
      const content = script.textContent || '';
      
      // Szukaj wzorców API key
      const patterns = [
        /"INNERTUBE_API_KEY":\s*"([^"]+)"/,
        /"innertubeApiKey":\s*"([^"]+)"/,
        /key=([A-Za-z0-9_-]+)/,
        /"key":\s*"([^"]+)"/
      ];
      
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
          console.log('🔑 Znaleziono API key');
          return match[1];
        }
      }
    }
    
    // Fallback do domyślnego klucza YouTube
    console.log('⚠️ Używam domyślnego API key');
    return 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'; // Publiczny klucz YouTube
  }

  getYouTubeContext() {
    // Kontekst dla YouTube InnerTube API
    return {
      client: {
        hl: 'pl',
        gl: 'PL',
        clientName: 'WEB',
        clientVersion: '2.20241210.01.00',
        userAgent: navigator.userAgent,
        timeZone: 'Europe/Warsaw',
        browserName: 'Chrome',
        browserVersion: '120.0.0.0',
        osName: 'Windows',
        osVersion: '10.0',
        platform: 'DESKTOP',
        clientFormFactor: 'UNKNOWN_FORM_FACTOR'
      },
      user: {
        lockedSafetyMode: false
      },
      request: {
        useSsl: true,
        internalExperimentFlags: [],
        consistencyTokenJars: []
      }
    };
  }

  extractYouTubeParameters() {
    // Pozyskaj parametry potrzebne dla timedtext API
    const scripts = document.querySelectorAll('script');
    let params = 'hl=pl&ip=0.0.0.0&ipbits=0';
    
    for (const script of scripts) {
      const content = script.textContent || '';
      
      // Szukaj parametrów
      const patterns = {
        'caps': /caps[=:](\w+)/,
        'opi': /opi[=:](\d+)/,
        'exp': /exp[=:](\w+)/,
        'xoaf': /xoaf[=:](\d+)/,
        'key': /key[=:](\w+)/
      };
      
      for (const [param, pattern] of Object.entries(patterns)) {
        const match = content.match(pattern);
        if (match) {
          params += `&${param}=${match[1]}`;
        }
      }
    }
    
    console.log('⚙️ Parametry YouTube:', params);
    return params;
  }

  selectBestCaptionReal(captionTracks) {
    // Inteligentna selekcja napisów - priorytet dla języka oryginalnego
    
    // Krok 1: Wykryj język oryginalny filmu
    const originalLanguage = this.detectVideoLanguage();
    console.log(`🎯 Wykryty język oryginalny filmu: ${originalLanguage}`);
    
    // Priorytet 1: Napisy w języku oryginalnym filmu
    if (originalLanguage && originalLanguage !== 'pl') {
      const originalCaption = captionTracks.find(c => {
        const code = (c.languageCode || '').toLowerCase();
        const vss = (c.vssId || '').toLowerCase();
        
        return code === originalLanguage.toLowerCase() || 
               code.startsWith(originalLanguage.toLowerCase() + '-') ||
               vss.includes(originalLanguage.toLowerCase());
      });
      
      if (originalCaption) {
        console.log(`🌍 Znaleziono napisy w języku oryginalnym: ${originalLanguage}`);
        return originalCaption;
      }
      
      // Spróbuj znaleźć automatyczne napisy w języku oryginalnym
      const originalAuto = captionTracks.find(c => {
        const code = (c.languageCode || '').toLowerCase();
        const kind = (c.kind || '').toLowerCase();
        
        return (code === originalLanguage.toLowerCase() || 
                code.startsWith(originalLanguage.toLowerCase() + '-')) && 
               (kind === 'asr' || c.name?.simpleText?.includes('auto'));
      });
      
      if (originalAuto) {
        console.log(`🤖 Znaleziono automatyczne napisy w języku oryginalnym: ${originalLanguage}`);
        return originalAuto;
      }
    }
    
    // Priorytet 2: Polskie napisy (jeśli film po polsku lub nie znaleziono oryginalnych)
    if (originalLanguage === 'pl' || originalLanguage === 'polish') {
      console.log('🇵🇱 Film po polsku - szukam polskich napisów');
    } else {
      console.log('🔄 Nie znaleziono napisów w języku oryginalnym - szukam polskich');
    }
    
    for (const variant of ['pl', 'pl-PL', 'polish']) {
      const polishCaption = captionTracks.find(c => {
        const code = (c.languageCode || '').toLowerCase();
        const vss = (c.vssId || '').toLowerCase();
        const name = (c.name?.simpleText || '').toLowerCase();
        
        return code === variant || 
               code.startsWith(variant + '-') ||
               vss.includes(variant) ||
               name.includes('pol');
      });
      
      if (polishCaption) {
        console.log(`🇵🇱 Znaleziono polskie napisy: ${variant}`);
        return polishCaption;
      }
    }

    // Priorytet 3: Angielskie napisy z automatycznym tłumaczeniem na polski
    const englishForTranslation = captionTracks.find(c => {
      const code = (c.languageCode || '').toLowerCase();
      const kind = (c.kind || '').toLowerCase();
      
      return code.startsWith('en') && (kind === 'asr' || c.isTranslatable);
    });

    if (englishForTranslation && originalLanguage !== 'en') {
      console.log('🔄 Znaleziono angielskie napisy - tłumaczę na polski');
      // Modyfikuj URL dla tłumaczenia na polski tylko jeśli film nie jest po angielsku
      if (englishForTranslation.baseUrl && englishForTranslation.isTranslatable) {
        try {
          const url = new URL(englishForTranslation.baseUrl);
          url.searchParams.set('tlang', 'pl');
          englishForTranslation.baseUrl = url.toString();
          console.log('✅ Dodano automatyczne tłumaczenie na polski');
        } catch (e) {
          console.log('⚠️ Nie udało się dodać tłumaczenia');
        }
      }
      return englishForTranslation;
    }

    // Priorytet 4: Angielskie napisy (bez tłumaczenia)
    const englishCaption = captionTracks.find(c => {
      const code = (c.languageCode || '').toLowerCase();
      return code.startsWith('en');
    });

    if (englishCaption) {
      console.log('🇺🇸 Znaleziono angielskie napisy (bez tłumaczenia)');
      return englishCaption;
    }

    // Priorytet 5: Pierwsze dostępne napisy
    if (captionTracks.length > 0) {
      console.log('📝 Używam pierwszych dostępnych napisów');
      return captionTracks[0];
    }

    return null;
  }

  detectVideoLanguage() {
    // Wykrywa język oryginalny filmu na podstawie różnych wskaźników
    try {
      console.log('🔍 Wykrywam język oryginalny filmu...');
      
      // Metoda 1: Sprawdź HTML lang attribute
      const htmlLang = document.documentElement.lang;
      if (htmlLang && htmlLang !== 'en') {
        console.log(`📍 HTML lang: ${htmlLang}`);
      }
      
      // Metoda 2: Sprawdź język z playerResponse
      const scripts = document.querySelectorAll('script');
      let detectedLang = null;
      
      for (const script of scripts) {
        const content = script.textContent || '';
        
        // Szukaj języka w metadanych wideo
        const langPatterns = [
          /"defaultAudioLanguage":\s*"([^"]+)"/,
          /"audioLanguage":\s*"([^"]+)"/,
          /"language":\s*"([^"]+)"/,
          /"defaultLanguage":\s*"([^"]+)"/,
          /"videoDetails":[^}]*"language":\s*"([^"]+)"/
        ];
        
        for (const pattern of langPatterns) {
          const match = content.match(pattern);
          if (match && match[1] && match[1] !== 'und') {
            detectedLang = match[1].split('-')[0]; // Weź tylko główny kod języka
            console.log(`📊 Wykryto język z metadanych: ${detectedLang}`);
            break;
          }
        }
        
        if (detectedLang) break;
      }
      
      // Metoda 3: Analiza tytułu wideo (podstawowa heurystyka)
      const title = document.title;
      const channelName = this.getChannelName();
      
      // Sprawdź czy tytuł/kanał sugeruje język
      const languageIndicators = {
        'en': [/\ben\b/i, /english/i, /\busa\b/i, /\buk\b/i, /\bus\b/i],
        'es': [/español/i, /spanish/i, /\bes\b/i],
        'fr': [/français/i, /french/i, /\bfr\b/i],
        'de': [/deutsch/i, /german/i, /\bde\b/i],
        'it': [/italiano/i, /italian/i, /\bit\b/i],
        'pt': [/português/i, /portuguese/i, /\bpt\b/i, /brasil/i],
        'ru': [/русский/i, /russian/i, /\bru\b/i],
        'ja': [/日本語/i, /japanese/i, /\bjp\b/i],
        'ko': [/한국어/i, /korean/i, /\bkr\b/i],
        'zh': [/中文/i, /chinese/i, /\bcn\b/i],
        'pl': [/polski/i, /polish/i, /\bpl\b/i, /polska/i]
      };
      
      for (const [lang, patterns] of Object.entries(languageIndicators)) {
        for (const pattern of patterns) {
          if (pattern.test(title) || pattern.test(channelName)) {
            console.log(`🏷️ Wykryto język z tytułu/kanału: ${lang}`);
            return lang;
          }
        }
      }
      
      // Metoda 4: Sprawdź URL kanału dla wskazówek geograficznych
      const channelUrl = this.getChannelUrl();
      if (channelUrl) {
        const geoIndicators = {
          'en': ['/c/', '/user/', '@', 'youtube.com'],
          'pl': ['/kanał/', 'polska', '.pl'],
          'de': ['/kanal/', 'deutschland', '.de'],
          'fr': ['/chaîne/', 'france', '.fr'],
          'es': ['/canal/', 'españa', '.es']
        };
        
        for (const [lang, indicators] of Object.entries(geoIndicators)) {
          if (indicators.some(indicator => channelUrl.includes(indicator))) {
            console.log(`🌍 Wykryto język z URL kanału: ${lang}`);
            if (lang !== 'en' || !detectedLang) { // Preferuj nie-angielskie języki
              return lang;
            }
          }
        }
      }
      
      // Zwróć wykryty język z metadanych lub domyślnie angielski
      const finalLang = detectedLang || 'en';
      console.log(`🎯 Ostateczny wykryty język: ${finalLang}`);
      return finalLang;
      
    } catch (error) {
      console.log('⚠️ Błąd wykrywania języka:', error);
      return 'en'; // Domyślnie angielski
    }
  }
  
  getChannelName() {
    // Pobiera nazwę kanału
    const selectors = [
      'ytd-channel-name a',
      '.ytd-channel-name a',
      '#owner-name a',
      '.owner-name a',
      'ytd-video-owner-renderer a'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent) {
        return element.textContent.trim();
      }
    }
    
    return '';
  }
  
  getChannelUrl() {
    // Pobiera URL kanału
    const selectors = [
      'ytd-channel-name a',
      '.ytd-channel-name a',
      '#owner-name a',
      '.owner-name a',
      'ytd-video-owner-renderer a'
    ];
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.href) {
        return element.href;
      }
    }
    
    return '';
  }

  async fetchTranscriptFromBaseUrl(baseUrl) {
    try {
      if (!baseUrl) {
        throw new Error('Brak baseUrl');
      }

      // Upewnij się że URL jest kompletny
      let fullUrl = baseUrl;
      if (fullUrl.startsWith('//')) {
        fullUrl = 'https:' + fullUrl;
      } else if (fullUrl.startsWith('/')) {
        fullUrl = 'https://www.youtube.com' + fullUrl;
      }

      console.log('📡 Pobieranie z baseUrl:', fullUrl.substring(0, 100) + '...');

      const response = await fetch(fullUrl, {
        headers: {
          'Accept': 'text/xml,application/xml,text/vtt,text/plain,*/*',
          'Accept-Language': 'pl-PL,pl;q=0.9,en;q=0.8',
          'User-Agent': navigator.userAgent,
          'Referer': window.location.href,
          'Origin': 'https://www.youtube.com'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();
      console.log(`📄 Pobrano ${text.length} znaków`);

      if (text.length < 50) {
        throw new Error('Zbyt krótka odpowiedź');
      }

      if (text.includes('<error>') || text.includes('error')) {
        throw new Error('API zwróciło błąd');
      }

      const parsed = this.parseSubtitleContent(text);
      
      if (!parsed || parsed.length < 100) {
        throw new Error('Nie udało się sparsować napisów');
      }

      console.log(`✅ Pomyślnie sparsowano ${parsed.length} znaków`);
      return parsed;

    } catch (error) {
      console.error('❌ Błąd w fetchTranscriptFromBaseUrl:', error);
      throw error;
    }
  }

  extractTextFromElementReal(element) {
    // Rzeczywiste metody wyciągania tekstu z elementów YouTube
    let text = '';
    
    // Metoda 1: Podstawowy textContent
    text = element.textContent?.trim();
    if (text && text.length > 1 && !text.match(/^\d+$/)) {
      return text;
    }
    
    // Metoda 2: innerText
    text = element.innerText?.trim();
    if (text && text.length > 1 && !text.match(/^\d+$/)) {
      return text;
    }
    
    // Metoda 3: innerHTML bez tagów
    text = element.innerHTML?.replace(/<[^>]*>/g, '').trim();
    if (text && text.length > 1 && !text.match(/^\d+$/)) {
      return text;
    }
    
    // Metoda 4: data attributes
    const dataText = element.getAttribute('data-text') || 
                     element.getAttribute('data-content') ||
                     element.getAttribute('aria-label');
    if (dataText && dataText.trim().length > 1) {
      return dataText.trim();
    }
    
    return '';
  }

  parseSubtitleContent(content) {
    try {
      let transcript = '';
      
      console.log('📄 Parsowanie napisów...');
      console.log(`📊 Długość content: ${content.length}, pierwsze 200 znaków: ${content.substring(0, 200)}`);

      // Wykryj format i parsuj odpowiednio
      if (content.includes('WEBVTT') || content.includes('-->')) {
        // VTT format
        transcript = this.parseVTTFormat(content);
      } else if (content.includes('<text') || content.includes('<transcript>')) {
        // XML format
        transcript = this.parseXMLFormat(content);
      } else if (content.includes('"text":') || content.includes('"events":')) {
        // JSON format
        transcript = this.parseJSONFormat(content);
      } else {
        // Plain text format
        transcript = this.parsePlainTextFormat(content);
      }

      if (!transcript || transcript.length < 50) {
        console.log('⚠️ Nie udało się sparsować lub za krótki tekst');
        return null;
      }

      const normalized = this.normalizeText(transcript);
      console.log(`✅ Sparsowano ${normalized.length} znaków tekstu`);
      
      return normalized;

    } catch (error) {
      console.error('❌ Błąd parsowania:', error);
      return null;
    }
  }

  parseVTTFormat(content) {
    const lines = content.split(/\r?\n/);
    let transcript = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Pomiń linie VTT metadata
      if (!trimmed || 
          trimmed.startsWith('WEBVTT') || 
          trimmed.startsWith('NOTE') ||
          /^\d+$/.test(trimmed) || 
          /\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}/.test(trimmed) ||
          trimmed.startsWith('STYLE') ||
          trimmed.startsWith('REGION')) {
        continue;
      }
      
      // Wyczyść linie z tagów i dodaj do transkrypcji
      const cleanLine = trimmed
        .replace(/<[^>]*>/g, '') // usuń tagi HTML/VTT
        .replace(/&[a-zA-Z0-9#]+;/g, '') // usuń entity HTML
        .replace(/\{[^}]*\}/g, '') // usuń style VTT
        .replace(/\[[^\]]*\]/g, '') // usuń znaczniki audio [música], [applause]
        .trim();
      
      if (cleanLine && cleanLine.length > 1) {
        transcript += cleanLine + ' ';
      }
    }
    
    return transcript.trim();
  }

  parseXMLFormat(content) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');
      
      // Sprawdź błędy parsowania
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML parsing error');
      }
      
      const textElements = xmlDoc.querySelectorAll('text');
      let transcript = '';
      
      textElements.forEach(element => {
        const text = element.textContent?.trim();
        if (text) {
          const decodedText = this.decodeHTMLEntities(text);
          transcript += decodedText + ' ';
        }
      });
      
      return transcript.trim();
    } catch (error) {
      console.log('⚠️ Błąd parsowania XML:', error);
      return '';
    }
  }

  parseJSONFormat(content) {
    try {
      const jsonData = JSON.parse(content);
      let transcript = '';
      
      // YouTube JSON format for captions
      if (jsonData.events && Array.isArray(jsonData.events)) {
        jsonData.events.forEach(event => {
          if (event.segs && Array.isArray(event.segs)) {
            event.segs.forEach(seg => {
              if (seg.utf8) {
                transcript += seg.utf8 + ' ';
              }
            });
          }
        });
      } 
      // Generic JSON array format
      else if (Array.isArray(jsonData)) {
        jsonData.forEach(item => {
          if (item.text) {
            transcript += item.text + ' ';
          } else if (item.content) {
            transcript += item.content + ' ';
          }
        });
      }
      
      return transcript.trim();
    } catch (error) {
      console.log('⚠️ Błąd parsowania JSON:', error);
      return '';
    }
  }

  parsePlainTextFormat(content) {
    const lines = content.split(/\r?\n/);
    let transcript = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed && 
          trimmed.length > 2 && 
          !trimmed.match(/^\d+$/) &&
          !trimmed.match(/^\d{2}:\d{2}:\d{2}/)) {
        
        // Usuń znaczniki czasu i inne metadane
        const cleanLine = trimmed
          .replace(/^\d+:\d+:\d+[,\.]?\d*\s*-->\s*\d+:\d+:\d+[,\.]?\d*/, '')
          .replace(/^\d+\s*$/, '')
          .replace(/^<[^>]+>/, '')
          .replace(/\[[^\]]*\]/g, '')
          .trim();
          
        if (cleanLine && cleanLine.length > 1) {
          transcript += cleanLine + ' ';
        }
      }
    }
    
    return transcript.trim();
  }

  normalizeText(text) {
    return text
      // Podstawowe entity HTML
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      
      // Polskie znaki Unicode
      .replace(/\u0105/g, 'ą').replace(/\u0104/g, 'Ą')
      .replace(/\u0107/g, 'ć').replace(/\u0106/g, 'Ć')
      .replace(/\u0119/g, 'ę').replace(/\u0118/g, 'Ę')
      .replace(/\u0142/g, 'ł').replace(/\u0141/g, 'Ł')
      .replace(/\u0144/g, 'ń').replace(/\u0143/g, 'Ń')
      .replace(/\u00f3/g, 'ó').replace(/\u00d3/g, 'Ó')
      .replace(/\u015b/g, 'ś').replace(/\u015a/g, 'Ś')
      .replace(/\u017a/g, 'ź').replace(/\u0179/g, 'Ź')
      .replace(/\u017c/g, 'ż').replace(/\u017b/g, 'Ż')
      
      // Czyść białe znaki
      .replace(/\s+/g, ' ')
      .replace(/\u00a0/g, ' ') // non-breaking space
      .trim();
  }

  extractVideoId() {
    const url = window.location.href;
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  decodeHTMLEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  }

  async getSettings() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get([
          'ai_platform',
          'ai_model',
          'new_tab',
          'notifications',
          'custom_prompt',
          'auto_send',
          'analysis_type'
        ], (result) => {
          if (chrome.runtime.lastError) {
            console.log('⚠️ Storage error, using defaults');
            resolve({});
            return;
          }
          resolve(result);
        });
      } catch (error) {
        console.log('⚠️ Storage unavailable, using defaults');
        resolve({});
      }
    });
  }

  createAIPrompt(transcript, videoTitle, videoUrl, platform, analysisType, settings) {
    if (settings.custom_prompt && settings.custom_prompt.trim()) {
      return settings.custom_prompt
        .replace(/\{title\}/g, videoTitle)
        .replace(/\{url\}/g, videoUrl)
        .replace(/\{transcript\}/g, transcript);
    }

    const templates = {
      summary: `Podsumuj tę transkrypcję z YouTube w języku polskim:

📺 **Tytuł:** ${videoTitle}
🔗 **Link:** ${videoUrl}

**Stwórz podsumowanie zawierające:**
1. **Główne tematy** - najważniejsze zagadnienia
2. **Kluczowe informacje** - fakty, dane, wnioski
3. **Praktyczne wskazówki** - konkretne rady (jeśli są)
4. **Najważniejsze cytaty** - wartościowe stwierdzenia

Napisz zwięźle ale kompletnie, 300-500 słów.

---
**TRANSKRYPCJA:**
${transcript}`,

      analysis: `Przeprowadź dogłębną analizę tej transkrypcji z YouTube:

**🎯 Wideo:** ${videoTitle}
**🔗 Źródło:** ${videoUrl}

**Proszę o analizę obejmującą:**
- Główne argumenty i tezy
- Stosowane przykłady i dowody
- Silne i słabe strony prezentacji
- Praktyczne wnioski i zastosowania
- Ocenę wartości merytorycznej

**TRANSKRYPCJA DO ANALIZY:**
${transcript}`,

      bullet: `Przekształć tę transkrypcję YouTube w przejrzyste punkty kluczowe:

📺 **${videoTitle}**
🔗 ${videoUrl}

**Format odpowiedzi:**
- **Główne tematy** - lista najważniejszych zagadnień
- **Kluczowe fakty** - konkretne informacje i dane
- **Praktyczne wskazówki** - actionable insights
- **Ważne cytaty** - najlepsze fragmenty

**TRANSKRYPCJA:**
${transcript}`,

      custom: `Oto transkrypcja wideo YouTube:

**Tytuł:** ${videoTitle}
**URL:** ${videoUrl}

**TRANSKRYPCJA:**
${transcript}`
    };

    return templates[analysisType] || templates.summary;
  }

  setupMessageListener() {
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'aiOpened') {
          const platformName = message.platform === 'claude' ? 'Claude' : 'ChatGPT';
          const sendStatus = message.autoSent ? 'wysłany automatycznie' : 'wklejony';
          this.showNotification(`✅ ${platformName} otwarty - prompt ${sendStatus}!`, 'success');
        } else if (message.action === 'showNotification') {
          this.showNotification(message.message, message.type || 'info');
        } else if (message.action === 'refreshButton') {
          this.loadButtonSettings().then(() => {
            const oldBtn = document.getElementById('transcript-summary-btn');
            if (oldBtn) oldBtn.remove();
            if (this.shouldAddButton()) {
              this.addSummaryButton();
            }
          });
        }
      });
    } catch (error) {
      console.log('⚠️ Message listener setup failed, but continuing...');
    }
  }

  showNotification(message, type = 'info') {
    const colors = {
      success: '#10a37f',
      error: '#dc2626',
      info: '#0066cc',
      warning: '#f59e0b'
    };

    const notification = document.createElement('div');
    notification.className = `youtube-ai-notification ${type}`;
    notification.style.cssText = `
      position: fixed !important;
      top: 150px !important;
      right: 20px !important;
      background: ${colors[type] || colors.info} !important;
      color: white !important;
      padding: 16px 24px !important;
      border-radius: 12px !important;
      z-index: 100001 !important;
      font-family: "Roboto", Arial, sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
      max-width: 350px !important;
      line-height: 1.5 !important;
      animation: slideInAndOut 5s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards !important;
      cursor: pointer !important;
      pointer-events: all !important;
    `;
    
    // Dodaj style animacji jeśli nie istnieją
    if (!document.getElementById('yt-ai-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'yt-ai-notification-styles';
      style.textContent = `
        @keyframes slideInAndOut {
          0% { transform: translateX(110%); opacity: 0; }
          15%, 85% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(110%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
    
    notification.textContent = message;
    notification.addEventListener('click', () => notification.remove());
    document.body.appendChild(notification);

    // Auto-remove po animacji
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }

  setupNavigationListener() {
    let lastUrl = location.href;
    
    const checkNavigation = () => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        this.modalOpen = false;
        
        console.log('🔄 Nawigacja YouTube:', url);
        
        const oldButton = document.getElementById('transcript-summary-btn');
        if (oldButton) {
          oldButton.remove();
          console.log('🗑️ Usunięto stary przycisk');
        }
        
        const oldPanel = document.getElementById('ai-model-panel');
        if (oldPanel) {
          oldPanel.remove();
        }
        
        setTimeout(() => {
          if (this.shouldAddButton()) {
            console.log('➕ Dodaję przycisk po nawigacji');
            this.addSummaryButton();
          }
        }, 2000);
      }
    };

    const observer = new MutationObserver(checkNavigation);
    observer.observe(document, { subtree: true, childList: true });

    const navApp = document.querySelector('ytd-app');
    if (navApp) {
      const navObserver = new MutationObserver(checkNavigation);
      navObserver.observe(navApp, { childList: true, subtree: true });
    }
    
    window.addEventListener('popstate', checkNavigation);
    
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function() {
      originalPushState.apply(history, arguments);
      setTimeout(checkNavigation, 100);
    };
    
    history.replaceState = function() {
      originalReplaceState.apply(history, arguments);
      setTimeout(checkNavigation, 100);
    };

    setInterval(checkNavigation, 3000);
  }
}

// INICJALIZACJA
let extractor = null;

function initExtractor() {
  if (!extractor) {
    try {
      console.log('🚀 Inicjalizuję YouTubeTranscriptExtractor...');
      extractor = new YouTubeTranscriptExtractor();
      console.log('✅ ZT-Youtube Extension initialized successfully - REAL FIX VERSION');
    } catch (error) {
      console.error('❌ Błąd inicjalizacji ZT-Youtube:', error);
      setTimeout(initExtractor, 3000);
    }
  }
}

// Inicjalizacja przy różnych stanach DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExtractor);
} else {
  initExtractor();
}

// Backup inicjalizacja
setTimeout(() => {
  if (!extractor) {
    console.log('🔄 Backup inicjalizacja...');
    initExtractor();
  }
}, 3000);

// Dodatkowy backup dla YouTube SPA
setTimeout(() => {
  if (!document.getElementById('transcript-summary-btn') && window.location.href.includes('/watch')) {
    console.log('🔄 Dodatkowy backup - wymuszam inicjalizację');
    initExtractor();
  }
}, 5000);

console.log('📦 ZT-Youtube Content Script Loaded - REAL FIX FOR POLISH SUBTITLES');