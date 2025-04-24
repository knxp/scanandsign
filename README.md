# Scan and Sign

A digital signature board accessible via QR code on a T-shirt, built with Azure services. This interactive web application allows people to scan a QR code and leave their signature on a shared digital canvas.

## Features

- QR code scanning to access the digital board
- Digital signature capture using drawing or text input
- Zoomable/scrollable canvas displaying all signatures
- Spam prevention without collecting personal data
- Mobile-friendly responsive design

## Tech Stack

- Frontend: HTML, CSS, JavaScript
  - SignaturePad for signature input
  - OpenSeadragon for zoomable canvas
- Backend: Azure Functions (Node.js)
- Database: Azure Cosmos DB / Table Storage
- Hosting: Azure Static Web Apps

## Project Structure

```
scanandsign/
├── frontend/           # Frontend web application
│   ├── public/        # Static files
│   │   ├── index.html
│   │   └── assets/   # Images, fonts, etc.
│   └── src/          # Source files
│       ├── styles/   # CSS files
│       ├── js/       # JavaScript files
│       └── components/ # Reusable components
├── backend/           # Azure Functions backend
│   ├── api/          # API endpoints
│   │   ├── submitSignature/
│   │   └── getSignatures/
│   └── shared/       # Shared utilities
├── scripts/          # Deployment and utility scripts
│   └── deploy/
└── docs/             # Documentation
```

## Setup

1. Prerequisites
   - Node.js (Latest LTS version)
   - Azure CLI
   - Azure Functions Core Tools

2. Installation
   ```bash
   # Clone the repository
   git clone https://github.com/knxp/scanandsign.git
   cd scanandsign

   # Install dependencies
   npm install
   ```

3. Local Development
   ```bash
   # Start frontend development server
   cd frontend
   npm start

   # Start backend functions locally
   cd backend
   func start
   ```

4. Deployment
   ```bash
   # Deploy to Azure
   npm run deploy
   ```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
