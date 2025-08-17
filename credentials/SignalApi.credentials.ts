import {
	ICredentialType,
	INodeProperties,
	IAuthenticateGeneric,
} from 'n8n-workflow';

export class SignalApi implements ICredentialType {
	name = 'signalApi';
	displayName = 'Signal API';
	documentationUrl = 'https://github.com/bbernhard/signal-cli-rest-api';
	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'http://localhost:8080',
			placeholder: 'http://localhost:8080',
			description: 'The base URL of your Signal CLI REST API (signal-cli-rest-api)',
			required: true,
		},
		{
			displayName: 'Sender Phone Number',
			name: 'senderNumber',
			type: 'string',
			default: '',
			placeholder: '+491234567890',
			description: 'Your Signal phone number in E.164 format (e.g., +491234567890)',
			required: true,
		},
		{
			displayName: 'Device Name',
			name: 'deviceName',
			type: 'string',
			default: 'n8n-signal-node',
			placeholder: 'n8n-signal-node',
			description: 'Optional device name for Signal registration',
			required: false,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'Content-Type': 'application/json',
			},
		},
	};
}
