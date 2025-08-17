# Signal Community Node Development Plan

## Phase 1: Projekt-Setup und Grundstruktur

### Schritt 1.1: Projekt-Initialisierung
- Erstelle Verzeichnisstruktur für n8n-nodes-signal
- Initialisiere package.json mit n8n Node-Template
- Konfiguriere TypeScript und Build-System
- Erstelle .gitignore und README.md

### Schritt 1.2: Basis-Node-Struktur
- Erstelle Signal.node.ts als Haupt-Node-Klasse
- Implementiere INodeType Interface
- Definiere Node-Metadaten (name, displayName, description)
- Erstelle Basis-Node-Properties für Credentials

### Schritt 1.3: Sidecar Integration Setup
- Erstelle SignalHTTPClient.ts für REST-API-Integration
- Implementiere HTTP-Client für bbernhard/signal-cli-rest-api
- Erstelle Platform-unabhängige API-Integration
- Implementiere Health-Check für Sidecar-Verbindung

## Phase 2: Credentials und Authentifizierung

### Schritt 2.1: Signal Credentials Definition
- Definiere INodeCredentialDescription mit baseUrl (REST-Endpunkt des Sidecars)
- Implementiere senderNumber (E.164-Format) Validierung
- Erstelle optional deviceName Parameter
- Implementiere Credential-Validation ohne QR-Secret-Speicherung

### Schritt 2.2: Sidecar Integration Setup
- Implementiere HTTP-Client für Signal-CLI-REST-API
- Erstelle interaktive QR-Code-Linking über Sidecar
- Implementiere Health-Check für Sidecar-Verbindung
- Erstelle Session-Management ohne lokale Secret-Speicherung

### Schritt 2.3: Credential-Testing und Kompatibilität
- Implementiere Test-Funktion mit /health Endpoint
- Erstelle Connection-Validation für Sidecar
- Definiere Kompatibilitätsmatrix (n8n-Version, Node.js-Version, OS/Docker)
- Implementiere Error-Handling für ungültige Credentials

## Phase 3: Send Message Node Implementation

### Schritt 3.1: Node-Properties Definition
- Definiere Resource-Options (message, attachment, group)
- Implementiere E.164-Validierung für Empfänger-Nummern
- Erstelle Message-Text-Properties mit Leer-Message-Prüfung
- Implementiere Attachment-Handling für Binary Data

### Schritt 3.2: Execute-Funktion Implementation
- Implementiere HTTP-Client für /v2/send Endpoint
- Erstelle Request-Format für Sidecar-API
- Implementiere Input-Data-Processing mit Binary-Support
- Erstelle Output-Data-Formatting mit Message-ID

### Schritt 3.3: Error-Handling und Validation
- Implementiere Input-Validation (E.164, leere Messages)
- Erstelle HTTP-Error-Mapping zu NodeOperationError
- Implementiere Timeout (10-15s) und Retry-Logic (2-3 Retries mit Exponential Backoff)
- Erstelle klare Fehlercodes (400 InvalidRecipient, 503 SidecarUnavailable)

## Phase 4: Attachment und Media Support

### Schritt 4.1: Binary Data Integration
- Implementiere n8n Binary Data Processing statt Base64
- Erstelle Binary-Stream-Handling für Performance
- Implementiere MIME-Type-Erkennung über Dateiendung/contentType
- Erstelle konfigurierbare Dateigrößenlimits mit sauberen Fehlermeldungen

### Schritt 4.2: Sidecar Attachment API
- Implementiere HTTP-Client für /v2/send mit Attachments
- Erstelle Multi-Part-Form-Data für Binary-Upload
- Implementiere Progress-Tracking für große Dateien
- Erstelle Cleanup-Logic für temporäre Binary-Daten

### Schritt 4.3: Media-Type Support
- Implementiere Image-Support (JPEG, PNG, GIF) mit MIME-Validation
- Erstelle Video-Support (MP4, MOV) mit Größenlimits
- Implementiere Audio-Support (MP3, WAV) mit Duration-Checks
- Erstelle Document-Support (PDF, DOC) mit Security-Scanning

## Phase 5: Group Management Node

### Schritt 5.1: Group Operations Properties (Minimal)
- Definiere Group-ID-Input mit Autovervollständigung
- Implementiere Group-Name-Validation für bekannte Gruppen
- Erstelle Member-List-Properties für bestehende Gruppen
- Implementiere Group-ID-Handling mit Credential-Test-Integration

