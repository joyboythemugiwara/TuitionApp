import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app } from "./firebase";
import { toast } from "sonner";

export const requestFCMToken = async () => {
  try {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const messaging = getMessaging(app);
      
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const currentToken = await getToken(messaging, {
          // vapidKey is optional but recommended. We will omit it so Firebase uses the default project settings or the user can add it later.
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        
        if (currentToken) {
          return currentToken;
        } else {
          console.log("No registration token available. Request permission to generate one.");
        }
      } else {
        console.log("Notification permission denied");
      }
    }
  } catch (error) {
    console.error("An error occurred while retrieving token. ", error);
  }
  return null;
};

export const onMessageListener = () => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    }
  });
};
