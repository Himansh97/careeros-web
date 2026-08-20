/* One pinned Pyodide runtime, isolated from the page and from CareerOS data. */
const PYODIDE_VERSION = "0.27.7";
const PYODIDE_ROOT = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
let runtimePromise;

async function runtime() {
  if (!runtimePromise) {
    importScripts(`${PYODIDE_ROOT}pyodide.js`);
    runtimePromise = self.loadPyodide({ indexURL: PYODIDE_ROOT }).then(async (pyodide) => {
      await pyodide.loadPackage("pandas");
      return pyodide;
    });
  }
  return runtimePromise;
}

self.addEventListener("message", async (event) => {
  const { id, code, fixture } = event.data || {};
  try {
    const pyodide = await runtime();
    pyodide.globals.set("_careeros_fixture_json", JSON.stringify(fixture || {}));
    pyodide.globals.set("_careeros_code", String(code || ""));
    const encoded = await pyodide.runPythonAsync(`
import json
import pandas as pd

_fixture = json.loads(_careeros_fixture_json)
for _name, _rows in _fixture.items():
    globals()[_name] = pd.DataFrame(_rows)

exec(_careeros_code, globals())
if 'result' not in globals():
    raise ValueError("Set a variable named result before running.")

def _normal(value):
    if isinstance(value, pd.DataFrame):
        return value.where(pd.notna(value), None).to_dict(orient='records')
    if isinstance(value, pd.Series):
        return value.where(pd.notna(value), None).tolist()
    if hasattr(value, 'item'):
        return value.item()
    return value

json.dumps(_normal(result), default=str, allow_nan=False)
    `);
    self.postMessage({ id, ok: true, output: JSON.parse(encoded) });
  } catch (error) {
    const firstLine = String(error && error.message ? error.message : error).split("\n")[0].slice(0, 240);
    self.postMessage({ id, ok: false, message: firstLine || "Python execution failed." });
  }
});
