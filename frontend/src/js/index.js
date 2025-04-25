// Import example signatures and grid system
import { exampleSignatures } from '../data/exampleSignatures.js';
import { GridCoordinates, createGridReference } from './gridCoordinates.js';

// Cell dimensions - increased by 20%
const CELL_WIDTH = 94;  // 78 * 1.2
const CELL_HEIGHT = 64; // 53 * 1.2

// Color mapping
const colorMap = {
    red: '#ff6b6b',
    blue: '#4dabf7',
    yellow: '#ffd43b',
    green: '#51cf66',
    pink: '#f783ac',
    purple: '#cc5de8'
};

// Calculate grid size based on viewport
function calculateGridSize() {
    const viewportWidth = window.innerWidth - 40; // Account for padding
    const viewportHeight = window.innerHeight - 160; // Account for header (100px) and padding (60px)
    
    // Calculate number of cells, then reduce by 20%
    const cols = Math.floor((viewportWidth / CELL_WIDTH) * 0.8);
    const rows = Math.floor((viewportHeight / CELL_HEIGHT) * 0.8);
    
    return {
        cols: Math.max(cols, 10), // Minimum 10 columns (reduced from 12)
        rows: Math.max(rows, 29)  // Minimum 29 rows (reduced from 36)
    };
}

// Global variables
let gridSize;
let BOARD_WIDTH;
let BOARD_HEIGHT;
let gridCoordinates;
let viewer;
let flippedSignatures = new Set(); // Track flipped signatures

// Function to find the next available spot in the grid
function findNextAvailableSpot(occupiedPositions) {
    // Start from the top-left and move right, then down
    for (let row = 0; row < gridSize.rows; row++) {
        for (let col = 0; col < gridSize.cols; col++) {
            const position = { col, row };
            
            // Check if this position is already occupied
            const isOccupied = occupiedPositions.some(pos => 
                pos.col === position.col && pos.row === position.row
            );
            
            if (!isOccupied) {
                return position;
            }
        }
    }
    return null; // No available spots
}

// Function to toggle signature flip state
function toggleSignatureFlip(signatureId) {
    if (flippedSignatures.has(signatureId)) {
        flippedSignatures.delete(signatureId);
    } else {
        flippedSignatures.add(signatureId);
    }
    
    // Find the signature that was clicked
    const signature = exampleSignatures.find(sig => sig.id === signatureId);
    if (!signature) return;
    
    // Calculate the position of the signature
    const { x, y } = gridCoordinates.getCenteredSignaturePosition(
        signature.gridPosition.col,
        signature.gridPosition.row,
        signature.width,
        signature.height
    );

    // Calculate fixed font size based on viewport
    const zoom = viewer.viewport.getZoom();
    const baseFontSize = 14; // Base font size in pixels
    const fontScale = 1 / zoom;
    
    // Remove any existing overlay for this signature
    const existingOverlay = viewer.overlays.find(overlay => overlay.id === `sig-${signatureId}`);
    if (existingOverlay) {
        viewer.overlays.remove(existingOverlay);
    }
    
    // Create a new overlay for the flipped card
    const overlay = document.createElement('div');
    overlay.id = `sig-${signatureId}`;
    overlay.className = 'signature-card';
    overlay.style.cssText = `
        width: ${signature.width}px;
        height: ${signature.height}px;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.6s;
    `;
    
    if (flippedSignatures.has(signatureId)) {
        overlay.classList.add('flipped');
    }
    
    // Create front and back of card
    const front = document.createElement('div');
    front.className = 'signature-card-front';
    front.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        background-color: ${colorMap[signature.color]};
    `;
    
    const back = document.createElement('div');
    back.className = 'signature-card-back';
    back.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        background-color: ${colorMap[signature.color]};
        transform: rotateY(180deg);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    `;

    // Create a fixed-size container for text
    const textContainer = document.createElement('div');
    textContainer.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        transform-origin: center;
        overflow: hidden;
    `;
    
    // Add timestamp and location to back
    const timestamp = document.createElement('div');
    timestamp.className = 'timestamp';
    timestamp.textContent = new Date(signature.timestamp).toLocaleString();
    timestamp.style.cssText = `
        color: #000000;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
        font-size: 12px;
        line-height: 1.2;
        text-align: center;
        margin-bottom: 6px;
        white-space: nowrap;
        transform-origin: center;
        width: 90%;
    `;
    
    const location = document.createElement('div');
    location.className = 'location';
    location.textContent = 'Location: Unknown';
    location.style.cssText = `
        color: #000000;
        font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
        font-size: 10px;
        line-height: 1.2;
        text-align: center;
        white-space: nowrap;
        transform-origin: center;
        width: 90%;
    `;
    
    textContainer.appendChild(timestamp);
    textContainer.appendChild(location);
    back.appendChild(textContainer);
    
    // Add signature image to front if available
    if (signature.data) {
        const img = new Image();
        img.src = signature.data;
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: contain;
        `;
        front.appendChild(img);
    }
    
    overlay.appendChild(front);
    overlay.appendChild(back);
    
    // Add the overlay to the viewer with fixed scaling
    viewer.addOverlay({
        element: overlay,
        location: new OpenSeadragon.Rect(x, y, signature.width, signature.height),
        placement: OpenSeadragon.Placement.CENTER,
        rotationMode: OpenSeadragon.OverlayRotationMode.NO_ROTATION,
        checkResize: false
    });
}

