import { contextBridge, ipcRenderer } from "electron";

console.log("client.js");

const _alerts: HTMLElement[] = new Array<HTMLElement>();

let _configuration: any = null;
let _inotifications: number = 0;

let _dialog_about: HTMLDialogElement = null;
let _dialog_configuration: HTMLDialogElement = null;
let _dialog_identity: HTMLDialogElement = null;
let _dialog_log: HTMLDialogElement = null;
let _dialog_notifications: HTMLDialogElement = null;
let _dialog_win32: HTMLDialogElement = null;

let _file: HTMLElement = null;
let _icon_notifications: HTMLElement = null;
let _ip: HTMLElement = null;
let _left: HTMLElement = null;
let _log: HTMLElement = null;
let _list: HTMLElement = null;
let _notifications: HTMLElement = null;
let _packets: HTMLElement = null;
let _progress: HTMLProgressElement = null;
let _rdap: HTMLElement = null;
let _right: HTMLElement = null;
let _status: HTMLElement = null;
let _text_configuration: HTMLTextAreaElement = null;

let _selected: HTMLElement = null;

// ajm: electron
contextBridge.exposeInMainWorld(
  "index", {
    send: (channel: string, data: any) => {
      ipcRenderer.send(channel, data);
    },
    
    receive: (channel: string, callback: any) => {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    },
      
    DeleteNotifications(): void {
      _notifications.innerHTML = "";
      _icon_notifications.classList.remove("icon-notifications-new");
      _icon_notifications.classList.add("icon-notifications-none");
      ipcRenderer.send("notifications-Delete");
    },
  
    Configuration(): void {
      ipcRenderer.send("update-configuration", JSON.parse(_text_configuration.value));
      (_dialog_configuration as any).close();
    },
  
    Identity() {
      (_dialog_identity as any).showModal();
    },
  
    Kiosk(): void {
      ipcRenderer.send("kiosk");
    },
  
    Menu(): void {
      ipcRenderer.send("menu");
    },
  
    Notifications(): void {
      ipcRenderer.send("dialog-notifications");
    },
  
    Save(): void {
      const data = {
        background: "",
        components: new Array<any>(),
      }
      ipcRenderer.send("save", data);
    },
  }
);

// ajm: events
document.addEventListener("keydown", (e) => {
  console.log(`Event: keydown: ${e.key}`);
  if (e.ctrlKey) {
    // ajm: ...
  }
});

// ajm: -------------------------------------------------------------------------------------------
class Alert {
  constructor(s: number, m: string) {
    let i: string = null;
    switch (s) {
      case 0:
      case 1:
        i = "info";
        break;
      case 2:
        i = "warn";
        break;
      case 3:
        i = "error";
        break;
      case 4:
        i = "exception";
        break;
    }
    while (_alerts.length > 3) {
      const n: HTMLElement = _alerts.shift();
      document.body.removeChild(n);
    }
    const n: HTMLElement = document.createElement("div");
    _alerts.push(n);
    n.style.alignItems = "center";
    n.style.backgroundColor = "whitesmoke";
    n.style.backgroundImage = `url('./images/${i}.png')`;
    n.style.backgroundRepeat = "no-repeat";
    n.style.color = "black";
    n.style.display = "flex";
    n.style.fontWeight = "bold";
    n.style.height = "50px";
    n.style.paddingLeft = "70px";
    n.style.position = "absolute";
    n.style.right = "5px";
    n.style.top = `${55 * _alerts.length}px`;
    n.style.width = "200px"
    n.style.zIndex = "100";
    n.innerText = m;
    document.body.appendChild(n);
    if (_alerts.length === 1) {
      this.Left();
    }
  }
  
  private Left() {
    setTimeout(() => {
      const n: HTMLElement = _alerts.shift();
      let right = 5;
      const interval: any = setInterval(() => {
        if (right < -405) {
          document.body.removeChild(n);
          clearInterval(interval);
        } else {
          right -= 20;
          n.style.right = `${right}px`;
        }
      }, 2);
      if (_alerts.length !== 0) {
        setTimeout(() => {
          let i: number = 1;
          for (let n of _alerts) {
            this.Up(n, i);
            i++;
          }
        }, 200);
      }
    }, 2000);
  }
  
  private Up(n: HTMLElement, i: number) {
    let top_end: number = 55 * i;
    let top: number = 55 * i + 55;
    const interval: any = setInterval(() => {
      if (top === top_end) {
        clearInterval(interval);
      } else {
        top -= 5;
        n.style.top = `${top}px`;
      }
    }, 2);
    if (i === _alerts.length) {
      setTimeout(() => {
        this.Left();
      }, 200);
    }
  }
}

