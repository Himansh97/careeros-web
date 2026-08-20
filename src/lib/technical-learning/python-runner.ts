type WorkerFactory = () => Worker;

interface WorkerResponse {
  id: string;
  ok: boolean;
  output?: unknown;
  message?: string;
}

export class PythonRunner {
  private worker: Worker | null = null;
  private sequence = 0;

  constructor(
    private readonly factory: WorkerFactory = () => new Worker("/workers/technical-python.worker.js"),
    private readonly timeoutMs = 12_000,
  ) {}

  private getWorker(): Worker {
    this.worker ??= this.factory();
    return this.worker;
  }

  restart(): void {
    this.worker?.terminate();
    this.worker = null;
  }

  run(code: string, fixture: Record<string, unknown[]>): Promise<unknown> {
    const worker = this.getWorker();
    const id = `py_${++this.sequence}`;
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        clearTimeout(timer);
        worker.removeEventListener("message", onMessage);
      };
      const onMessage = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.id !== id) return;
        cleanup();
        if (event.data.ok) resolve(event.data.output);
        else reject(new Error(event.data.message || "Python execution failed."));
      };
      const timer = setTimeout(() => {
        cleanup();
        this.restart();
        reject(new Error("Python execution timed out. The runtime was restarted."));
      }, this.timeoutMs);
      worker.addEventListener("message", onMessage);
      worker.postMessage({ id, code, fixture });
    });
  }
}
