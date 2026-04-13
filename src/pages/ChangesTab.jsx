import { useState, useContext, useEffect } from "react";
import {
  Button,
  Typography,
  TextField,
  Box,
  Tooltip,
  DialogContent,
  DialogContentText,
  IconButton,
  Grid2,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { doI18n, postJson, getJson } from "pithekos-lib";
import {
  debugContext,
  i18nContext,
  netContext,
  PanTable,
  PanDialog,
  PanDialogActions,
} from "pankosmia-rcl";
import { enqueueSnackbar } from "notistack";
import PushToDcs from "./PushToDcs";
import PullFromDownloaded from "./PullFromDownloaded";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import UpdateOutlinedIcon from "@mui/icons-material/UpdateOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

function ChangesTab({
  repoPath,
  repoName,
  open,
  setTabValue,
  setRemoteUrlExists,
}) {
  const { i18nRef } = useContext(i18nContext);
  const { debugRef } = useContext(debugContext);
  const { enabledRef } = useContext(netContext);

  const [status, setStatus] = useState([]);
  const [commits, setCommits] = useState([]);

  const [remotes, setRemotes] = useState([]);
  const [remoteUrlValue, setRemoteUrlValue] = useState("");
  const [commitMessageValue, setCommitMessageValue] = useState("");

  const [pushAnchorEl, setPushAnchorEl] = useState(null);
  const pushOpen = Boolean(pushAnchorEl);
  const [pullAnchorEl, setPullAnchorEl] = useState(null);
  const pullOpen = Boolean(pullAnchorEl);

  const [updateAnywaysAnchorEl, setUpdateAnywaysAnchorEl] = useState(null);
  const updateAnywaysOpen = Boolean(updateAnywaysAnchorEl);

  const repoStatus = async (repo_path) => {
    const statusUrl = `/git/status/${repo_path}`;
    const statusResponse = await getJson(statusUrl, debugRef.current);
    if (statusResponse.ok) {
      setStatus(statusResponse.json);
    } else {
      enqueueSnackbar(
        doI18n("pages:content:could_not_fetch_status", i18nRef.current),
        { variant: "error" },
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
        { variant: "error" },
      );
    }
  };

  const repoRemotes = async (repo_path) => {
    const remoteListUrl = `/git/remotes/${repo_path}`;
    const remoteList = await getJson(remoteListUrl, debugRef.current);
    if (remoteList.ok) {
      setRemotes(remoteList.json.payload.remotes);
      const originRecord = remoteList.json.payload.remotes.filter(
        (p) => p.name === "origin",
      )[0];
      if (originRecord) {
        setRemoteUrlValue(originRecord.url);
      }
    } else {
      enqueueSnackbar(
        doI18n("pages:content:could_not_list_remotes", i18nRef.current),
        { variant: "error" },
      );
    }
  };

  useEffect(() => {
    const doFetch = async () => {
      if (repoPath.length > 0) {
        await repoStatus(repoPath);
        await repoCommits(repoPath);
        await repoRemotes(repoPath);
      }
    };
    if (open) {
      doFetch().then();
    }
  }, [open, repoPath]);

  const addAndCommitRepo = async (repo_path, commitMessage) => {
    const addAndCommitUrl = `/git/add-and-commit/${repo_path}`;
    const commitJson = JSON.stringify({ commit_message: commitMessage });
    const addAndCommitResponse = await postJson(
      addAndCommitUrl,
      commitJson,
      debugRef.current,
    );
    if (addAndCommitResponse.ok) {
      enqueueSnackbar(
        doI18n("pages:content:commit_complete", i18nRef.current),
        { variant: "success" },
      );
      setCommitMessageValue("");
      await repoStatus(repoPath);
      await repoCommits(repoPath);
    } else {
      enqueueSnackbar(
        doI18n("pages:content:could_not_commit", i18nRef.current),
        { variant: "error" },
      );
    }
  };

  const statusColumns = [
    {
      field: "status",
      headerName: doI18n("pages:content:status", i18nRef.current),
      flex: 3,
    },
    {
      field: "path",
      headerName: doI18n("pages:content:row_path", i18nRef.current),
      flex: 3,
    },
  ];

  const statusRows = status.map((s, n) => {
    return {
      ...s,
      id: n,
      status: s.change_type,
      path: s.path,
    };
  });

  const commitsColumns = [
    {
      field: "author",
      headerName: doI18n("pages:content:row_author", i18nRef.current),
    },
    {
      field: "date",
      headerName: doI18n("pages:content:row_date", i18nRef.current),
    },
    {
      field: "message",
      headerName: doI18n("pages:content:row_message", i18nRef.current),
    },
  ];

  const commitsRows = commits.map((c, n) => {
    return {
      ...c,
      id: n,
      commitId: c.id,
      author: c.author,
      date: c.date,
      message: c.message,
    };
  });

  const branches = remotes.map((b) => b.name);
  const syncBranches =
    branches.includes("downloaded") && branches.includes("updates");
  const originBranch = remotes
    .map((b) => b.name)
    .filter((name) => name.includes("origin"));

  return (
    <Box>
      <Grid2
        container
        direction="row"
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
        }}
        columnSpacing={1}
        rowSpacing={1}
      >
        <Grid2 item size={{ "@xs": 2, "@md": 1 }}>
          <Typography variant="h6">
            {doI18n(
              "pages:core-contenthandler_version_manager:title_files_modified",
              i18nRef.current,
            )}{" "}
          </Typography>
        </Grid2>
        <Grid2 item size={12}>
          <Accordion disabled={status.length === 0}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1-content"
              id="panel1-header"
            >
              <Typography component="span">
                {" "}
                {`${status.length} ${doI18n("pages:core-contenthandler_version_manager:files_modified", i18nRef.current)}`}{" "}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {status.length > 0 && (
                <PanTable columns={statusColumns} rows={statusRows} />
              )}
            </AccordionDetails>
          </Accordion>
          <Grid2 />
          <Grid2
            container
            sx={{
              display: "flex",
              justifyContent: "flex-start",
              alignItems: "center",
            }}
            marginTop={5}
          >
            <Grid2 item size={{ "@xs": 2, "@md": 1 }}>
              <Typography variant="h6">
                {doI18n(
                  "pages:core-contenthandler_version_manager:title_label",
                  i18nRef.current,
                )}{" "}
              </Typography>
            </Grid2>
            <Grid2 item size={{ "@xs": 2, "@md": 1 }}>
              <Typography variant="caption">
                {" "}
                {doI18n(
                  "pages:core-contenthandler_version_manager:commit_helper_text",
                  i18nRef.current,
                )}{" "}
              </Typography>
            </Grid2>
            <Grid2 item size="grow">
              <TextField
                id="commit-message-input"
                fullWidth
                label={doI18n("pages:content:commit_message", i18nRef.current)}
                value={commitMessageValue}
                variant="outlined"
                onChange={(e) => setCommitMessageValue(e.target.value)}
                required={true}
                disabled={status.length === 0}
                size={window.innerHeight <= 600 ? "small" : "medium"}
                sx={{ mt: 1 }}
              />
            </Grid2>
            <Grid2
              item
              size={{ "@xs": 2, "@md": 1 }}
              sx={{ alignSelf: "center" }}
            >
              <Button
                fullWidth
                color="secondary"
                disabled={status.length === 0 || commitMessageValue === ""}
                onClick={() => {
                  addAndCommitRepo(repoPath, commitMessageValue).then();
                }}
              >
                {doI18n("pages:content:accept", i18nRef.current)}
              </Button>
            </Grid2>
          </Grid2>
        </Grid2>
      </Grid2>

      <Grid2
        container
        direction="row"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
        columnSpacing={0.5}
        rowSpacing={2}
        gap={1}
        marginTop={5}
      >
        <Grid2 item size="grow">
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1-content"
              id="panel1-header"
            >
              <Typography component="span">
                {" "}
                {commits.length}{" "}
                {doI18n(
                  "pages:core-contenthandler_version_manager:label",
                  i18nRef.current,
                )}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {commits.length > 0 ? (
                <PanTable columns={commitsColumns} rows={commitsRows} />
              ) : (
                <Typography variant="h6">
                  {doI18n("pages:content:no_commits", i18nRef.current)}
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid2>

        <Grid2 item size={{ "@xs": 2, "@md": 1 }}>
          <Tooltip
            title={
              !enabledRef.current
                ? doI18n(
                    "pages:core-contenthandler_version_manager:operation_requires_internet",
                    i18nRef.current,
                  )
                : doI18n(
                    "pages:core-contenthandler_version_manager:update_remote",
                    i18nRef.current,
                  )
            }
          >
            <span>
              <IconButton
                fullWidth
                color="secondary"
                disabled={
                  !enabledRef.current ||
                  remotes.length === 0 ||
                  !remoteUrlValue.startsWith("https://")
                }
                onClick={(event) => {
                  if (status.length > 0 || !originBranch) {
                    setUpdateAnywaysAnchorEl(event.currentTarget);
                  } else {
                    setPushAnchorEl(event.currentTarget);
                  }
                }}
              >
                <ShareOutlinedIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip
            title={
              !syncBranches
                ? doI18n(
                    "pages:core-contenthandler_version_manager:sync_repo",
                    i18nRef.current,
                  )
                : doI18n(
                    "pages:core-contenthandler_version_manager:synchronisation",
                    i18nRef.current,
                  )
            }
          >
            <span>
              <IconButton
                fullWidth
                color="secondary"
                onClick={(event) => {
                  setPullAnchorEl(event.currentTarget);
                }}
                disabled={status.length > 0 || !syncBranches}
              >
                <UpdateOutlinedIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Grid2>
      </Grid2>

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
      <PanDialog
        titleLabel={doI18n(
          "pages:content:update_without_latest_changes",
          i18nRef.current,
        )}
        isOpen={updateAnywaysOpen}
        closeFn={() => setUpdateAnywaysAnchorEl(null)}
      >
        <DialogContent>
          <DialogContentText>
            <Typography variant="body1">
              {doI18n("pages:content:uncommitted_changes", i18nRef.current)}
            </Typography>
          </DialogContentText>
        </DialogContent>
        <PanDialogActions
          closeFn={() => setUpdateAnywaysAnchorEl(null)}
          closeLabel={doI18n("pages:content:cancel", i18nRef.current)}
          actionFn={(event) => setPushAnchorEl(event.currentTarget)}
          actionLabel={doI18n("pages:content:update_anyways", i18nRef.current)}
        />
      </PanDialog>
    </Box>
  );
}

export default ChangesTab;