const DeleteNotification = (): void => {
  (<HTMLElement>event.target).parentElement.parentElement.style.display = "none";
  ipcRenderer.send("notification-Delete", (<HTMLElement>event.target).parentElement.parentElement.id);
  _inotifications--;
  if (_inotifications === 0) {
    _icon_notifications.classList.remove("icon-notifications-new");
    _icon_notifications.classList.add("icon-notifications-none");
  }
}

// ajm: electron
ipcRenderer.on("alert", (e: Electron.Event, alert: any) => {
  new Alert(alert.severity, alert.message);
});

ipcRenderer.on("configuration", (e: Electron.Event, configuration: any, versions: any) => {
  _configuration = configuration;

  if (_dialog_about === null) {
    _dialog_about = document.getElementById("dialog_about") as HTMLDialogElement;
    _dialog_configuration = document.getElementById("dialog_configuration") as HTMLDialogElement;
    _dialog_identity = document.getElementById("dialog_identity") as HTMLDialogElement;
    _dialog_log = document.getElementById("dialog_log") as HTMLDialogElement;
    _dialog_notifications = document.getElementById("dialog_notifications") as HTMLDialogElement;
    _dialog_win32 = document.getElementById("dialog_win32") as HTMLDialogElement;
    _file = document.getElementById("file");
    _icon_notifications = document.getElementById("icon_notifications");
    _left = document.getElementById("left");
    _log = document.getElementById("log");
    _notifications = document.getElementById("notifications");
    _progress = document.getElementById("progress") as HTMLProgressElement;
    _right = document.getElementById("right");
    _status = document.getElementById("status");
    _text_configuration = document.getElementById("configuration") as HTMLTextAreaElement;  
    _ip = document.getElementById("ip");

    document.getElementById("version_chrome").innerText = versions.chrome;
    document.getElementById("version_electron").innerText = versions.electron;
    document.getElementById("version_node").innerText = versions.node;

    _list = document.getElementById("list");
    _packets = document.getElementById("packets");
    _rdap = document.getElementById("rdap");
  }
});

ipcRenderer.on("debug", (e: Electron.Event, data: any) => {
});

ipcRenderer.on("dialog-about", (e: Electron.Event, data: any) => {
  document.getElementById("version").innerText = data;
  (_dialog_about as any).showModal();
});

ipcRenderer.on("dialog-configuration", (e: Electron.Event, data: any) => {
  _text_configuration.innerHTML = JSON.stringify(data, null, 2);
  (_dialog_configuration as any).showModal();
});

ipcRenderer.on("dialog-log", (e: Electron.Event, data: any) => {
  _log.innerHTML = "";
  for (const e of data) {
    let c = "lightgray"
    let s = "un";
    switch (e.severity) {
      case 0: {
        s = "Db";
        break;
      }
      case 1:
        c = "var(--green)";
        s = "In";
      break;
      case 2:
        c = "var(--yellow)";
        s = "Wn";
      break;
      case 3:
        c = "red";
        s = "Er";
      break;
      case 4:
        s = "Ex";
        c = "red";
      break;
    }

    const tr = document.createElement("tr");
    const time = document.createElement("td");
    time.style.verticalAlign = "top";
    time.style.minWidth = "170px";
    time.innerText = e.dt;
    tr.appendChild(time);
    const severity = document.createElement("td");
    severity.style.color = c;
    severity.style.verticalAlign = "top";
    severity.style.minWidth = "70px";
    severity.innerText = `[${s}]`;
    tr.appendChild(severity);
    const message = document.createElement("td");
    message.innerText = e.message;
    tr.appendChild(message);
    _log.appendChild(tr);
  }
  (_dialog_log as any).showModal();  
});

