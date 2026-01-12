interface SocketConnection {
  webSocket: WebSocket;
  id: string;
}

// Store active connections
const connections = new Map<string, SocketConnection>();

// Generate unique connection ID
function generateConnectionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Handle Socket.IO-like messages
function handleSocketMessage(connection: SocketConnection, message: string) {
  try {
    const data = JSON.parse(message);
    
    // Echo the message back to the sender for now
    // You can implement custom logic here
    connection.webSocket.send(JSON.stringify({
      type: 'message',
      data: data,
      timestamp: new Date().toISOString()
    }));
    
    // Broadcast to all other connections
    for (const [id, conn] of connections) {
      if (id !== connection.id && conn.webSocket.readyState === 1) {
        conn.webSocket.send(JSON.stringify({
          type: 'broadcast',
          from: connection.id,
          data: data,
          timestamp: new Date().toISOString()
        }));
      }
    }
  } catch (error) {
    console.error('Error handling socket message:', error);
  }
}

export default {
  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/name")) {
      return Response.json({
        name: "Cloudflare",
      });
    }

    // Handle Socket.IO endpoint
    if (url.pathname === "/api/socket") {
      // Check if this is a WebSocket upgrade request
      if (request.headers.get("Upgrade") !== "websocket") {
        return new Response("Expected WebSocket upgrade", { status: 426 });
      }

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);
      
      const connectionId = generateConnectionId();
      const connection: SocketConnection = {
        webSocket: server,
        id: connectionId
      };

      // Store the connection
      connections.set(connectionId, connection);

      // Handle WebSocket events
      server.accept();
      
      server.addEventListener('message', (event) => {
        handleSocketMessage(connection, event.data as string);
      });

      server.addEventListener('close', () => {
        connections.delete(connectionId);
        console.log(`Connection ${connectionId} closed`);
      });

      server.addEventListener('error', (error) => {
        console.error(`WebSocket error for connection ${connectionId}:`, error);
        connections.delete(connectionId);
      });

      // Send welcome message
      server.send(JSON.stringify({
        type: 'connection',
        id: connectionId,
        message: 'Connected to Socket.IO server',
        timestamp: new Date().toISOString()
      }));

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
