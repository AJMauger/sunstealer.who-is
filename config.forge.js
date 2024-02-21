const fs = require ("fs");

const platformDarwin = (process.platform === "darwin");
const platformLinux = (process.platform === "linux");
const platformWin32 = (process.platform === "win32");

const command = process.argv.find(arg => arg.startsWith('--command='));
console.log(`command: ${command}`);

module.exports = {
  packagerConfig: {
    asar: true,
    ignore: [
      ".vscode",
      "certs",
      "^/src",
      "test",
      "^.*\\.(code-workspace|map|zip)$",
      "config.forge.js",
      "package-lock.json",
      "tsconfig.json"
    ]
  },
  osxSign: {
    "hardened-runtime": true,
    identity: "",
    entitlements: "./certs/entitlements.plist",
    "entitlements-inherit": "./certs/entitlements.plist",
    signatureFlags: "library"
  },
  osxNotarize: {
      appleId: "",
      appleIdPassword: ""
  },
  electronRebuildConfig: {

  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        loadingGif: "./src/images/splash.jpg"
      }
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        background: "./src/images/splash.jpg",
				format: "ULFO",
      }
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {}
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        "darwin",
        "linux"
      ]
    }
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-nucleus",
      config: {
        host: "https://fedora-core36-01.ajm.net:8443",
        appId: "1",
        channelId: "",
        token: ""
      }
    }
  ],
  plugins: [

  ],
  hooks: {
    generateAssets: async () => {
      console.log("\ngenerateAssets");
      if (command !== "--command=start") {
        const minify = await import("minify");

        let files = fs.readdirSync("./dist");
        for (f of files) {
          const uri = `./dist/${f}`;
          if (f.endsWith(".html") /* || f.endsWith(".js")*/) {
            minify.minify(uri, {}).then(data => {
              console.log(`minify: ${uri}`);
              fs.writeFileSync(`${uri}`, data);
            }).catch(e => {
              console.log(`EXCEPTION: minify ${uri} ${e} ${JSON.stringify(e)}`);
            });
          }
        }
        files = fs.readdirSync("./dist/css");
        for (f of files) {
          const uri = `./dist/css/${f}`;
          if (f.endsWith(".css")) {
            minify.minify(uri, {}).then(data => {
              console.log(`minify: ${uri}`);
              fs.writeFileSync(`${uri}`, data);
            }).catch(e => {
              console.log(`EXCEPTION: minify ${uri} ${e} ${JSON.stringify(e)}`);
            });
          }
        }
      }
    },
    postStart: async () => {
      console.log("\npostStart");
    },
    prePackage: async () => {
      console.log("\nprePackage");
    },
    packageAfterCopy: async () => {
      console.log("\npackageAfterCopy");
    },
    packageAfterExtract: async () => {
      console.log("\npackageAfterExtract");
    },
    postPackage: async () => {
      console.log("\npostPackage");
    },
    preMake: async () => {
      console.log("\npremake");
    },
    postMake: async () => {
      console.log("\npostMake");
    },
    readPackageJson: async () => {
      console.log("\nreadPackageJson");
    },
    buildIdentifier: "Adam"
  }
}