// Function to load signatures
function loadSignatures() {
    try {
        // Clear any existing images
        viewer.world.removeAll();
        
        // Remove all overlays
        while (viewer.overlays.length > 0) {
            viewer.overlays.remove(viewer.overlays[0]);
        }

        // Add the grid tile source
        viewer.addTiledImage({
            tileSource: createGridTileSource(),
            x: 0,
            y: 0,
            width: BOARD_WIDTH
        });

        // Add viewport constraints
        viewer.viewport.applyConstraints({
            minZoomLevel: 0.001,
            maxZoomLevel: 20,
            minX: 0,
            minY: 0,
            maxX: BOARD_WIDTH,
            maxY: BOARD_HEIGHT
        });

        // Add home button handler
        viewer.addHandler('home', function() {
            showEntireBoard();
        });
    } catch (error) {
        console.error('Error loading signatures:', error);
    }
}

// Function to show the entire board
function showEntireBoard() {
    viewer.viewport.fitBounds(new OpenSeadragon.Rect(0, 0, BOARD_WIDTH, BOARD_HEIGHT), true);
}

// Function to reset all flipped signatures
function resetFlippedSignatures() {
    flippedSignatures.clear();
    loadSignatures();
}

// Function to handle click events on the viewer
function handleViewerClick(event) {
    const webPoint = viewer.viewport.pointFromPixel(event.position);
    const viewportPoint = viewer.viewport.viewportToImageCoordinates(webPoint);
    
    // Check if click is within any signature
    for (const signature of exampleSignatures) {
        const { x, y } = gridCoordinates.getCenteredSignaturePosition(
            signature.gridPosition.col,
            signature.gridPosition.row,
            signature.width,
            signature.height
        );
        
        if (viewportPoint.x >= x && 
            viewportPoint.x <= x + signature.width &&
            viewportPoint.y >= y && 
            viewportPoint.y <= y + signature.height) {
            toggleSignatureFlip(signature.id);
            break;
        }
    }
}

