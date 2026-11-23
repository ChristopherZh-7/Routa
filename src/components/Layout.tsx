import AltRouteOutlined from "@mui/icons-material/AltRouteOutlined";
import AutoAwesomeOutlined from "@mui/icons-material/AutoAwesomeOutlined";
import SpaceDashboardOutlined from "@mui/icons-material/SpaceDashboardOutlined";
import DnsOutlined from "@mui/icons-material/DnsOutlined";
import SwapHorizOutlined from "@mui/icons-material/SwapHorizOutlined";
import LanguageOutlined from "@mui/icons-material/LanguageOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BrandMark } from "./BrandMark";
import { UpdateNavButton } from "./UpdateNavButton";
import { UpdateNotice } from "./UpdateNotice";
import { clearMonitorFocus, useMonitorFocus } from "../api/monitorFocus";
import pkg from "../../package.json";

const DRAWER_WIDTH = 196;

const NAV_GROUPS = [
  { label: "工作台", items: ["/", "/listeners", "/ai-apps", "/process-routing"] },
  { label: "资源", items: ["/subscriptions", "/nodes"] },
];

export const pages = [
  { path: "/", label: "概览", icon: <SpaceDashboardOutlined /> },
  { path: "/listeners", label: "代理", icon: <SwapHorizOutlined /> },
  { path: "/ai-apps", label: "AI 应用", icon: <AutoAwesomeOutlined /> },
  { path: "/process-routing", label: "进程分流", icon: <AltRouteOutlined /> },
  { path: "/subscriptions", label: "订阅", icon: <LanguageOutlined /> },
  { path: "/nodes", label: "节点", icon: <DnsOutlined /> },
  { path: "/settings", label: "设置", icon: <SettingsOutlined /> },
];

function isCurrent(path: string, current: string): boolean {
  return path === "/"
    ? current === "/"
    : current === path || current.startsWith(`${path}/`);
}

/**
 * Routes a toast click to its page. A node focus is left in the store for the node page to
 * highlight (it may mount only after this navigation); the other targets have nothing to consume it.
 */
export function useMonitorFocusNavigation() {
  const focus = useMonitorFocus();
  const navigate = useNavigate();
  // `navigate` changes with the location, so remember the focus already routed: a node focus
  // stays set until the node page consumes it and must not navigate again in the meantime.
  const handled = useRef<typeof focus>(null);
  const { pathname: current } = useLocation();
  const pathname = useRef(current);
  useEffect(() => { pathname.current = current; }, [current]);
  useEffect(() => {
    if (focus === handled.current) return;
    handled.current = focus;
    if (!focus) return;
    const go = (to: string, path: string) => navigate(to, { replace: pathname.current === path });
    if (typeof focus === "object") return void go("/nodes", "/nodes");
    if (focus === "Listeners") go("/listeners", "/listeners");
    else go("/settings?tab=network", "/settings");
    clearMonitorFocus();
  }, [focus, navigate]);
}

export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  useMonitorFocusNavigation();
  return (
    <Box
      sx={{
        boxSizing: "border-box",
        height: "100%",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          display: "flex",
          height: "100%",
          overflow: "hidden",
          bgcolor: "background.paper",
        }}
      >
      <Box
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: 1,
          borderColor: "divider",
        }}
      >
        <Stack
          data-tauri-drag-region
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", px: 2, pt: 2.25, pb: 0.5 }}
        >
          <BrandMark size={22} />
          <Typography sx={{ fontSize: 15, fontWeight: 650, letterSpacing: "-0.02em" }}>Routa</Typography>
        </Stack>
        <List
          component="nav"
          aria-label="主导航"
          sx={{ px: 1.25, pt: 1, flex: 1, display: "flex", flexDirection: "column" }}
        >
          {NAV_GROUPS.map((group) => (
            <Box key={group.label} sx={{ mb: 1.25 }}>
              <Typography
                variant="caption"
                sx={{ display: "block", px: 1.25, pb: 0.5, color: "text.secondary", fontSize: 11, fontWeight: 600 }}
              >
                {group.label}
              </Typography>
              {group.items.map((path) => {
                const p = pages.find((page) => page.path === path)!;
                return (
                  <ListItemButton
                    key={p.path}
                    component={Link}
                    to={p.path}
                    selected={isCurrent(p.path, pathname)}
                    sx={{
                      mb: 0.25,
                      flexGrow: 0,
                      minHeight: 32,
                      px: 1.25,
                      color: "text.secondary",
                      "& .MuiListItemIcon-root": { color: "inherit" },
                      "&&.Mui-selected": {
                        color: "text.primary",
                        bgcolor: "action.selected",
                        boxShadow: "none",
                        "&:hover": { bgcolor: "action.selected" },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 28, color: "inherit", "& svg": { fontSize: 17 } }}>
                      {p.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={p.label}
                      slotProps={{ primary: { sx: { fontSize: 13, letterSpacing: "-0.011em" } } }}
                    />
                  </ListItemButton>
                );
              })}
            </Box>
          ))}
          {(() => {
            const p = pages.find((page) => page.path === "/settings")!;
            return (
              <Box sx={{ position: "relative", mt: "auto", display: "flex", flexDirection: "column" }}>
                <ListItemButton
                  component={Link}
                  to={p.path}
                  selected={isCurrent(p.path, pathname)}
                  sx={{
                    mb: 0.25,
                    flexGrow: 0,
                    minHeight: 32,
                    px: 1.25,
                    color: "text.secondary",
                    "& .MuiListItemIcon-root": { color: "inherit" },
                    "&&.Mui-selected": {
                      color: "text.primary",
                      bgcolor: "action.selected",
                      boxShadow: "none",
                      "&:hover": { bgcolor: "action.selected" },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 28, color: "inherit", "& svg": { fontSize: 17 } }}>
                    {p.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={p.label}
                    slotProps={{ primary: { sx: { fontSize: 13, letterSpacing: "-0.011em" } } }}
                  />
                </ListItemButton>
                {/* Sibling of the link: a button inside the anchor would be invalid. */}
                <Box sx={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}>
                  <UpdateNavButton />
                </Box>
              </Box>
            );
          })()}
        </List>
        <Typography
          variant="caption"
          sx={{ px: 2.25, pt: 0.5, pb: 1.75, color: "text.secondary" }}
        >
          v{pkg.version}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", pt: 6 }}>
        <Box
          component="main"
          className="quiet-scroll"
          sx={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", px: { xs: 2, sm: 3.5 }, pb: 2 }}
        >
          {children}
        </Box>
      </Box>
      </Box>
      <UpdateNotice />
    </Box>
  );
}