ipcRenderer.on("dialog-notifications", (e, data) => {
  _notifications.innerHTML = "";
  let icon: string = "icon-info";
  for (const ev of data) {
    switch(ev.severity) {
      case 1:
        icon = "icon-info";
      break;
      case 2:
        icon = "icon-warn";
      break;
      case 3:
      case 4:
        icon = "icon-error";
      break;
    }

    const n = document.createElement("div");
    n.id = ev.id;
    n.style.alignItems = "center";
    n.style.background = "var(--color-background-div)";
    n.style.borderRadius = "10px";
    n.style.display = "flex";
    n.style.flexDirection = "row";
    n.style.margin = "10px";
    n.style.padding = "20px";
    n.style.width = "calc(100% - 60px)";
    const ni = document.createElement("div");
    ni.classList.add(icon);
    ni.style.height = "45px";
    ni.style.width = "45px";
    const nm = document.createElement("div");
    nm.style.marginLeft = nm.style.marginRight = "20px";
    nm.style.width = "calc(100% - 10px)";
    nm.innerHTML = ev.message;
    const nta = document.createElement("div");
    nta.style.display = "flex";
    nta.style.flexDirection = "column";
    const nt = document.createElement("div");
    nt.style.height = "50%";
    nt.style.textAlign = "right";
    nt.innerText = ev.t;
    const na = document.createElement("div");
    na.classList.add("active", "icon-delete");
    na.style.backgroundPositionX = "26px";
    na.style.height = "28px";
    na.style.marginTop = "10px";
    na.onclick = () => DeleteNotification();
    n.appendChild(ni);
    n.appendChild(nm);
    nta.appendChild(nt);
    nta.appendChild(na);
    n.appendChild(nta);
    _notifications.appendChild(n);
  }
  (_dialog_notifications as any).showModal();
});

ipcRenderer.on("dialog-win32", (e: Electron.Event, data: any) => {
  (_dialog_win32 as any).showModal();
});

ipcRenderer.on("notification", (e, l, m, s) => {
  _inotifications++;
  _icon_notifications.classList.remove("icon-notifications-none");
  _icon_notifications.classList.add("icon-notifications-new");
  switch(s) {
    case 0:
    break;
    case 1:
      new Alert(1, "Information");
    break;
    case 2:
      new Alert(2, "Warning");
    break;
    case 3:
      new Alert(3, "Error");
    break;
    case 4:
      new Alert(4, "Exception");
    break;
  }
});

ipcRenderer.on("render", (e: Electron.Event, data: any[]) => {
  console.log(`render: ${data.length}`);
  for (const i of data.values()) {
    const count: HTMLElement = document.createElement("td");
    count.style.minWidth = "100px";
    count.innerText = i.count;

    const ip: HTMLElement = document.createElement("td");
    ip.style.minWidth = "150px";
    ip.innerText = i.ip;

    const name: HTMLElement = document.createElement("td");
    name.style.minWidth = "200px";
    
    let n: string = i.rdap.name || "UNDEFINED";
    // ajm: PRIVATE-ADDRESS-ABLK-RFC1918-IANA-RESERVED
    if (n.endsWith("-RFC1918-IANA-RESERVED")) {
      n = `${n.substr(0, 17)} ...`;
    } else if (n.length > 20) {
      n = `${n.substr(0, 20)} ...`;
    }
    name.innerText = n;

    let tr: HTMLElement = document.createElement("tr");
    tr.className="active";
    tr.style.width ="100%";
    tr.style.userSelect = "text";
    tr.appendChild(count);
    tr.appendChild(ip);
    tr.appendChild(name);
    tr.addEventListener("click", (e: MouseEvent) => {
      _packets.innerHTML = "";
      _rdap.innerHTML = "";

      if (_selected) {
        _selected.style.backgroundColor = "var(--color-background-main)";
        _selected.style.color = "whitesmoke";      
        _selected.style.opacity = "0.8";
      }

      _selected = (e.target as HTMLElement).parentElement;
      _selected.style.backgroundColor = "var(--color-background-selected)";
      _selected.style.opacity = "1";

      const pre: HTMLElement = document.createElement("pre");
      pre.style.maxWidth = "calc(100vw - 580px)";
      pre.style.userSelect = "text";
      pre.innerText = JSON.stringify(i.rdap, null, 2);

      _rdap.appendChild(pre);

      for (const packet of i.packets) {
        let div: HTMLElement = document.createElement("div");
        div.style.userSelect = "text";
        div.innerText = packet;
        _packets.appendChild(div);
      }  
    });
    _list.appendChild(tr);
  }
  _status.style.display = "none";
  _left.style.display = "block";
  _right.style.display = "block";
});

ipcRenderer.on("progress-start", (e: Electron.Event) => {
  document.getElementById("world").style.display = "none";
  _left.style.display = "none";
  _right.style.display = "none";
  _progress.innerText = "0%";
  _progress.value = 0;
  _ip.innerText = "";
  _status.style.display = "flex";
});

ipcRenderer.on("progress-update", (e: Electron.Event, data) => {
  console.log(`progress-update: ${data.progress}`);
  _progress.value = data.progress;
  _progress.innerText = `${data.progress}%`;
  _file.innerText=`File ${data.index} of ${data.max}: ${data.uri} `;
  _ip.innerText = `Processing: ${data.ip}`;
});
