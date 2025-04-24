import SignaturePad from 'signature_pad/dist/signature_pad.js';

export class SignatureInput {
    constructor(gridCoordinates, onSignatureSubmit) {
        console.log('SignatureInput constructor called');
        this.gridCoordinates = gridCoordinates;
        this.onSignatureSubmit = onSignatureSubmit;
        this.modal = null;
        this.signaturePad = null;
        this.selectedColor = 'red';
        this.colorMap = {
            red: 'rgb(255, 107, 107)',
            blue: 'rgb(77, 171, 247)',
            yellow: 'rgb(255, 212, 59)',
            green: 'rgb(81, 207, 102)',
            pink: 'rgb(247, 131, 172)',
            purple: 'rgb(204, 93, 232)'
        };
    }

    // Create and show the signature input modal
    show() {
        console.log('Showing signature input');
        this.createModal();
        // Wait for modal to be fully rendered
        setTimeout(() => {
            console.log('Initializing signature pad');
            this.initializeSignaturePad();
            this.setupEventListeners();
        }, 300);
    }

    // Create the modal HTML structure
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = 'signature-modal';
        this.modal.innerHTML = `
            <div class="signature-modal-content">
                <div class="signature-modal-header">
                    <h2>Add Your Signature</h2>
                    <button class="close-button">&times;</button>
                </div>
                <div class="signature-modal-body">
                    <div class="signature-input-container">
                        <canvas id="signature-pad" width="400" height="200"></canvas>
                    </div>
                    <div class="color-selection">
                        <p>Choose a background color:</p>
                        <div class="color-options">
                            <button class="color-option red active" data-color="red"></button>
                            <button class="color-option blue" data-color="blue"></button>
                            <button class="color-option yellow" data-color="yellow"></button>
                            <button class="color-option green" data-color="green"></button>
                            <button class="color-option pink" data-color="pink"></button>
                            <button class="color-option purple" data-color="purple"></button>
                        </div>
                    </div>
                    <div class="signature-actions">
                        <button class="clear-button">Clear</button>
                        <button class="submit-button">Submit</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(this.modal);
    }

    // Initialize the signature pad
    initializeSignaturePad() {
        console.log('Initializing signature pad');
        const canvas = document.getElementById('signature-pad');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }

        console.log('Canvas found:', canvas);

        // Set explicit dimensions
        canvas.width = 400;
        canvas.height = 200;

        console.log('Canvas size set:', canvas.width, canvas.height);

        try {
            // Initialize signature pad
            this.signaturePad = new SignaturePad(canvas, {
                backgroundColor: this.colorMap[this.selectedColor],
                penColor: 'rgb(0, 0, 0)',
                velocityFilterWeight: 0.7,
                minWidth: 0.5,
                maxWidth: 2.5,
                throttle: 16
            });

            console.log('Signature pad initialized');

            // Handle window resize
            const resizeObserver = new ResizeObserver(() => {
                console.log('Canvas resized');
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = 400 * ratio;
                canvas.height = 200 * ratio;
                canvas.getContext('2d').scale(ratio, ratio);
                this.signaturePad.clear();
            });

            resizeObserver.observe(canvas);
        } catch (error) {
            console.error('Error initializing signature pad:', error);
        }
    }

    // Set up event listeners
    setupEventListeners() {
        // Close button
        this.modal.querySelector('.close-button').addEventListener('click', () => this.hide());

        // Color selection
        this.modal.querySelectorAll('.color-option').forEach(button => {
            button.addEventListener('click', (e) => {
                this.selectColor(e.target.dataset.color);
            });
        });

        // Clear button
        this.modal.querySelector('.clear-button').addEventListener('click', () => {
            this.signaturePad.clear();
            this.signaturePad.backgroundColor = this.colorMap[this.selectedColor];
        });

        // Submit button
        this.modal.querySelector('.submit-button').addEventListener('click', () => {
            this.handleSubmit();
        });
    }

    selectColor(color) {
        console.log('Selecting color:', color);
        this.selectedColor = color;
        this.modal.querySelectorAll('.color-option').forEach(button => {
            button.classList.toggle('active', button.dataset.color === color);
        });
        
        if (this.signaturePad) {
            console.log('Updating signature pad background color');
            this.signaturePad.backgroundColor = this.colorMap[color];
            this.signaturePad.clear();
        } else {
            console.error('Signature pad not initialized');
        }
    }

    // Handle signature submission
    handleSubmit() {
        if (this.signaturePad.isEmpty()) {
            alert('Please draw your signature first');
            return;
        }

        const signatureData = this.signaturePad.toDataURL();
        const occupiedPositions = this.getOccupiedPositions();
        const position = this.gridCoordinates.findBestPosition(occupiedPositions);

        if (!position) {
            alert('No space available for signatures');
            return;
        }

        const signature = {
            id: Date.now(),
            gridPosition: position,
            width: 75,
            height: 50,
            color: this.selectedColor,
            timestamp: new Date().toISOString(),
            data: signatureData
        };

        this.onSignatureSubmit(signature);
        this.hide();
    }

    // Get currently occupied positions
    getOccupiedPositions() {
        // This should be replaced with actual data from your application
        return [];
    }

    // Hide and clean up the modal
    hide() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
            this.signaturePad = null;
        }
    }
} 