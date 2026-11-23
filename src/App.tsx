import {
  Alert,
  Box,
  Button,
  CircularProgress,
  CssBaseline,
  Stack,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { useRuntimeEvents } from "./api/events";
import { ApplyResultProvider } from "./components/ApplyResultSnackbar";
import { ExitConfirmDialog } from "./components/ExitConfirmDialog";
import { Layout } from "./components/Layout";
import { WindowCaption } from "./components/WindowCaption";

import { Listeners } from "./pages/Listeners";
import { FullOverview } from "./pages/FullOverview";
import { AiAppsPage } from "./pages/AiApps";
import { ProcessRoutingPage } from "./pages/ProcessRouting";
import { Settings } from "./pages/Settings";
import { ResourceCenter } from "./pages/ResourceCenter";
import { Diagnostics } from "./pages/Diagnostics";
import {
  InterfaceProvider,
  useInterface,
} from "./components/InterfaceProvider";
import { errorMessage } from "./api/client";
import { theme } from "./theme";

function Events() {
  useRuntimeEvents();
  return null;
}

/** Shows a scrollbar only while that region is actually scrolling. */
function useQuietScrollbars() {
  useEffect(() => {
    const timers = new Map<HTMLElement, number>();
    const onScroll = (event: Event) => {
      const el = event.target;
      if (!(el instanceof HTMLElement) || !el.classList.contains("quiet-scroll")) return;
      el.classList.add("is-scrolling");
      const prev = timers.get(el);
      if (prev) window.clearTimeout(prev);
      timers.set(
        el,
        window.setTimeout(() => {
          el.classList.remove("is-scrolling");
          timers.delete(el);
        }, 700),
      );
    };
    document.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);
}

function ApplicationShell() {
  const ui = useInterface()!;
  const mode = ui.state?.preferences.mode;
  const chooseMode = useRef(ui.chooseMode);
  chooseMode.current = ui.chooseMode;
  useEffect(() => {
    if (mode === undefined || mode === "Full") return;
    void chooseMode.current("Full").catch(() => {});
  }, [mode]);
  useEffect(() => {
    if (!isTauri() || mode === undefined) return;
    const window = getCurrentWindow();
    void window.setMinSize(new LogicalSize(760, 560)).catch(() => {});
  }, [mode]);
  if (!ui.state)
    return (
      <Stack spacing={2} sx={{ p: 5, alignItems: "center" }}>
        {ui.error ? (
          <Alert
            severity="error"
            action={<Button onClick={ui.retry}>重试</Button>}
          >
            {errorMessage(ui.error)}
          </Alert>
        ) : (
          <>
            <CircularProgress />
            <Typography>正在读取界面设置…</Typography>
          </>
        )}
      </Stack>
    );
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<FullOverview />} />
        <Route path="/listeners" element={<Listeners />} />
        <Route path="/ai-apps" element={<AiAppsPage />} />
        <Route path="/process-routing" element={<ProcessRoutingPage />} />
        <Route path="/subscriptions" element={<ResourceCenter subscriptionsOnly />} />
        <Route path="/nodes" element={<ResourceCenter />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  // Keep the client with its query observers when Fast Refresh re-evaluates this module.
  const [queryClient] = useState(() => new QueryClient());
  useQuietScrollbars();

  return (
    <ThemeProvider
      theme={theme}
      defaultMode="light"
      modeStorageKey="routa-color-mode"
    >
      <QueryClientProvider client={queryClient}>
        <ApplyResultProvider>
          <Events />
          <ExitConfirmDialog />
          <InterfaceProvider>
            <HashRouter>
              <CssBaseline enableColorScheme />
              <Box sx={{ height: "100vh", bgcolor: "background.paper" }}>
                <ApplicationShell />
                <WindowCaption />
              </Box>
            </HashRouter>
          </InterfaceProvider>
        </ApplyResultProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
