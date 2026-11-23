import { invoke, isTauri } from "@tauri-apps/api/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  NodeRef,
  DesktopState,
  UiPreferences,
  CaptureMode,
  ConnectionInfo,
} from "../bindings";
export type {
  DesktopState,
  UiPreferences,
  InterfaceMode,
  CaptureMode,
} from "../bindings";

export const desktopApi = {
  state: () => invoke<DesktopState>("desktop_state"),
  preferences: (input: UiPreferences) =>
    invoke<UiPreferences>("save_ui_preferences", { input }),
  bind: (id: string | null) =>
    invoke<UiPreferences>("bind_default_listener", { id }),
  connect: (mode: CaptureMode | null) =>
    invoke<DesktopState>("set_desktop_connection", { mode }),
  systemListener: (id: string) =>
    invoke<DesktopState>("set_system_proxy_listener", { id }),
  changeNode: (id: string, node: NodeRef) =>
    invoke<void>("change_process_node", { id, node }),
  setRuleEnabled: (id: string, enabled: boolean) =>
    invoke<void>("set_process_rule_enabled", { id, enabled }),
  connections: () => invoke<ConnectionInfo[]>("get_connection_details"),
  logs: () => invoke<string>("read_core_log"),
  /** Starts an elevated copy (UAC) and exits; rejects with "已取消" if declined. */
  relaunchAsAdmin: (connectTun: boolean) =>
    invoke<void>("relaunch_as_admin", { connectTun }),
};
/** Browser-only stand-in so the shell can render without the Tauri backend. Tests still hit `invoke`. */
const browserPreview: DesktopState = {
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

export function useDesktopState() {
  return useQuery({
    queryKey: ["desktop"],
    queryFn: () =>
      import.meta.env.VITEST || isTauri()
        ? desktopApi.state()
        : Promise.resolve(structuredClone(browserPreview)),
    refetchInterval: import.meta.env.VITEST || !isTauri() ? false : 2000,
  });
}
export function useDesktopMutation<A, T>(run: (arg: A) => Promise<T>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSettled: async () => {
      await Promise.all(
        ["desktop", "model", "status", "procroute"].map((key) =>
          qc.invalidateQueries({ queryKey: [key] }),
        ),
      );
    },
  });
}
