import { createTheme } from "@mui/material/styles";

// macOS-like desktop chrome built only from MUI theme options. Pages keep using
// MUI components and `sx` for layout; color, type, and control shape live here.

const numeric = { fontVariantNumeric: "tabular-nums" } as const;
const floatingShadow = "0 16px 50px rgba(0, 0, 0, 0.16), 0 0 0 0.5px rgba(0, 0, 0, 0.08)";

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: "data" },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#007aff", contrastText: "#ffffff" },
        success: { main: "#1b873b" },
        warning: { main: "#9a5600" },
        error: { main: "#d70015" },
        background: { default: "#e6e6eb", paper: "#ffffff" },
        divider: "#e5e5ea",
        text: { primary: "#1d1d1f", secondary: "#6e6e73" },
        action: {
          hover: "rgba(0, 0, 0, 0.04)",
          selected: "rgba(0, 0, 0, 0.08)",
          focus: "rgba(0, 122, 255, 0.2)",
        },
      },
    },
    dark: {
      palette: {
        primary: { main: "#0a84ff", contrastText: "#ffffff" },
        success: { main: "#30d158" },
        warning: { main: "#ffd60a" },
        error: { main: "#ff453a" },
        background: { default: "#111113", paper: "#1c1c1e" },
        divider: "#38383a",
        text: { primary: "#f5f5f7", secondary: "#98989d" },
        action: {
          hover: "rgba(255, 255, 255, 0.06)",
          selected: "rgba(255, 255, 255, 0.1)",
          focus: "rgba(10, 132, 255, 0.32)",
        },
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "SF Pro Text", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei UI", "Segoe UI Variable", "Segoe UI", sans-serif',
    h5: { fontSize: 22, fontWeight: 650, letterSpacing: "-0.02em", lineHeight: 1.25 },
    h6: { fontSize: 17, fontWeight: 650, letterSpacing: "-0.014em" },
    subtitle1: { fontSize: 15, fontWeight: 600, letterSpacing: "-0.011em" },
    body1: { ...numeric, fontSize: 14, lineHeight: 1.45 },
    body2: { ...numeric, fontSize: 13, lineHeight: 1.45 },
    caption: { ...numeric, fontSize: 12, letterSpacing: "0.01em" },
    button: { textTransform: "none", fontWeight: 600, fontSize: 13, letterSpacing: "-0.01em" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          userSelect: "none",
          backgroundColor: theme.vars.palette.background.default,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          fontOpticalSizing: "auto",
        },
        'input, textarea, [contenteditable=""], [contenteditable="true"], [contenteditable="plaintext-only"], [data-selectable="true"], [role="alert"]:not(.MuiAlert-root)': {
          userSelect: "text",
        },
        "::selection": { backgroundColor: `rgb(${theme.vars.palette.primary.mainChannel} / 0.28)` },
        // Overlay-style scrollbar: a narrow pill, no arrow buttons, no track.
        "::-webkit-scrollbar": { width: 10, height: 10 },
        "::-webkit-scrollbar-track, ::-webkit-scrollbar-corner": { background: "transparent" },
        "::-webkit-scrollbar-button": { display: "none" },
        "::-webkit-scrollbar-thumb": {
          minHeight: 40,
          border: "3px solid transparent",
          borderRadius: 8,
          backgroundClip: "content-box",
          backgroundColor: `rgb(${theme.vars.palette.text.primaryChannel} / 0.22)`,
        },
        "::-webkit-scrollbar-thumb:hover": {
          backgroundColor: `rgb(${theme.vars.palette.text.primaryChannel} / 0.4)`,
        },
        "::-webkit-scrollbar-thumb:active": {
          borderWidth: 2,
          backgroundColor: `rgb(${theme.vars.palette.text.primaryChannel} / 0.5)`,
        },
      }),
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
        message: ({ ownerState }) => ({
          userSelect: ownerState.severity === "error" || ownerState.severity === "warning" ? "text" : undefined,
        }),
      },
    },
    MuiFormHelperText: {
      styleOverrides: { root: { "&.Mui-error": { userSelect: "text" } } },
    },
    MuiPaper: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: { backgroundImage: "none" },
        rounded: { borderRadius: 14 },
        outlined: ({ theme }) => ({
          borderColor: theme.vars.palette.divider,
          backgroundColor: theme.vars.palette.background.paper,
          boxShadow: "none",
        }),
      },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          backgroundImage: "none",
          borderColor: theme.vars.palette.divider,
          backgroundColor: theme.vars.palette.background.paper,
          boxShadow: "none",
        }),
      },
    },
    MuiDialog: {
      defaultProps: { slotProps: { paper: { variant: "elevation", elevation: 8 } } },
      styleOverrides: {
        paper: { borderRadius: 14, backgroundImage: "none", boxShadow: floatingShadow },
      },
    },
    MuiBackdrop: {
      styleOverrides: { root: { backgroundColor: "rgba(0, 0, 0, 0.28)" } },
    },
    MuiMenu: {
      defaultProps: { slotProps: { paper: { variant: "elevation", elevation: 4 } } },
      styleOverrides: {
        paper: { borderRadius: 12, backgroundImage: "none", boxShadow: floatingShadow },
        list: { paddingTop: 4, paddingBottom: 4 },
      },
    },
    MuiPopover: {
      defaultProps: { slotProps: { paper: { variant: "elevation", elevation: 4 } } },
      styleOverrides: {
        paper: { borderRadius: 12, backgroundImage: "none", boxShadow: floatingShadow },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: { borderRadius: 8, marginInline: 4, minHeight: 32, fontSize: 13 },
      },
    },
    MuiDialogTitle: {
      styleOverrides: { root: { fontSize: 17, fontWeight: 650, letterSpacing: "-0.014em" } },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, minHeight: 32, paddingInline: 14 },
        contained: { borderRadius: 999, paddingInline: 16 },
        sizeSmall: { minHeight: 28, borderRadius: 7, paddingInline: 10, fontSize: 13 },
        sizeLarge: { minHeight: 40, borderRadius: 10, fontSize: 15 },
      },
      variants: [
        {
          props: { variant: "outlined" },
          style: ({ theme }) => ({
            borderColor: theme.vars.palette.divider,
            color: theme.vars.palette.text.primary,
            backgroundColor: theme.vars.palette.background.paper,
            "&:hover": {
              borderColor: theme.vars.palette.divider,
              backgroundColor: `rgb(${theme.vars.palette.text.primaryChannel} / 0.04)`,
            },
          }),
        },
        {
          props: { variant: "outlined", color: "error" },
          style: ({ theme }) => ({
            borderColor: theme.vars.palette.error.main,
            color: theme.vars.palette.error.main,
            backgroundColor: "transparent",
          }),
        },
      ],
    },
    MuiIconButton: {
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiChip: {
      defaultProps: { variant: "outlined", size: "small" },
      styleOverrides: {
        root: { borderRadius: 999, height: 24, fontWeight: 600 },
        label: { paddingInline: 8 },
      },
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          backgroundColor: theme.vars.palette.background.paper,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: theme.vars.palette.divider },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: `rgb(${theme.vars.palette.text.primaryChannel} / 0.28)`,
          },
          "&.Mui-focused": {
            boxShadow: `0 0 0 3px rgb(${theme.vars.palette.primary.mainChannel} / 0.22)`,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderWidth: 1,
            borderColor: theme.vars.palette.primary.main,
          },
        }),
      },
    },
    MuiTabs: {
      defaultProps: { textColor: "inherit" },
      styleOverrides: {
        root: ({ theme }) => ({
          minHeight: 32,
          width: "fit-content",
          maxWidth: "100%",
          padding: 2,
          borderRadius: 9,
          backgroundColor: `rgb(${theme.vars.palette.text.primaryChannel} / 0.06)`,
        }),
        indicator: { display: "none" },
        list: { gap: 2 },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: ({ theme }) => ({
          minHeight: 28,
          minWidth: 0,
          padding: "4px 14px",
          borderRadius: 7,
          textTransform: "none",
          fontSize: 13,
          fontWeight: 500,
          color: theme.vars.palette.text.secondary,
          "&.Mui-selected": {
            color: theme.vars.palette.text.primary,
            fontWeight: 600,
            backgroundColor: theme.vars.palette.background.paper,
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.06)",
          },
        }),
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: ({ theme }) => ({
          padding: 2,
          gap: 2,
          borderRadius: 9,
          backgroundColor: `rgb(${theme.vars.palette.text.primaryChannel} / 0.06)`,
        }),
        grouped: { border: 0 },
        middleButton: { marginLeft: 0, borderLeft: 0, borderRadius: 7 },
        lastButton: { marginLeft: 0, borderLeft: 0, borderRadius: 7 },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          border: 0,
          borderRadius: "7px !important",
          textTransform: "none",
          fontSize: 13,
          fontWeight: 500,
          color: theme.vars.palette.text.secondary,
          "&&.Mui-selected": {
            color: theme.vars.palette.text.primary,
            fontWeight: 600,
            backgroundColor: theme.vars.palette.background.paper,
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08), 0 0 0 0.5px rgba(0, 0, 0, 0.06)",
            "&:hover": { backgroundColor: theme.vars.palette.background.paper },
          },
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: ({ theme }) => ({ borderColor: theme.vars.palette.divider, fontSize: 13 }),
        head: ({ theme }) => ({
          color: theme.vars.palette.text.secondary,
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: "0.01em",
        }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 8,
          "&.Mui-selected": {
            backgroundColor: theme.vars.palette.action.selected,
            "& .MuiListItemText-primary": { fontWeight: 600 },
          },
        }),
      },
    },
  },
});
