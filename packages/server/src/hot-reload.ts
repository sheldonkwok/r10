import type { Server as HttpServer } from "node:http";
import { createServer } from "node:http";
import type { Application } from "express";
import { Server } from "socket.io";

export function getOrCreateHttpServer(hot: ImportMeta["hot"]): HttpServer {
  return (hot?.data.httpServer as HttpServer | undefined) ?? createServer();
}

/**
 * Swaps the express app on the HTTP server using a stable handler wrapper.
 * On first boot, registers a single stable "request" listener that delegates
 * to the current app via a shared ref. On hot reloads, only the ref is updated,
 * so the listener stays in the same position relative to Socket.IO's listeners —
 * preventing the double-response bug that occurs when listener order changes.
 */
export function swapExpressApp(hot: ImportMeta["hot"], httpServer: HttpServer, app: Application): void {
  const appRef = hot?.data.appRef as { current: Application } | undefined;
  if (appRef) {
    appRef.current = app;
  } else {
    httpServer.removeAllListeners("request");
    httpServer.removeAllListeners("upgrade");
    const ref = { current: app };
    if (hot) hot.data.appRef = ref;
    httpServer.on("request", (req, res) => ref.current(req, res));
  }
}

// biome-ignore lint/suspicious/noExplicitAny: mirrors socket.io's own EventsMap constraint ({ [event: string]: any })
export function getOrCreateIo<C extends { [event: string]: any }, S extends { [event: string]: any }>(
  hot: ImportMeta["hot"],
  httpServer: HttpServer,
): Server<C, S> {
  return (
    (hot?.data.io as Server<C, S> | undefined) ?? new Server<C, S>(httpServer, { cors: { origin: "*" } })
  );
}

export async function getOrCreateViteServer(
  hot: ImportMeta["hot"],
  create: () => Promise<import("vite").ViteDevServer>,
): Promise<import("vite").ViteDevServer> {
  const existing = hot?.data.viteServer as import("vite").ViteDevServer | undefined;
  if (existing) return existing;
  const server = await create();
  if (hot) hot.data.viteServer = server;
  return server;
}

export function saveHotData(
  hot: NonNullable<ImportMeta["hot"]>,
  httpServer: HttpServer,
  io: Server,
  onDispose: () => void,
): void {
  hot.data.httpServer = httpServer;
  hot.data.io = io;
  hot.dispose(onDispose);
}
