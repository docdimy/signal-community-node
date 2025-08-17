import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { SignalHTTPClient, SignalCredentials } from '../../src/utils/SignalHTTPClient';

export class SignalHealth implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Signal Health',
		name: 'signalHealth',
		icon: 'file:signalHealth.svg',
		group: ['transform'],
		version: 1,
		description: 'Check Signal API health and connection status',
		defaults: {
			name: 'Signal Health',
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
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				options: [
					{
						name: 'Health Check',
						value: 'health',
						description: 'Check if Signal API is healthy',
						action: 'Check Signal API health',
					},
					{
						name: 'Get Version',
						value: 'version',
						description: 'Get Signal API version information',
						action: 'Get Signal API version',
					},
					{
						name: 'Get Groups',
						value: 'groups',
						description: 'Get list of available groups',
						action: 'Get Signal groups',
					},
				],
				default: 'health',
				noDataExpression: true,
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;
				const credentials = await this.getCredentials('signalApi') as SignalCredentials;
				const client = new SignalHTTPClient(credentials);

				let result: INodeExecutionData;

				switch (operation) {
					case 'health':
						result = await this.performHealthCheck(client);
						break;
					case 'version':
						result = await this.getVersionInfo(client);
						break;
					case 'groups':
						result = await this.getGroupsList(client);
						break;
					default:
						throw new Error(`Unknown operation: ${operation}`);
				}

				returnData.push(result);
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

	private async performHealthCheck(client: SignalHTTPClient): Promise<INodeExecutionData> {
		const health = await client.healthCheck();

		return {
			json: {
				success: true,
				operation: 'health_check',
				status: health.status,
				version: health.version,
				timestamp: health.timestamp,
				message: health.status === 'ok' ? 'Signal API is healthy' : 'Signal API is not healthy',
			},
		};
	}

	private async getVersionInfo(client: SignalHTTPClient): Promise<INodeExecutionData> {
		const version = await client.getVersion();

		return {
			json: {
				success: true,
				operation: 'get_version',
				version: version.version,
				build: version.build,
				timestamp: new Date().toISOString(),
				message: 'Version information retrieved successfully',
			},
		};
	}

	private async getGroupsList(client: SignalHTTPClient): Promise<INodeExecutionData> {
		const groups = await client.getGroups();

		return {
			json: {
				success: true,
				operation: 'get_groups',
				groups: groups.map(group => ({
					id: group.id,
					name: group.name,
					description: group.description,
					memberCount: group.memberCount,
				})),
				totalGroups: groups.length,
				timestamp: new Date().toISOString(),
				message: `Retrieved ${groups.length} groups successfully`,
			},
		};
	}
}
