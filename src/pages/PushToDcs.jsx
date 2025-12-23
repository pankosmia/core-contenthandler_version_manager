import { useState, useContext } from 'react';
import {
    DialogContent,
    DialogContentText,
    Typography,
    Stack,
    TextField
} from "@mui/material";
import { debugContext, i18nContext, doI18n, postJson } from "pithekos-lib";
import { enqueueSnackbar } from "notistack";
import { PanDialog, PanDialogActions } from 'pankosmia-rcl'

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

    return <PanDialog
            titleLabel={doI18n("pages:content:push_to_dcs", i18nRef.current)}
            isOpen={open}
            closeFn={() => closeFn()}
        >
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
            <PanDialogActions
                actionFn={() => { pushRepo(repoPath, dcsUsername, dcsPassword).then() ;closeFn() }}
                actionLabel={doI18n("pages:content:accept", i18nRef.current)}
                closeFn={() => closeFn()}
                closeLabel={doI18n("pages:content:cancel", i18nRef.current)}
                isDisabled={dcsUsername === "" || dcsPassword === ""}
            />
        </PanDialog>
}

export default PushToDcs;