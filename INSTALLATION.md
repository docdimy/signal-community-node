# Installation Guide

## Prerequisites

### 1. Install Node.js

You need Node.js 18+ to develop and build the Signal Community Node.

#### macOS (using Homebrew)
```bash
brew install node
```

#### Ubuntu/Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Windows
Download and install from [nodejs.org](https://nodejs.org/)

### 2. Install Docker

You need Docker to run the Signal CLI REST API.

#### macOS
Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER
```

#### Windows
Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop)

## Setup Development Environment

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/n8n-nodes-signal.git
cd n8n-nodes-signal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Build the Node
```bash
npm run build
```

### 4. Start Signal CLI REST API
```bash
docker-compose up -d
```

### 5. Link Signal Account
1. Open http://localhost:8080 in your browser
2. Click "Link Device"
3. Scan the QR code with your Signal app
4. Verify the linking process

## Development Workflow

### 1. Development Mode
```bash
npm run dev
```
This will watch for file changes and rebuild automatically.

### 2. Testing
```bash
npm run lint
npm test
```

### 3. Building for Production
```bash
npm run build
```

## Installing in n8n

### Method 1: Local Development
1. Copy the `signal-community-node` folder to your n8n custom nodes directory:
   ```bash
   cp -r signal-community-node /path/to/n8n/custom/nodes/
   ```
2. Restart n8n
3. The Signal nodes will appear in the node list

### Method 2: npm Package (when published)
```bash
npm install n8n-nodes-signal
```

## Troubleshooting

### Node.js not found
- Make sure Node.js is installed: `node --version`
- Make sure npm is installed: `npm --version`
- Add Node.js to your PATH if needed

### Docker issues
- Make sure Docker is running: `docker ps`
- Check Docker permissions: `docker run hello-world`
- Restart Docker if needed

### Build errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript version: `npx tsc --version`
- Update dependencies: `npm update`

### Signal API connection issues
- Check if container is running: `docker ps | grep signal-cli-rest-api`
- Check container logs: `docker logs signal-cli-rest-api`
- Verify API health: `curl http://localhost:8080/health`
