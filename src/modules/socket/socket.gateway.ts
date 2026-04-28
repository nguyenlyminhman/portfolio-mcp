import { Injectable, OnModuleInit } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io'


@Injectable()
export class SocketGateway implements OnModuleInit {
    @WebSocketServer()
    server: Server;

    private readonly clients = new Map<string, any>();

    onModuleInit(): void {
        // Called once when the Nest module is initialized.
        // Initialize in-memory structures and attach lightweight shutdown handlers.
        console.info('[SocketGateway] initialized');

        const shutdown = () => {
            console.info('[SocketGateway] shutting down — clearing connected clients');
            this.clients.clear();
        };

        // Register simple process signal handlers to allow cleanup if the process is terminated.
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }

    // Register a connected client (id should be unique per connection) and its associated socket/connection object.        
    registerClient(id: string, client: any): void {
        this.clients.set(id, client);
    }

    // Remove a disconnected client
    unregisterClient(id: string): void {
        this.clients.delete(id);
    }

    // Broadcast an event/payload to all registered clients.
    // This is defensive and supports common client APIs (emit/send).
    broadcast(event: string, payload: unknown): void {
        for (const client of this.clients.values()) {
            try {
                if (client && typeof client.emit === 'function') {
                    client.emit(event, payload);
                } else if (client && typeof client.send === 'function') {
                    // fall back to JSON string if client expects raw messages
                    client.send(JSON.stringify({ event, payload }));
                }
            } catch (err) {
                console.warn('[SocketGateway] failed to send to a client', err);
            }
        }
    }
}
