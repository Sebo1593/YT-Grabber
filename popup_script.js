// popup-script.js - Wersja z debugowaniem

console.log('🚀 Popup script loaded');

// Sprawdź czy elementy istnieją
document.addEventListener('DOMContentLoaded', function() {
  console.log('📋 DOM loaded, checking elements...');
  
  // Sprawdź wszystkie elementy
  const platformBtns = document.querySelectorAll('.platform-btn');
  const analysisTypeBtns = document.querySelectorAll('.analysis-type-btn');
  const modelSelection = document.getElementById('model-selection');
  const modelSelect = document.getElementById('model-select');
  const buttonPositionSelect = document.getElementById('button-position');
  const buttonStyleSelect = document.getElementById('button-style');
  const saveBtn = document.getElementById('save-btn');
  const statusMessage = document.getElementById('status-message');
  const customPrompt = document.getElementById('custom-prompt');
  const templateBtns = document.querySelectorAll('.template-btn');
  
  console.log('🔍 Element check:');
  console.log('- Platform buttons:', platformBtns.length);
  console.log('- Analysis type buttons:', analysisTypeBtns.length);
  console.log('- Model selection:', !!modelSelection);
  console.log('- Model select:', !!modelSelect);
  console.log('- Button position select:', !!buttonPositionSelect);
  console.log('- Button style select:', !!buttonStyleSelect);
  console.log('- Save button:', !!saveBtn);
  console.log('- Status message:', !!statusMessage);
  console.log('- Custom prompt:', !!customPrompt);
  console.log('- Template buttons:', templateBtns.length);
  
  // Toggles
  const newTabToggle = document.getElementById('new-tab-toggle');
  const notificationsToggle = document.getElementById('notifications-toggle');
  const autoSendToggle = document.getElementById('auto-send-toggle');
  
  console.log('- New tab toggle:', !!newTabToggle);
  console.log('- Notifications toggle:', !!notificationsToggle);
  console.log('- Auto send toggle:', !!autoSendToggle);
  
  if (platformBtns.length === 0) {
    console.error('❌ No platform buttons found!');
    return;
  }
  
  console.log('✅ All elements found, setting up...');
  loadSettings();
  setupEventListeners();
});

// Modele dla różnych platform
const models = {
  chatgpt: [
    { value: 'gpt-4o', text: 'GPT-4o (najnowszy)' },
    { value: 'o3', text: 'o3 (szybki)' }
  ],
  claude: [
    { value: 'claude-3-5-sonnet', text: 'Claude 3.5 Sonnet (Najnowszy)' },
    { value: 'claude-3-opus', text: 'Claude 3 Opus (Najlepszy)' },
    { value: 'claude-3-sonnet', text: 'Claude 3 Sonnet (Zbalansowany)' },
    { value: 'claude-3-haiku', text: 'Claude 3 Haiku (Szybki)' }
  ]
};

// Szablony promptów
const promptTemplates = {
  default: `Analizuj tę transkrypcję z YouTube w języku polskim:

📺 **Tytuł:** {title}
🔗 **Link:** {url}

**Stwórz analizę zawierającą:**
1. **Główne tematy** - najważniejsze zagadnienia
2. **Kluczowe informacje** - fakty, dane, wnioski  
3. **Praktyczne wskazówki** - konkretne rady (jeśli są)
4. **Najważniejsze cytaty** - wartościowe stwierdzenia

Napisz zwięźle ale kompletnie, 300-500 słów.

---
**TRANSKRYPCJA:**
{transcript}`,

  summary: `Podsumuj tę transkrypcję z YouTube w języku polskim:

📺 **Tytuł:** {title}
🔗 **Link:** {url}

**Stwórz podsumowanie zawierające:**
1. **Główne tematy** - najważniejsze zagadnienia
2. **Kluczowe informacje** - fakty, dane, wnioski  
3. **Praktyczne wskazówki** - konkretne rady (jeśli są)
4. **Najważniejsze cytaty** - wartościowe stwierdzenia

Napisz zwięźle ale kompletnie, 300-500 słów.

---
**TRANSKRYPCJA:**
{transcript}`,

  analysis: `Przeprowadź dogłębną analizę tej transkrypcji z YouTube:

**🎯 Wideo:** {title}
**🔗 Źródło:** {url}

**Proszę o analizę obejmującą:**
- Główne argumenty i tezy
- Stosowane przykłady i dowody
- Silne i słabe strony prezentacji
- Praktyczne wnioski i zastosowania
- Ocenę wartości merytorycznej

**TRANSKRYPCJA DO ANALIZY:**
{transcript}`,

  bullet: `Przekształć tę transkrypcję YouTube w przejrzyste punkty kluczowe:

📺 **{title}**
🔗 {url}

**Format odpowiedzi:**
- **Główne tematy** - lista najważniejszych zagadnień
- **Kluczowe fakty** - konkretne informacje i dane
- **Praktyczne wskazówki** - actionable insights
- **Ważne cytaty** - najlepsze fragmenty

**TRANSKRYPCJA:**
{transcript}`,

  custom: `{transcript}`
};

