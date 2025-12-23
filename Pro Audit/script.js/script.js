// SafetyAudit Pro - Professional Auditing Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 SafetyAudit Pro Initialized');
    
    // Initialize application
    initApp();
});

// ===== APPLICATION INITIALIZATION =====
function initApp() {
    // Set today's date as default
    setDefaultDate();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load saved data
    loadSavedData();
    
    // Initialize theme
    initTheme();
    
    // Setup auto-save
    setupAutoSave();
    
    // Setup phone formatting
    setupPhoneFormatting();
    
    // Setup form validation
    setupFormValidation();
    
    // Start auto-save indicator
    startAutoSaveIndicator();
}

// ===== DATE SETUP =====
function setDefaultDate() {
    const auditDateInput = document.getElementById('auditDate');
    if (auditDateInput) {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        auditDateInput.value = formattedDate;
        auditDateInput.max = formattedDate; // Prevent future dates
    }
}

// ===== EVENT LISTENERS =====
function initEventListeners() {
    // Form submission
    const form = document.getElementById('siteDetailsForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Save draft button
    const saveDraftBtn = document.getElementById('saveDraftBtn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', handleSaveDraft);
    }
    
    // Clear form button
    const clearFormBtn = document.getElementById('clearFormBtn');
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', handleClearForm);
    }
    
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Modal buttons
    const continueChecklistBtn = document.getElementById('continueChecklistBtn');
    if (continueChecklistBtn) {
        continueChecklistBtn.addEventListener('click', handleContinueChecklist);
    }
    
    const viewAuditBtn = document.getElementById('viewAuditBtn');
    if (viewAuditBtn) {
        viewAuditBtn.addEventListener('click', handleViewAudit);
    }
    
    // Quick action buttons
    const addPhotoBtn = document.getElementById('addPhotoBtn');
    if (addPhotoBtn) {
        addPhotoBtn.addEventListener('click', handleAddPhoto);
    }
    
    const addNoteBtn = document.getElementById('addNoteBtn');
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', handleAddNote);
    }
    
    const loadTemplateBtn = document.getElementById('loadTemplateBtn');
    if (loadTemplateBtn) {
        loadTemplateBtn.addEventListener('click', handleLoadTemplate);
    }
    
    // Export buttons
    const exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', handleExportPDF);
    }
    
    const printPreviewBtn = document.getElementById('printPreviewBtn');
    if (printPreviewBtn) {
        printPreviewBtn.addEventListener('click', handlePrintPreview);
    }
    
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', handleExportData);
    }
}

// ===== FORM HANDLING =====
function handleFormSubmit(event) {
    event.preventDefault();
    console.log('📝 Form submission started');
    
    if (validateForm()) {
        saveFormData();
        showSuccessModal();
        
        // Simulate API call
        simulateDatabaseSave()
            .then(() => {
                showToast('✅ Audit saved to database successfully!', 'success');
                updateLastSavedTime();
            })
            .catch(error => {
                console.error('Database save error:', error);
                showToast('⚠️ Saved locally, but database sync failed', 'warning');
            });
    } else {
        showToast('❌ Please fix form errors before submitting', 'error');
    }
}

function handleSaveDraft() {
    if (validateForm(true)) { // Skip required validation for draft
        saveFormData();
        showToast('💾 Draft saved successfully!', 'success');
        updateLastSavedTime();
    }
}

function handleClearForm() {
    if (confirm('Are you sure you want to clear all form data?')) {
        const form = document.getElementById('siteDetailsForm');
        form.reset();
        setDefaultDate();
        localStorage.removeItem('auditAppData');
        showToast('🗑️ Form cleared successfully', 'info');
    }
}

// ===== FORM VALIDATION =====
function setupFormValidation() {
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', validateEmailField);
    });
    
    const requiredInputs = document.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
        input.addEventListener('blur', validateRequiredField);
    });
}

function validateForm(skipRequired = false) {
    let isValid = true;
    const form = document.getElementById('siteDetailsForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.hasAttribute('required') && !skipRequired) {
            if (!validateRequiredField({ target: input }, true)) {
                isValid = false;
            }
        }
        
        if (input.type === 'email' && input.value) {
            if (!validateEmailField({ target: input }, true)) {
                isValid = false;
            }
        }
    });
    
    return isValid;
}

function validateRequiredField(event, returnResult = false) {
    const input = event.target || event;
    const value = input.value.trim();
    const isValid = value !== '';
    
    if (!returnResult) {
        updateFieldValidation(input, isValid, 'This field is required');
    }
    
    return isValid;
}

function validateEmailField(event, returnResult = false) {
    const input = event.target || event;
    const email = input.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = email === '' || emailRegex.test(email);
    
    if (!returnResult) {
        updateFieldValidation(input, isValid, 'Please enter a valid email address');
    }
    
    return isValid;
}

