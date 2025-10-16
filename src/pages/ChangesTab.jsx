import { useState, useContext, useEffect, useRef } from 'react';
import {
    Grid2,
    Button,
    Typography,
    TextField,
    Box,
    Stack,
    Paper,
    Divider,
    Tooltip,
    Dialog, DialogContent, DialogContentText, DialogActions, AppBar, Toolbar,
    Link,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination
} from "@mui/material";
import { styled } from '@mui/material/styles';
import { debugContext, i18nContext, netContext, doI18n, postJson, getJson } from "pithekos-lib";
import { enqueueSnackbar } from "notistack";
import PushToDcs from './PushToDcs';
import PullFromDownloaded from "./PullFromDownloaded";

const Item = styled(Paper)(({ theme }) => ({
    minHeight: '38vh',
    maxHeight: '38vh',
    width: '100%',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: (theme.vars ?? theme).palette.text.secondary,
    ...theme.applyStyles('dark', {
        backgroundColor: '#1A2027',
    }),
}));

function ChangesTab({ repoPath, repoName, open, setTabValue, setRemoteUrlExists }) {

    const { i18nRef } = useContext(i18nContext);
    const { debugRef } = useContext(debugContext);
    const { enabledRef } = useContext(netContext);

    const [status, setStatus] = useState([]);
    const [commits, setCommits] = useState([]);
    const [remotes, setRemotes] = useState([]);
    const [remoteUrlValue, setRemoteUrlValue] = useState('');
    const [commitMessageValue, setCommitMessageValue] = useState('');

    const [pushAnchorEl, setPushAnchorEl] = useState(null);
    const pushOpen = Boolean(pushAnchorEl);
    const [pullAnchorEl, setPullAnchorEl] = useState(null);
    const pullOpen = Boolean(pullAnchorEl);

    const [updateAnywaysAnchorEl, setUpdateAnywaysAnchorEl] = useState(null);
    const updateAnywaysOpen = Boolean(updateAnywaysAnchorEl);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const repoStatus = async (repo_path) => {
        const statusUrl = `/git/status/${repo_path}`;
        const statusResponse = await getJson(statusUrl, debugRef.current);
        if (statusResponse.ok) {
            setStatus(statusResponse.json);
        } else {
            enqueueSnackbar(
                doI18n("pages:content:could_not_fetch_status", i18nRef.current),
                { variant: "error" }
            );
        }
    };

    const repoCommits = async (repo_path) => {

        const commitsUrl = `/git/log/${repo_path}`;
        const commitsResponse = await getJson(commitsUrl, debugRef.current);
        if (commitsResponse.ok) {
            setCommits(commitsResponse.json);
        } else {
            enqueueSnackbar(
                doI18n("pages:content:could_not_fetch_commits", i18nRef.current),
                { variant: "error" }
            );
        }
    };

    const repoRemotes = async (repo_path) => {
        const remoteListUrl = `/git/remotes/${repo_path}`;
        const remoteList = await getJson(remoteListUrl, debugRef.current);
        if (remoteList.ok) {
            setRemotes(remoteList.json.payload.remotes);
            const originRecord = remoteList.json.payload.remotes.filter((p) => p.name === "origin")[0];
            if (originRecord) {
                setRemoteUrlValue(originRecord.url)
            }
        } else {
            enqueueSnackbar(
                doI18n("pages:content:could_not_list_remotes", i18nRef.current),
                { variant: "error" }
            )
        }
    };

    useEffect(() => {
        const doFetch = async () => {
            if (repoPath.length > 0) {
                await repoStatus(repoPath);
                await repoCommits(repoPath);
                await repoRemotes(repoPath)
            }
        }
        if (open) {
            doFetch().then()
        }
    },
        [open, repoPath]);

    const addAndCommitRepo = async (repo_path, commitMessage) => {

        const addAndCommitUrl = `/git/add-and-commit/${repo_path}`;
        const commitJson = JSON.stringify({ "commit_message": commitMessage });
        const addAndCommitResponse = await postJson(addAndCommitUrl, commitJson, debugRef.current);
        if (addAndCommitResponse.ok) {
            enqueueSnackbar(
                doI18n("pages:content:commit_complete", i18nRef.current),
                { variant: "success" }
            );
            setCommitMessageValue('');
            await repoStatus(repoPath);
            await repoCommits(repoPath)
        } else {
            enqueueSnackbar(
                doI18n("pages:content:could_not_commit", i18nRef.current),
                { variant: "error" }
            );
        }
    };

    const statusColumns = [
        {
            field: 'status',
            headerName: doI18n("pages:content:status", i18nRef.current),
            flex: 3
        },
        {
            field: 'path',
            headerName: doI18n("pages:content:row_path", i18nRef.current),
            flex: 3
        }
    ];

    const statusRows = status.map((s, n) => {
        return {
            ...s,
            id: n,
            status: s.change_type,
            path: s.path
        }
    });

    const commitsColumns = [
        {
            field: 'author',
            headerName: doI18n("pages:content:row_author", i18nRef.current),
        },
        {
            field: 'date',
            headerName: doI18n("pages:content:row_date", i18nRef.current),
        },
        {
            field: 'message',
            headerName: doI18n("pages:content:row_message", i18nRef.current),
        }
    ];

    const commitsRows = commits.map((c, n) => {
        return {
            ...c,
            id: n,
            commitId: c.id,
            author: c.author,
            date: c.date,
            message: c.message
        }
    });

    return <Box sx={{ height: "80vh" }}>
        <Stack
            divider={<Divider orientation="horizontal" flexItem />}
            spacing={2}
            sx={{
                height: "100%",
                justifyContent: "space-between",
                alignItems: "flex-start",
            }}
        >
            <Item>
                <Stack direction="column" spacing={0} sx={{ height: "100%", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <Box sx={{ width: '100%' }}>
                        {status.length > 0
                            ?
                            <TableContainer component={Paper} sx={{ maxHeight: { xs: 65, sm: 70, md: 120, lg: 250 } }}>
                                <Table stickyHeader sx={{ minWidth: "100%" }} size="small" aria-label="status dense table">
                                    <TableHead>
                                        <TableRow>
                                            {statusColumns.map((s, n) => {
                                                return <TableCell align="left">{s.headerName}</TableCell>
                                            })}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {statusRows.map((row) => (
                                            <TableRow
                                                key={row.status}
                                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                                            >
                                                <TableCell component="th" scope="row">{row.status}</TableCell>
                                                <TableCell align="left">{row.path}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            :
                            <Typography variant="h6">
                                {doI18n("pages:content:no_changes", i18nRef.current)}
                            </Typography>
                        }
                    </Box>
                    <Box>
                        <TextField
                            id="commit-message-input"
                            fullWidth
                            label={doI18n("pages:content:commit_message", i18nRef.current)}
                            value={commitMessageValue}
                            variant="outlined"
                            onChange={(e) => setCommitMessageValue(e.target.value)}
                            required={true}
                            disabled={status.length === 0}
                            helperText={doI18n("pages:content:commit_helper_text", i18nRef.current)}
                            size={window.innerHeight <= 600 ? "small" : "medium"}
                            sx={{ mt: 1 }}
                        />
                        <Button
                            fullWidth
                            color="secondary"
                            disabled={status.length === 0 || commitMessageValue === ''}
                            onClick={() => { addAndCommitRepo(repoPath, commitMessageValue).then() }}
                        >
                            {doI18n("pages:content:accept", i18nRef.current)}
                        </Button>
                    </Box>
                </Stack>
            </Item>
            <Item>
                <Stack direction="column" spacing={2} sx={{ height: "100%", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <Box sx={{ width: '100%' }}>
                        {commits.length > 0
                            ?
                            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                                <TableContainer sx={{ maxHeight: { xs: 140, sm: 170, lg: 240, xl: 300 } }}>
                                    <Table stickyHeader aria-label="commits sticky table" sx={{ tableLayout: 'fixed' }}>
                                        <TableHead>
                                            <TableRow>
                                                {commitsColumns.map((column, n) => (
                                                    <TableCell
                                                        key={n}
                                                        align={"left"}
                                                        sx={{ width: '33%', whiteSpace: 'normal', wordBreak: 'break-word', }}
                                                    >
                                                        {column.headerName}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {commitsRows
                                                .map((row, n) => {
                                                    return (
                                                        <TableRow hover role="checkbox" tabIndex={-1} key={n}>
                                                            <TableCell sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.author}</TableCell>
                                                            <TableCell align="left" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.date}</TableCell>
                                                            <TableCell align="left" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{row.message}</TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                            :
                            <Typography variant="h6">
                                {doI18n("pages:content:no_commits", i18nRef.current)}
                            </Typography>
                        }
                    </Box>
                    <Box sx={{ width: '100%' }}>
                        {
                            remotes.length === 0 &&
                            <Link
                                component="button"
                                variant="body2"
                                onClick={() => {
                                    setTabValue(1);
                                    setRemoteUrlExists(false)
                                }}
                                underline="always"
                            >
                                {doI18n("pages:content:add_remote_repo_to_update", i18nRef.current)}
                            </Link>
                        }
                        <Tooltip title={!enabledRef.current ? doI18n("pages:content:operation_requires_internet", i18nRef.current) : doI18n("pages:content:update_remote", i18nRef.current)}>
                            <span sx={{ display: 'inline-block' }}>
                                <Button
                                    fullWidth
                                    color='secondary'
                                    disabled={!enabledRef.current || remotes.length === 0 || !remoteUrlValue.startsWith("https://")}
                                    onClick={(event) => {
                                        if (status.length > 0) {
                                            setUpdateAnywaysAnchorEl(event.currentTarget)
                                        } else {
                                            setPushAnchorEl(event.currentTarget)
                                        }
                                    }}
                                >
                                    {doI18n("pages:content:update_remote", i18nRef.current)}
                                </Button>
                            </span>
                        </Tooltip>
                        <Button
                            fullWidth
                            color='secondary'
                            onClick={(event) => {
                                setPullAnchorEl(event.currentTarget)
                            }}
                            disabled={status.length > 0}
                        >
                            {doI18n("pages:content:pull_from_downloaded", i18nRef.current)}
                        </Button>
                    </Box>
                </Stack>
            </Item>
        </Stack>
        <PushToDcs
            repoPath={repoPath}
            repoName={repoName}
            open={pushOpen}
            closeFn={() => setPushAnchorEl(null)}
            status={status}
        />
        <PullFromDownloaded
            repoPath={repoPath}
            repoName={repoName}
            open={pullOpen}
            closeFn={() => setPullAnchorEl(null)}
        />
        <Dialog
            open={updateAnywaysOpen}
            onClose={() => setUpdateAnywaysAnchorEl(null)}
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
                        {doI18n("pages:content:update_without_latest_changes", i18nRef.current)}
                    </Typography>
                </Toolbar>
            </AppBar>
            <DialogContent>
                <DialogContentText>
                    <Typography variant="body1">
                        {doI18n("pages:content:uncommitted_changes", i18nRef.current)}
                    </Typography>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button color="warning" onClick={() => setUpdateAnywaysAnchorEl(null)}>
                    {doI18n("pages:content:cancel", i18nRef.current)}
                </Button>
                <Button
                    variant='contained'
                    color="primary"
                    onClick={(event) => setPushAnchorEl(event.currentTarget)}
                >{doI18n("pages:content:update_anyways", i18nRef.current)}</Button>
            </DialogActions>
        </Dialog>
    </Box>;
}

export default ChangesTab;