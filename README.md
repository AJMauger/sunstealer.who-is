# Sunstealer who-is

This Electron App reads a text file (for example t-shark output), extracts any IPv4 addresses based on reg-ex pattern match and identifies the who-is entity via an internet registry of numbers look-up.

To start:

**$ npm install**

**$ npm start**

Then, **Menu** - **Open** and browse a text file, for example:

$ cat my-text-file.txt

- Line 1  142.250.72.68
- Line 2  20.103.85.33
- line 3  95.173.136.163

or 

$ traceroute www.bbc.com > my-text-file.txt

c:\> tracert www.cnn.com > my-text-file.txt

or this README.md file...
