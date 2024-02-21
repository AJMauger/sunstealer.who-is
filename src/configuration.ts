import Crypto from "crypto";
import * as Fs from "fs";
import * as Path from "path";
import { _logger } from "./index";

// ajm: -------------------------------------------------------------------------------------------
export class Configuration {
  public configuration: any = null;
  public file: string = null;

  constructor(public folder: string) {
    try {
      this.file= Path.join(folder, "./configuration.json");
      if(!Fs.existsSync(this.file)) {
        Fs.copyFileSync(Path.join(__dirname, "./configuration.json"), this.file);
      }
      const buffer: Buffer = Fs.readFileSync(this.file);
      try {
        this.configuration = JSON.parse(buffer.toString());
      } catch(e) {
        Fs.copyFileSync(Path.join(__dirname, "./configuration.json"), this.file);
        const buffer: Buffer = Fs.readFileSync(this.file);
        this.configuration = JSON.parse(buffer.toString());
        console.log("Configuration reset");  
      }
    }
    catch(e) {
      console.log(`EXCEPTION: ${e.message} ${e.stack}`);
    }
  }

  // ajm: ---------------------------------------------------------------------------------------
  public GetUuid(): string {
    return Crypto.randomBytes(16).toString("hex");
  }

  // ajm: ---------------------------------------------------------------------------------------
  public Iterable(variable: any) {
    return variable !== null && Symbol.iterator in Object(variable);
  }
  // ajm: ---------------------------------------------------------------------------------------
  public Save(): void {
    try {
      _logger.LogDebug("Configuration.Save() ...");
      const n: number = Fs.openSync(this.file, "w");
      const i: number = Fs.writeSync(n, JSON.stringify(this.configuration));
      Fs.closeSync(n);
      _logger.LogDebug(`Configuration saved ${i} bytes wrtten.`);
    } catch (e) {
      _logger.LogException(e);
    }
  }
}
