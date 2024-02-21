import { app, BrowserWindow, Display, Menu, MenuItem, ipcMain, dialog, nativeTheme, screen, BrowserView } from 'electron';
import * as FS from "fs";
import * as Path from "path";
import { eSEVERITY, Event } from "./event";
import { Axios } from "./iaxios"
import { Configuration } from "./configuration"
import { Logger } from "./logger"
import { WebPreferences } from 'electron/main';

// ajm: https://www.arin.net/resources/registry/whois/rdap/#rdap-urls

export const platform_darwin: boolean = (process.platform === "darwin");
export const platform_linux: boolean = (process.platform === "linux");
export const platform_win32: boolean = (process.platform === "win32");

export async function sleep(ms: number): Promise<number> {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

process.on("uncaughtException", (e: Error): void => {
  if (!_logger) {
    console.log(`Event: uncaughtException ${e}`);
  } else {
    _logger.LogException(e);
  }
});

nativeTheme.themeSource = "dark";

export interface IHTTPS {
  Delete(uri: string, c: any, h: any): Promise<any>;
  Get(uri: string, c: any, h: any): Promise<any>;
  Post(uri: string, b: any, c: any, h: any): Promise<any>;
  Put(uri: string, b: any, c: any, h: any): Promise<any>;
}

const application: string = "who-is";

const folder = Path.join(Path.join(app.getPath("appData"), `./Adam Mauger/Sunstealer.${application}`));
if (!FS.existsSync(folder)) {
  FS.mkdirSync(folder, { recursive: true });
}

app.setPath("userData", folder);

export const _configuration: Configuration = new Configuration(folder);
export const _https: IHTTPS = new Axios();
export const _logger = new Logger("logs");
export let _view: BrowserView = null;
export let _winMain: BrowserWindow = null;

const _ips: Map<string, any> = new Map<string, any>();

let installer: boolean = false;
if (require("electron-squirrel-startup")) { // eslint-disable-line global-require
  installer = true;
  app.quit();
} else {
  if (!app.requestSingleInstanceLock()) {
    if (!installer) {
      app.quit();
    }
  }

  app.on("second-instance", (event: Electron.Event, argv: string[], cwd: string) => {
    try {
      _logger.LogInformation(`Event: second-instance argv: ${argv} cwd: ${cwd} installer: ${installer}`);
      _winMain.show();
    } catch (e) {
      _logger.LogException(e);
    }
  });
}

// ajm: -------------------------------------------------------------------------------------------
function CompareRDAP(a: any, b: any): number {
  try {
    const ca: string = (a.rdap.name || "unknown").toUpperCase();
    const cb: string = (b.rdap.name || "unknown").toUpperCase();
    if (ca > cb) {
      return 1;
    } else if (ca < cb) {
      return -1;
    }
  } catch (e) {
    _logger.LogException(e);
  }
  return 0;
}

// ajm: -------------------------------------------------------------------------------------------
function CreateMenu(): Menu {
  try {
    const advanced: Menu = new Menu();
    advanced.append(new MenuItem({
      label: "Debug",
      click(menuItem: MenuItem, browserWindow: BrowserWindow, event: Electron.KeyboardEvent): void {
        _winMain.webContents.send("debug");
        _logger.LogDebug("_logger.ctor() - debug test");
        _logger.LogInformation("<div>Logger - information test.<br /><br /></div><button>Information</button>", "Information");
        _logger.LogWarning(`Logger - warning test<br />No action necessaery unless recurring.<br /><br /></div><button class="button-warning">Warning !</button>`);
        _logger.LogError(`Logger - error test<br /><br /></div><button class="button-error">Error !</button>`);
        _logger.LogException(new Error("Logger - exception test"));
      },
    }));
    if (_configuration.configuration.debug !== undefined) {
      advanced.append(new MenuItem({
        label: "Developer Tools",
        click(menuItem: MenuItem, browserWindow: BrowserWindow, event: Electron.KeyboardEvent): void {
          browserWindow.webContents.openDevTools();
          browserWindow.webContents.send("open-dev-tools");
        },
      }));
      advanced.append(new MenuItem({
        label: "Reload",
        click(menuItem: MenuItem, browserWindow: BrowserWindow, event: Electron.KeyboardEvent): void {
          browserWindow.webContents.reload();
        },
      }));
    }

    const help: Menu = new Menu();
    help.append(new MenuItem({
      label: "About",
      click(menuItem: MenuItem, browserWindow: BrowserWindow, event: Electron.KeyboardEvent): void {
        browserWindow.webContents.send("dialog-about", app.getVersion());
      },
    }));

    help.append(new MenuItem({
      label: "Win32 help",
      click(menuItem: MenuItem, browserWindow: BrowserWindow, event: Electron.KeyboardEvent): void {
        browserWindow.webContents.send("dialog-win32", app.getVersion());
      },
    }));

    let options: MenuItem[] = [
      new MenuItem({
        label: "Advanced",
        submenu: advanced,
      }),
      new MenuItem({
        label: "Help",
        submenu: help,
      }),
      new MenuItem({
        type: "separator",
      }),
      new MenuItem({
        label: "Configuration",
        click(menuItem: MenuItem, browserWindow: BrowserWindow, event: Electron.KeyboardEvent): void {
          browserWindow.webContents.send("dialog-configuration", _configuration.configuration);
        },
      }),
      new MenuItem({
        label: "Log",
        click(menuItem: MenuItem, browserWindow: BrowserWindow, event: Electron.KeyboardEvent): void {
          browserWindow.webContents.send("dialog-log", _logger.eventsInMemory);
        },
      }),
      new MenuItem({
        label: "Open File",
        async click(menuItem: MenuItem, browserWindow: BrowserWindow, event: Electron.KeyboardEvent): Promise<void> {
          try {
            dialog.showOpenDialog(_winMain, null).then(async (odrv: Electron.OpenDialogReturnValue) => {
              if (odrv?.filePaths?.length === 0) {
                return;
              }
              _logger.LogDebug(`File: ${odrv?.filePaths[0]}`);
              await ProcessFile(1, 1, odrv.filePaths[0]);
              const array: any[] = Array.from(_ips.values());
              array.sort(CompareRDAP);
              _winMain.webContents.send("render", array);
            });  
          } catch(e) {
            _logger.LogException(e);
          }
          return Promise.resolve();
        }
      }),
      new MenuItem({
        label: "Open Folder",
        async click(menuItem: MenuItem, browserWindow: BrowserWindow, event: Electron.KeyboardEvent): Promise<void> {
          try {
            dialog.showOpenDialog(_winMain, { properties: ["openDirectory"] }).then(async (odrv: Electron.OpenDialogReturnValue) => {
              if (odrv?.filePaths?.length === 0) {
                return;
              }
              _logger.LogDebug(`Folder: ${odrv?.filePaths[0]}`);
              const files: string[] = FS.readdirSync(odrv?.filePaths[0]).filter(uri => uri.startsWith(_configuration.configuration.filename_prefix));
              if (files.length===0) {
                _logger.LogWarning(`No files match "${_configuration.configuration.filename_prefix}"`)
                return;
              }
              let i: number = 1;
              for (const f of files) {
                _logger.LogDebug(`File: ${odrv.filePaths[0]}/${f}`);
                await ProcessFile(i, files.length, `${odrv.filePaths[0]}/${f}`);
                i++;
              }
              const array: any[] = Array.from(_ips.values());
              array.sort(CompareRDAP);
              _winMain.webContents.send("render", array);
            });  
          } catch(e) {
            _logger.LogException(e);
          }
          return Promise.resolve();
        }
      }),
      new MenuItem({
        type: "separator",
      }),
      new MenuItem({
        label: "Exit",
        click(menuItem: MenuItem, browserWindow: BrowserWindow, event: Electron.KeyboardEvent): void {
          browserWindow.close();
        },
      }),
    ];
    const menu: Menu = new Menu();
    for (const o of options) {
      menu.append(o);
    }
    return menu;
  } catch (e) {
    console.log(`EXCEPTION: ${e}`);
  }
}

// ajm: -------------------------------------------------------------------------------------------
async function ProcessFile(index: number, max: number, uri: string): Promise<void> {
  try {
    _winMain.webContents.send("progress-start");
    await new Promise<void>((resolve, reject) => {
      FS.readFile(uri, "utf-8", async (e, data: string) => {
        if (e) {
          _logger.LogError(`readFile(${uri}) error ${e.message}`);
          return [];
        }
        let lines: string[] = data.split(/\r\n|\n/);
        for(let i = 0; i < lines.length; i++) {
          const ips: RegExpMatchArray = lines[i].match(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g);
          if (ips !== null) {
            for (const ip of ips) {
              const octets: string[] = ip.split(".");
              let b = true;
              for (const octet of octets) {
                const j: number = parseInt(octet, 10);
                if (j < 0 || j > 255) {
                  b = false;
                  break;
                }
              }
              if (b && !ip.startsWith(_configuration.configuration.home_interface)) {
                const j: any = _ips.get(ip);
                if (j === undefined) {
                  _winMain.webContents.send("progress-update", { uri, index, max, progress: ((100 * i) / lines.length).toFixed(0) , ip });
                  let rdap: any = null;
                  try {
                    while(!rdap) {
                      rdap = await GetRDAP(ip).then((rdap: any) => {
                        return rdap;
                      }).catch( async (e: any) => {
                        _logger.LogError(`Ipv4: ${ip} ${e.message}; ${e.name}; ${e.stack}`);
                        await sleep(10000);
                        return null;
                      });
                    }
                  } catch(e: any) {
                    _logger.LogError(`Ipv4: ${ip} ${e.message}; ${e.name}; ${e.stack}`);
                    await sleep(10000);                             
                  }
                  if (!rdap.name) {
                    _logger.LogWarning(`${ip} !rdap.name.`);
                  }
                  const l: any = {
                    count: 1,
                    ip, 
                    packets: new Array<string>(),
                    rdap,
                  }
                  l.packets.push(lines[i]);
                  _ips.set(ip, l);
                } else {
                  j.count++;
                  if (j.packets.length<(_configuration.configuration.packets || 100)) {
                    j.packets.push(lines[i]);
                  }
                }

              }
            }
          }
        }
        return resolve();  
      });
    });
    console.log("_winMain.webContents.send(render");
  } catch(e) {
    _logger.LogException(e);
  }
}


// ajm: -------------------------------------------------------------------------------------------
function CreateWindow() {
  try {
    const displays: Display[] = screen.getAllDisplays();
    const display: Display = displays[displays.length - 1];

    _winMain = new BrowserWindow({
      frame: false,
      height: display.workArea.height,
      webPreferences: {
        devTools: (_configuration.configuration.debug !== undefined),
        preload: Path.join(__dirname, "./client.js"),
      },
      width: display.workArea.width,
      x: display.bounds.x,
      y: display.bounds.y,
    });

    _winMain.loadFile(Path.join(__dirname, './index.html'));
    _winMain.webContents.on("did-finish-load", (e: Electron.Event) => {
      try {
        const versions = { chrome: process.versions.chrome, electron: process.versions.electron, node: process.versions.node };
        _winMain.webContents.send("configuration", _configuration.configuration, versions);
        _logger.LogDebug("Event: did-finish-load _WinMain exit.");
        _winMain.show();
      } catch (e) {
        _logger.LogException(e);
      }
    });

    _winMain.webContents.on("context-menu", (e: Electron.Event, params: Electron.PopupOptions) => {
      const menu: Menu = CreateMenu();
      menu.popup(params);
    });

    _winMain.webContents.on("will-attach-webview", (e: Electron.Event, wp: WebPreferences, params: any) => {
      _logger.LogError(`Security Violation: report: ${params.src} immediately.  This incident has been logged.`);
      e.preventDefault();
    });

    _winMain.webContents.setWindowOpenHandler((details: Electron.HandlerDetails) => {
      _logger.LogError(`Security Violation: report: ${details.url} immediately.  This incident has been logged.`);
      return { action: "deny" }
    });
  } catch (e) {
    _logger.LogException(e);
  }
};

// ajm: -------------------------------------------------------------------------------------------
export function OnNotification(s: eSEVERITY, m: string): void {
  try {
    _winMain.webContents.send("notification", _logger.notifications.length, m, s);
  } catch (e) {
    _logger.LogException(e);
  }
}

// ajm: -------------------------------------------------------------------------------------------
export async function GetRDAP(ip: string): Promise<any> {
  try {
    return await _https.Get(`${_configuration.configuration.uri_ip}${ip}`, undefined, undefined).then(async (rdap: any) => {
      if (rdap.status === -1) {
        await sleep(1000);
      }
      return rdap.data;
    }).catch((e) => {
      _logger.LogException(e);
    })
  } catch (e) {
    _logger.LogException(e);
  }
  return Promise.reject();
}

// ajm: app ---------------------------------------------------------------------------------------
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    CreateWindow();
  }
});

