// background.js - Ulepszona wersja z automatycznym wysyłaniem (Enter)
class AIOpener {
  constructor() {
    this.setupMessageListener();
    this.platformUrls = {
      chatgpt: 'https://chatgpt.com',
      claude: 'https://claude.ai/chat'
    };
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'openAI') {
        this.openAIWithPrompt(message.platform, message.prompt, message.settings, sender.tab.id, message.model, message.autoSend);
        return true; 
      }
    });
  }

  async openAIWithPrompt(platform, prompt, settings, sourceTabId, selectedModel, autoSend = false) {
    try {
      const url = this.platformUrls[platform] || this.platformUrls.chatgpt;
      
      console.log(`🚀 Otwieranie ${platform} z promptem (${prompt.length} znaków)${selectedModel ? ` - Model: ${selectedModel}` : ''}${autoSend ? ' - AUTO SEND' : ''}`);
      
      const aiTab = await chrome.tabs.create({ url, active: true });

      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === aiTab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          
          // ZMIANA: Zwiększony czas oczekiwania dla większej niezawodności
          const waitTime = platform === 'claude' ? 6000 : 5000;
          console.log(`⏳ Czekam ${waitTime}ms na pełne załadowanie ${platform}...`);
          
          setTimeout(() => {
            console.log(`💉 Wstrzykuję skrypt do wklejania promptu...`);
            
            chrome.scripting.executeScript({
              target: { tabId: aiTab.id },
              func: injectorFunction,
              args: [prompt, platform, autoSend]
            }).then((results) => {
              if (chrome.runtime.lastError) {
                console.error('❌ Błąd wstrzykiwania skryptu:', chrome.runtime.lastError.message);
                this.copyToClipboardFallback(prompt, sourceTabId, platform, autoSend);
                return;
              }

              if (results && results[0] && results[0].result === true) {
                console.log(`✅ Skrypt wstrzyknięty i ${autoSend ? 'wysłany automatycznie' : 'wklejony'} pomyślnie dla ${platform}`);
                chrome.tabs.sendMessage(sourceTabId, {
                  action: 'aiOpened',
                  platform: platform,
                  autoSent: autoSend
                }).catch(e => console.error("Błąd wysyłania powiadomienia:", e));
              } else {
                console.warn(`⚠️ Wstrzyknięcie skryptu nie powiodło się dla ${platform}. Uruchamiam fallback.`);
                this.copyToClipboardFallback(prompt, sourceTabId, platform, autoSend);
              }
            }).catch(error => {
              console.error(`❌ Błąd wykonania skryptu dla ${platform}:`, error);
              this.copyToClipboardFallback(prompt, sourceTabId, platform, autoSend);
            });
          }, waitTime);
        }
      });
    } catch (error) {
      console.error(`❌ Błąd podczas otwierania ${platform}:`, error);
      this.copyToClipboardFallback(prompt, sourceTabId, platform, autoSend);
    }
  }

  async copyToClipboardFallback(prompt, sourceTabId, platform, autoSend) {
    try {
      const platformName = platform === 'claude' ? 'Claude' : 'ChatGPT';
      console.log(`📋 Fallback: kopiuję prompt do schowka dla ${platformName}`);
      
      const autoSendText = autoSend ? 'Auto-wysyłanie i wklejanie' : 'Auto-wklejanie';
      chrome.tabs.sendMessage(sourceTabId, {
        action: 'showNotification',
        message: `📋 ${autoSendText} nie powiodło się. Prompt skopiowany. Wklej ręcznie (Ctrl+V)${autoSend ? ' i naciśnij Enter.' : '.'}`,
        type: 'warning'
      }).catch(e => console.error("Błąd wysyłania powiadomienia fallback:", e));
    } catch (error) {
      console.error('❌ Błąd w funkcji fallback:', error);
    }
  }
}

/**
 * NOWA FUNKCJONALNOŚĆ: Funkcja została rozszerzona o automatyczne wysyłanie promptu (Enter)
 * Po wklejeniu tekstu, jeśli autoSend=true, automatycznie naciśnie Enter lub kliknie przycisk Send
 */