// Konfiguracja nasłuchiwaczy zdarzeń
function setupEventListeners() {
  console.log('🔧 Setting up event listeners...');
  
  const platformBtns = document.querySelectorAll('.platform-btn');
  const analysisTypeBtns = document.querySelectorAll('.analysis-type-btn');
  const modelSelection = document.getElementById('model-selection');
  const modelSelect = document.getElementById('model-select');
  const saveBtn = document.getElementById('save-btn');
  const statusMessage = document.getElementById('status-message');
  const customPrompt = document.getElementById('custom-prompt');
  const templateBtns = document.querySelectorAll('.template-btn');
  const newTabToggle = document.getElementById('new-tab-toggle');
  const notificationsToggle = document.getElementById('notifications-toggle');
  const autoSendToggle = document.getElementById('auto-send-toggle');
  
  // Obsługa wyboru platformy
  platformBtns.forEach((btn, index) => {
    console.log(`🎯 Setting up platform button ${index}:`, btn.dataset.platform);
    btn.addEventListener('click', function() {
      console.log('🎯 Platform clicked:', btn.dataset.platform);
      
      // Usuń aktywne klasy
      platformBtns.forEach(b => b.classList.remove('active'));
      // Dodaj aktywną klasę do klikniętego przycisku
      btn.classList.add('active');
      
      const platform = btn.dataset.platform;
      updateModelSelection(platform);
    });
  });

  // Obsługa wyboru typu analizy
  analysisTypeBtns.forEach((btn, index) => {
    console.log(`🔍 Setting up analysis button ${index}:`, btn.dataset.type);
    btn.addEventListener('click', function() {
      console.log('🔍 Analysis type clicked:', btn.dataset.type);
      
      // Usuń aktywne klasy
      analysisTypeBtns.forEach(b => b.classList.remove('active'));
      // Dodaj aktywną klasę do klikniętego przycisku
      btn.classList.add('active');
    });
  });

  // Obsługa toggles
  if (newTabToggle) {
    console.log('🔄 Setting up new tab toggle');
    newTabToggle.addEventListener('click', () => {
      console.log('🔄 New tab toggle clicked');
      toggleSetting(newTabToggle);
    });
  }

  if (notificationsToggle) {
    console.log('🔔 Setting up notifications toggle');
    notificationsToggle.addEventListener('click', () => {
      console.log('🔔 Notifications toggle clicked');
      toggleSetting(notificationsToggle);
    });
  }

  if (autoSendToggle) {
    console.log('🚀 Setting up auto send toggle');
    autoSendToggle.addEventListener('click', () => {
      console.log('🚀 Auto send toggle clicked');
      toggleSetting(autoSendToggle);
    });
  }

  // Obsługa szablonów promptów
  templateBtns.forEach((btn, index) => {
    console.log(`📝 Setting up template button ${index}:`, btn.dataset.template);
    btn.addEventListener('click', function() {
      console.log('📝 Template clicked:', btn.dataset.template);
      
      // Usuń aktywne klasy
      templateBtns.forEach(b => b.classList.remove('active'));
      // Dodaj aktywną klasę
      btn.classList.add('active');
      
      const template = btn.dataset.template;
      if (template !== 'custom' && customPrompt) {
        customPrompt.value = promptTemplates[template] || '';
      } else if (customPrompt) {
        customPrompt.focus();
      }
    });
  });

  // Obsługa zapisywania
  if (saveBtn) {
    console.log('💾 Setting up save button');
    saveBtn.addEventListener('click', function() {
      console.log('💾 Save button clicked');
      saveSettings();
    });
  }

  // Obsługa zmiany modelu
  if (modelSelect) {
    console.log('🔧 Setting up model select');
    modelSelect.addEventListener('change', function() {
      console.log('🔧 Model changed:', modelSelect.value);
    });
  }
  
  console.log('✅ All event listeners set up');
}

