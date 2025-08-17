# n8n Signal Community Node

A community node for n8n that allows you to send and receive messages via Signal using the signal-cli-rest-api.

## Features

- ✅ Send text messages to individual recipients or groups
- ✅ Send messages with attachments (images, documents, etc.)
- ✅ Health check and troubleshooting tools
- ✅ E.164 phone number validation
- ✅ Automatic retry with exponential backoff
- ✅ Binary data support for attachments
- ✅ Error handling with clear error messages

## Quick Start

### 1. Setup Signal CLI REST API

Create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  signal-cli-rest-api:
    image: bbernhard/signal-cli-rest-api:latest
    container_name: signal-cli-rest-api
    ports:
      - "8080:8080"
    environment:
      - SIGNAL_CLI_CONFIG_DIR=/signal-cli-config
    volumes:
      - signal-cli-config:/signal-cli-config
    restart: unless-stopped

volumes:
  signal-cli-config:
```

Start the service:
```bash
docker-compose up -d
```

### 2. Link your Signal account

1. Open your browser and go to `http://localhost:8080`
2. Click on "Link Device" and scan the QR code with your Signal app
3. Verify the linking process

### 3. Install the Signal Node

1. Copy the `signal-community-node` folder to your n8n custom nodes directory
2. Restart n8n
3. The Signal nodes will appear in the node list

### 4. Configure Credentials

1. Go to Settings → Credentials
2. Add new "Signal API" credential
3. Enter:
   - **Base URL**: `http://localhost:8080`
   - **Sender Phone Number**: Your Signal number (e.g., `+491234567890`)
   - **Device Name**: Optional (default: `n8n-signal-node`)

### 5. Test the Connection

1. Add a "Signal Health" node to your workflow
2. Select "Health Check" operation
3. Execute the workflow to verify the connection

## Node Types

### Signal Node

Main node for sending messages and attachments.

**Operations:**
- **Send Message**: Send text messages to recipients or groups
- **Send Attachment**: Send messages with file attachments

**Properties:**
- **Recipients**: Comma-separated list of phone numbers in E.164 format
- **Message**: Text message to send
- **Group ID**: Optional group ID (overrides recipients)
- **Binary Property**: Name of binary property for attachments

### Signal Health Node

Troubleshooting and diagnostic node.

**Operations:**
- **Health Check**: Verify Signal API is running
- **Get Version**: Get API version information
- **Get Groups**: List available groups

## Example Workflows

### 1. Send Simple Text Message

```
Trigger → Signal (Send Message) → Success
```

**Signal Node Configuration:**
- Resource: Message
- Operation: Send
- Recipients: `+491234567890`
- Message: `Hello from n8n!`

### 2. Send Image with Message

```
Trigger → HTTP Request (get image) → Signal (Send Attachment) → Success
```

**Signal Node Configuration:**
- Resource: Attachment
- Operation: Send
- Recipients: `+491234567890`
- Message: `Here's the image you requested`
- Binary Property: `data`

### 3. Incoming Message Handler

```
Signal Trigger → Switch → Process Message → Send Response
```

## Phone Number Format

All phone numbers must be in E.164 format:
- ✅ `+491234567890` (Germany)
- ✅ `+1234567890` (US)
- ❌ `491234567890` (missing +)
- ❌ `01234567890` (missing country code)

## Error Handling

The node includes comprehensive error handling:

- **400 Bad Request**: Invalid phone numbers or message format
- **401 Unauthorized**: Authentication issues
- **503 Service Unavailable**: Signal API not running
- **Timeout**: Network or service issues

## Troubleshooting

### Signal API not responding

1. Check if the Docker container is running:
   ```bash
   docker ps | grep signal-cli-rest-api
   ```

2. Check container logs:
   ```bash
   docker logs signal-cli-rest-api
   ```

3. Verify the API is accessible:
   ```bash
   curl http://localhost:8080/health
   ```

### Linking issues

1. Make sure your phone number is in E.164 format
2. Check if the QR code is still valid (they expire)
3. Verify your Signal app is up to date

### Message not delivered

1. Check if the recipient number is correct
2. Verify the recipient has Signal installed
3. Check if your Signal account is properly linked

## Development

### Building the Node

```bash
npm install
npm run build
```

### Testing

```bash
npm run lint
npm test
```

### Development Mode

```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- GitHub Issues: [Create an issue](https://github.com/yourusername/n8n-nodes-signal/issues)
- n8n Community: [n8n Community Forum](https://community.n8n.io/)

## Changelog

### v0.1.0
- Initial release
- Basic message sending
- Attachment support
- Health check functionality
- E.164 validation
- Error handling and retry logic
