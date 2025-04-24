// Grid coordinate system
export class GridCoordinates {
    constructor(cols, rows, cellWidth, cellHeight) {
        this.cols = cols;
        this.rows = rows;
        this.cellWidth = cellWidth;
        this.cellHeight = cellHeight;
    }

    // Convert grid coordinates (col, row) to pixel coordinates (x, y)
    gridToPixel(col, row) {
        return {
            x: col * this.cellWidth,
            y: row * this.cellHeight
        };
    }

    // Convert pixel coordinates (x, y) to grid coordinates (col, row)
    pixelToGrid(x, y) {
        return {
            col: Math.floor(x / this.cellWidth),
            row: Math.floor(y / this.cellHeight)
        };
    }

    // Check if a grid position is valid
    isValidPosition(col, row) {
        return col >= 0 && col < this.cols && row >= 0 && row < this.rows;
    }

    // Get the center of a grid cell
    getCellCenter(col, row) {
        const { x, y } = this.gridToPixel(col, row);
        return {
            x: x + (this.cellWidth / 2),
            y: y + (this.cellHeight / 2)
        };
    }

    // Get all valid grid positions
    getAllPositions() {
        const positions = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                positions.push({ col, row });
            }
        }
        return positions;
    }

    // Get the next available position in the grid
    getNextAvailablePosition(occupiedPositions) {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const position = { col, row };
                if (!occupiedPositions.some(pos => pos.col === col && pos.row === row)) {
                    return position;
                }
            }
        }
        return null; // No available positions
    }

    // Count total used and open spots
    countGridUsage(occupiedPositions) {
        const totalSpots = this.cols * this.rows;
        const usedSpots = occupiedPositions.length;
        const openSpots = totalSpots - usedSpots;
        
        return {
            total: totalSpots,
            used: usedSpots,
            open: openSpots,
            percentageUsed: (usedSpots / totalSpots) * 100
        };
    }

    // Get the center position of a grid cell for signature placement
    getSignatureCenterPosition(col, row) {
        const { x, y } = this.gridToPixel(col, row);
        return {
            x: x + (this.cellWidth / 2),
            y: y + (this.cellHeight / 2)
        };
    }

    // Check if a signature can be placed at a specific position
    canPlaceSignature(col, row, occupiedPositions) {
        // Check if position is valid
        if (!this.isValidPosition(col, row)) {
            return false;
        }
        
        // Check if position is already occupied
        return !occupiedPositions.some(pos => pos.col === col && pos.row === row);
    }

    // Get all available positions in the grid
    getAllAvailablePositions(occupiedPositions) {
        const available = [];
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.canPlaceSignature(col, row, occupiedPositions)) {
                    available.push({ col, row });
                }
            }
        }
        return available;
    }

    // Find the best position for a new signature (prioritizing center)
    findBestPosition(occupiedPositions) {
        const centerCol = Math.floor(this.cols / 2);
        const centerRow = Math.floor(this.rows / 2);
        
        // Start from center and spiral outward
        const positions = this.getAllAvailablePositions(occupiedPositions);
        if (positions.length === 0) return null;
        
        // Sort positions by distance from center
        positions.sort((a, b) => {
            const distA = Math.sqrt(
                Math.pow(a.col - centerCol, 2) + 
                Math.pow(a.row - centerRow, 2)
            );
            const distB = Math.sqrt(
                Math.pow(b.col - centerCol, 2) + 
                Math.pow(b.row - centerRow, 2)
            );
            return distA - distB;
        });
        
        return positions[0];
    }

    // Get the pixel coordinates for centering a signature in a grid cell
    getCenteredSignaturePosition(col, row, signatureWidth, signatureHeight) {
        const { x, y } = this.gridToPixel(col, row);
        return {
            x: x + (this.cellWidth - signatureWidth) / 2,
            y: y + (this.cellHeight - signatureHeight) / 2
        };
    }
}

// Create a visual reference for the grid
export function createGridReference(cols, rows, cellWidth, cellHeight) {
    const canvas = document.createElement('canvas');
    canvas.width = cols * cellWidth;
    canvas.height = rows * cellHeight;
    const ctx = canvas.getContext('2d');

    // Draw background
    ctx.fillStyle = '#f5f5f7';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 3;

    // Draw vertical lines
    for (let i = 0; i <= cols; i++) {
        const x = i * cellWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    // Draw horizontal lines
    for (let i = 0; i <= rows; i++) {
        const y = i * cellHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }

    // Draw coordinates
    ctx.fillStyle = '#86868b';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * cellWidth + (cellWidth / 2);
            const y = row * cellHeight + (cellHeight / 2);
            ctx.fillText(`${col},${row}`, x, y);
        }
    }

    return canvas.toDataURL();
} 