// Ładowanie ustawień
function loadSettings() {
  console.log('📥 Loading settings...');
  
  chrome.storage.sync.get([
    'ai_platform', 
    'ai_model', 
    'analysis_type',
    'new_tab',
    'notifications',
    'auto_send',
    'custom_prompt',
    'button_position',
    'button_style'
  ], function(result) {
    console.log('📊 Loaded settings:', result);
    
    const platformBtns = document.querySelectorAll('.platform-btn');
    const analysisTypeBtns = document.querySelectorAll('.analysis-type-btn');
    const modelSelect = document.getElementById('model-select');
    const customPrompt = document.getElementById('custom-prompt');
    const templateBtns = document.querySelectorAll('.template-btn');
    const newTabToggle = document.getElementById('new-tab-toggle');
    const notificationsToggle = document.getElementById('notifications-toggle');
    const autoSendToggle = document.getElementById('auto-send-toggle');
    
    // Platforma
    const platform = result.ai_platform || 'chatgpt';
    console.log('🎯 Setting platform to:', platform);
    
    // Usuń wszystkie aktywne klasy
    platformBtns.forEach(btn => btn.classList.remove('active'));
    
    // Dodaj aktywną klasę do wybranej platformy
    const selectedPlatformBtn = document.querySelector(`[data-platform="${platform}"]`);
    if (selectedPlatformBtn) {
      selectedPlatformBtn.classList.add('active');
      console.log('✅ Platform button activated:', platform);
    } else {
      console.error('❌ Platform button not found for:', platform);
    }

    // Typ analizy
    const analysisType = result.analysis_type || 'summary';
    console.log('🔍 Setting analysis type to:', analysisType);
    
    // Usuń wszystkie aktywne klasy
    analysisTypeBtns.forEach(btn => btn.classList.remove('active'));
    
    // Dodaj aktywną klasę do wybranego typu
    const selectedAnalysisBtn = document.querySelector(`[data-type="${analysisType}"]`);
    if (selectedAnalysisBtn) {
      selectedAnalysisBtn.classList.add('active');
      console.log('✅ Analysis type button activated:', analysisType);
    } else {
      console.error('❌ Analysis type button not found for:', analysisType);
    }
    
    // Zaktualizuj wybór modelu
    updateModelSelection(platform);
    
    // Ustaw model jeśli jest zapisany
    if (result.ai_model && modelSelect) {
      modelSelect.value = result.ai_model;
      const optionExists = Array.from(modelSelect.options).some(
        opt => opt.value === result.ai_model
      );
      if (!optionExists) {
        modelSelect.value = modelSelect.options[0].value;
      }
      console.log('🔧 Model set to:', modelSelect.value);
    }
    
    // Toggles
    if (result.new_tab !== false && newTabToggle) {
      newTabToggle.classList.add('active');
      console.log('✅ New tab toggle activated');
    }
    if (result.notifications !== false && notificationsToggle) {
      notificationsToggle.classList.add('active');
      console.log('✅ Notifications toggle activated');
    }
    if (result.auto_send !== false && autoSendToggle) {
      autoSendToggle.classList.add('active');
      console.log('✅ Auto send toggle activated');
    }

    if (buttonPositionSelect) {
      buttonPositionSelect.value = result.button_position || 'bottom-right';
      console.log('📍 Button position set to:', buttonPositionSelect.value);
    }

    if (buttonStyleSelect) {
      buttonStyleSelect.value = result.button_style || 'gradient';
      console.log('🎨 Button style set to:', buttonStyleSelect.value);
    }
    
    // Custom prompt
    if (result.custom_prompt && customPrompt) {
      customPrompt.value = result.custom_prompt;
      console.log('📝 Custom prompt loaded');
      
      // Znajdź odpowiedni szablon
      const matchingTemplate = Object.keys(promptTemplates).find(key => 
        promptTemplates[key] === result.custom_prompt
      );
      
      if (matchingTemplate) {
        // Usuń wszystkie aktywne klasy z szablonów
        templateBtns.forEach(btn => btn.classList.remove('active'));
        // Dodaj aktywną klasę do odpowiedniego szablonu
        const templateBtn = document.querySelector(`[data-template="${matchingTemplate}"]`);
        if (templateBtn) {
          templateBtn.classList.add('active');
          console.log('✅ Template activated:', matchingTemplate);
        }
      } else {
        // Jeśli nie ma dopasowania, ustaw jako custom
        templateBtns.forEach(btn => btn.classList.remove('active'));
        const customBtn = document.querySelector('[data-template="custom"]');
        if (customBtn) {
          customBtn.classList.add('active');
          console.log('✅ Custom template activated');
        }
      }
    } else {
      // Domyślny szablon
      if (customPrompt) {
        customPrompt.value = promptTemplates.default;
        console.log('📝 Default prompt loaded');
      }
      templateBtns.forEach(btn => btn.classList.remove('active'));
      const defaultBtn = document.querySelector('[data-template="default"]');
      if (defaultBtn) {
        defaultBtn.classList.add('active');
        console.log('✅ Default template activated');
      }
    }
    
    console.log('✅ Settings loaded successfully');
  });
}

