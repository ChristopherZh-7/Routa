import { invoke } from "@tauri-apps/api/core";
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn() }));
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { Listener, Model } from "../bindings";

vi.mock("../bindings", () => ({
  commands: {
    getModel: vi.fn(),
    getStatus: vi.fn(),
    saveListener: vi.fn(),
  },
}));

import { commands } from "../bindings";
import { ListenerDialog, newListener } from "./ListenerDialog";

const model: Model = {
  subscriptions: [],
  exits: [],
  listeners: [],
  settings: {
    autostart: false,
    core_path: null,
    controller_port: 19097,
    delay_test_interval_mins: 10,
    delay_test_url: "u",
    node_monitor: { enabled: false, members: [], interval_secs: 300, fail_threshold: 2, latency_limit_ms: 1000, notify_recovery: true },
  },
  manual_nodes: [],
  node_groups: [],
  process_routing: { rules: [], exit_prompt: true },
};

const listener: Listener = {
  id: "l1",
  name: "浏览器",
  listener_type: "Mixed",
  listen: "0.0.0.0",
  port: 7891,
  auth: null,
  exit: null,
  user_enabled: true,
};

function Loc() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname + loc.search}</div>;
}

async function modelLoaded() {
  await waitFor(() => expect(commands.getModel).toHaveBeenCalled());
  await new Promise((r) => setTimeout(r, 0));
}

function renderDialog(l: Listener, onClose = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ListenerDialog listener={l} onClose={onClose} />
        <Loc />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return onClose;
}

