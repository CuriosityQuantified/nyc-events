import { getDeviceToken } from "./device-token";

export type InAppNotification = {
  event_guid: string;
  title: string;
  url: string;
  created_at: string;
  read: boolean;
};

function headers(extra: HeadersInit = {}): HeadersInit {
  return { "X-Device-Token": getDeviceToken(), ...extra };
}

export async function fetchNotifications(): Promise<InAppNotification[]> {
  const response = await fetch("/api/profile/notifications", {
    headers: headers(),
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(`Notifications API returned ${response.status}`);
  const body = (await response.json()) as {
    notifications: InAppNotification[];
  };
  return body.notifications;
}

export async function fetchPushStatus(): Promise<{
  enabled: boolean;
  vapidPublicKey: string;
}> {
  const response = await fetch("/api/profile/push-subscription", {
    headers: headers(),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Push API returned ${response.status}`);
  const body = (await response.json()) as {
    enabled: boolean;
    vapid_public_key: string;
  };
  return { enabled: body.enabled, vapidPublicKey: body.vapid_public_key };
}

function applicationServerKey(value: string): Uint8Array<ArrayBuffer> {
  const padded = `${value}${"=".repeat((4 - (value.length % 4)) % 4)}`;
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function enableWebPush(vapidPublicKey: string): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window))
    return false;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;
  const registration = await navigator.serviceWorker.register("/push-sw.js");
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey(vapidPublicKey),
    }));
  const response = await fetch("/api/profile/push-subscription", {
    method: "PUT",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(subscription.toJSON()),
  });
  if (!response.ok) {
    if (!existing) await subscription.unsubscribe();
    throw new Error(`Push API returned ${response.status}`);
  }
  return true;
}

export async function disableWebPush(): Promise<void> {
  if ("serviceWorker" in navigator) {
    const registration =
      await navigator.serviceWorker.getRegistration("/push-sw.js");
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
  }
  const response = await fetch("/api/profile/push-subscription", {
    method: "DELETE",
    headers: headers(),
  });
  if (!response.ok) throw new Error(`Push API returned ${response.status}`);
}
