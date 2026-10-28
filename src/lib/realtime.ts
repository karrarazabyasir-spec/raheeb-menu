import { supabase } from "./supabase";

const CHANNEL_NAME = "raheeb-live";

// Broadcast an event to all connected clients (Customer, Cashier, Kitchen, Admin)
export async function broadcastLiveEvent(event: string, payload: any) {
  try {
    const channel = supabase.channel(CHANNEL_NAME);
    await channel.send({
      type: "broadcast",
      event,
      payload,
    });
  } catch (err) {
    console.warn("Failed to broadcast live event:", event, err);
  }
}

// Subscribe to all live events across the platform
export function subscribeToLiveEvents(
  onEvent: (event: string, payload: any) => void
) {
  const channel = supabase.channel(CHANNEL_NAME);

  channel
    .on("broadcast", { event: "*" }, (data) => {
      if (data.event && onEvent) {
        onEvent(data.event, data.payload);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
