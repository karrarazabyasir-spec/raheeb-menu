import { eventBus } from "@/lib/store";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        try {
          const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        } catch (err) {
          // Stream might be closed
        }
      };

      // Initial ping
      sendEvent("connected", { time: new Date().toISOString() });

      const onNewOrder = (order: unknown) => sendEvent("new_order", order);
      const onStatusChange = (order: unknown) => sendEvent("order_status_changed", order);
      const onWaiterCall = (data: unknown) => sendEvent("waiter_called", data);
      const onWaiterDismiss = (data: unknown) => sendEvent("waiter_dismissed", data);
      const onTableUpdate = (data: unknown) => sendEvent("table_updated", data);
      const onMenuUpdate = () => sendEvent("menu_updated", { time: Date.now() });

      eventBus.on("new_order", onNewOrder);
      eventBus.on("order_status_changed", onStatusChange);
      eventBus.on("waiter_called", onWaiterCall);
      eventBus.on("waiter_dismissed", onWaiterDismiss);
      eventBus.on("table_updated", onTableUpdate);
      eventBus.on("menu_updated", onMenuUpdate);

      // Keep-alive heartbeat every 20 seconds
      const interval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(interval);
        }
      }, 20000);

      // Cleanup when connection closes
      const cleanUp = () => {
        clearInterval(interval);
        eventBus.off("new_order", onNewOrder);
        eventBus.off("order_status_changed", onStatusChange);
        eventBus.off("waiter_called", onWaiterCall);
        eventBus.off("waiter_dismissed", onWaiterDismiss);
        eventBus.off("table_updated", onTableUpdate);
        eventBus.off("menu_updated", onMenuUpdate);
      };

      // We handle cleanup when the stream is cancelled
      return cleanUp;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