// Function to create grid tile source
function createGridTileSource() {
    const tileSize = 512;
    const signatureImages = new Map();
    
    // Preload signature images
    exampleSignatures.forEach(signature => {
        if (signature.data && !signatureImages.has(signature.id)) {
            const img = new Image();
            img.src = signature.data;
            signatureImages.set(signature.id, img);
        }
    });
    
    return {
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
        tileSize: tileSize,
        tileOverlap: 0,
        getTileUrl: function(level, x, y) {
            const canvas = document.createElement('canvas');
            canvas.width = tileSize;
            canvas.height = tileSize;
            const ctx = canvas.getContext('2d');
            
            // Calculate tile boundaries
            const startX = x * tileSize;
            const startY = y * tileSize;
            
            // Draw grid lines
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            
            // Draw vertical lines
            for (let col = 0; col <= gridSize.cols; col++) {
                const x = col * CELL_WIDTH - startX;
                if (x >= 0 && x < tileSize) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, tileSize);
                    ctx.stroke();
                }
            }
            
            // Draw horizontal lines
            for (let row = 0; row <= gridSize.rows; row++) {
                const y = row * CELL_HEIGHT - startY;
                if (y >= 0 && y < tileSize) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(tileSize, y);
                    ctx.stroke();
                }
            }
            
            // Draw signatures in this tile
            exampleSignatures.forEach(signature => {
                const { x, y } = gridCoordinates.getCenteredSignaturePosition(
                    signature.gridPosition.col,
                    signature.gridPosition.row,
                    signature.width,
                    signature.height
                );
                const sigX = x - startX;
                const sigY = y - startY;
                
                // Only draw if the signature is in this tile
                if (sigX >= 0 && sigX < tileSize && sigY >= 0 && sigY < tileSize) {
                    const isFlipped = flippedSignatures.has(signature.id);
                    const cardColor = colorMap[signature.color];
                    
                    if (isFlipped) {
                        // Draw back of card with matching color
                        ctx.fillStyle = cardColor;
                        ctx.strokeStyle = '#e0e0e0';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.rect(sigX, sigY, signature.width, signature.height);
                        ctx.fill();
                        ctx.stroke();
                        
                        // Draw timestamp and location with contrasting text
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '14px Arial';
                        ctx.textAlign = 'center';
                        const timestamp = new Date(signature.timestamp).toLocaleString();
                        ctx.fillText(timestamp, sigX + signature.width/2, sigY + signature.height/2 - 8);
                        
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '12px Arial';
                        ctx.fillText('Location: Unknown', sigX + signature.width/2, sigY + signature.height/2 + 8);
                    } else {
                        // Draw front of card
                        ctx.fillStyle = cardColor;
                        ctx.strokeStyle = '#e0e0e0';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.rect(sigX, sigY, signature.width, signature.height);
                        ctx.fill();
                        ctx.stroke();
                        
                        // Draw the signature image
                        const img = signatureImages.get(signature.id);
                        if (img && img.complete) {
                            ctx.drawImage(img, sigX, sigY, signature.width, signature.height);
                        }
                    }
                }
            });
            
            return canvas.toDataURL();
        }
    };
}