describe("ListenerDialog V4.3", () => {
  beforeEach(() => {
    vi.mocked(commands.getModel).mockResolvedValue(model);
    vi.mocked(commands.getStatus).mockResolvedValue({
      interfaces: [],
      delays: {},
    } as never);
    vi.mocked(invoke)
      .mockReset()
      .mockResolvedValue({ NotRunning: { error: "" } });
  });
  it("offers three independent port modes without shared outbound selection", async () => {
    renderDialog(listener);
    await modelLoaded();
    for (const name of ["规则分流", "统一转发", "直连"])
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    expect(screen.queryByLabelText("出口")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("监听地址")).not.toBeInTheDocument();
  });
  it("commits listener and private destination together without navigation", async () => {
    const close = renderDialog(listener);
    await modelLoaded();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(invoke).toHaveBeenCalledWith(
      "save_proxy",
      expect.objectContaining({
        l: expect.objectContaining({ id: "l1", routing: null }),
        target: expect.objectContaining({ kind: "Direct" }),
      }),
    );
    expect(commands.saveListener).not.toHaveBeenCalled();
    expect(screen.getByTestId("loc")).toHaveTextContent(/^\/$/);
  });
  it("never silently wires a new proxy to a legacy shared outbound", async () => {
    vi.mocked(commands.getModel).mockResolvedValue({
      ...model,
      exits: [{ id: "e1", name: "legacy", kind: "Direct", interface: null }],
    });
    renderDialog(listener);
    await modelLoaded();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() => expect(invoke).toHaveBeenCalled());
    expect(vi.mocked(invoke).mock.calls[0][1]).toEqual(
      expect.objectContaining({
        target: expect.objectContaining({ id: "proxy-l1" }),
      }),
    );
  });
  it("requires a real node before uniform forwarding can save", async () => {
    renderDialog(listener);
    await modelLoaded();
    fireEvent.click(screen.getByRole("button", { name: "统一转发" }));
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(await screen.findByText("请选择节点")).toBeInTheDocument();
    expect(invoke).not.toHaveBeenCalled();
  });
  it("keeps validation conflicts attached to the port", async () => {
    vi.mocked(invoke).mockRejectedValue([
      { PortConflict: { port: 7891, with: "浏览器" } },
    ]);
    const close = renderDialog(listener);
    await modelLoaded();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(
      await screen.findByText("端口 7891 已被「浏览器」占用"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("端口")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(close).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("端口"), {
      target: { value: "7892" },
    });
    expect(
      screen.queryByText("端口 7891 已被「浏览器」占用"),
    ).not.toBeInTheDocument();
  });
  it("rejects empty names before submitting", async () => {
    renderDialog({ ...listener, name: "" });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(await screen.findByText("名称不能为空")).toBeInTheDocument();
    expect(invoke).not.toHaveBeenCalled();
    await modelLoaded();
  });
  it("masks passwords and allows showing them", async () => {
    renderDialog({ ...listener, auth: { username: "u", password: "p" } });
    fireEvent.click(screen.getByText("高级选项"));
    expect(screen.getByLabelText("密码")).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "显示" }));
    expect(screen.getByLabelText("密码")).toHaveAttribute("type", "text");
    await modelLoaded();
  });
  it("rejects invalid ports without touching the backend", async () => {
    renderDialog(listener);
    fireEvent.change(screen.getByLabelText("端口"), {
      target: { value: "70000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    expect(
      await screen.findByText("端口需在 1–65535 之间"),
    ).toBeInTheDocument();
    expect(invoke).not.toHaveBeenCalled();
    await modelLoaded();
  });
  it("discards a changed form on close without committing", async () => {
    const close = renderDialog(listener);
    fireEvent.change(screen.getByLabelText("名称"), {
      target: { value: "draft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "关闭" }));
    expect(close).toHaveBeenCalledOnce();
    expect(invoke).not.toHaveBeenCalled();
    await modelLoaded();
  });
  it.each([["127.0.0.1", "0.0.0.0"], ["::1", "::"]])("sets LAN wildcard %s → %s through a switch", async (initial, wildcard) => {
    renderDialog({ ...listener, listen: initial });
    await modelLoaded();
    fireEvent.click(screen.getByText("高级选项"));
    fireEvent.click(screen.getByRole("switch", { name: "允许局域网" }));
    expect(screen.queryByLabelText("接入网卡")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        "save_proxy",
        expect.objectContaining({
          l: expect.objectContaining({ listen: wildcard }),
        }),
      ),
    );
  });
});
describe("newListener", () => {
  it("proposes the next available port and local access", () => {
    expect(newListener([]).port).toBe(7881);
    expect(
      newListener([
        { ...listener, port: 7000 },
        { ...listener, port: 7005 },
      ]).port,
    ).toBe(7006);
    expect(newListener([]).listen).toBe("127.0.0.1");
    expect(newListener([]).routing).toEqual({
      bypass_cn: true,
      rules: [],
      unmatched: "Proxy",
    });
  });
  it("never proposes a port above 65535", () =>
    expect(
      newListener([
        { ...listener, port: 65535 },
        { ...listener, port: 1024 },
      ]).port,
    ).toBe(1025));
});
describe("newListener hidden range", () => {
  it("never proposes a port in the hidden range", () => {
    expect(newListener([{ ...listener, port: 37799 }]).port).toBe(38000);
    expect(newListener([{ ...listener, port: 37800 }]).port).toBe(38000);
    expect(newListener([{ ...listener, port: 37999 }]).port).toBe(38000);
  });
});
describe("ListenerDialog default CN & LAN bypass", () => {
  beforeEach(() => {
    vi.mocked(commands.getModel).mockResolvedValue({
      ...model,
      manual_nodes: [
        {
          id: "m1",
          name: "SG 01",
          groups: [],
          kind: { Proxy: { raw: { name: "SG 01", type: "ss", server: "1.1.1.1", port: 443 } } },
        },
      ],
      exits: [
        {
          id: "proxy-old",
          name: "代理-old",
          interface: null,
          kind: { Node: { node: { manual_id: "m1" } } },
        },
      ],
      listeners: [
        {
          id: "old",
          name: "雷霆",
          listener_type: "Mixed",
          listen: "127.0.0.1",
          port: 7882,
          auth: null,
          exit: "proxy-old",
          user_enabled: true,
          routing: null,
        },
      ],
    });
    vi.mocked(commands.getStatus).mockResolvedValue({
      interfaces: [],
      delays: {},
    } as never);
    vi.mocked(invoke)
      .mockReset()
      .mockResolvedValue({ NotRunning: { error: "" } });
  });

  it("opens newListener in rules mode with CN & LAN bypass enabled by default", async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ListenerDialog
            listener={{ ...newListener([]), id: "new1", name: "新代理" }}
            initialNode={{ manual_id: "m1" }}
            onClose={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await modelLoaded();
    const bypassSwitch = screen.getByRole("switch", { name: "绕过大陆与局域网" });
    expect(bypassSwitch).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        "save_proxy",
        expect.objectContaining({
          l: expect.objectContaining({
            id: "new1",
            routing: { bypass_cn: true, rules: [], unmatched: "Proxy" },
          }),
          target: expect.objectContaining({
            kind: { Node: { node: { manual_id: "m1" } } },
          }),
        }),
      ),
    );
  });

  it("keeps existing uniform-forwarding proxies untouched until switched to rules mode", async () => {
    const existing: Listener = {
      id: "old",
      name: "雷霆",
      listener_type: "Mixed",
      listen: "127.0.0.1",
      port: 7882,
      auth: null,
      exit: "proxy-old",
      user_enabled: true,
      routing: null,
    };
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    qc.setQueryData(["model"], await commands.getModel());
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ListenerDialog listener={existing} onClose={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await modelLoaded();
    expect(screen.queryByRole("switch", { name: "绕过大陆与局域网" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "规则分流" }));
    expect(screen.getByRole("switch", { name: "绕过大陆与局域网" })).toBeChecked();
    fireEvent.click(screen.getByText("验证规则"));
    fireEvent.change(screen.getByLabelText("域名或 IPv4 地址"), {
      target: { value: "192.168.1.1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "验证" }));
    expect(screen.getByText("匹配内置局域网规则 → 直连")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("域名或 IPv4 地址"), {
      target: { value: "ustc.edu.cn" },
    });
    fireEvent.click(screen.getByRole("button", { name: "验证" }));
    expect(screen.getByText("匹配内置大陆规则 → 直连")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "保存" }));
    await waitFor(() =>
      expect(invoke).toHaveBeenCalledWith(
        "save_proxy",
        expect.objectContaining({
          l: expect.objectContaining({
            id: "old",
            routing: { bypass_cn: true, rules: [], unmatched: "Proxy" },
          }),
        }),
      ),
    );
  });
});
