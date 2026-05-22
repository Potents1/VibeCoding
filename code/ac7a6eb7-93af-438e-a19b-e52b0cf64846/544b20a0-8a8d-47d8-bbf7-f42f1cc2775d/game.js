// Browser entrypoint for the game. Keep this as the module loaded by `index.html`.
// Re-export the pure logic for tests/other modules.
export * from "./logic.js";

if (typeof window !== "undefined" && typeof document !== "undefined") {
  import("./main.js");
}
