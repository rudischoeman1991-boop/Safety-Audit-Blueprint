// ==============================================
// SAFETYAUDIT PRO - Main Application Script
// ==============================================

class SafetyAuditApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.auditData = {
            siteDetails: {},
            checklist: [],
            findings: [],
            photos: [],
            signatures: []
        };
        
        this.init();
    }

    // Initialize the application
    init() {
        console.log('🚀 SafetyAudit Pro Initializing...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    // Setup all event listeners and load data
    setup() {
        // Hide loading screen after 1.5 seconds
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
                document.getElementById('appContainer').style.opacity = '1';
            }, 500);
        }, 1500);

        // Load saved data
        this.loadSavedData();
        
        // Setup navigation
        this.setupNavigation();
        
        // Setup form handlers
        this.setupForms();
        
        // Setup buttons
        this.setupButtons();
        
        // Setup theme
        this.setupTheme();
        
        // Update UI
        this.updateUI();
        
        // Simulate loading user data
        this.loadUserData();
        
        console.log('✅ SafetyAudit Pro Ready!');
    }

    // ===== NAVIGATION =====
    setupNavigation() {
        // Navigation menu items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });

        // Sidebar toggle for mobile
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('collapsed');
                document.querySelector('.main-content').classList.toggle('expanded');
            });
        }

        // New Audit button
        const newAuditBtn = document.getElementById('newAuditBtn');
        if (newAuditBtn) {
            newAuditBtn.addEventListener('click', () => {
                this.navigateTo('siteDetails');
                this.showToast('Start a new audit', 'info');
            });
        }

        // Quick action buttons
        const actionBtns = document.querySelectorAll('.action-btn');
        actionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                this.navigateTo(action);
            });
        });
    }

    navigateTo(page) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Update active page
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
            if (p.id === `${page}Page`) {
                p.classList.add('active');
            }
        });

        // Update page title
        const pageTitles = {
            dashboard: 'Dashboard',
            siteDetails: 'Site Details',
            auditChecklist: 'Audit Checklist',
            photos: 'Photos & Evidence',
            findings: 'Findings & Actions',
            signatures: 'Signatures',
            reports: 'Reports',
            settings: 'Settings',
            help: 'Help & Support'
        };

        const pageTitle = pageTitles[page] || 'SafetyAudit Pro';
        document.getElementById('pageTitle').textContent = pageTitle;
        
        // Update breadcrumb
        const breadcrumb = document.getElementById('breadcrumb');
        breadcrumb.innerHTML = `<span>Home</span> / <span>${pageTitle}</span>`;

        // Save current page
        this.currentPage = page;
        localStorage.setItem('lastPage', page);

        // Page-specific setup
        this.setupPage(page);
    }

    setupPage(page) {
        switch(page) {
            case 'siteDetails':
                this.setupSiteDetailsPage();
                break;
            case 'auditChecklist':
                this.setupChecklistPage();
                break;
            case 'photos':
                this.setupPhotosPage();
                break;
            default:
                // Default page setup
                break;
        }
    }

    // ===== SITE DETAILS PAGE =====
    setupSiteDetailsPage() {
        const form = document.getElementById('siteDetailsForm');
        if (!form) return;

        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        const auditDateInput = document.getElementById('auditDate');
        if (auditDateInput && !auditDateInput.value) {
            auditDateInput.value = today;
        }

        // Get location button
        const getLocationBtn = document.getElementById('getLocationBtn');
        if (getLocationBtn) {
            getLocationBtn.addEventListener('click', () => {
                this.getCurrentLocation();
            });
        }

        // Clear form button
        const clearFormBtn = document.getElementById('clearFormBtn');
        if (clearFormBtn) {
            clearFormBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear the form? All entered data will be lost.')) {
                    form.reset();
                    this.showToast('Form cleared', 'warning');
                }
            });
        }

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSiteDetails();
        });

        // Auto-save on change
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.autoSaveSiteDetails();
            });
        });

        // Phone number formatting
        const phoneInputs = form.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.formatPhoneNumber(e.target);
            });
        });

        // Load existing data if available
        this.loadSiteDetails();
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showToast('Geolocation is not supported by your browser', 'error');
            return;
        }

        this.showToast('Getting your location...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const locationInput = document.getElementById('siteLocation');
                if (locationInput) {
                    locationInput.value = `${latitude}, ${longitude}`;
                    this.showToast('Location captured successfully!', 'success');
                    
                    // Store coordinates
                    this.auditData.siteDetails.gpsCoordinates = {
                        latitude,
                        longitude,
                        timestamp: new Date().toISOString()
                    };
                }
            },
            (error) => {
                let errorMessage = 'Unable to get location. ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'Permission denied.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'Location request timed out.';
                        break;
                    default:
                        errorMessage += 'An unknown error occurred.';
                }
                this.showToast(errorMessage, 'error');
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }

    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            // Format as +X (XXX) XXX-XXXX
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

    loadSiteDetails() {
        const savedData = localStorage.getItem('safetyAudit_siteDetails');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                
                // Populate form fields
                Object.keys(data).forEach(key => {
                    const input = document.getElementById(key);
                    if (input) {
                        input.value = data[key];
                    }
                });
                
                // Update audit data
                this.auditData.siteDetails = data;
                
                this.showToast('Loaded saved site details', 'success');
            } catch (error) {
                console.error('Error loading site details:', error);
            }
        }
    }

    autoSaveSiteDetails() {
        const form = document.getElementById('siteDetailsForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        // Update audit data
        this.auditData.siteDetails = data;
        
        // Save to localStorage
        localStorage.setItem('safetyAudit_siteDetails', JSON.stringify(data));
        
        // Update last saved time
        this.updateLastSavedTime();
        
        // Update UI badge
        const siteBadge = document.getElementById('siteBadge');
        if (siteBadge) {
            siteBadge.textContent = 'SAVED';
            siteBadge.style.background = '#10b981';
        }
    }

    saveSiteDetails() {
        const form = document.getElementById('siteDetailsForm');
        if (!form) return;

        // Validate required fields
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        let firstInvalidField = null;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                this.markFieldInvalid(field, 'This field is required');
                isValid = false;
                if (!firstInvalidField) {
                    firstInvalidField = field;
                }
            } else if (field.type === 'email') {
                if (!this.validateEmail(field.value)) {
                    this.markFieldInvalid(field, 'Please enter a valid email address');
                    isValid = false;
                    if (!firstInvalidField) {
                        firstInvalidField = field;
                    }
                } else {
                    this.markFieldValid(field);
                }
            } else {
                this.markFieldValid(field);
            }
        });

        if (!isValid) {
            if (firstInvalidField) {
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalidField.focus();
            }
            this.showToast('Please fill in all required fields correctly', 'error');
            return;
        }

        // Get form data
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Add timestamp
        data.savedAt = new Date().toISOString();
        data.status = 'draft';

        // Update audit data
        this.auditData.siteDetails = data;

        // Save to localStorage
        localStorage.setItem('safetyAudit_siteDetails', JSON.stringify(data));
        
        // Save to Replit Database (simulated)
        this.saveToDatabase('siteDetails', data);

        // Show success
        this.showSuccessModal('Site details saved successfully!', 'You can now proceed to the audit checklist.');
        
        // Update stats
        this.updateStats();
        
        // Navigate to checklist after 2 seconds
        setTimeout(() => {
            this.navigateTo('auditChecklist');
        }, 2000);
    }

    // ===== CHECKLIST PAGE =====
    setupChecklistPage() {
        const container = document.getElementById('checklistContainer');
        if (!container) return;

        // Clear loading message
        container.innerHTML = '';

        // Sample checklist categories and items
        const checklistCategories = [
            {
                id: 1,
                name: 'Site Setup & Access',
                icon: '🏗️',
                items: [
                    { id: 1, question: 'Is the site properly barricaded and signed?', severity: 'high' },
                    { id: 2, question: 'Are access points clearly marked and safe?', severity: 'medium' },
                    { id: 3, question: 'Is there adequate lighting around the site?', severity: 'low' }
                ]
            },
            {
                id: 2,
                name: 'PPE Compliance',
                icon: '👷',
                items: [
                    { id: 4, question: 'Are all workers wearing appropriate safety helmets?', severity: 'critical' },
                    { id: 5, question: 'Is high-visibility clothing worn where required?', severity: 'high' },
                    { id: 6, question: 'Are safety footwear being used correctly?', severity: 'medium' }
                ]
            },
            {
                id: 3,
                name: 'Electrical Safety',
                icon: '⚡',
                items: [
                    { id: 7, question: 'Are electrical tools PAT tested and tagged?', severity: 'critical' },
                    { id: 8, question: 'Are temporary electrical installations protected?', severity: 'high' },
                    { id: 9, question: 'Are cables properly routed and protected?', severity: 'medium' }
                ]
            },
            {
                id: 4,
                name: 'Fire Safety',
                icon: '🔥',
                items: [
                    { id: 10, question: 'Are fire extinguishers available and accessible?', severity: 'high' },
                    { id: 11, question: 'Are flammable materials stored safely?', severity: 'medium' },
                    { id: 12, question: 'Is there a clear fire escape route?', severity: 'critical' }
                ]
            }
        ];

        // Render checklist
        checklistCategories.forEach(category => {
            const categoryElement = this.createChecklistCategory(category);
            container.appendChild(categoryElement);
        });

        // Add submit button
        const submitSection = document.createElement('div');
        submitSection.className = 'form-section';
        submitSection.innerHTML = `
            <div class="form-actions">
                <button type="button" class="btn-secondary" id="saveChecklistBtn">
                    <i class="fas fa-save"></i> Save Progress
                </button>
                <button type="button" class="btn-primary" id="submitChecklistBtn">
                    <i class="fas fa-check-circle"></i> Complete Checklist
                </button>
            </div>
        `;
        container.appendChild(submitSection);

        // Add event listeners
        document.getElementById('saveChecklistBtn')?.addEventListener('click', () => {
            this.saveChecklist();
        });

        document.getElementById('submitChecklistBtn')?.addEventListener('click', () => {
            this.submitChecklist();
        });
    }

    createChecklistCategory(category) {
        const section = document.createElement('div');
        section.className = 'form-section';
        
        let itemsHTML = '';
        category.items.forEach(item => {
            itemsHTML += `
                <div class="checklist-item" data-id="${item.id}">
                    <div class="checklist-question">
                        <span class="severity-badge severity-${item.severity}">${item.severity.toUpperCase()}</span>
                        <span class="question-text">${item.question}</span>
                    </div>
                    <div class="checklist-response">
                        <label class="response-option">
                            <input type="radio" name="item_${item.id}" value="compliant">
                            <span class="response-label">Compliant</span>
                        </label>
                        <label class="response-option">
                            <input type="radio" name="item_${item.id}" value="non_compliant">
                            <span class="response-label">Non-Compliant</span>
                        </label>
                        <label class="response-option">
                            <input type="radio" name="item_${item.id}" value="not_applicable">
                            <span class="response-label">N/A</span>
                        </label>
                        <label class="response-option">
                            <input type="radio" name="item_${item.id}" value="observation">
                            <span class="response-label">Observation</span>
                        </label>
                    </div>
                    <div class="checklist-notes hidden">
                        <textarea placeholder="Add notes or evidence for this item..."></textarea>
                    </div>
                </div>
            `;
        });

        section.innerHTML = `
            <h3 class="section-title">
                <span class="category-icon">${category.icon}</span>
                ${category.name}
            </h3>
            ${itemsHTML}
        `;

        // Add event listeners for radio buttons
        setTimeout(() => {
            section.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    const item = e.target.closest('.checklist-item');
                    const notesSection = item.querySelector('.checklist-notes');
                    
                    if (e.target.value === 'non_compliant') {
                        notesSection.classList.remove('hidden');
                    } else {
                        notesSection.classList.add('hidden');
                    }
                });
            });
        }, 100);

        return section;
    }

    saveChecklist() {
        const checklistItems = document.querySelectorAll('.checklist-item');
        const checklistData = [];

        checklistItems.forEach(item => {
            const itemId = item.dataset.id;
            const selectedResponse = item.querySelector('input[type="radio"]:checked');
            const notes = item.querySelector('textarea')?.value || '';

            if (selectedResponse) {
                checklistData.push({
                    id: itemId,
                    response: selectedResponse.value,
                    notes: notes,
                    timestamp: new Date().toISOString()
                });
            }
        });

        this.auditData.checklist = checklistData;
        localStorage.setItem('safetyAudit_checklist', JSON.stringify(checklistData));
        
        this.showToast('Checklist progress saved!', 'success');
        this.updateLastSavedTime();
    }

    submitChecklist() {
        // Calculate compliance rate
        const totalItems = document.querySelectorAll('.checklist-item').length;
        const compliantItems = document.querySelectorAll('input[type="radio"][value="compliant"]:checked').length;
        const nonCompliantItems = document.querySelectorAll('input[type="radio"][value="non_compliant"]:checked').length;
        
        const complianceRate = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0;
        
        // Save checklist data
        this.saveChecklist();
        
        // Update audit status
        this.auditData.siteDetails.status = 'checklist_completed';
        this.auditData.siteDetails.complianceRate = complianceRate;
        this.auditData.siteDetails.totalFindings = nonCompliantItems;
        
        localStorage.setItem('safetyAudit_siteDetails', JSON.stringify(this.auditData.siteDetails));
        
        // Show summary
        this.showSuccessModal(
            'Checklist Completed!',
            `Compliance Rate: ${complianceRate}%<br>
            Total Items: ${totalItems}<br>
            Non-Compliant: ${nonCompliantItems}<br><br>
            Proceed to capture findings and actions.`
        );
        
        // Update findings badge
        const findingsBadge = document.getElementById('findingsBadge');
        if (findingsBadge) {
            findingsBadge.textContent = nonCompliantItems;
        }
        
        // Update stats
        this.updateStats();
        
        // Navigate to findings after 3 seconds
        setTimeout(() => {
            this.navigateTo('findings');
        }, 3000);
    }

    // ===== PHOTOS PAGE =====
    setupPhotosPage() {
        const uploadArea = document.getElementById('photoUploadArea');
        const photoInput = document.getElementById('photoInput');
        const gallery = document.getElementById('photoGallery');

        if (!uploadArea || !photoInput || !gallery) return;

        // Click to upload
        uploadArea.addEventListener('click', () => {
            photoInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#2563eb';
            uploadArea.style.background = '#f1f5f9';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
            
            const files = e.dataTransfer.files;
            this.handlePhotoUpload(files);
        });

        // File input change
        photoInput.addEventListener('change', (e) => {
            const files = e.target.files;
            this.handlePhotoUpload(files);
        });

        // Load existing photos
        this.loadPhotos();
    }

    handlePhotoUpload(files) {
        if (!files.length) return;

        const gallery = document.getElementById('photoGallery');
        const uploadArea = document.getElementById('photoUploadArea');

        // Show loading state
        const originalHTML = uploadArea.innerHTML;
        uploadArea.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            <h3>Uploading ${files.length} photo(s)...</h3>
            <p>Please wait</p>
        `;

        // Simulate upload process (in real app, upload to server)
        setTimeout(() => {
            // Restore upload area
            uploadArea.innerHTML = originalHTML;

            // Process each file
            Array.from(files).forEach((file, index) => {
                if (!file.type.startsWith('image/')) {
                    this.showToast(`Skipped ${file.name}: Not an image file`, 'warning');
                    return;
                }

                const reader = new FileReader();
                
                reader.onload = (e) => {
                    const photoData = {
                        id: Date.now() + index,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        dataUrl: e.target.result,
                        uploadedAt: new Date().toISOString()
                    };

                    // Add to audit data
                    this.auditData.photos.push(photoData);
                    
                    // Save to localStorage
                    localStorage.setItem('safetyAudit_photos', JSON.stringify(this.auditData.photos));
                    
                    // Add to gallery
                    this.addPhotoToGallery(photoData);
                    
                    this.showToast(`Uploaded: ${file.name}`, 'success');
                };

                reader.readAsDataURL(file);
            });

            // Update last saved time
            this.updateLastSavedTime();
        }, 1500);
    }

    addPhotoToGallery(photoData) {
        const gallery = document.getElementById('photoGallery');
        
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.dataset.id = photoData.id;
        
        photoItem.innerHTML = `
            <img src="${photoData.dataUrl}" alt="${photoData.name}">
            <div class="photo-actions">
                <button class="btn-icon-small" onclick="app.deletePhoto(${photoData.id})">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="btn-icon-small" onclick="app.viewPhoto(${photoData.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        `;
        
        gallery.appendChild(photoItem);
    }

    loadPhotos() {
        const savedPhotos = localStorage.getItem('safetyAudit_photos');
        if (savedPhotos) {
            try {
                this.auditData.photos = JSON.parse(savedPhotos);
                
                const gallery = document.getElementById('photoGallery');
                gallery.innerHTML = '';
                
                this.auditData.photos.forEach(photo => {
                    this.addPhotoToGallery(photo);
                });
            } catch (error) {
                console.error('Error loading photos:', error);
            }
        }
    }

    deletePhoto(photoId) {
        if (confirm('Are you sure you want to delete this photo?')) {
            this.auditData.photos = this.auditData.photos.filter(photo => photo.id !== photoId);
            localStorage.setItem('safetyAudit_photos', JSON.stringify(this.auditData.photos));
            
            const photoItem = document.querySelector(`.photo-item[data-id="${photoId}"]`);
            if (photoItem) {
                photoItem.remove();
            }
            
            this.showToast('Photo deleted', 'warning');
            this.updateLastSavedTime();
        }
    }

    viewPhoto(photoId) {
        const photo = this.auditData.photos.find(p => p.id === photoId);
        if (photo) {
            // In a real app, you'd show a modal with the full-size image
            window.open(photo.dataUrl, '_blank');
        }
    }

    // ===== THEME MANAGEMENT =====
    setupTheme() {
        const themeToggle = document.getElementById('themeToggle');
        if (!themeToggle) return;

        // Load saved theme
        const savedTheme = localStorage.getItem('safetyAudit_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.checked = savedTheme === 'dark';

        // Toggle theme
        themeToggle.addEventListener('change', () => {
            const theme = themeToggle.checked ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('safetyAudit_theme', theme);
            this.showToast(`Switched to ${theme} theme`, 'info');
        });
    }

    // ===== USER DATA =====
    loadUserData() {
        // In a real app, this would come from authentication/API
        const userData = {
            name: 'John Auditor',
            role: 'Senior Safety Auditor',
            company: 'Safety Solutions Inc.',
            email: 'john.auditor@safetysolutions.com',
            phone: '+1 (555) 123-4567'
        };

        // Update UI
        document.getElementById('userName').textContent = userData.name;
        document.getElementById('userRole').textContent = userData.role;
        document.getElementById('userCompany').textContent = userData.company;
        
        // Pre-fill auditor info in form
        setTimeout(() => {
            const auditorName = document.getElementById('auditorName');
            const auditorEmail = document.getElementById('auditorEmail');
            const auditorPhone = document.getElementById('auditorPhone');
            const auditorCompany = document.getElementById('auditorCompany');
            
            if (auditorName && !auditorName.value) auditorName.value = userData.name;
            if (auditorEmail && !auditorEmail.value) auditorEmail.value = userData.email;
            if (auditorPhone && !auditorPhone.value) auditorPhone.value = userData.phone;
            if (auditorCompany && !auditorCompany.value) auditorCompany.value = userData.company;
        }, 1000);
    }

    // ===== DATA MANAGEMENT =====
    loadSavedData() {
        // Load all saved data from localStorage
        const keys = [
            'safetyAudit_siteDetails',
            'safetyAudit_checklist',
            'safetyAudit_findings',
            'safetyAudit_photos',
            'safetyAudit_signatures'
        ];

        keys.forEach(key => {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const dataType = key.replace('safetyAudit_', '');
                    this.auditData[dataType] = JSON.parse(data);
                } catch (error) {
                    console.error(`Error loading ${key}:`, error);
                }
            }
        });
    }

    saveToDatabase(dataType, data) {
        // Simulate saving to Replit Database
        console.log(`💾 Saving ${dataType} to database:`, data);
        
        // In a real app, you would make a fetch request to your backend
        // fetch('/api/save-data', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ type: dataType, data })
        // });
        
        this.showToast(`Saved ${dataType} to database`, 'success');
    }

    // ===== UI UPDATES =====
    updateUI() {
        // Update last saved time
        this.updateLastSavedTime();
        
        // Update connection status
        this.updateConnectionStatus();
        
        // Update stats
        this.updateStats();
    }

    updateLastSavedTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        document.getElementById('lastSavedTime').textContent = timeString;
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;

        const isOnline = navigator.onLine;
        if (isOnline) {
            statusElement.innerHTML = '<i class="fas fa-wifi"></i> Online';
            statusElement.style.color = '#10b981';
        } else {
            statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline';
            statusElement.style.color = '#ef4444';
        }
    }

    updateStats() {
        // Update dashboard statistics
        const auditsCompleted = localStorage.getItem('safetyAudit_completedCount') || 0;
        const openFindings = this.auditData.siteDetails.totalFindings || 0;
        const complianceRate = this.auditData.siteDetails.complianceRate || 0;
        
        document.getElementById('auditsCompleted').textContent = auditsCompleted;
        document.getElementById('openFindings').textContent = openFindings;
        document.getElementById('complianceRate').textContent = `${complianceRate}%`;
        document.getElementById('avgAuditTime').textContent = '45m'; // Example
        
        // Update recent audits list
        this.updateRecentAudits();
    }

    updateRecentAudits() {
        const list = document.getElementById('recentAuditsList');
        if (!list) return;

        // Example recent audits
        const recentAudits = [
            { id: 1, company: 'Construction Masters Inc.', date: '2024-01-15', status: 'completed', score: '92%' },
            { id: 2, company: 'Urban Builders Ltd.', date: '2024-01-10', status: 'in-progress', score: '78%' },
            { id: 3, company: 'Infra Solutions', date: '2024-01-05', status: 'draft', score: '--' }
        ];

        list.innerHTML = recentAudits.map(audit => `
            <div class="audit-item">
                <div class="audit-info">
                    <h4>${audit.company}</h4>
                    <p>${new Date(audit.date).toLocaleDateString()} • Score: ${audit.score}</p>
                </div>
                <div class="audit-status-badge ${audit.status}">
                    ${audit.status.replace('-', ' ').toUpperCase()}
                </div>
            </div>
        `).join('');
    }

    // ===== FORM VALIDATION =====
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    markFieldInvalid(field, message) {
        field.style.borderColor = '#ef4444';
        field.style.boxShadow = '0 0 0 3px rgba(239, 68, 68, 0.1)';
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) existingError.remove();
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        field.parentNode.appendChild(errorDiv);
    }

    markFieldValid(field) {
        field.style.borderColor = '#10b981';
        field.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
        
        // Remove error message if exists
        const errorDiv = field.parentNode.querySelector('.error-message');
        if (errorDiv) errorDiv.remove();
    }

    // ===== NOTIFICATIONS =====
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toastId = 'toast-' + Date.now();
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };

        const toast = document.createElement('div');
        toast.id = toastId;
        toast.className = `toast ${type}`;
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas ${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${type.toUpperCase()}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="document.getElementById('${toastId}').remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        container.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
                toastElement.style.opacity = '0';
                toastElement.style.transform = 'translateX(100%)';
                setTimeout(() => toastElement.remove(), 300);
            }
        }, 5000);
    }

    showSuccessModal(title, message) {
        const modal = document.getElementById('successModal');
        const titleElement = modal.querySelector('h3');
        const messageElement = document.getElementById('successMessage');
        const closeBtn = document.getElementById('closeSuccessModal');

        if (titleElement) titleElement.textContent = title;
        if (messageElement) messageElement.innerHTML = message;

        modal.classList.add('active');

        // Close modal on button click
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.classList.remove('active');
            };
        }

        // Close modal on background click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        };
    }

    // ===== SETUP BUTTONS =====
    setupButtons() {
        // Save draft button
        const saveAuditBtn = document.getElementById('saveAuditBtn');
        if (saveAuditBtn) {
            saveAuditBtn.addEventListener('click', () => {
                this.saveAllData();
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportAudit();
            });
        }

        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.showNotifications();
            });
        }

        // Help button
        const helpBtn = document.getElementById('helpBtn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.navigateTo('help');
            });
        }
    }

    saveAllData() {
        // Save all audit data
        Object.keys(this.auditData).forEach(key => {
            if (this.auditData[key] && Object.keys(this.auditData[key]).length > 0) {
                localStorage.setItem(`safetyAudit_${key}`, JSON.stringify(this.auditData[key]));
            }
        });

        this.showToast('All audit data saved!', 'success');
        this.updateLastSavedTime();
    }

    exportAudit() {
        // In a real app, this would generate a PDF or Excel file
        const exportData = {
            ...this.auditData,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };

        // Create downloadable JSON file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `safety-audit-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showToast('Audit data exported successfully!', 'success');
    }

    showNotifications() {
        // In a real app, this would show a notifications panel
        const notifications = [
            { id: 1, message: '3 pending findings require your attention', type: 'warning', time: '10 min ago' },
            { id: 2, message: 'Site details saved successfully', type: 'success', time: '1 hour ago' },
            { id: 3, message: 'Weekly audit report is ready', type: 'info', time: '1 day ago' }
        ];

        this.showToast(`You have ${notifications.length} notifications`, 'info');
    }

    // ===== MISC =====
    setupForms() {
        // Add any additional form setup here
    }

    // ===== PUBLIC METHODS (for HTML onclick handlers) =====
    deletePhoto(photoId) {
        this.deletePhoto(photoId);
    }

    viewPhoto(photoId) {
        this.viewPhoto(photoId);
    }
}

// Initialize the app when the page loads
let app;
window.addEventListener('load', () => {
    app = new SafetyAuditApp();
    window.app = app; // Make app available globally for HTML onclick handlers
});

// Online/offline detection
window.addEventListener('online', () => {
    if (app) {
        app.updateConnectionStatus();
        app.showToast('You are back online!', 'success');
    }
});

window.addEventListener('offline', () => {
    if (app) {
        app.updateConnectionStatus();
        app.showToast('You are offline. Changes will be saved locally.', 'warning');
    }
});

// Auto-save on page unload
window.addEventListener('beforeunload', (e) => {
    if (app && Object.keys(app.auditData.siteDetails).length > 0) {
        // Only prompt if there's unsaved data
        const confirmationMessage = 'You have unsaved changes. Are you sure you want to leave?';
        e.returnValue = confirmationMessage;
        return confirmationMessage;
    }
});

// Service Worker for offline capability (optional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(error => {
        console.log('ServiceWorker registration failed:', error);
    });
} 