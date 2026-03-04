import type { Server as HttpServer } from "node:http";
import { createServer } from "node:http";
import type { Application } from "express";
import { Server } from "socket.io";

export function getOrCreateHttpServer(hot: ImportMeta["hot"]): HttpServer {
  return (hot?.data.httpServer as HttpServer | undefined) ?? createServer();
}

/**
 * Swaps the express app listener on the HTTP server.
 * On first boot, clears all listeners (including Socket.IO's upgrade listener).
 * On reloads, only removes the previous express app by reference to leave
 * Socket.IO's listeners intact and avoid MaxListenersExceededWarning.
 */
export function swapExpressApp(hot: ImportMeta["hot"], httpServer: HttpServer, app: Application): void {
  if (hot?.data.expressApp) {
    httpServer.removeListener("request", hot.data.expressApp as Application);
  } else {
    httpServer.removeAllListeners("request");
    httpServer.removeAllListeners("upgrade");
  }
  httpServer.on("request", app);
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
  app: Application,
  onDispose: () => void,
): void {
  hot.data.httpServer = httpServer;
  hot.data.io = io;
  hot.data.expressApp = app;
  hot.dispose(onDispose);
}
