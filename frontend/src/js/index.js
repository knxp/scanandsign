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

// Create a colored box image
function createColoredBoxImage(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 75;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    
    // Draw the box
    ctx.fillStyle = colorMap[color];
    ctx.beginPath();
    ctx.roundRect(0, 0, 75, 50, 4);
    ctx.fill();
    
    return canvas.toDataURL();
}

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
loadSignatures(); 