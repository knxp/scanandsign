# Scan and Sign Frontend

The frontend for the Scan and Sign digital signature board application. This is a responsive web application that allows users to sign a digital board and view all signatures on a zoomable/scrollable canvas.

## Features

- Responsive design for mobile and desktop
- Signature input using SignaturePad
- Zoomable/scrollable canvas using OpenSeadragon
- Device fingerprinting for spam prevention
- Real-time signature board updates

## Prerequisites

- Node.js (Latest LTS version)
- npm (comes with Node.js)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm start
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Development

The project uses Vite for development and building. The main files are:

- `public/index.html`: Main HTML file
- `src/styles/main.css`: Main stylesheet
- `src/js/index.js`: Main JavaScript file

### Dependencies

- SignaturePad: For signature input
- OpenSeadragon: For zoomable/scrollable canvas
- FingerprintJS: For device fingerprinting

### API Endpoints

The frontend expects the following API endpoints:

- `POST /api/submit-signature`: Submit a new signature
- `GET /api/signatures`: Retrieve all signatures

## Testing

To test the application locally:

1. Start the development server:
   ```bash
   npm start
   ```

2. Open your browser to `http://localhost:5173`

3. Test the following features:
   - Signature input
   - Signature submission
   - Signature board display
   - Mobile responsiveness
   - Zoom and pan functionality

## Deployment

The frontend is designed to be deployed to Azure Static Web Apps. The build process creates optimized static files in the `dist` directory.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 