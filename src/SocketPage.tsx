import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

interface Message {
  type: string;
  id?: string;
  message?: string;
  data?: unknown;
  from?: string;
  timestamp: string;
}

export default function SocketPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState('Connecting...');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to the worker's socket endpoint
    // Use the current host but change protocol to ws/wss
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}/api/socket`;
    
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus('Connected');
    };

    socket.onmessage = (event) => {
      try {
        const data: Message = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    socket.onclose = () => {
      setStatus('Disconnected');
    };

    socket.onerror = () => {
      setStatus('Error');
    };

    return () => {
      socket.close();
    };
  }, []);

  const sendMessage = () => {
    if (socketRef.current && input.trim()) {
      socketRef.current.send(JSON.stringify({ message: input }));
      setInput('');
    }
  };

  return (
    <div className="socket-container" style={{ padding: '20px', textAlign: 'left' }}>
      <Link to="/">← Back to Home</Link>
      <h1>Socket.IO Connection</h1>
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> <span style={{ color: status === 'Connected' ? 'green' : 'red' }}>{status}</span>
      </div>
      
      <div style={{ 
        border: '1px solid #ccc', 
        height: '300px', 
        overflowY: 'scroll', 
        padding: '10px',
        background: '#f9f9f9',
        borderRadius: '4px',
        color: '#333'
      }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '8px', fontSize: '14px' }}>
            <small style={{ color: '#888' }}>[{new Date(msg.timestamp).toLocaleTimeString()}]</small>{' '}
            <strong>{msg.type === 'connection' ? 'System' : msg.from || 'You'}:</strong>{' '}
            {msg.message || JSON.stringify(msg.data)}
          </div>
        ))}
        {messages.length === 0 && <div style={{ color: '#888' }}>No messages yet...</div>}
      </div>

      <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button onClick={sendMessage} disabled={status !== 'Connected'}>
          Send
        </button>
      </div>
    </div>
  );
}
