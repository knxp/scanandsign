export class WelcomeModal {
    constructor(onYes, onNo) {
        this.onYes = onYes;
        this.onNo = onNo;
        this.modal = null;
    }

    show() {
        this.createModal();
        this.setupEventListeners();
    }

    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'welcome-modal';
        this.modal.innerHTML = `
            <div class="welcome-modal-content">
                <h2>Nice you scanned my shirt!</h2>
                <p>Want to sign your name with the others who've scanned?</p>
                <div class="welcome-buttons">
                    <button class="yes-button">Yes, I'll sign!</button>
                    <button class="no-button">No, just show me</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    setupEventListeners() {
        this.modal.querySelector('.yes-button').addEventListener('click', () => {
            this.hide();
            this.onYes();
        });

        this.modal.querySelector('.no-button').addEventListener('click', () => {
            this.hide();
            this.onNo();
        });
    }

    hide() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
} 