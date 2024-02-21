import { contextBridge, ipcRenderer } from "electron";

console.log("clientUntrusted.js");

// ajm: electron
contextBridge.exposeInMainWorld(
  "api", {
    send: (channel: string, data: any) => {
      ipcRenderer.send(channel, data);
    },
    receive: (channel: string, callback: any) => {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  }
);

// ajm: events
document.addEventListener("keydown", (e) => {
  console.log(`Event: keydown: ${e.key}`);
  if (e.ctrlKey) {
    if (e.key === "e") {
      ipcRenderer.sendToHost("edit");
    }
    else if (e.key === "k") {
      ipcRenderer.sendToHost("edit");
    }
  }
});

window.addEventListener("focus", (e) => {
  console.log("Event: focus");
  ipcRenderer.sendToHost("focus");
});
