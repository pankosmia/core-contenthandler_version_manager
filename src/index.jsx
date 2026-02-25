import {createRoot} from "react-dom/client";
import {SpaContainer} from "pankosmia-rcl";
import {createHashRouter, RouterProvider} from "react-router-dom";
import './index.css';
import VersionManager from "./pages/VersionManager";
import App from "./App";

const router = createHashRouter([
    {
        path:"version_manager",
        element:<App/>
    },
    // {
    //     path: "",
    //     element:<VersionManager/> 
    // }
]);

createRoot(document.getElementById("root"))
    .render(
        <SpaContainer>
            <RouterProvider router={router}/>
        </SpaContainer>
    );