### Schritt 5.2: Group Management Implementation (v1)
- Implementiere "Send to Group ID" für bekannte Gruppen
- Erstelle Gruppenliste-Abruf beim Credential-Test
- Implementiere Group-Info-Retrieval für bestehende Gruppen
- Erstelle Autovervollständigung für Group-IDs

### Schritt 5.3: Group Message Sending
- Implementiere Group-Message-Send über /v2/send
- Erstelle Group-Broadcast-Function für bestehende Gruppen
- Implementiere Group-Member-Validation (nur Lesen)
- Erstelle Group-Permission-Checking (nur Senden)

## Phase 6: Trigger Node Implementation

### Schritt 6.1: Signal Message Trigger (Polling)
- Implementiere INodeType für Polling-Trigger
- Erstelle Polling-Mechanismus mit cursor/seitigem Token
- Implementiere Message-Parsing für /receive Endpoint
- Erstelle Contact-Info-Extraction aus Message-Data

### Schritt 6.2: Signal Event Processing
- Implementiere Deduplizierung über Message-ID in staticData
- Erstelle Message-Filtering für Duplikate
- Implementiere Contact-Update-Handling
- Erstelle Group-Event-Processing

### Schritt 6.3: Trigger Configuration und Daten-Normierung
- Implementiere Trigger-Filter-Properties
- Erstelle Contact-Whitelist/Blacklist
- Implementiere Message-Keyword-Filtering
- Erstelle normierte Rückgabedaten (Absende-Nummer, Text, Medien als Binary, Zeitstempel, GroupId)

## Phase 7: Advanced Features

### Schritt 7.1: Contact Management
- Implementiere Contact-List-Retrieval
- Erstelle Contact-Info-Operations
- Implementiere Contact-Search-Function
- Erstelle Contact-Profile-Management

### Schritt 7.2: Message History
- Implementiere Message-History-Retrieval
- Erstelle Conversation-Thread-Management
- Implementiere Message-Search-Function
- Erstelle Message-Export-Features

### Schritt 7.3: Signal Protocol Features (Optional)
- Implementiere Typing-Indicator (nur wenn Sidecar verlässlich liefert)
- Erstelle Read-Receipt-Handling (nur wenn Sidecar verlässlich liefert)
- Implementiere Message-Reaction-Support (nur wenn Sidecar verlässlich liefert)
- Erstelle einfaches Templating ({{workflow.id}}, {{$json.foo}}) ohne große Template-Engine

## Phase 8: Testing und Validation

### Schritt 8.1: Unit Tests
- Erstelle Test-Suite für HTTP-Client mit nock für /v2/send, /receive
- Implementiere Node-Property-Tests
- Erstelle Credential-Validation-Tests
- Implementiere Error-Handling-Tests

### Schritt 8.2: Integration Tests (Optional)
- Erstelle Docker-Compose Setup (n8n + Sidecar)
- Implementiere Minimal-Workflow für Testnummer/Loopback
- Erstelle Attachment-Tests
- Implementiere Trigger-Node-Tests

### Schritt 8.3: Kompatibilitäts-Tests
- Erstelle Tests für Node 18/20
- Implementiere Tests für n8n LTS + aktuelle Version
- Erstelle Performance-Tests
- Implementiere Compatibility-Tests

## Phase 9: Documentation und Deployment

### Schritt 9.1: Schnellstart-Dokumentation
- Erstelle 10-Zeilen docker-compose.yml Beispiel
- Implementiere 3 Screenshots (Sidecar up, QR-Linking, erster Send-Node)
- Erstelle README.md mit Installation-Guide
- Implementiere Code-Examples

### Schritt 9.2: Beispiel-Workflows
- Erstelle "Text senden" Workflow (einfach)
- Implementiere "Bild senden" Workflow (Binary Data)
- Erstelle "Eingehende Nachrichten" Workflow (Trigger → Router)
- Implementiere Troubleshooting-Guide

### Schritt 9.3: Deployment Preparation
- Erstelle npm-Package-Konfiguration
- Implementiere Build-Scripts
- Erstelle Docker-Configuration
- Implementiere CI/CD-Pipeline

## Phase 10: Quality Assurance