app.on("ready", () => {
  if (!installer) {
    CreateWindow();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ajm: -------------------------------------------------------------------------------------------
ipcMain.on("dialog-notifications", (e: Electron.IpcMainEvent) => {
  try {
    _winMain.webContents.send("dialog-notifications", _logger.notifications);
  } catch (e) {
    _logger.LogException(e);
  }
});

// ajm: -------------------------------------------------------------------------------------------
ipcMain.on("kiosk", (e: Electron.IpcMainEvent) => {
  try {
    // ajm: _logger.LogDebug(`Event: kiosk`);
    _winMain.setKiosk(!_winMain.isKiosk());
  } catch (e) {
    _logger.LogException(e);
  }
});

// ajm: -------------------------------------------------------------------------------------------
ipcMain.on("menu", () => {
  try {
    // ajm: _logger.LogDebug(`Event: menu`);
    const menu: Menu = CreateMenu();
    menu.popup();
  } catch (e) {
    _logger.LogException(e);
  }
});

// ajm: -------------------------------------------------------------------------------------------
ipcMain.on("notification-Delete", (e: Electron.IpcMainEvent, id: string) => {
  try {
    let i: number = 0;
    for (const n of _logger.notifications) {
      if (n.id === id) {
        _logger.notifications.splice(i, 1);
        // ajm: _logger.LogInformation(`Event: notification-Delete id: ${id}`);
        break;
      }
      i++;
    }
  } catch (e) {
    _logger.LogException(e);
  }
});

// ajm: -------------------------------------------------------------------------------------------
ipcMain.on("notifications-Delete", (e: Electron.IpcMainEvent) => {
  try {
    // ajm: _logger.LogInformation(`Event: notifications-Delete`);
    _logger.notifications = [];
  } catch (e) {
    _logger.LogException(e);
  }
});

// ajm: -------------------------------------------------------------------------------------------
ipcMain.on("update-configuration", (e: Electron.IpcMainEvent, data: any) => {
  try {
    _configuration.configuration = data;
    _logger.LogInformation(`Event: update-configuration configuration: ${JSON.stringify(data, null, 2)}`);
    _configuration.Save();
  } catch (e) {
    _logger.LogException(e);
  }
});
