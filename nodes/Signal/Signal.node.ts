import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
} from 'n8n-workflow';
import { SignalHTTPClient, SignalCredentials, SignalMessage } from '../../src/utils/SignalHTTPClient';

export class Signal implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Signal',
		name: 'signal',
		icon: 'file:signal.svg',
		group: ['transform'],
		version: 1,
		description: 'Send messages via Signal using signal-cli-rest-api',
		defaults: {
			name: 'Signal',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'signalApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Message',
						value: 'message',
						description: 'Send a text message',
					},
					{
						name: 'Attachment',
						value: 'attachment',
						description: 'Send a message with attachments',
					},
				],
				default: 'message',
				noDataExpression: true,
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['message', 'attachment'],
					},
				},
				options: [
					{
						name: 'Send',
						value: 'send',
						description: 'Send a message',
						action: 'Send a message',
					},
				],
				default: 'send',
				noDataExpression: true,
			},
			{
				displayName: 'Recipients',
				name: 'recipients',
				type: 'string',
				default: '',
				placeholder: '+491234567890,+499876543210',
				description: 'Comma-separated list of recipient phone numbers in E.164 format',
				displayOptions: {
					show: {
						resource: ['message', 'attachment'],
						operation: ['send'],
					},
				},
				required: true,
			},
			{
				displayName: 'Message',
				name: 'message',
				type: 'string',
				default: '',
				description: 'Message text to send',
				displayOptions: {
					show: {
						resource: ['message', 'attachment'],
						operation: ['send'],
					},
				},
				required: true,
			},
			{
				displayName: 'Group ID',
				name: 'groupId',
				type: 'string',
				default: '',
				description: 'Group ID to send message to (optional, overrides recipients)',
				displayOptions: {
					show: {
						resource: ['message', 'attachment'],
						operation: ['send'],
					},
				},
				required: false,
			},
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				description: 'Name of the binary property containing the file data',
				displayOptions: {
					show: {
						resource: ['attachment'],
						operation: ['send'],
					},
				},
				required: true,
			},
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['message', 'attachment'],
						operation: ['send'],
					},
				},
				options: [
					{
						displayName: 'Timeout',
						name: 'timeout',
						type: 'number',
						default: 15000,
						description: 'Request timeout in milliseconds',
						typeOptions: {
							minValue: 5000,
							maxValue: 60000,
						},
					},
					{
						displayName: 'Max Retries',
						name: 'maxRetries',
						type: 'number',
						default: 3,
						description: 'Maximum number of retry attempts',
						typeOptions: {
							minValue: 0,
							maxValue: 5,
						},
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				if (resource === 'message' && operation === 'send') {
					const result = await this.sendMessage(i);
					returnData.push(result);
				} else if (resource === 'attachment' && operation === 'send') {
					const result = await this.sendAttachment(i);
					returnData.push(result);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							success: false,
							error: error instanceof Error ? error.message : 'Unknown error',
							timestamp: new Date().toISOString(),
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}

	private async sendMessage(i: number): Promise<INodeExecutionData> {
		const credentials = await this.getCredentials('signalApi') as SignalCredentials;
		const client = new SignalHTTPClient(credentials);

		const recipients = this.getNodeParameter('recipients', i) as string;
		const message = this.getNodeParameter('message', i) as string;
		const groupId = this.getNodeParameter('groupId', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		// Validate inputs
		if (!message.trim()) {
			throw new NodeOperationError(this.getNode(), 'Message cannot be empty');
		}

		if (!groupId && !recipients.trim()) {
			throw new NodeOperationError(this.getNode(), 'Either recipients or group ID must be provided');
		}

		// Parse recipients
		const recipientList = groupId ? [] : recipients.split(',').map(r => r.trim()).filter(r => r);

		// Validate E.164 format
		if (!groupId) {
			for (const recipient of recipientList) {
				if (!this.isValidE164(recipient)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid phone number format: ${recipient}. Must be in E.164 format (e.g., +491234567890)`
					);
				}
			}
		}

		const signalMessage: SignalMessage = {
			number: credentials.senderNumber,
			message: message.trim(),
			recipients: recipientList,
			...(groupId && { groupId }),
		};

		// Send message with retry logic
		const response = await client.retryWithBackoff(
			() => client.sendMessage(signalMessage),
			(additionalFields.maxRetries as number) || 3,
			1000
		);

		return {
			json: {
				success: true,
				message: 'Message sent successfully',
				timestamp: response.timestamp,
				results: response.results,
				recipients: recipientList,
				groupId,
				messageLength: message.length,
			},
		};
	}

	private async sendAttachment(i: number): Promise<INodeExecutionData> {
		const credentials = await this.getCredentials('signalApi') as SignalCredentials;
		const client = new SignalHTTPClient(credentials);

		const recipients = this.getNodeParameter('recipients', i) as string;
		const message = this.getNodeParameter('message', i) as string;
		const groupId = this.getNodeParameter('groupId', i) as string;
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
		const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

		// Validate inputs
		if (!groupId && !recipients.trim()) {
			throw new NodeOperationError(this.getNode(), 'Either recipients or group ID must be provided');
		}

		// Get binary data
		const item = this.getInputData()[i];
		if (!item.binary || !item.binary[binaryPropertyName]) {
			throw new NodeOperationError(
				this.getNode(),
				`Binary property '${binaryPropertyName}' not found in input data`
			);
		}

		const binaryData = item.binary[binaryPropertyName];
		if (!binaryData.data) {
			throw new NodeOperationError(
				this.getNode(),
				`Binary property '${binaryPropertyName}' has no data`
			);
		}

		// Parse recipients
		const recipientList = groupId ? [] : recipients.split(',').map(r => r.trim()).filter(r => r);

		// Validate E.164 format
		if (!groupId) {
			for (const recipient of recipientList) {
				if (!this.isValidE164(recipient)) {
					throw new NodeOperationError(
						this.getNode(),
						`Invalid phone number format: ${recipient}. Must be in E.164 format (e.g., +491234567890)`
					);
				}
			}
		}

		const signalMessage: SignalMessage = {
			number: credentials.senderNumber,
			message: message.trim() || '',
			recipients: recipientList,
			...(groupId && { groupId }),
		};

		const attachments = [{
			binary: {
				data: binaryData.data,
				mimeType: binaryData.mimeType,
				fileName: binaryData.fileName,
			},
		}];

		// Send message with attachment
		const response = await client.retryWithBackoff(
			() => client.sendMessageWithAttachments(signalMessage, attachments),
			(additionalFields.maxRetries as number) || 3,
			1000
		);

		return {
			json: {
				success: true,
				message: 'Message with attachment sent successfully',
				timestamp: response.timestamp,
				results: response.results,
				recipients: recipientList,
				groupId,
				attachment: {
					fileName: binaryData.fileName,
					mimeType: binaryData.mimeType,
					size: Buffer.from(binaryData.data, 'base64').length,
				},
			},
		};
	}

	private isValidE164(phoneNumber: string): boolean {
		// E.164 format: +[country code][national number]
		// Example: +491234567890
		const e164Regex = /^\+[1-9]\d{1,14}$/;
		return e164Regex.test(phoneNumber);
	}
}
