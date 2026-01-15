export class SocketManager {
	private readonly connections = new Map<string, WebSocket>();
	private readonly textDecoder = new TextDecoder();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(_state: DurableObjectState) {}

	private generateConnectionId(): string {
		return crypto.randomUUID();
	}

	private broadcastMessage(senderId: string, data: unknown) {
		const broadcastPayload = JSON.stringify({
			type: 'broadcast',
			from: senderId,
			data,
			timestamp: new Date().toISOString(),
		});

		for (const [connectionId, socket] of this.connections) {
			if (connectionId === senderId || socket.readyState !== 1) {
				continue;
			}
			socket.send(broadcastPayload);
		}
	}

	private handleSocketMessage(connectionId: string, rawMessage: string) {
		const socket = this.connections.get(connectionId);
		if (!socket || socket.readyState !== 1) {
			return;
		}

		try {
			const data = JSON.parse(rawMessage);
			socket.send(
				JSON.stringify({
					type: 'message',
					data,
					timestamp: new Date().toISOString(),
				})
			);
			this.broadcastMessage(connectionId, data);
		} catch (error) {
			console.error('Error handling socket message inside durable object:', error);
		}
	}

	fetch(request: Request) {
		if (request.headers.get('Upgrade') !== 'websocket') {
			return new Response('Expected WebSocket upgrade', { status: 426 });
		}

		const webSocketPair = new WebSocketPair();
		const [client, server] = Object.values(webSocketPair);
		const connectionId = this.generateConnectionId();

		this.connections.set(connectionId, server);
		console.log(`Socket connection ${connectionId} created in durable object`);

		server.accept();

		const cleanup = () => {
			this.connections.delete(connectionId);
			console.log(`Connection ${connectionId} closed`);
		};

		server.addEventListener('message', (event) => {
			const rawPayload =
				typeof event.data === 'string' ? event.data : this.textDecoder.decode(event.data);
			this.handleSocketMessage(connectionId, rawPayload);
		});

		server.addEventListener('close', cleanup);

		server.addEventListener('error', (error) => {
			console.error(`WebSocket error for connection ${connectionId}:`, error);
			cleanup();
		});

		if (server.readyState === 1) {
			server.send(
				JSON.stringify({
					type: 'connection',
					id: connectionId,
					message: 'Connected to Socket.IO durable object',
					timestamp: new Date().toISOString(),
				})
			);
		}

		return new Response(null, { status: 101, webSocket: client });
	}
}