### Schritt 10.1: Code Quality und Credential-Test
- Implementiere ESLint-Konfiguration
- Erstelle Prettier-Formatting
- Implementiere TypeScript-Strict-Mode
- Erstelle Credential-Test-Button (ping /health)

### Schritt 10.2: Security Review und Logging
- Implementiere Input-Sanitization
- Erstelle Credential-Security-Checks (keine Telefonnummern/Token im Workflow-JSON loggen)
- Implementiere File-Upload-Security
- Erstelle Logging-Hinweise (Sidecar-Logs, Support-Anfragen)

### Schritt 10.3: Performance Optimization
- Implementiere Rate Limiting/Backoff an zentraler Fetch-Helfer
- Erstelle Memory-Usage-Optimization
- Implementiere Response-Time-Optimization
- Erstelle Resource-Cleanup-Logic

## Technische Spezifikationen

### Sidecar Integration (Signal-CLI-REST-API)
- HTTP-Client für bbernhard/signal-cli-rest-api
- Platform-unabhängige REST-API-Integration
- Version-Pinning für API-Kompatibilität
- Health-Check Node für Troubleshooting

### Node-Struktur
- Haupt-Node: Signal (Send Message, Send Attachment)
- Trigger-Node: Signal Trigger (Message Events mit Polling)
- Group-Node: Signal Group (Group Management - v1 minimal)
- Health-Node: Signal Health (optional für Troubleshooting)

### Credential-Management
- E.164-Validierung für Telefonnummern
- baseUrl-Konfiguration für Sidecar-Endpoint
- Keine QR-Secret-Speicherung in n8n
- Interaktive Linking über Sidecar

### Error-Handling
- HTTP-Error-Mapping zu NodeOperationError
- User-friendly Error-Messages mit klaren Codes
- Retry-Logic mit Exponential-Backoff
- Graceful-Degradation bei Sidecar-Fehlern

### Performance-Optimization
- Rate Limiting/Backoff an zentraler Fetch-Helfer
- Binary-Stream-Processing für Attachments
- Memory-Efficient File-Handling
- Async-Processing für Non-Blocking-Operations

## Abhängigkeiten und Voraussetzungen

### Node.js Dependencies
- @n8n/n8n-nodes-base
- axios für HTTP-Client
- fs-extra für File-Operations
- path für Platform-spezifische Pfade
- nock für HTTP-Testing

### System Requirements
- Node.js 18+ für n8n Kompatibilität
- Docker für Sidecar-Container
- Internet-Verbindung für Sidecar-API
- Ausreichend Speicherplatz für Attachments

### Development Tools
- TypeScript 4.5+
- ESLint für Code-Quality
- Jest für Testing
- Prettier für Code-Formatting
- Husky für Git-Hooks

## Timeline und Meilensteine

### Woche 1-2: Phase 1-2
- Projekt-Setup und Grundstruktur
- Credentials und Authentifizierung

### Woche 3-4: Phase 3-4
- Send Message Node Implementation
- Attachment und Media Support

### Woche 5-6: Phase 5-6
- Group Management Node
- Trigger Node Implementation

### Woche 7-8: Phase 7-8
- Advanced Features
- Testing und Validation

### Woche 9-10: Phase 9-10
- Documentation und Deployment
- Quality Assurance

## Risiken und Mitigation

### Technische Risiken
- Signal-CLI API-Änderungen: Version-Pinning (Image-Tag), /version-Prüfung mit kompatiblen Ranges
- Platform-Kompatibilität: Umfassende Testing auf verschiedenen OS
- Performance-Issues: Monitoring und Optimization

### Sicherheitsrisiken
- Credential-Exposure: Sichere Credential-Speicherung, keine Telefonnummern/Token im Workflow-JSON loggen
- File-Upload-Security: Input-Validation und Sanitization
- Dependency-Vulnerabilities: Regelmäßige Security-Scans

### Deployment-Risiken
- Persistenz/Linking: Volume für Sidecar verpflichtend dokumentieren; ohne Persistenz kein Empfang
- Große Anhänge: per Binary-Stream senden; klares Fehlermapping bei Überschreitung
- n8n-Version-Kompatibilität: Version-Testing
- User-Adoption: Umfassende Dokumentation und Examples
- Maintenance: Automatisierte Updates und Monitoring
