// content.js - Finalna wersja z pełną funkcjonalnością
class YouTubeTranscriptExtractor {
  constructor() {
    this.modalOpen = false;
    this.buttonPosition = 'middle-right';
    this.buttonStyle = 'gradient';
    this.init();
  }

  async init() {
    this.setupMessageListener();
    await this.loadButtonSettings();
    this.setupStorageListener();
    this.setupFullscreenListener();
    this.waitForPageLoad();
    this.setupNavigationListener();
  }

  waitForPageLoad() {
    const checkAndAdd = () => {
      // Re-add the button if it was removed by dynamic page updates
      const hasButton = document.getElementById('transcript-summary-btn');
      if (this.shouldAddButton() && !hasButton) {
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

    const flexyNode = document.querySelector('ytd-watch-flexy');
    if (flexyNode) {
      const flexyObserver = new MutationObserver(checkAndAdd);
      flexyObserver.observe(flexyNode, { childList: true, subtree: true });
    }

    setInterval(checkAndAdd, 3000);
  }

  shouldAddButton() {
    return window.location.href.includes('youtube.com') &&
           window.location.href.includes('/watch');
  }

  loadButtonSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['button_position', 'button_style'], (res) => {
        this.buttonPosition = res.button_position || 'middle-right';
        this.buttonStyle = res.button_style || 'gradient';
        resolve();
      });
    });
  }

  setupStorageListener() {
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

    // Dodaj style animacji
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

    // Dodaj backdrop
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
          <option value="gpt-4o">GPT-4o (Najnowszy)</option>
          <option value="o3">o3 (Szybki)</option>
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
      </div>
    `;
  }

  setupModalEventListeners(modalPanel) {
    // Obsługa wyboru typu analizy
    const analysisTypeBtns = modalPanel.querySelectorAll('.analysis-type');
    let selectedAnalysisType = 'summary';

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

    // Obsługa wyboru platformy
    const platformBtns = modalPanel.querySelectorAll('.platform-choice');
    const modelArea = modalPanel.querySelector('#model-selection-area');
    const modelDropdown = modalPanel.querySelector('#model-dropdown');
    
    let selectedPlatform = 'chatgpt';

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

    // Hover effect dla close button
    const closeBtn = modalPanel.querySelector('#close-modal');
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.backgroundColor = '#f1f5f9';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.backgroundColor = 'transparent';
    });

    // Obsługa przycisków
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
    console.log('🔒 Modal zamknięty');
  }

  async handleSummaryRequest(platform, model, analysisType, autoSend, modalPanel) {
    const progressText = modalPanel.querySelector('#progress-text');
    
    try {
      progressText.textContent = 'Pobieranie transkrypcji...';
      console.log('🚀 Rozpoczynam pobieranie transkrypcji...');

      const transcript = await this.getTranscript();
      
      if (!transcript) {
        throw new Error('Nie udało się pobrać transkrypcji. Sprawdź czy wideo ma dostępne napisy.');
      }

      console.log(`✅ Pobrano transkrypcję (${transcript.length} znaków)`);
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

      // Skopiuj do schowka
      try {
        await navigator.clipboard.writeText(prompt);
        console.log('✅ Prompt skopiowany do schowka');
      } catch (e) {
        console.log('⚠️ Nie udało się skopiować do schowka:', e);
      }

      progressText.textContent = `Otwieranie ${platformName}...`;

      // Wyślij do background script
      chrome.runtime.sendMessage({
        action: 'openAI',
        platform: platform,
        model: model,
        prompt: prompt,
        autoSend: autoSend,
        settings: settings
      });

      progressText.textContent = `✅ ${platformName} zostanie otwarty!`;
      
      // Zamknij modal po 2 sekundach
      setTimeout(() => {
        this.closeModal();
      }, 2000);

    } catch (error) {
      console.error('❌ Błąd:', error);
      progressText.textContent = `❌ ${error.message}`;
      progressText.style.color = '#dc2626';
      
      // Przywróć przyciski po błędzie
      setTimeout(() => {
        const progressArea = modalPanel.querySelector('#progress-area');
        const proceedBtn = modalPanel.querySelector('#proceed-btn');
        const cancelBtn = modalPanel.querySelector('#cancel-btn');
        
        progressArea.style.display = 'none';
        proceedBtn.disabled = false;
        proceedBtn.style.opacity = '1';
        cancelBtn.disabled = false;
        cancelBtn.style.opacity = '1';
      }, 3000);
    }
  }

  // Pobieranie transkrypcji
  async getTranscript() {
    try {
      console.log('🔍 Rozpoczynam pobieranie transkrypcji...');
      
      // Metoda 1: window.ytInitialData
      let transcript = await this.getTranscriptFromWindowData();
      if (transcript) {
        console.log('✅ Transkrypcja pobrana z window.ytInitialData');
        return transcript;
      }

      // Metoda 2: ytInitialPlayerResponse
      transcript = await this.getTranscriptFromPlayerResponse();
      if (transcript) {
        console.log('✅ Transkrypcja pobrana z ytInitialPlayerResponse');
        return transcript;
      }

      // Metoda 3: DOM
      transcript = await this.getTranscriptFromDOM();
      if (transcript) {
        console.log('✅ Transkrypcja pobrana z DOM');
        return transcript;
      }

      // Metoda 4: Otwórz panel
      transcript = await this.getTranscriptByOpeningPanel();
      if (transcript) {
        console.log('✅ Transkrypcja pobrana po otwarciu panelu');
        return transcript;
      }

      throw new Error('Nie udało się pobrać transkrypcji. Sprawdź czy wideo ma napisy.');

    } catch (error) {
      console.error('❌ Błąd podczas pobierania transkrypcji:', error);
      throw error;
    }
  }

  async getTranscriptFromWindowData() {
    try {
      if (typeof window.ytInitialData === 'undefined') return null;
      
      const videoId = this.extractVideoId();
      if (!videoId) return null;

      const searchForCaptions = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        
        if (obj.captionTracks && Array.isArray(obj.captionTracks)) {
          return obj.captionTracks;
        }
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const result = searchForCaptions(obj[key]);
            if (result) return result;
          }
        }
        return null;
      };

      const captionTracks = searchForCaptions(window.ytInitialData);
      if (!captionTracks || captionTracks.length === 0) return null;

      return await this.fetchTranscriptFromTracks(captionTracks);
    } catch (error) {
      console.error('Błąd w getTranscriptFromWindowData:', error);
      return null;
    }
  }

  async getTranscriptFromPlayerResponse() {
    try {
      const videoId = this.extractVideoId();
      if (!videoId) return null;

      if (window.ytInitialPlayerResponse) {
        const captions = window.ytInitialPlayerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (captions && captions.length > 0) {
          return await this.fetchTranscriptFromTracks(captions);
        }
      }

      const scripts = document.querySelectorAll('script');
      for (const script of scripts) {
        const content = script.textContent;
        if (content && content.includes('ytInitialPlayerResponse')) {
          const matches = content.match(/ytInitialPlayerResponse\s*=\s*(\{.*?\});/);
          if (matches && matches[1]) {
            try {
              const playerResponse = JSON.parse(matches[1]);
              const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
              if (captions && captions.length > 0) {
                return await this.fetchTranscriptFromTracks(captions);
              }
            } catch (e) {
              continue;
            }
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Błąd w getTranscriptFromPlayerResponse:', error);
      return null;
    }
  }

  async fetchTranscriptFromTracks(captionTracks) {
    try {
      console.log('📝 Znalezione napisy:', captionTracks.map(c => c.languageCode || c.vssId));

      let selectedCaption = null;

      // Dodaj DEBUGGING - aby zobaczyć wszystkie dostępne napisy
      console.log('🔍 DEBUGGING - Wszystkie dostępne napisy:');
      captionTracks.forEach((caption, index) => {
        console.log(`${index}: languageCode="${caption.languageCode}" vssId="${caption.vssId}" kind="${caption.kind}"`);
      });

      // Funkcja sprawdzająca czy napisy są polskie
      function isPolishCaption(caption) {
        const code = (caption.languageCode || '').toLowerCase();
        const vss = (caption.vssId || '').toLowerCase();

        if (code.includes('pl')) return true;
        if (vss.includes('pl')) return true;
        if (vss.startsWith('a.pl')) return true;
        if (vss.includes('.pl.')) return true;
        if (vss.includes('.pl')) return true;
        if (vss.endsWith('.pl')) return true;

        return false;
      }

      // Funkcja sprawdzająca czy napisy są angielskie
      function isEnglishCaption(caption) {
        const code = (caption.languageCode || '').toLowerCase();
        const vss = (caption.vssId || '').toLowerCase();

        if (code.includes('en')) return true;
        if (vss.includes('en')) return true;
        if (vss.startsWith('a.en')) return true;

        return false;
      }

      function pickCaption(predicate) {
        let track = captionTracks.find(c => predicate(c) && c.kind !== 'asr');
        if (!track) track = captionTracks.find(c => predicate(c) && c.kind === 'asr');
        return track;
      }

      // 1. Najpierw szukaj polskich napisów (najpierw manualne, potem auto)
      selectedCaption = pickCaption(isPolishCaption);
      if (selectedCaption) {
        console.log('🇵🇱 Znaleziono polskie napisy:', selectedCaption.languageCode || selectedCaption.vssId, selectedCaption.kind === 'asr' ? '(auto)' : '(manual)');
      } else {
        console.log('⚠️ Nie znaleziono polskich napisów, szukam angielskich...');

        // 2. Potem angielskie (najpierw manualne, potem auto)
        selectedCaption = pickCaption(isEnglishCaption);
        if (selectedCaption) {
          console.log('🇬🇧 Używam angielskich napisów:', selectedCaption.languageCode || selectedCaption.vssId, selectedCaption.kind === 'asr' ? '(auto)' : '(manual)');
        } else {
          console.log('⚠️ Nie znaleziono angielskich napisów, używam pierwszych dostępnych...');

          // 3. W ostateczności pierwszy dostępny (preferuj manualne)
          selectedCaption = captionTracks.find(c => c.kind !== 'asr') || captionTracks[0];
          if (selectedCaption) {
            console.log('🌍 Używam pierwszych dostępnych napisów:', selectedCaption.languageCode || selectedCaption.vssId, selectedCaption.kind === 'asr' ? '(auto)' : '(manual)');
          }
        }
      }

      if (!selectedCaption.baseUrl) return null;

      let transcriptUrl = selectedCaption.baseUrl;
      if (!/\bfmt=/.test(transcriptUrl)) {
        const sep = transcriptUrl.includes('?') ? '&' : '?';
        transcriptUrl += `${sep}fmt=vtt`;
      }

      const response = await fetch(transcriptUrl);
      if (!response.ok) {
        console.error('Błąd pobierania transkrypcji:', response.status);
        return null;
      }

      const xmlText = await response.text();
      console.log('📄 Pobrano XML transkrypcji, długość:', xmlText.length);

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const textElements = xmlDoc.querySelectorAll('text');

      let transcript = '';

      if (textElements.length > 0) {
        textElements.forEach((element) => {
          const text = element.textContent?.trim();
          if (text) {
            const decodedText = this.decodeHTMLEntities(text);
            transcript += decodedText + ' ';
          }
        });
      } else {
        console.log('❌ Brak elementów text w XML, próba parsowania VTT');
        const lines = xmlText.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('WEBVTT') || /^\d+$/.test(trimmed) || /--\>/.test(trimmed)) {
            continue;
          }
          transcript += trimmed + ' ';
        }
      }

      const finalTranscript = transcript.trim();
      console.log(`✅ Transkrypcja gotowa, długość: ${finalTranscript.length} znaków`);

      return finalTranscript || null;

    } catch (error) {
      console.error('Błąd w fetchTranscriptFromTracks:', error);
      return null;
    }
  }

  decodeHTMLEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  }

  async getTranscriptFromDOM() {
    const transcriptSelectors = [
      'ytd-transcript-segment-renderer .segment-text',
      '.ytd-transcript-segment-renderer .segment-text',
      '[class*="transcript"] [class*="segment-text"]',
      '[class*="transcript"] [class*="cue-text"]'
    ];

    for (const selector of transcriptSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        let transcript = '';
        elements.forEach(element => {
          const text = element.textContent?.trim();
          if (text) transcript += text + ' ';
        });
        if (transcript.trim()) return transcript.trim();
      }
    }

    return null;
  }

  async getTranscriptByOpeningPanel() {
    return new Promise((resolve) => {
      const transcriptButtonSelectors = [
        'button[aria-label*="transcript"]',
        'button[aria-label*="Transcript"]', 
        'button[aria-label*="transkrypcj"]',
        'button[aria-label*="Transkrypcj"]',
        'button[aria-label*="Show transcript"]',
        'button[aria-label*="Pokaż transkrypcję"]',
        '[role="button"][aria-label*="transcript"]',
        'yt-button-renderer[aria-label*="transcript"]'
      ];

      let transcriptButton = null;
      for (const selector of transcriptButtonSelectors) {
        transcriptButton = document.querySelector(selector);
        if (transcriptButton) break;
      }

      if (!transcriptButton) {
        const buttons = document.querySelectorAll('button, [role="button"]');
        for (const button of buttons) {
          const text = button.textContent?.toLowerCase();
          const ariaLabel = button.getAttribute('aria-label')?.toLowerCase();
          if (text?.includes('transcript') || text?.includes('transkrypcj') ||
              ariaLabel?.includes('transcript') || ariaLabel?.includes('transkrypcj')) {
            transcriptButton = button;
            break;
          }
        }
      }

      if (!transcriptButton) {
        console.log('❌ Nie znaleziono przycisku transkrypcji');
        resolve(null);
        return;
      }

      console.log('🔍 Znaleziono przycisk transkrypcji, klikam...');
      transcriptButton.click();

      setTimeout(async () => {
        const transcript = await this.getTranscriptFromDOM();
        resolve(transcript);
      }, 3000);
    });
  }

  extractVideoId() {
    const url = window.location.href;
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : null;
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([
        'ai_platform', 
        'ai_model', 
        'new_tab', 
        'notifications',
        'custom_prompt',
        'auto_send',
        'analysis_type'
      ], (result) => {
        resolve(result);
      });
    });
  }

  createAIPrompt(transcript, videoTitle, videoUrl, platform, analysisType, settings) {
    // Sprawdź czy jest custom prompt w ustawieniach
    if (settings.custom_prompt && settings.custom_prompt.trim()) {
      return settings.custom_prompt
        .replace(/\{title\}/g, videoTitle)
        .replace(/\{url\}/g, videoUrl)
        .replace(/\{transcript\}/g, transcript);
    }

    // Szablony promptów
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

      custom: transcript
    };

    return templates[analysisType] || templates.summary;
  }

  setupMessageListener() {
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
  }

  showNotification(message, type = 'info') {
    const colors = {
      success: '#10a37f',
      error: '#dc2626',
      info: '#0066cc',
      warning: '#f59e0b'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed !important;
      top: 80px !important;
      right: 20px !important;
      background: ${colors[type] || colors.info} !important;
      color: white !important;
      padding: 16px 24px !important;
      border-radius: 12px !important;
      z-index: 999998 !important;
      font-family: "Roboto", Arial, sans-serif !important;
      font-size: 14px !important;
      font-weight: 500 !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
      max-width: 350px !important;
      line-height: 1.4 !important;
      animation: slideInScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
      cursor: pointer !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
    `;
    
    if (!document.getElementById('yt-ai-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'yt-ai-notification-styles';
      style.textContent = `
        @keyframes slideInScale {
          from { 
            transform: translateX(100%) scale(0.8); 
            opacity: 0; 
          }
          to { 
            transform: translateX(0) scale(1); 
            opacity: 1; 
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    notification.textContent = message;
    notification.addEventListener('click', () => notification.remove());
    document.body.appendChild(notification);

    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 6000);
  }

  setupNavigationListener() {
    let lastUrl = location.href;
    
    const checkNavigation = () => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        this.modalOpen = false;
        
        // Usuń stary przycisk
        const oldButton = document.getElementById('transcript-summary-btn');
        if (oldButton) {
          oldButton.remove();
        }
        
        // Usuń stary modal
        const oldPanel = document.getElementById('ai-model-panel');
        if (oldPanel) {
          oldPanel.remove();
        }
        
        // Dodaj nowy przycisk po nawigacji
        setTimeout(() => {
          if (this.shouldAddButton()) {
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
    
    // Override pushState i replaceState
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

// Inicjalizacja
let extractor = null;

function initExtractor() {
  if (!extractor) {
    try {
      extractor = new YouTubeTranscriptExtractor();
      console.log('🧠 ZT-Youtube Extension initialized successfully');
    } catch (error) {
      console.error('❌ Błąd inicjalizacji ZT-Youtube:', error);
      setTimeout(initExtractor, 3000);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExtractor);
} else {
  initExtractor();
}

setTimeout(() => {
  if (!extractor) {
    initExtractor();
  }
}, 3000);

console.log('📦 ZT-Youtube Content Script Loaded - Production Version');