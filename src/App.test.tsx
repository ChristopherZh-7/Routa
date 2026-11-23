import { render, screen, waitFor, within } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import type { DesktopState } from "./api/desktop";
import pkg from "../package.json";
import App from "./App";

vi.mock("./api/events", () => ({ useRuntimeEvents: () => {} }));
vi.mock("@tauri-apps/api/core", () => ({
  isTauri: () => false,
  invoke: vi.fn(),
}));
vi.mock("./bindings", () => ({
  commands: {
    getModel: () => new Promise(() => {}),
    getStatus: () => new Promise(() => {}),
  },
}));

const desktop: DesktopState = {
  preferences: {
    mode: "Full",
    listener_id: null,
    exit_id: null,
    system_listener_id: null,
    capture_mode: "System",
    auto_connect: false,
    close_to_tray: true,
    taskbar_status: { enabled: true, mode: "Rotate", traffic: "Values" },
    managed_rules: [],
    selected_apps: [],
    skip_ai_reset_prompt: false,
  },
  connection: null,
  requested: null,
  error: null,
  is_admin: false,
  system_listener_id: null,
  taskbar_status_supported: true,
};
beforeEach(() => {
  vi.mocked(invoke).mockResolvedValue(structuredClone(desktop));
  window.location.hash = "#/";
});
describe("App", () => {
  it("renders the navigation items", async () => {
    render(<App />);
    const nav = await screen.findByRole("navigation", { name: "主导航" });
    const labels = within(nav)
      .getAllByRole("link")
      .map((l) => l.textContent);
    expect(labels).toEqual([
      "概览",
      "代理",
      "AI 应用",
      "进程分流",
      "订阅",
      "节点",
      "设置",
    ]);
  });
});

describe("Layout sidebar", () => {
  it("shows the brand and version", async () => {
    render(<App />);
    const nav = await screen.findByRole("navigation", { name: "主导航" });
    expect(screen.getByRole("img", { name: "Routa" })).toBeInTheDocument();
    expect(screen.getByText(`v${pkg.version}`)).toBeInTheDocument();
    expect(nav).toBeInTheDocument();
  });

  it("marks only the current page as selected", async () => {
    window.location.hash = "#/";
    render(<App />);
    const links = within(
      await screen.findByRole("navigation", { name: "主导航" }),
    ).getAllByRole("link");
    const selected = links
      .filter((l) => l.classList.contains("Mui-selected"))
      .map((l) => l.textContent);
    expect(selected).toEqual(["概览"]);
  });
});

it("opens the full interface when no mode is stored and saves that choice", async () => {
  let current = structuredClone(desktop);
  current.preferences.mode = null;
  vi.mocked(invoke).mockImplementation(async (command, args) => {
    if (command === "save_ui_preferences") {
      current.preferences = (
        args as { input: DesktopState["preferences"] }
      ).input;
      return current.preferences;
    }
    return current;
  });
  render(<App />);
  expect(
    await screen.findByRole("navigation", { name: "主导航" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("先选一种使用方式")).not.toBeInTheDocument();
  await waitFor(() =>
    expect(invoke).toHaveBeenCalledWith(
      "save_ui_preferences",
      expect.objectContaining({
        input: expect.objectContaining({ mode: "Full" }),
      }),
    ),
  );
});

it("opens the full interface when a saved simple mode is still on disk", async () => {
  let current = structuredClone(desktop);
  current.preferences.mode = "Simple";
  vi.mocked(invoke).mockImplementation(async (command, args) => {
    if (command === "save_ui_preferences") {
      current.preferences = (
        args as { input: DesktopState["preferences"] }
      ).input;
      return current.preferences;
    }
    return current;
  });
  render(<App />);
  expect(
    await screen.findByRole("navigation", { name: "主导航" }),
  ).toBeInTheDocument();
  await waitFor(() =>
    expect(invoke).toHaveBeenCalledWith(
      "save_ui_preferences",
      expect.objectContaining({
        input: expect.objectContaining({ mode: "Full" }),
      }),
    ),
  );
});
