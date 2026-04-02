import { SerialPort, PortInfo } from "tauri-plugin-serialplugin-api";

export class TauriSerialPort {
  private port: SerialPort | null = null;
  public path: string;
  private info: PortInfo;
  private unlistenFn: (() => void) | null = null;

  private _readable: ReadableStream<Uint8Array> | null = null;
  private currentController: ReadableStreamDefaultController<Uint8Array> | null =
    null;

  get readable(): ReadableStream<Uint8Array> | null {
    if (!this.port) return null;
    if (!this._readable) {
      this._readable = new ReadableStream<Uint8Array>({
        start: (controller) => {
          this.currentController = controller;
        },
        cancel: () => {
          this.currentController = null;
          this._readable = null;
        },
      });
    }
    return this._readable;
  }

  get writable(): WritableStream<Uint8Array> | null {
    if (!this.port) return null;
    return new WritableStream<Uint8Array>({
      write: async (chunk) => {
        if (this.port) {
          await this.port.writeBinary(chunk);
        }
      },
    });
  }

  constructor(path: string, info: PortInfo) {
    this.path = path;
    this.info = info;
  }

  async open(options: { baudRate: number }) {
    this.port = new SerialPort({ path: this.path, baudRate: options.baudRate });
    await this.port.open();
    await this.port.startListening();

    // isDecode=false to receive raw binary data (Uint8Array)
    this.unlistenFn = await this.port.listen((data: any) => {
      let chunk: Uint8Array;
      if (data instanceof Uint8Array) {
        chunk = data;
      } else if (Array.isArray(data)) {
        chunk = new Uint8Array(data);
      } else {
        chunk = new TextEncoder().encode(String(data));
      }

      if (this.currentController) {
        this.currentController.enqueue(chunk);
      }
    }, false);
  }

  getInfo() {
    let usbVendorId: number | undefined;
    let usbProductId: number | undefined;

    if (this.info.vid && this.info.vid !== "Unknown") {
      usbVendorId = parseInt(String(this.info.vid).replace("0x", ""), 16);
    }
    if (this.info.pid && this.info.pid !== "Unknown") {
      usbProductId = parseInt(String(this.info.pid).replace("0x", ""), 16);
    }

    return {
      usbVendorId,
      usbProductId,
    };
  }

  async close() {
    if (this.unlistenFn) {
      this.unlistenFn();
      this.unlistenFn = null;
    }

    if (this.port) {
      try {
        await this.port.stopListening();
      } catch (e) {
        console.warn("Failed to stop listening:", e);
      }
      try {
        await this.port.close();
      } catch (e) {
        console.warn("Failed to close port:", e);
      }
      this.port = null;
    }

    this.currentController = null;
    this._readable = null;
  }
}

export const tauriSerial = {
  requestPort: async (): Promise<TauriSerialPort> => {
    const ports = await SerialPort.available_ports();
    const portPaths = Object.keys(ports);

    if (portPaths.length === 0) {
      throw new Error("No serial ports found");
    }

    // Since Tauri doesn't have a native browser-like port picker popup,
    // we return the first available port for compatibility,
    // but typically you should use getPorts() to build a custom selection UI.
    const path = portPaths[0];
    const info = ports[path];

    return new TauriSerialPort(path, info);
  },

  getPorts: async (): Promise<TauriSerialPort[]> => {
    const ports = await SerialPort.available_ports();
    return Object.keys(ports).map(
      (path) => new TauriSerialPort(path, ports[path]),
    );
  },
};
