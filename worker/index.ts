interface Env {
  SOCKET_MANAGER: DurableObjectNamespace;
}

export { SocketManager } from './SocketManager';

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/name')) {
      return Response.json({ name: 'Cloudflare' });
    }

    if (url.pathname === '/api/socket') {
      const durableId = env.SOCKET_MANAGER.idFromName('socket-manager');
      const stub = env.SOCKET_MANAGER.get(durableId);
      return stub.fetch(request);
    }

    return new Response(null, { status: 404 });
  },
} satisfies ExportedHandler<Env>;
