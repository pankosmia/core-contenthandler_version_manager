import { useState, useContext } from 'react';
import {
    AppBar,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    Toolbar,
    Typography,
    Stack,
    TextField
} from "@mui/material";
import { debugContext, i18nContext, doI18n, postJson } from "pithekos-lib";
import { enqueueSnackbar } from "notistack";

function PushToDcs({ repoPath,repoName, open, closeFn }) {
    const { i18nRef } = useContext(i18nContext);
    const { debugRef } = useContext(debugContext);
    const [dcsUsername, setDcsUsername] = useState("");
    const [dcsPassword, setDcsPassword] = useState("");

    const pushRepo = async (repo_path, username, password) => {

        const pushUrl = `/git/push/${repo_path}`;
            const pushJson = JSON.stringify({
                "cred_type": "https",
                "username": username,
                "pass_key": password,
                "remote": "origin"
            });
            const pushResponse = await postJson(pushUrl, pushJson, debugRef.current);
            if (pushResponse.ok) {
                enqueueSnackbar(
                    doI18n("pages:content:push_complete", i18nRef.current),
                    { variant: "success" }
                );
            } else {
                enqueueSnackbar(
                    doI18n("pages:content:could_not_push", i18nRef.current),
                    { variant: "error" }
                );
            }
    };

    return <Dialog
        open={open}
        onClose={closeFn}
        fullWidth={true}
        maxWidth={"lg"}
        slotProps={{
            paper: {
                component: 'form',
            },
        }}
    >
        <AppBar color='secondary' sx={{ position: 'relative', borderTopLeftRadius: 4, borderTopRightRadius: 4 }}>
            <Toolbar>
                <Typography variant="h6" component="div">
                    {doI18n("pages:content:push_to_dcs", i18nRef.current)}
                </Typography>
            </Toolbar>
        </AppBar>
        <DialogContent>
        <DialogContentText>
                <Typography variant="h6">
                    {repoName}
                </Typography>
                <Stack spacing={2} sx={{ m: 2 }}>
                    <TextField
                        id="dcs-username"
                        label={doI18n("pages:content:dcs-username", i18nRef.current)}
                        value={dcsUsername}
                        variant="outlined"
                        onChange={(e) => setDcsUsername(e.target.value)}
                        /* error={!usernameRegex.test(username)} */
                        required={true}
                    />
                    <TextField
                        id="dcs-password"
                        label={doI18n("pages:content:dcs-password", i18nRef.current)}
                        value={dcsPassword}
                        type="password"
                        autoComplete="current-password"
                        variant="outlined"
                        onChange={(e) => setDcsPassword(e.target.value)}
                        /* error={!passwordRegex.test(password)} */
                        required={true}
                    />
                </Stack>
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button color="warning" onClick={closeFn}>
                {doI18n("pages:content:cancel", i18nRef.current)}
            </Button>
            <Button
                variant='contained'
                color="primary"
                disabled={dcsUsername === "" || dcsPassword === ""}
                onClick={() => { pushRepo(repoPath, dcsUsername, dcsPassword).then() ;closeFn() }}
            >{doI18n("pages:content:accept", i18nRef.current)}</Button>
        </DialogActions>
    </Dialog>;
}

export default PushToDcs;