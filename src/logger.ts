import { AxiosError, AxiosResponse } from "axios";
import { app } from "electron";
import { eSEVERITY, Event } from "./event";
import { _configuration, _logger, _winMain, OnNotification } from "./index";

import * as Fs from "fs";
import * as Path from "path";

export class Logger {

  public severity = ["Db", "In", "Wn", "Er", "Ex"];
  public count: number = 0;
  public eventsInMemory: Event[] = new Array<Event>();
  public eventsFile: string[] = new Array<string>();
  public file: number = -1;
  public notifications: Array<Event> = new Array<Event>();
  
  // ajm: -----------------------------------------------------------------------------------------
  public constructor(public folder: string) {
    this.folder = Path.join(app.getPath("userData"), this.folder);
    if (!Fs.existsSync(this.folder)) {
      Fs.mkdirSync(this.folder);
    }
    this.Open();
  }

  // ajm: -----------------------------------------------------------------------------------------
  public Close(exit: boolean = false): void {
    try {
      this.count = 0;
      if (exit) {
        this.LogInformation("_logger.Close() on exit");
      } else {
        this.LogInformation("_logger.Close()");
      }

      Fs.closeSync(this.file);
      this.file = -1;

      const date: Date = new Date();
      const uri: string = `${this.folder}/Sunstealer_${this.GetDateStringFile(date)}.log`;

      Fs.renameSync(`${this.folder}/Sunstealer.log`, uri);
    } catch (e) {
      console.log(`EXCEPTION: _logger.Close() ${e}`);
    }
  }

  // ajm: -----------------------------------------------------------------------------------------
  public GetDateStringFile(date: Date): string {
    const D: string = String(date.getDate()).padStart(2, "0");
    const M: string = String(date.getMonth() + 1).padStart(2, "0");
    const h: string = String(date.getHours()).padStart(2, "0");
    const m: string = String(date.getMinutes()).padStart(2, "0");
    const s: string = String(date.getSeconds()).padStart(2, "0");

    return `${date.getFullYear()}-${M}-${D}T${h}-${m}-${s}`;
  }

  // ajm: -----------------------------------------------------------------------------------------
  public GetDateString(date: Date): string {
    const D: string = String(date.getDate()).padStart(2, "0");
    const M: string = String(date.getMonth() + 1).padStart(2, "0");
    const h: string = String(date.getHours()).padStart(2, "0");
    const m: string = String(date.getMinutes()).padStart(2, "0");
    const s: string = String(date.getSeconds()).padStart(2, "0");

    return `${date.getFullYear()}-${M}-${D}T${h}:${m}:${s}.0+00:00`;
  }

  // ajm: -----------------------------------------------------------------------------------------
  public GetResponse(response: AxiosResponse) {
    return `_configuration.() response ${response.status}; ${response.statusText}; ${JSON.stringify(response.data)}`;
  }

  // ajm: -----------------------------------------------------------------------------------------
  public LogAxiosError(e: AxiosError): void {
    const event: string = `Axios: ${e.config.method} ${e.config.url}; ${e.message}`;
    this.Log(eSEVERITY.eEXCEPTION, event, e.message);
    this.LogToFile(eSEVERITY.eEXCEPTION, JSON.stringify(e.config, null, 2));
  }

  // ajm: -----------------------------------------------------------------------------------------
  public LogDebug(event: string, notification: string = null): void {
    this.Log(eSEVERITY.eDEBUG, event, notification);
  }

  // ajm: -----------------------------------------------------------------------------------------
  public LogInformation(event: string, notification: string = null): void {
    this.Log(eSEVERITY.eINFORMATION, event, notification);
  }

  // ajm: -----------------------------------------------------------------------------------------
  public LogWarning(event: string, notification: string = null): void {
    if(notification === null) {
      notification = "Warning";
    }
    this.Log(eSEVERITY.eWARNING, event, notification);
  }

  // ajm: -----------------------------------------------------------------------------------------
  public LogError(event: string, notification: string = null): void {
    if(notification === null) {
      notification = "Error";
    }
    this.Log(eSEVERITY.eERROR, event, notification);
  }

  // ajm: -----------------------------------------------------------------------------------------
  public LogException(e: Error, notification: string = null): void {
    if (e) {
      if(notification === null) {
        notification = "Exception";
      }
      const event: string = `${e.message}; ${e.name}; ${e.stack}`;
      this.Log(eSEVERITY.eEXCEPTION, event, notification);
    }
  }

  // ajm: -----------------------------------------------------------------------------------------
  public Log(severity: eSEVERITY, message: string, notification: string): void {
    const e: Event = new Event(severity, message, notification);

    if(notification !== null) {
      if(this.notifications.length > 100) {
        this.notifications.shift();
      }
      this.notifications.push(e);
      OnNotification(severity, message);
    }

    const s: string = `${e.dt} [${this.severity[e.severity]}] ${e.message}`;
    console.log(s);

    Fs.writeSync(this.file, `\r\n${s}`);
    this.count++;
    if (this.count > _configuration.configuration.log.file_size) {
      this.Close();
      this.Open();
    }

    if (severity >= _configuration.configuration.log.level) {
      if (this.eventsInMemory.length > _configuration.configuration.log.memory_size) {
        this.eventsInMemory.shift();
      }
      this.eventsInMemory.push(e);
    }
  }

  // ajm: -----------------------------------------------------------------------------------------
  public LogToFile(severity: eSEVERITY, message: string): void {
    if (this.file !== -1) {
      const datetime: Date = new Date();
      const D: string = String(datetime.getDate()).padStart(2, "0");
      const M: string = String(datetime.getMonth() + 1).padStart(2, "0");
      const h: string = String(datetime.getHours()).padStart(2, "0");
      const m: string = String(datetime.getMinutes()).padStart(2, "0");
      const s: string = String(datetime.getSeconds()).padStart(2, "0");
      const dateTime: string = `${datetime.getFullYear()}-${M}-${D}T${h}:${m}:${s}`;
      const log: string = `${dateTime} [${this.severity[severity]}] ${message}`;
      this.eventsFile.push(log);
    }
  }

  // ajm: -----------------------------------------------------------------------------------------
  public Open(): void {
    try {
      this.file = Fs.openSync(`${this.folder}/Sunstealer.log`, "a");
      this.LogInformation("Logger.Open()");
    } catch (e) {
      this.LogException(e);
    }
  }
}
