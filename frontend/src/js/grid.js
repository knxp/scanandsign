// Grid system for managing signature positions
export class SignatureGrid {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.grid = [];
        this.initializeGrid();
    }

    initializeGrid() {
        const rows = Math.floor(this.height / this.cellSize);
        const cols = Math.floor(this.width / this.cellSize);
        
        for (let i = 0; i < rows; i++) {
            this.grid[i] = new Array(cols).fill(null);
        }
    }

    // Add a signature to the grid
    addSignature(signature) {
        // If the signature has a position, use it
        if (signature.x !== undefined && signature.y !== undefined) {
            const row = Math.floor(signature.y / this.cellSize);
            const col = Math.floor(signature.x / this.cellSize);
            
            if (row >= 0 && row < this.grid.length && col >= 0 && col < this.grid[row].length) {
                this.grid[row][col] = signature;
                return {
                    x: signature.x,
                    y: signature.y,
                    width: this.cellSize,
                    height: this.cellSize
                };
            }
        }
        return null;
    }

    // Get all signatures from the grid
    getAllSignatures() {
        const signatures = [];
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                if (this.grid[row][col] !== null) {
                    signatures.push({
                        ...this.grid[row][col],
                        x: col * this.cellSize,
                        y: row * this.cellSize,
                        width: this.cellSize,
                        height: this.cellSize
                    });
                }
            }
        }
        return signatures;
    }

    // Clear the grid
    clear() {
        this.initializeGrid();
    }
} 