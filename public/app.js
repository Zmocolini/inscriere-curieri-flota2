/**
 * BOLT FOOD FLEET - APLICATIE INSCRIERE CURIERI
 * Validare pe client, compresie automata a pozei de buletin prin HTML5 Canvas
 * si transmitere prin Vercel Serverless Function catre Google Apps Script.
 */

document.addEventListener('DOMContentLoaded', () => {
  // ELEMENTE DOM
  const form = document.getElementById('courierForm');
  const formSection = document.getElementById('formSection');
  const successSection = document.getElementById('successSection');
  
  // Campuri input
  const fullNameInput = document.getElementById('fullName');
  const cnpInput = document.getElementById('cnp');
  const cnpCounter = document.getElementById('cnpCounter');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  const citySelect = document.getElementById('city');
  const vehicleCards = document.querySelectorAll('.vehicle-card');
  const gdprConsent = document.getElementById('gdprConsent');
  
  // Upload elemente
  const dropzone = document.getElementById('dropzone');
  const btnCamera = document.getElementById('btnCamera');
  const btnGallery = document.getElementById('btnGallery');
  const cameraInput = document.getElementById('cameraInput');
  const fileInput = document.getElementById('fileInput');
  const previewContainer = document.getElementById('previewContainer');
  const previewImg = document.getElementById('previewImg');
  const pdfIcon = document.getElementById('pdfIcon');
  const previewFilename = document.getElementById('previewFilename');
  const previewSize = document.getElementById('previewSize');
  const btnRemoveFile = document.getElementById('btnRemoveFile');
  
  // Progres si erori
  const progressBox = document.getElementById('progressBox');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const globalError = document.getElementById('globalError');
  const globalErrorMsg = document.getElementById('globalErrorMsg');
  const btnSubmit = document.getElementById('btnSubmit');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnRestart = document.getElementById('btnRestart');

  // Stare fisier curent
  let selectedFile = null;
  let optimizedFileData = null; // { filename, mimeType, base64, size }

  // -------------------------------------------------------------------------
  // 1. SELECTARE VEHICUL (Radio cards)
  // -------------------------------------------------------------------------
  vehicleCards.forEach(card => {
    card.addEventListener('click', () => {
      vehicleCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  // -------------------------------------------------------------------------
  // 2. FORMATARI SI VALIDARI IN TIMP REAL
  // -------------------------------------------------------------------------
  
  // CNP: Permite doar cifre, lungime maxima 13, actualizeaza badge
  cnpInput.addEventListener('input', (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 13) val = val.slice(0, 13);
    e.target.value = val;
    
    cnpCounter.textContent = `${val.length} / 13 cifre`;
    if (val.length === 13) {
      cnpCounter.classList.add('valid');
      hideError('cnpError', cnpInput);
    } else {
      cnpCounter.classList.remove('valid');
    }
  });

  // Telefon: Permite doar cifre si semnul +
  phoneInput.addEventListener('input', (e) => {
    let val = e.target.value;
    // Permite doar + la inceput si cifre
    if (val.startsWith('+')) {
      val = '+' + val.slice(1).replace(/\D/g, '');
    } else {
      val = val.replace(/\D/g, '');
    }
    e.target.value = val;
    if (val.length >= 10) {
      hideError('phoneError', phoneInput);
    }
  });

  // Nume si Prenume
  fullNameInput.addEventListener('input', () => {
    if (fullNameInput.value.trim().length >= 3) {
      hideError('nameError', fullNameInput);
    }
  });

  // Email
  emailInput.addEventListener('input', () => {
    if (isValidEmail(emailInput.value.trim())) {
      hideError('emailError', emailInput);
    }
  });

  // Oras
  citySelect.addEventListener('change', () => {
    if (citySelect.value) {
      hideError('cityError', citySelect);
    }
  });

  // -------------------------------------------------------------------------
  // 3. GESTIONARE UPLOAD & COMPRESIE IMAGINE PE CLIENT
  // -------------------------------------------------------------------------
  btnCamera.addEventListener('click', () => cameraInput.click());
  btnGallery.addEventListener('click', () => fileInput.click());

  cameraInput.addEventListener('change', (e) => handleFileSelection(e.target.files[0]));
  fileInput.addEventListener('change', (e) => handleFileSelection(e.target.files[0]));

  // Drag and drop
  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  });

  btnRemoveFile.addEventListener('click', () => {
    selectedFile = null;
    optimizedFileData = null;
    cameraInput.value = '';
    fileInput.value = '';
    previewContainer.classList.add('hidden');
    dropzone.classList.remove('hidden');
  });

  async function handleFileSelection(file) {
    if (!file) return;

    // Verificare marime bruta (maxim 15 MB)
    if (file.size > 15 * 1024 * 1024) {
      showError('fileError', null, 'Fișierul este prea mare (maxim 15 MB permis).');
      return;
    }

    selectedFile = file;
    hideError('fileError');

    // Daca este PDF
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1];
        optimizedFileData = {
          filename: file.name,
          mimeType: 'application/pdf',
          base64: base64,
          size: file.size
        };
        showPreview(file.name, `${(file.size / (1024 * 1024)).toFixed(1)} MB`, null, true);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Daca este imagine: aplicam compresie automata prin Canvas
    try {
      showTemporaryOptimizingState();
      const compressed = await compressImageFile(file, 2048, 0.85);
      optimizedFileData = compressed;
      showPreview(
        file.name, 
        `${(compressed.size / 1024).toFixed(0)} KB (optimizat)`, 
        compressed.dataUrl, 
        false
      );
    } catch (err) {
      console.warn('Compresia a esuat, folosim fisierul original:', err);
      // Fallback la citire directa Base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target.result.split(',')[1];
        optimizedFileData = {
          filename: file.name,
          mimeType: file.type || 'image/jpeg',
          base64: base64,
          size: file.size
        };
        showPreview(file.name, `${(file.size / 1024).toFixed(0)} KB`, e.target.result, false);
      };
      reader.readAsDataURL(file);
    }
  }

  function showPreview(filename, sizeText, imgSrc, isPdf) {
    previewFilename.textContent = filename;
    previewSize.textContent = sizeText;
    
    if (isPdf) {
      previewImg.classList.add('hidden');
      pdfIcon.classList.remove('hidden');
    } else {
      pdfIcon.classList.add('hidden');
      previewImg.classList.remove('hidden');
      previewImg.src = imgSrc;
    }

    dropzone.classList.add('hidden');
    previewContainer.classList.remove('hidden');
  }

  function showTemporaryOptimizingState() {
    dropzone.classList.add('hidden');
    previewContainer.classList.remove('hidden');
    previewFilename.textContent = 'Se optimizează fotografia...';
    previewSize.textContent = 'Vă rugăm să așteptați o secundă';
    previewImg.src = '';
  }

  /**
   * Compresie imagine client-side folosind HTML5 Canvas:
   * Redimensioneaza la maxim maxDim (ex: 2048px) pastrand claritatea textului de pe buletin
   * si exporta ca JPEG la 85% calitate, reducand o poza de 8MB la ~800KB instant!
   */
  function compressImageFile(file, maxDim = 2048, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Calculare dimensiuni proportionale
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          // Desenare pe canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Export ca JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64 = dataUrl.split(',')[1];
          const approxBytes = Math.round((base64.length * 3) / 4);

          resolve({
            filename: file.name.replace(/\.[^/.]+$/, "") + ".jpg",
            mimeType: "image/jpeg",
            base64: base64,
            dataUrl: dataUrl,
            size: approxBytes
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // -------------------------------------------------------------------------
  // 4. VALIDARE FORMULAR LA SUBMIT
  // -------------------------------------------------------------------------
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideGlobalError();

    let isValid = true;
    let firstInvalidElement = null;

    // Nume
    const nameVal = fullNameInput.value.trim();
    if (nameVal.length < 3 || !nameVal.includes(' ')) {
      showError('nameError', fullNameInput, 'Introdu atât numele, cât și prenumele complet.');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = fullNameInput;
    } else {
      hideError('nameError', fullNameInput);
    }

    // CNP
    const cnpVal = cnpInput.value.trim();
    if (cnpVal.length !== 13 || !/^\d{13}$/.test(cnpVal)) {
      showError('cnpError', cnpInput, 'CNP-ul trebuie să conțină exact 13 cifre numerice.');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = cnpInput;
    } else {
      hideError('cnpError', cnpInput);
    }

    // Telefon
    const phoneVal = phoneInput.value.trim();
    if (!isValidRomanianPhone(phoneVal)) {
      showError('phoneError', phoneInput, 'Număr de telefon invalid. Format: 07xxxxxxxx sau +407xxxxxxxx.');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = phoneInput;
    } else {
      hideError('phoneError', phoneInput);
    }

    // Email
    const emailVal = emailInput.value.trim();
    if (!isValidEmail(emailVal)) {
      showError('emailError', emailInput, 'Introdu o adresă de email validă.');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = emailInput;
    } else {
      hideError('emailError', emailInput);
    }

    // Oras
    const cityVal = citySelect.value;
    if (!cityVal) {
      showError('cityError', citySelect, 'Te rugăm să alegi orașul în care dorești să livrezi.');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = citySelect;
    } else {
      hideError('cityError', citySelect);
    }

    // Buletin
    if (!optimizedFileData || !optimizedFileData.base64) {
      showError('fileError', null, 'Atașarea fotografiei buletinului este obligatorie pentru activare.');
      isValid = false;
      if (!firstInvalidElement) firstInvalidElement = dropzone;
    } else {
      hideError('fileError');
    }

    // GDPR
    if (!gdprConsent.checked) {
      showGlobalError('Trebuie să fii de acord cu prelucrarea datelor pentru a continua.');
      isValid = false;
    }

    if (!isValid) {
      if (firstInvalidElement) {
        firstInvalidElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Vehicul selectat
    const selectedVehRadio = document.querySelector('input[name="vehicle"]:checked');
    const vehicleVal = selectedVehRadio ? selectedVehRadio.value : '🚗 Mașină';

    // -------------------------------------------------------------------------
    // 5. TRIMITERE DATE CATRE VERCEL API / APPS SCRIPT
    // -------------------------------------------------------------------------
    await submitApplication({
      name: nameVal,
      cnp: cnpVal,
      phone: phoneVal,
      email: emailVal,
      city: cityVal,
      vehicle: vehicleVal,
      file: {
        filename: optimizedFileData.filename,
        mimeType: optimizedFileData.mimeType,
        base64: optimizedFileData.base64
      }
    });
  });

  async function submitApplication(data) {
    setSubmittingState(true);
    updateProgress(25, 'Se pregătește documentul...');

    try {
      updateProgress(50, 'Se transmit datele securizat către dispecerat...');

      // Endpoint-ul Vercel Serverless Function
      const endpoint = '/api/submit';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      updateProgress(85, 'Validare răspuns server...');

      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success !== false) {
        updateProgress(100, 'Finalizat!');
        setTimeout(() => {
          showSuccessScreen(data);
        }, 400);
      } else {
        throw new Error(result.error || 'A apărut o problemă la trimitere. Te rugăm să încerci din nou.');
      }
    } catch (err) {
      console.error('Eroare trimitere cerere:', err);
      showGlobalError(err.message || 'Eroare de conexiune la rețea. Te rugăm să reîncerci.');
      setSubmittingState(false);
    }
  }

  // -------------------------------------------------------------------------
  // 6. ECRAN DE SUCCES & RESTART
  // -------------------------------------------------------------------------
  function showSuccessScreen(data) {
    document.getElementById('successName').textContent = data.name.split(' ')[0] || data.name;
    document.getElementById('successCity').textContent = data.city;
    document.getElementById('successVehicle').textContent = data.vehicle;

    formSection.classList.add('hidden');
    successSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  btnRestart.addEventListener('click', () => {
    form.reset();
    selectedFile = null;
    optimizedFileData = null;
    previewContainer.classList.add('hidden');
    dropzone.classList.remove('hidden');
    cnpCounter.textContent = '0 / 13 cifre';
    cnpCounter.classList.remove('valid');

    vehicleCards.forEach(c => c.classList.remove('active'));
    document.querySelector('.vehicle-card:first-child').classList.add('active');

    successSection.classList.add('hidden');
    formSection.classList.remove('hidden');
    setSubmittingState(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // -------------------------------------------------------------------------
  // 7. FUNCTII AJUTATOARE
  // -------------------------------------------------------------------------
  function setSubmittingState(isSubmitting) {
    btnSubmit.disabled = isSubmitting;
    if (isSubmitting) {
      btnSpinner.classList.remove('hidden');
      progressBox.classList.remove('hidden');
    } else {
      btnSpinner.classList.add('hidden');
      progressBox.classList.add('hidden');
      progressBar.style.width = '0%';
    }
  }

  function updateProgress(percent, text) {
    progressBar.style.width = `${percent}%`;
    if (text) progressText.textContent = text;
  }

  function showError(errorId, inputElement, customMsg) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
      if (customMsg) errorEl.textContent = customMsg;
      errorEl.classList.add('visible');
    }
    if (inputElement) {
      const wrapper = inputElement.closest('.form-group');
      if (wrapper) wrapper.classList.add('input-error');
    }
  }

  function hideError(errorId, inputElement) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) errorEl.classList.remove('visible');
    if (inputElement) {
      const wrapper = inputElement.closest('.form-group');
      if (wrapper) wrapper.classList.remove('input-error');
    }
  }

  function showGlobalError(msg) {
    globalErrorMsg.textContent = msg;
    globalError.classList.remove('hidden');
    globalError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideGlobalError() {
    globalError.classList.add('hidden');
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidRomanianPhone(phone) {
    const clean = phone.replace(/[\s.-]/g, '');
    // Format 07xxxxxxxx (10 cifre) sau +407xxxxxxxx (12 caractere)
    return /^(07\d{8}|\+407\d{8})$/.test(clean);
  }
});