// Initialize the application
function initializeApp() {
    // Get grid dimensions
    gridSize = calculateGridSize();
    BOARD_WIDTH = gridSize.cols * CELL_WIDTH;
    BOARD_HEIGHT = gridSize.rows * CELL_HEIGHT;

    // Initialize grid coordinates
    gridCoordinates = new GridCoordinates(gridSize.cols, gridSize.rows, CELL_WIDTH, CELL_HEIGHT);

    // Initialize OpenSeadragon viewer
    viewer = OpenSeadragon({
        id: 'signature-board',
        prefixUrl: 'https://cdn.jsdelivr.net/npm/openseadragon@3.1.0/build/openseadragon/images/',
        showNavigationControl: true,
        showRotationControl: false,
        showHomeControl: true,
        showFullPageControl: false,
        maxZoomLevel: 20,
        minZoomLevel: 0.001,
        defaultZoomLevel: 0.001,
        animationTime: 0.5,
        visibilityRatio: 1,
        wrapHorizontal: false,
        wrapVertical: false,
        showNavigator: false,
        backgroundColor: '#f5f5f7',
        viewportMargins: {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0
        }
    });

    // Initialize SignaturePad
    const canvas = document.getElementById('signature-pad');
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });

    // Modal elements
    const welcomeModal = document.getElementById('welcome-modal');
    const signatureModal = document.getElementById('signature-modal');
    const confirmationModal = document.getElementById('confirmation-modal');
    const yesButton = document.getElementById('yes-button');
    const noButton = document.getElementById('no-button');
    const clearButton = document.getElementById('clear-signature');
    const submitButton = document.getElementById('submit-signature');
    const confirmSubmitButton = document.getElementById('confirm-submit');
    const cancelSubmitButton = document.getElementById('cancel-submit');
    const colorOptions = document.querySelectorAll('.color-option');

    // Selected color
    let selectedColor = 'red';
    let hasSelectedColor = false; // Track if user has actively selected a color

    // Handle signature pad resizing
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext('2d').scale(ratio, ratio);
        signaturePad.clear();
    }

    // Show modal
    function showModal(modal) {
        modal.classList.add('active');
    }

    // Hide modal
    function hideModal(modal) {
        modal.classList.remove('active');
    }

    // Handle color selection
    function selectColor(color) {
        selectedColor = color;
        hasSelectedColor = true; // Mark that user has selected a color
        colorOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.dataset.color === color) {
                option.classList.add('selected');
            }
        });
        
        // Save current signature data
        const data = signaturePad.toData();
        
        // Update background color
        signaturePad.backgroundColor = colorMap[color];
        
        // Restore signature data
        signaturePad.fromData(data);
    }

    // Event listeners
    window.addEventListener('resize', resizeCanvas);

    // Welcome modal buttons
    yesButton.addEventListener('click', () => {
        hideModal(welcomeModal);
        showModal(signatureModal);
        resizeCanvas();
    });

    noButton.addEventListener('click', () => {
        hideModal(welcomeModal);
    });

    // Color options
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectColor(option.dataset.color);
        });
    });

    // Signature controls
    clearButton.addEventListener('click', () => {
        // Save current background color
        const currentBg = signaturePad.backgroundColor;
        
        // Set white background
        signaturePad.backgroundColor = 'rgb(255, 255, 255)';
        
        // Clear the signature
        signaturePad.clear();
        
        // Reset color selection
        hasSelectedColor = false;
        selectedColor = 'red';
        colorOptions.forEach(option => {
            option.classList.remove('selected');
        });
        
        // Restore the selected color background
        signaturePad.backgroundColor = colorMap[selectedColor];
    });

    submitButton.addEventListener('click', () => {
        if (signaturePad.isEmpty()) {
            alert('Please provide a signature first.');
            return;
        }

        if (!hasSelectedColor) {
            alert('Please select a background color for your signature.');
            return;
        }

        showModal(confirmationModal);
    });

    confirmSubmitButton.addEventListener('click', () => {
        const signatureData = signaturePad.toDataURL();
        const occupiedPositions = exampleSignatures.map(sig => sig.gridPosition);
        const position = findNextAvailableSpot(occupiedPositions);

        if (!position) {
            alert('No space available for signatures');
            return;
        }

        const signature = {
            id: Date.now(),
            gridPosition: position,
            width: 90,
            height: 60,
            color: selectedColor,
            timestamp: new Date().toISOString(),
            data: signatureData
        };

        exampleSignatures.push(signature);
        signaturePad.clear();
        hideModal(confirmationModal);
        hideModal(signatureModal);
        loadSignatures();
    });

    cancelSubmitButton.addEventListener('click', () => {
        hideModal(confirmationModal);
    });

    // Add click handler to viewer
    viewer.addHandler('canvas-click', handleViewerClick);

    // Handle window resize
    window.addEventListener('resize', function() {
        const newGridSize = calculateGridSize();
        if (newGridSize.cols !== gridSize.cols || newGridSize.rows !== gridSize.rows) {
            gridSize = newGridSize;
            BOARD_WIDTH = gridSize.cols * CELL_WIDTH;
            BOARD_HEIGHT = gridSize.rows * CELL_HEIGHT;
            gridCoordinates = new GridCoordinates(gridSize.cols, gridSize.rows, CELL_WIDTH, CELL_HEIGHT);
            loadSignatures();
        }
    });

    // Handle FAQ toggles
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close all other FAQs
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                }
            });
            // Toggle current FAQ
            item.classList.toggle('active');
        });
    });

    // Close FAQ when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.faq-item')) {
            faqItems.forEach(item => {
                item.classList.remove('active');
            });
        }
    });

    // Initial setup
    resizeCanvas();
    loadSignatures();
    showModal(welcomeModal);
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeApp); 