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

    // Create a tile source for the grid
    function createGridTileSource() {
        const tileSize = 512;
        const signatureImages = new Map(); // Cache for loaded signature images
        
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
                        // Draw the box with a subtle outline
                        ctx.fillStyle = colorMap[signature.color];
                        ctx.strokeStyle = '#e0e0e0'; // Match grid line color
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.rect(sigX, sigY, signature.width, signature.height); // Remove rounded corners
                        ctx.fill();
                        ctx.stroke();

                        // Draw the signature image if it's loaded
                        const img = signatureImages.get(signature.id);
                        if (img && img.complete) {
                            ctx.drawImage(img, sigX, sigY, signature.width, signature.height);
                        }
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
            gridSize = newGridSize;
            BOARD_WIDTH = gridSize.cols * CELL_WIDTH;
            BOARD_HEIGHT = gridSize.rows * CELL_HEIGHT;
            gridCoordinates = new GridCoordinates(gridSize.cols, gridSize.rows, CELL_WIDTH, CELL_HEIGHT);
            loadSignatures();
        }
    });

    // Initial setup
    resizeCanvas();
    loadSignatures();
    showModal(welcomeModal);
}

// Wait for DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeApp); 