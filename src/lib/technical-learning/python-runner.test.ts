import { afterEach, describe, expect, it, vi } from "vitest";

import { PythonRunner } from "./python-runner";

class FakeWorker {
  static instances: FakeWorker[] = [];
  listeners = new Map<string, Set<(event: MessageEvent) => void>>();
  messages: unknown[] = [];
  terminated = false;

  constructor() { FakeWorker.instances.push(this); }
  addEventListener(type: string, listener: (event: MessageEvent) => void) {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener); this.listeners.set(type, set);
  }
  removeEventListener(type: string, listener: (event: MessageEvent) => void) { this.listeners.get(type)?.delete(listener); }
  postMessage(message: unknown) { this.messages.push(message); }
  terminate() { this.terminated = true; }
  emit(data: unknown) { for (const listener of this.listeners.get("message") ?? []) listener({ data } as MessageEvent); }
}

describe("PythonRunner", () => {
  afterEach(() => { FakeWorker.instances = []; vi.useRealTimers(); });

  it("returns only normalized output from the matching worker response", async () => {
    const runner = new PythonRunner(() => new FakeWorker() as unknown as Worker, 1000);
    const pending = runner.run("result = orders", { orders: [{ id: 1 }] });
    const worker = FakeWorker.instances[0];
    const request = worker.messages[0] as { id: string; code: string };
    expect(request.code).toBe("result = orders");
    worker.emit({ id: request.id, ok: true, output: [{ id: 1 }] });
    await expect(pending).resolves.toEqual([{ id: 1 }]);
  });

  it("terminates and recreates the runtime after a timeout", async () => {
    vi.useFakeTimers();
    const runner = new PythonRunner(() => new FakeWorker() as unknown as Worker, 50);
    const pending = runner.run("while True: pass", {});
    const first = FakeWorker.instances[0];
    const rejection = expect(pending).rejects.toThrow("timed out");
    await vi.advanceTimersByTimeAsync(51);
    await rejection;
    expect(first.terminated).toBe(true);
    runner.run("result = 1", {}).catch(() => undefined);
    expect(FakeWorker.instances).toHaveLength(2);
  });

  it("surfaces execution errors without including a worker stack", async () => {
    const runner = new PythonRunner(() => new FakeWorker() as unknown as Worker, 1000);
    const pending = runner.run("bad code", {});
    const worker = FakeWorker.instances[0];
    const request = worker.messages[0] as { id: string };
    worker.emit({ id: request.id, ok: false, message: "NameError: bad" });
    await expect(pending).rejects.toThrow("NameError: bad");
  });
});