// Aktualizacja wyboru modelu
function updateModelSelection(platform) {
  console.log('🔧 Updating model selection for platform:', platform);
  
  const modelSelect = document.getElementById('model-select');
  const modelSelection = document.getElementById('model-selection');
  
  if (!modelSelect) {
    console.log('❌ Model select element not found');
    return;
  }
  
  const platformModels = models[platform] || models.chatgpt;
  
  // Wyczyść obecne opcje
  modelSelect.innerHTML = '';
  
  // Dodaj nowe opcje
  platformModels.forEach(model => {
    const option = document.createElement('option');
    option.value = model.value;
    option.textContent = model.text;
    modelSelect.appendChild(option);
  });

  // Pokaż/ukryj selekcję modelu
  if (modelSelection) {
    if (platform === 'claude') {
      modelSelection.style.display = 'none';
      console.log('🙈 Model selection hidden for Claude');
    } else {
      modelSelection.style.display = 'block';
      console.log('👁️ Model selection shown for ChatGPT');
    }
  }
  
  console.log('✅ Model selection updated');
}

// Przełączanie ustawień
function toggleSetting(toggle) {
  if (toggle) {
    toggle.classList.toggle('active');
    console.log('🔄 Toggle switched:', toggle.classList.contains('active'));
  }
}

// Zapisywanie ustawień
function saveSettings() {
  console.log('💾 Saving settings...');
  
  const platformBtns = document.querySelectorAll('.platform-btn');
  const analysisTypeBtns = document.querySelectorAll('.analysis-type-btn');
  const modelSelect = document.getElementById('model-select');
  const customPrompt = document.getElementById('custom-prompt');
  const newTabToggle = document.getElementById('new-tab-toggle');
  const notificationsToggle = document.getElementById('notifications-toggle');
  const autoSendToggle = document.getElementById('auto-send-toggle');
  const buttonPositionSelect = document.getElementById('button-position');
  const buttonStyleSelect = document.getElementById('button-style');
  const saveBtn = document.getElementById('save-btn');
  const statusMessage = document.getElementById('status-message');
  
  // Znajdź aktywną platformę
  const activePlatformBtn = document.querySelector('.platform-btn.active');
  const activePlatform = activePlatformBtn ? activePlatformBtn.dataset.platform : 'chatgpt';

  // Znajdź aktywny typ analizy
  const activeAnalysisBtn = document.querySelector('.analysis-type-btn.active');
  const activeAnalysisType = activeAnalysisBtn ? activeAnalysisBtn.dataset.type : 'summary';
  
  const selectedModel = modelSelect ? modelSelect.value : 'gpt-4o';
  const promptText = customPrompt ? customPrompt.value.trim() : '';
  
  const settings = {
    ai_platform: activePlatform,
    ai_model: selectedModel,
    analysis_type: activeAnalysisType,
    new_tab: newTabToggle ? newTabToggle.classList.contains('active') : true,
    notifications: notificationsToggle ? notificationsToggle.classList.contains('active') : true,
    auto_send: autoSendToggle ? autoSendToggle.classList.contains('active') : true,
    custom_prompt: promptText,
    button_position: buttonPositionSelect ? buttonPositionSelect.value : 'bottom-right',
    button_style: buttonStyleSelect ? buttonStyleSelect.value : 'gradient'
  };

  console.log('📊 Settings to save:', settings);

  // Zablokuj przycisk podczas zapisywania
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ Zapisywanie...';
  }

  chrome.storage.sync.set(settings, function() {
    // Odblokuj przycisk
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Zapisz ustawienia';
    }
    
    if (chrome.runtime.lastError) {
      console.error('❌ Error saving settings:', chrome.runtime.lastError);
      showStatus('Błąd podczas zapisywania ustawień!', 'error');
    } else {
      console.log('✅ Settings saved successfully');
      showStatus('✅ Ustawienia zostały zapisane!', 'success');

      // Powiadom zakładki YouTube o zmianie ustawień
      chrome.tabs.query({ url: '*://*.youtube.com/*' }, function(tabs) {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: 'refreshButton' });
        });
      });

      // Ukryj status po 3 sekundach
      setTimeout(() => {
        if (statusMessage) {
          statusMessage.style.display = 'none';
        }
      }, 3000);
    }
  });
}

// Pokazywanie statusu
function showStatus(message, type) {
  const statusMessage = document.getElementById('status-message');
  if (!statusMessage) return;
  
  statusMessage.textContent = message;
  statusMessage.className = `status-message status-${type}`;
  statusMessage.style.display = 'block';
  
  console.log(`📢 Status: ${message} (${type})`);
}

console.log('📦 Popup script setup completed');