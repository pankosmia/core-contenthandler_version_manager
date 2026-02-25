import { useContext, useState, useCallback, useEffect } from "react";
import { Button, Chip, Grid2 } from "@mui/material";
import { doI18n } from "pithekos-lib";
import { useNavigate } from "react-router-dom";
import { getAndSetJson } from "pithekos-lib";
import { i18nContext } from "pankosmia-rcl";
import { createTheme, ThemeProvider, styled } from "@mui/material";
import { SnackbarProvider, MaterialDesignContent } from "notistack";
import VersionManager from "./pages/VersionManager";
function App() {
  const [themeSpec, setThemeSpec] = useState({
    palette: {
      primary: {
        main: "#666",
      },
      secondary: {
        main: "#888",
      },
    },
  });
  useEffect(() => {
    if (
      themeSpec.palette &&
      themeSpec.palette.primary &&
      themeSpec.palette.primary.main &&
      themeSpec.palette.primary.main === "#666"
    ) {
      getAndSetJson({
        url: "/app-resources/themes/default.json",
        setter: setThemeSpec,
      }).then();
    }
  });
  const theme = createTheme(themeSpec);
  const [maxWindowHeight, setMaxWindowHeight] = useState(
    window.innerHeight - 64,
  );
  const handleWindowResize = useCallback((event) => {
    setMaxWindowHeight(window.innerHeight - 64);
  }, []);
  const { i18nRef } = useContext(i18nContext);
  const navigate = useNavigate();

  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [handleWindowResize]);
  const CustomSnackbarContent = styled(MaterialDesignContent)(() => ({
    "&.notistack-MuiContent-error": {
      backgroundColor: "#FDEDED",
      color: "#D32F2F",
    },
    "&.notistack-MuiContent-info": {
      backgroundColor: "#E5F6FD",
      color: "#0288D1",
    },
    "&.notistack-MuiContent-warning": {
      backgroundColor: "#FFF4E5",
      color: "#EF6C00",
    },
    "&.notistack-MuiContent-success": {
      backgroundColor: "#EDF7ED",
      color: "#2E7D32",
    },
  }));
  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider
        Components={{
          error: CustomSnackbarContent,
          info: CustomSnackbarContent,
          warning: CustomSnackbarContent,
          success: CustomSnackbarContent,
        }}
        maxSnack={6}
      >
        <VersionManager />
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
