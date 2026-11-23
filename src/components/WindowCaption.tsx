import { Box } from "@mui/material";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState, type ReactNode } from "react";

function Glyph({ children }: { children: ReactNode }) {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
      {children}
    </svg>
  );
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 1.15,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/**
 * Window controls sit in the top-right of the page itself. There is no caption bar.
 * The strip above the title is only a drag target.
 */
export function WindowCaption() {
  const [maximized, setMaximized] = useState(false);
  useEffect(() => {
    if (!isTauri()) return;
    const win = getCurrentWindow();
    let unlisten: (() => void) | undefined;
    let disposed = false;
    void win.isMaximized().then((value) => {
      if (!disposed) setMaximized(value);
    }).catch(() => {});
    void win.onResized(() => {
      void win.isMaximized().then((value) => {
        if (!disposed) setMaximized(value);
      }).catch(() => {});
    }).then((stop) => {
      if (disposed) stop();
      else unlisten = stop;
    });
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  const act = (run: () => Promise<void>) => {
    if (!isTauri()) return;
    void run().catch(() => {});
  };

  return (
    <>
      <Box
        data-tauri-drag-region
        sx={{ position: "fixed", top: 0, left: 0, right: 112, height: 36, zIndex: 5 }}
      />
      <Box
        sx={{
          position: "fixed",
          top: 8,
          right: 8,
          zIndex: 6,
          display: "flex",
          alignItems: "center",
          gap: 0.25,
        }}
      >
        <Box component="button" type="button" aria-label="最小化" onClick={() => act(() => getCurrentWindow().minimize())} sx={controlSx}>
          <Glyph>
            <path d="M1.5 5.5h8" {...stroke} />
          </Glyph>
        </Box>
        <Box component="button" type="button" aria-label={maximized ? "还原" : "最大化"} onClick={() => act(() => getCurrentWindow().toggleMaximize())} sx={controlSx}>
          <Glyph>
            {maximized ? (
              <>
                <path d="M3.5 3.2h5.2v5.2" {...stroke} />
                <path d="M2.2 4.6h5.2v5.2H2.2z" {...stroke} />
              </>
            ) : (
              <rect x="1.7" y="1.7" width="7.6" height="7.6" rx="1" {...stroke} />
            )}
          </Glyph>
        </Box>
        <Box
          component="button"
          type="button"
          aria-label="关闭"
          onClick={() => act(() => getCurrentWindow().close())}
          sx={{ ...controlSx, "&:hover": { bgcolor: "error.main", color: "error.contrastText" } }}
        >
          <Glyph>
            <path d="M2.2 2.2l6.6 6.6M8.8 2.2L2.2 8.8" {...stroke} />
          </Glyph>
        </Box>
      </Box>
    </>
  );
}

const controlSx = {
  width: 28,
  height: 28,
  border: 0,
  borderRadius: "8px",
  p: 0,
  display: "grid",
  placeItems: "center",
  color: "text.secondary",
  bgcolor: "transparent",
  cursor: "pointer",
  "&:hover": { bgcolor: "action.hover", color: "text.primary" },
};