function updateFieldValidation(input, isValid, errorMessage) {
    const formGroup = input.closest('.form-group');
    const existingError = formGroup.querySelector('.field-error');
    
    if (existingError) {
        existingError.remove();
    }
    
    if (!isValid && input.value.trim() !== '') {
        input.classList.add('error');
        input.classList.remove('success');
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${errorMessage}`;
        errorDiv.style.color = '#ef4444';
        errorDiv.style.fontSize = '0.75rem';
        errorDiv.style.marginTop = '0.25rem';
        errorDiv.style.display = 'flex';
        errorDiv.style.alignItems = 'center';
        errorDiv.style.gap = '0.5rem';
        
        formGroup.appendChild(errorDiv);
    } else if (isValid && input.value.trim() !== '') {
        input.classList.remove('error');
        input.classList.add('success');
    } else {
        input.classList.remove('error', 'success');
    }
}

// ===== DATA PERSISTENCE =====
function saveFormData() {
    const form = document.getElementById('siteDetailsForm');
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Add metadata
    data._id = generateAuditId();
    data._createdAt = new Date().toISOString();
    data._updatedAt = new Date().toISOString();
    data._status = 'draft';
    
    // Save to localStorage (in real app, this would go to your backend)
    localStorage.setItem('auditAppData', JSON.stringify(data));
    localStorage.setItem('auditAppLastSaved', new Date().toISOString());
    
    console.log('💾 Form data saved:', data);
    return data;
}

function loadSavedData() {
    try {
        const savedData = localStorage.getItem('auditAppData');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            Object.keys(data).forEach(key => {
                if (!key.startsWith('_')) { // Skip metadata
                    const field = document.getElementById(key);
                    if (field) {
                        field.value = data[key];
                        
                        // Trigger validation for filled fields
                        if (field.type === 'email' && field.value) {
                            validateEmailField({ target: field });
                        }
                    }
                }
            });
            
            console.log('📂 Loaded saved data');
            showToast('📂 Previous draft loaded', 'info');
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
}

function generateAuditId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `AUDIT-${timestamp}-${random}`.toUpperCase();
}

// ===== AUTO-SAVE FUNCTIONALITY =====
function setupAutoSave() {
    const form = document.getElementById('siteDetailsForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    let autoSaveTimeout;
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                if (validateForm(true)) {
                    saveFormData();
                    console.log('🤖 Auto-saved form data');
                }
            }, 2000); // Save 2 seconds after last input
        });
    });
}

function startAutoSaveIndicator() {
    const indicator = document.querySelector('.auto-save span');
    if (!indicator) return;
    
    let dots = 0;
    setInterval(() => {
        dots = (dots + 1) % 4;
        indicator.textContent = 'Auto-saving' + '.'.repeat(dots);
    }, 500);
}

// ===== THEME MANAGEMENT =====
function initTheme() {
    const savedTheme = localStorage.getItem('auditAppTheme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('auditAppTheme', newTheme);
    updateThemeIcon(newTheme);
    
    showToast(`Switched to ${newTheme} theme`, 'info');
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ===== PHONE NUMBER FORMATTING =====
function setupPhoneFormatting() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', formatPhoneNumber);
    });
}

function formatPhoneNumber(event) {
    const input = event.target;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length > 0) {
        if (value.length <= 3) {
            value = '+' + value;
        } else if (value.length <= 6) {
            value = '+' + value.substring(0, 3) + ' (' + value.substring(3);
        } else if (value.length <= 9) {
            value = '+' + value.substring(0, 3) + ' (' + value.substring(3, 6) + ') ' + value.substring(6);
        } else {
            value = '+' + value.substring(0, 3) + ' (' + value.substring(3, 6) + ') ' + 
                   value.substring(6, 9) + '-' + value.substring(9, 13);
        }
    }
    
    input.value = value;
}

// ===== MODAL HANDLING =====
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function handleContinueChecklist() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    showToast('➡️ Redirecting to checklist...', 'info');
    
    // Simulate navigation
    setTimeout(() => {
        // In a real app, you would navigate to the checklist page
        window.location.hash = '#checklist';
    }, 1500);
}

function handleViewAudit() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    showToast('👁️ Opening audit preview...', 'info');
}

// ===== QUICK ACTIONS =====
function handleAddPhoto() {
    showToast('📸 Camera feature coming soon!', 'info');
    
    // In a real app, this would open camera/file picker
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = function(event) {
        if (event.target.files.length > 0) {
            showToast('✅ Photo added to audit', 'success');
        }
    };
    input.click();
}

function handleAddNote() {
    const note = prompt('Enter your note:');
    if (note) {
        showToast('📝 Note saved to audit', 'success');
        
        // In a real app, this would save to database
        console.log('Note added:', note);
    }
}

function handleLoadTemplate() {
    const templates = [
        { name: 'Construction Site', id: 'construction' },
        { name: 'Office Safety', id: 'office' },
        { name: 'Manufacturing', id: 'manufacturing' },
        { name: 'Warehouse', id: 'warehouse' }
    ];
    
    const templateList = templates.map(t => `• ${t.name}`).join('\n');
    const choice = prompt(`Select a template:\n\n${templateList}\n\nEnter template name:`);
    
    if (choice && templates.some(t => t.name.toLowerCase().includes(choice.toLowerCase()))) {
        showToast(`📋 Loaded "${choice}" template`, 'success');
        
        // Simulate loading template data
        setTimeout(() => {
            showToast('✅ Template applied to form', 'success');
        }, 1000);
    }
}

// ===== EXPORT FUNCTIONS =====
function handleExportPDF() {
    showToast('📄 Generating PDF report...', 'info');
    
    // Simulate PDF generation
    setTimeout(() => {
        showToast('✅ PDF ready for download', 'success');
        
        // In a real app, this would trigger download
        const link = document.createElement('a');
        link.href = '#';
        link.download = `audit-report-${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();
    }, 2000);
}

function handlePrintPreview() {
    showToast('🖨️ Opening print preview...', 'info');
    
    // In a real app, this would open print dialog
    setTimeout(() => {
        window.print();
    }, 1000);
}

function handleExportData() {
    const data = localStorage.getItem('auditAppData');
    if (!data) {
        showToast('📊 No data to export', 'warning');
        return;
    }
    
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('💾 Data exported successfully', 'success');
}

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${getToastIcon(type)}"></i>
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles for close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'inherit';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.marginLeft = 'auto';
    closeBtn.style.opacity = '0.7';
    closeBtn.style.padding = '0';
    
    container.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0