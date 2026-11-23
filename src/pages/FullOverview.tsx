import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { RuntimeSummary } from "./RuntimeSummary";
import { desktopApi } from "../api/desktop";
import { errorMessage } from "../api/client";
import { createConnectionSampler } from "../lib/connections";
import { ConnectionsPanel } from "./ConnectionsPanel";
import { LogsPanel } from "./LogsPanel";

/** Width where the overview keeps two status cards, four stats and the bottom actions on one row. */
const OVERVIEW_LAYOUT_WIDTH = 860;

/** Lays the overview out at a stable size, then scales that whole block so a smaller window keeps the same positions. */
function FittedOverview({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: 1, width: 0, height: 0 });
  useLayoutEffect(() => {
    const frameEl = frame.current;
    const contentEl = content.current;
    if (!frameEl || !contentEl) return;
    const measure = () => {
      const availW = frameEl.clientWidth;
      const availH = frameEl.clientHeight;
      if (availW < 8 || availH < 8) return;
      const layoutW = Math.max(availW, OVERVIEW_LAYOUT_WIDTH);
      contentEl.style.width = `${layoutW}px`;
      contentEl.style.height = "auto";
      contentEl.style.transform = "none";
      const naturalH = contentEl.offsetHeight;
      if (naturalH < 8) return;
      const scaleW = availW / layoutW;
      const scale = naturalH * scaleW <= availH ? scaleW : availH / naturalH;
      const layoutH = naturalH * scaleW <= availH ? availH / scale : naturalH;
      contentEl.style.width = `${layoutW}px`;
      contentEl.style.height = `${layoutH}px`;
      contentEl.style.transform = `scale(${scale})`;
      setFit((prev) =>
        Math.abs(prev.scale - scale) < 0.01 && prev.width === layoutW && Math.abs(prev.height - layoutH) < 1
          ? prev
          : { scale, width: layoutW, height: layoutH },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frameEl);
    return () => observer.disconnect();
  }, []);
  const ready = fit.width > 0;
  return (
    <Box ref={frame} sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
      <Box sx={{ width: ready ? fit.width * fit.scale : "100%", height: ready ? fit.height * fit.scale : "auto", mx: "auto" }}>
        <Box
          ref={content}
          sx={{
            width: ready ? fit.width : "100%",
            height: ready ? fit.height : "auto",
            transform: ready ? `scale(${fit.scale})` : "none",
            transformOrigin: "top left",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export function FullOverview() {
  const [tab, setTab] = useState("summary");
  const [grouped, setGrouped] = useState(true);
  const [logsPaused, setLogsPaused] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const sampler = useRef(createConnectionSampler());
  const connections = useQuery({
    queryKey: ["connections", "live"],
    queryFn: async () => {
      try {
        return sampler.current.sample(await desktopApi.connections(), performance.now());
      } catch (error) {
        sampler.current.reset();
        throw error;
      }
    },
    retry: false,
    enabled: tab === "connections",
    refetchInterval: tab === "connections" ? 2000 : false,
  });
  const logs = useQuery({
    queryKey: ["core-log"],
    queryFn: desktopApi.logs,
    enabled: tab === "logs" && !logsPaused,
    retry: false,
    refetchInterval: tab === "logs" && !logsPaused ? 3000 : false,
  });
  const header = (
    <>
      <Typography variant="h5">概览</Typography>
      <Tabs aria-label="概览内容" value={tab} onChange={(_, v) => { sampler.current.reset(); setTab(v); }}>
        <Tab id="overview-summary-tab" aria-controls="overview-summary" value="summary" label="运行概况" />
        <Tab id="overview-connections-tab" aria-controls="overview-connections" value="connections" label="连接" />
        <Tab id="overview-logs-tab" aria-controls="overview-logs" value="logs" label="日志" />
      </Tabs>
    </>
  );
  return (
    <Stack spacing={2} sx={{ flex: 1, minHeight: 0 }}>
      {tab === "summary" ? (
        <FittedOverview>
          <Stack spacing={2} sx={{ flex: "1 1 auto" }}>
            {header}
            <RuntimeSummary />
          </Stack>
        </FittedOverview>
      ) : (
      <>
      {header}
      <Box role="tabpanel" id={`overview-${tab}`} aria-labelledby={`overview-${tab}-tab`} sx={{
        "--overview-content-height": "clamp(160px, calc(100dvh - 280px), 480px)",
      }}>
      {tab === "connections" ? (
        <>
          <ConnectionsPanel rows={connections.data ?? []} loading={connections.isLoading}
            feedback={connections.error && <Alert severity="error" action={<Button onClick={() => void connections.refetch()} disabled={connections.isFetching}>重试</Button>}>{errorMessage(connections.error)}</Alert>}
            stale={connections.isError} grouped={grouped} onGroupedChange={setGrouped}
            collapsed={collapsed} onCollapse={(key) => setCollapsed((previous) => {
              const next = new Set(previous);
              if (next.has(key)) next.delete(key); else next.add(key);
              return next;
            })} />
        </>
      ) : (
        <LogsPanel text={logs.data ?? ""} loading={logs.isLoading} fetching={logs.isFetching}
          error={logs.error ? errorMessage(logs.error) : undefined}
          paused={logsPaused} onPausedChange={setLogsPaused} onRefresh={() => void logs.refetch()} />
      )}
      </Box>
      </>
      )}
    </Stack>
  );
}
