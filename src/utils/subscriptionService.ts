import { useEffect, useRef } from "react";

import { useEcho } from "./websocketConfig";

type EventConfig = Record<
    string,
    {
        channel: string;
        event: string;
        callback?: (payload: any) => void;
        debounceMs?: number;
    }
>;

export function useSubscriptionService(events: EventConfig) {
    const { echo, connected } = useEcho();
    const eventsRef = useRef<EventConfig>(events);
    eventsRef.current = events;

    const signature = Object.entries(events)
        .map(([key, { channel, event, debounceMs }]) => `${key}|${channel}|${event}|${debounceMs ?? 0}`)
        .join(",");

    useEffect(() => {
        if (!connected || !echo) return;

        const cleanups: (() => void)[] = [];
        const seen = new Set<string>();

        Object.entries(eventsRef.current).forEach(([key, { channel, event, debounceMs }]) => {
            const subKey = `${channel}:${event}`;
            if (seen.has(subKey)) return;
            seen.add(subKey);

            const ch = echo.channel(channel);
            const eventName = event.startsWith(".") ? event : `.${event}`;

            let timer: ReturnType<typeof setTimeout> | null = null;
            let lastPayload: any;

            const wrappedCallback = (payload: any) => {
                if (!debounceMs) {
                    eventsRef.current[key]?.callback?.(payload);
                    return;
                }
                lastPayload = payload;
                if (timer) clearTimeout(timer);
                timer = setTimeout(() => {
                    timer = null;
                    eventsRef.current[key]?.callback?.(lastPayload);
                }, debounceMs);
            };

            ch.listen(eventName, wrappedCallback);

            cleanups.push(() => {
                if (timer) clearTimeout(timer);
                ch.stopListening(eventName, wrappedCallback);
            });
        });

        return () => cleanups.forEach((fn) => fn());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [connected, echo, signature]);
}