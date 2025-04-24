// Import example signatures and grid system
import { exampleSignatures } from '../data/exampleSignatures.js';
import { GridCoordinates, createGridReference } from './gridCoordinates.js';

// Cell dimensions
const CELL_WIDTH = 78;  // 75 + 3
const CELL_HEIGHT = 53; // 50 + 3

// Calculate grid size based on viewport
function calculateGridSize() {
    const viewportWidth = window.innerWidth - 40; // Account for padding
    const viewportHeight = window.innerHeight - 160; // Account for header (100px) and padding (60px)
    
    const cols = Math.floor(viewportWidth / CELL_WIDTH);
    const rows = Math.floor(viewportHeight / CELL_HEIGHT);
    
    return {
        cols: Math.max(cols, 12), // Minimum 12 columns
        rows: Math.max(rows, 36)  // Minimum 36 rows
    };
}

// Get grid dimensions
const gridSize = calculateGridSize();
const BOARD_WIDTH = gridSize.cols * CELL_WIDTH;
const BOARD_HEIGHT = gridSize.rows * CELL_HEIGHT;

// Initialize grid coordinates
const gridCoordinates = new GridCoordinates(gridSize.cols, gridSize.rows, CELL_WIDTH, CELL_HEIGHT);

// Initialize OpenSeadragon viewer
const viewer = OpenSeadragon({
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

// Color mapping
const colorMap = {
    red: '#ff6b6b',
    blue: '#4dabf7',
    yellow: '#ffd43b',
    green: '#51cf66',
    pink: '#f783ac',
    purple: '#cc5de8'
};

// Initialize SignaturePad
const canvas = document.getElementById('signature-pad');
const signaturePad = new SignaturePad(canvas, {
    backgroundColor: 'rgb(255, 255, 255)',
    penColor: 'rgb(0, 0, 0)'
});

// Modal elements
const welcomeModal = document.getElementById('welcome-modal');
const signatureModal = document.getElementById('signature-modal');
const yesButton = document.getElementById('yes-button');
const noButton = document.getElementById('no-button');
const clearButton = document.getElementById('clear-signature');
const submitButton = document.getElementById('submit-signature');
const colorOptions = document.querySelectorAll('.color-option');

// Selected color
let selectedColor = 'red';

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
    colorOptions.forEach(option => {
        option.classList.remove('selected');
        if (option.dataset.color === color) {
            option.classList.add('selected');
        }
    });
    
    // Update signature pad background color
    const colorMap = {
        red: 'rgb(255, 107, 107)',
        blue: 'rgb(77, 171, 247)',
        yellow: 'rgb(255, 212, 59)',
        green: 'rgb(81, 207, 102)',
        pink: 'rgb(247, 131, 172)',
        purple: 'rgb(204, 93, 232)'
    };
    
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
    
    // Restore the selected color background
    const colorMap = {
        red: 'rgb(255, 107, 107)',
        blue: 'rgb(77, 171, 247)',
        yellow: 'rgb(255, 212, 59)',
        green: 'rgb(81, 207, 102)',
        pink: 'rgb(247, 131, 172)',
        purple: 'rgb(204, 93, 232)'
    };
    signaturePad.backgroundColor = colorMap[selectedColor];
});

submitButton.addEventListener('click', () => {
    if (signaturePad.isEmpty()) {
        alert('Please provide a signature first.');
        return;
    }

    const signatureData = signaturePad.toDataURL();
    const occupiedPositions = exampleSignatures.map(sig => sig.gridPosition);
    const position = gridCoordinates.findBestPosition(occupiedPositions);

    if (!position) {
        alert('No space available for signatures');
        return;
    }

    const signature = {
        id: Date.now(),
        gridPosition: position,
        width: 75,
        height: 50,
        color: selectedColor,
        timestamp: new Date().toISOString(),
        data: signatureData
    };

    exampleSignatures.push(signature);
    signaturePad.clear();
    hideModal(signatureModal);
    loadSignatures();
});

// Create a tile source for the grid
function createGridTileSource() {
    const tileSize = 512;
    
    return {
        width: BOARD_WIDTH,
        height: BOARD_HEIGHT,
        tileSize: tileSize,
        tileOverlap: 0,
        getTileUrl: function(level, x, y) {
            // Create a canvas for this tile
            const canvas = document.createElement('canvas');
            canvas.width = tileSize;
            canvas.height = tileSize;
            const ctx = canvas.getContext('2d');
            
            // Calculate which cells are in this tile
            const startX = x * tileSize;
            const startY = y * tileSize;
            
            // Draw grid lines
            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 3;
            
            // Draw vertical lines
            for (let i = 0; i <= gridSize.cols; i++) {
                const x = i * CELL_WIDTH - startX;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, tileSize);
                ctx.stroke();
            }
            
            // Draw horizontal lines
            for (let i = 0; i <= gridSize.rows; i++) {
                const y = i * CELL_HEIGHT - startY;
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(tileSize, y);
                ctx.stroke();
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
                    // Draw the box with a subtle outline
                    ctx.fillStyle = colorMap[signature.color];
                    ctx.strokeStyle = '#e0e0e0';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.roundRect(sigX, sigY, signature.width, signature.height, 4);
                    ctx.fill();
                    ctx.stroke();
                }
            });
            
            return canvas.toDataURL();
        }
    };
}

// Function to show the entire board
function showEntireBoard() {
    viewer.viewport.fitBounds(new OpenSeadragon.Rect(0, 0, BOARD_WIDTH, BOARD_HEIGHT), true);
}

// Load signatures
function loadSignatures() {
    try {
        // Clear any existing images
        viewer.world.removeAll();

        // Add the grid tile source
        viewer.addTiledImage({
            tileSource: createGridTileSource(),
            x: 0,
            y: 0,
            width: BOARD_WIDTH,
            height: BOARD_HEIGHT
        });

        // Add viewport constraints
        viewer.viewport.setConstraints({
            minZoomLevel: 0.001,
            maxZoomLevel: 20,
            minX: 0,
            minY: 0,
            maxX: BOARD_WIDTH,
            maxY: BOARD_HEIGHT
        });

        // Show the entire board
        showEntireBoard();

        // Add home button handler
        viewer.addHandler('home', function() {
            showEntireBoard();
        });

    } catch (error) {
        console.error('Error loading signatures:', error);
    }
}

// Handle window resize
window.addEventListener('resize', function() {
    const newGridSize = calculateGridSize();
    if (newGridSize.cols !== gridSize.cols || newGridSize.rows !== gridSize.rows) {
        loadSignatures();
    }
});

// Initial setup
resizeCanvas();
loadSignatures();
showModal(welcomeModal); 