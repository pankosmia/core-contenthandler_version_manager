import { createRoot } from "react-dom/client";
import { getAndSetJson} from "pithekos-lib";
import { createHashRouter, RouterProvider } from "react-router-dom";
import './index.css';
import VersionManager from "./pages/VersionManager";
import App from "./App";
import { useEffect, useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material";
import { SpaContainer,fallbackTheme } from "pankosmia-rcl";
const router = createHashRouter([
    {
        path: "/",
        element: <App />
    },
    {
        path: "versionManager",
        element: <VersionManager />
    }
]);
function AppLayout() {
    const [themeSpec, setThemeSpec] = useState(fallbackTheme);
    const theme = createTheme(themeSpec);
    useEffect(() => {
        if (themeSpec.palette && themeSpec.palette.primary && themeSpec.palette.primary.main && themeSpec.palette.primary.main === "#666") {
            getAndSetJson({
                url: "/app-resources/themes/default.json", setter: setThemeSpec,
            }).then();
        }
    }, []);

    return <ThemeProvider theme={theme}>
        <SpaContainer>
            <RouterProvider router={router} />
        </SpaContainer>
    </ThemeProvider>
}
createRoot(document.getElementById("root"))
    .render(
        <AppLayout/>
    );