import Echo from "laravel-echo";
import Pusher from "pusher-js";
import { useEffect, useState } from "react";

interface EchoDiagnostics {
    pusherInitialized: boolean;
    echoInitialized: boolean;
    connectionState: string;
    socketId: string | null;
    config: { key?: string; host?: string };
}

interface SharedConnection {
    pusher: Pusher;
    echo: Echo<"pusher">;
    refs: number;
    connected: boolean;
    socketId: string | null;
    listeners: Set<() => void>;
}

let shared: SharedConnection | null = null;

function createConnection(): SharedConnection | null {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY!;
    const host = process.env.NEXT_PUBLIC_PUSHER_HOST!;

    try {
        const pusher = new Pusher(key, {
            cluster: "",
            wsHost: host,
            wsPort: 6001,
            wssPort: 443,
            forceTLS: false,
            enabledTransports: ["ws", "wss"],
            disableStats: true,
        });

        const echo = new Echo({
            broadcaster: "pusher",
            key,
            wsHost: host,
            wsPort: 6001,
            wssPort: 443,
            forceTLS: false,
            client: pusher,
            disableStats: true,
            enabledTransports: ["ws", "wss"],
        });

        const conn: SharedConnection = {
            pusher,
            echo,
            refs: 0,
            connected: false,
            socketId: null,
            listeners: new Set(),
        };

        pusher.connection.bind("connected", () => {
            conn.connected = true;
            conn.socketId = pusher.connection.socket_id;
            conn.listeners.forEach((l) => l());
        });

        pusher.connection.bind("disconnected", () => {
            conn.connected = false;
            conn.listeners.forEach((l) => l());
        });

        (window as any).Echo = echo;
        (window as any).PusherClient = pusher;

        return conn;
    } catch (error) {
        console.error("❌ Error initializing Echo or Pusher:", error);
        return null;
    }
}

export function useEcho() {
    const [, setTick] = useState(0);

    useEffect(() => {
        if (typeof window === "undefined") return;

        if (!shared) shared = createConnection();
        const conn = shared;
        if (!conn) return;

        conn.refs += 1;
        const listener = () => setTick((t) => t + 1);
        conn.listeners.add(listener);
        setTick((t) => t + 1);

        return () => {
            conn.listeners.delete(listener);
            conn.refs -= 1;
            if (conn.refs === 0) {
                conn.echo.disconnect();
                conn.pusher.disconnect();
                if (shared === conn) shared = null;
            }
        };
    }, []);

    const conn = shared;

    const reconnect = () => {
        if (conn && conn.pusher.connection.state !== "connected") {
            conn.pusher.connect();
        }
    };

    const getDiagnostics = (): EchoDiagnostics => ({
        pusherInitialized: !!conn?.pusher,
        echoInitialized: !!conn?.echo,
        connectionState: conn?.pusher.connection.state || "not_initialized",
        socketId: conn?.pusher.connection.socket_id || null,
        config: {
            key: process.env.NEXT_PUBLIC_PUSHER_KEY?.substring(0, 10) + "...",
            host: process.env.NEXT_PUBLIC_PUSHER_HOST,
        },
    });

    return {
        connected: conn?.connected ?? false,
        socketId: conn?.socketId ?? null,
        echo: conn?.echo ?? null,
        pusher: conn?.pusher ?? null,
        reconnect,
        getDiagnostics,
    };
}