function injectorFunction(prompt, platform, autoSend = false) {
  
  function waitForElement(selectors, timeout = 15000) {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element && (element.offsetWidth > 0 || element.offsetHeight > 0)) {
            clearInterval(interval);
            resolve(element);
            return;
          }
        }
      }, 500);

      setTimeout(() => {
        clearInterval(interval);
        resolve(null);
      }, timeout);
    });
  }

  function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;

    if (valueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
    } else if (valueSetter) {
        valueSetter.call(element, value);
    } else {
        element.value = value;
    }
  }

  function pasteText(element, text) {
    element.focus();
    
    // Wyczyść poprzednią zawartość
    if (element.tagName.toLowerCase() === 'textarea') {
      element.value = '';
      setNativeValue(element, text);
    } else if (element.isContentEditable) {
      element.innerHTML = '';
      element.innerHTML = text.replace(/\n/g, '<br>');
    }
    
    // Dispatch events to notify React/Vue/etc frameworks
    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'a', code: 'KeyA' }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'a', code: 'KeyA' }));

    // Dodatkowy dispatch dla niektórych frameworków
    setTimeout(() => {
      element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
      element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    }, 100);
  }

  async function sendMessage(textArea) {
    if (!autoSend) {
      console.log('[Injector] Auto-send wyłączony, nie wysyłam automatycznie.');
      return false;
    }

    console.log('[Injector] 🚀 Próbuję automatycznie wysłać wiadomość...');
    
    // Metoda 1: Naciśnij Enter
    console.log('[Injector] Próba 1: Wysyłanie przez Enter...');
    textArea.focus();
    
    // Spróbuj Ctrl+Enter (dla niektórych platform)
    textArea.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      ctrlKey: true,
      bubbles: true,
      composed: true
    }));
    
    // Poczekaj chwilę
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Spróbuj zwykły Enter
    textArea.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      composed: true
    }));
    
    textArea.dispatchEvent(new KeyboardEvent('keypress', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      composed: true
    }));
    
    textArea.dispatchEvent(new KeyboardEvent('keyup', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      composed: true
    }));

    // Poczekaj chwilę i sprawdź czy wysłano
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Metoda 2: Znajdź i kliknij przycisk Send
    console.log('[Injector] Próba 2: Szukanie przycisku Send...');
    
    const sendButtonSelectors = [
      // ChatGPT
      'button[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[title*="Send"]',
      'button:has(svg[data-testid="send-button"])',
      'button:has(svg[class*="send"])',
      '[data-testid="send-button"]',
      
      // Claude
      'button[aria-label*="Send Message"]',
      'button[title*="Send Message"]',
      'button:has(svg[class*="send"])',
      'button[type="submit"]',
      
      // Uniwersalne
      'button:contains("Send")',
      'button:contains("Wyślij")',
      '[role="button"][aria-label*="send"]',
      '[role="button"][title*="send"]'
    ];

    for (const selector of sendButtonSelectors) {
      const sendButton = document.querySelector(selector);
      if (sendButton && !sendButton.disabled && sendButton.offsetParent !== null) {
        console.log('[Injector] ✅ Znaleziono przycisk Send, klikam:', selector);
        
        // Kliknij przycisk
        sendButton.click();
        
        // Dispatch dodatkowych eventów dla pewności
        sendButton.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window
        }));
        
        return true;
      }
    }

    // Metoda 3: Spróbuj znaleźć przycisk przez tekst
    console.log('[Injector] Próba 3: Szukanie przez zawartość tekstu...');
    const allButtons = document.querySelectorAll('button, [role="button"]');
    
    for (const button of allButtons) {
      const text = button.textContent?.toLowerCase().trim();
      const ariaLabel = button.getAttribute('aria-label')?.toLowerCase();
      const title = button.getAttribute('title')?.toLowerCase();
      
      if ((text === 'send' || text === 'wyślij' || 
           ariaLabel?.includes('send') || 
           title?.includes('send')) && 
          !button.disabled && 
          button.offsetParent !== null) {
        
        console.log('[Injector] ✅ Znaleziono przycisk przez tekst, klikam:', text || ariaLabel || title);
        button.click();
        return true;
      }
    }

    console.log('[Injector] ⚠️ Nie udało się znaleźć przycisku Send lub Enter nie zadziałał.');
    return false;
  }

  async function run() {
    const chatGPTSelectors = [
      '#prompt-textarea',
      'textarea[data-id="root"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="message"]',
      'textarea[tabindex="0"]'
    ];
    const claudeSelectors = [
      'div[contenteditable="true"][data-testid="message-input"]',
      '.ProseMirror[contenteditable="true"]',
      'div.ProseMirror',
      'div[contenteditable="true"][aria-label*="Send a message"]',
      'div[contenteditable="true"]'
    ];

    const selectors = platform === 'chatgpt' ? chatGPTSelectors : claudeSelectors;
    
    console.log(`[Injector] Szukam pola tekstowego dla ${platform}...`);
    const textArea = await waitForElement(selectors);

    if (textArea) {
      console.log('[Injector] ✅ Znaleziono pole tekstowe. Wklejam prompt.');
      pasteText(textArea, prompt);
      
      // Poczekaj chwilę na przetworzenie tekstu
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Spróbuj automatycznie wysłać jeśli włączone
      if (autoSend) {
        const sent = await sendMessage(textArea);
        if (sent) {
          console.log('[Injector] ✅ Wiadomość wysłana automatycznie!');
        } else {
          console.log('[Injector] ⚠️ Auto-wysyłanie nie powiodło się, ale prompt został wklejony.');
        }
      }

      return true;
    } else {
      console.error('[Injector] ❌ Nie znaleziono pola tekstowego.');
      return false;
    }
  }

  return run();
}

// Inicjalizacja
new AIOpener();
console.log('✅ ZT-Youtube Background Script Loaded');
