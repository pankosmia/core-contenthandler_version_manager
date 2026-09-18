import { useState, useContext, useEffect, useRef } from "react";
import {
  Button,
  Typography,
  TextField,
  Stack,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  Popover,
} from "@mui/material";
import DoneIcon from "@mui/icons-material/Done";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { postEmptyJson, getJson } from "pankosmia-lib/http";
import { doI18n } from "pankosmia-lib/i18n";
import { debugContext, i18nContext } from "pankosmia-rcl";
import { enqueueSnackbar } from "notistack";

function SettingsTab({
  repoInfo,
  open,
  reposModCount,
  remoteUrlExists,
  setRemoteUrlExists,
}) {
  const { i18nRef } = useContext(i18nContext);
  const { debugRef } = useContext(debugContext);
  const [remoteUrlValue, setRemoteUrlValue] = useState("");
  const [remoteUrlIsValid, setRemoteUrlIsValid] = useState(null);
  const remoteUrlRef = useRef(null);
  const [newBranchValue, setNewBranchValue] = useState("");
  const [newBranchIsValid, setIsNewBranchValid] = useState(
    newBranchValue === "" ? true : false,
  );
  const [addBranchAnchorEl, setAddBranchAnchorEl] = useState(null);
  const addBranchOpen = Boolean(addBranchAnchorEl);
  /* const remoteUrlRegex = new RegExp(/^\S+@\S+:\S+$/); */
  const [remotes, setRemotes] = useState([]);
  const [branchList, setBranchList] = useState([]);
  const [selectedBranchIndex, setSelectedBranchIndex] = useState();

  useEffect(() => {
    const doFetch = async () => {
      const remoteListUrl = `/api/git/remotes/${repoInfo}`;
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
          `Server error : ${remoteList.status} ${remoteList.statusText} `,
          { variant: "error" },
        );
        return;
      }
    };
    doFetch().then();
  }, [reposModCount]);

  let cleanRemoteUrlValue =
    remoteUrlValue && remoteUrlValue.replace(".git", "");
  const addRemoteRepo = async (repo_path) => {
    if (remotes.filter((p) => p.name === "origin")[0]) {
      const deleteUrl = `/api/git/remote/delete/${repo_path}?remote_name=origin`;
      const deleteResponse = await postEmptyJson(deleteUrl, debugRef.current);
      if (!deleteResponse.ok) {
        enqueueSnackbar(
          doI18n("pages:content:could_not_delete_remote", i18nRef.current),
          `Server error : ${JSON.parse(deleteResponse?.error).reason} `,
          { variant: "error" },
        );
        return;
      }
    }
    // console.log("cleanUrl", cleanRemoteUrlValue);
    const addUrl = `/api/git/remote/add/${repo_path}?remote_name=origin&remote_url=${cleanRemoteUrlValue}`;
    const addResponse = await postEmptyJson(addUrl, debugRef.current);
    if (addResponse.ok) {
      enqueueSnackbar(
        doI18n("pages:content:remote_repo_added", i18nRef.current),
        { variant: "success" },
      );
    } else {
      enqueueSnackbar(
        doI18n("pages:content:could_not_add_remote_repo", i18nRef.current),

        `Server error :  ${JSON.parse(addResponse?.error).reason}`,
        { variant: "error" },
      );
      return;
    }
  };

  const addRemoteDownloadedAndUpdate = async (repo_path_origin, repo_path) => {
    let cleanRemoteUrl =
      repo_path_origin && repo_path_origin.replace(".git", "");
    const copyrepo_path = `_local_/_local_/${repo_path && repo_path.split("/")[2].replace(".git", "")}`;

    const existingRemotesUrl = `/api/git/remotes/${copyrepo_path}`;
    const existingRemotesResponse = await getJson(
      existingRemotesUrl,
      debugRef.current,
    );
    const existingRemotes = existingRemotesResponse.ok
      ? existingRemotesResponse.json.payload.remotes
      : [];

    const existingDownloaded = existingRemotes.find(
      (r) => r.name === "downloaded",
    );
    if (!existingDownloaded || existingDownloaded.url !== cleanRemoteUrl) {
      if (existingDownloaded) {
        const deleteUrl = `/api/git/remote/delete/${copyrepo_path}?remote_name=downloaded`;
        await postEmptyJson(deleteUrl, debugRef.current);
      }
      const addUrl = `/api/git/remote/add/${copyrepo_path}?remote_name=downloaded&remote_url=${cleanRemoteUrl}`;
      const addResponse = await postEmptyJson(addUrl, debugRef.current);
      if (!addResponse.ok) {
        enqueueSnackbar(
          doI18n("pages:content:could_not_add_remote_repo", i18nRef.current),
          `Server error : ${JSON.parse(addResponse?.error).reason}`,
          { variant: "error" },
        );
        return;
      }
    }

    const updatesPath = `_local_/_updates_/${repo_path.split("/")[2]}`;
    const existingUpdates = existingRemotes.find((r) => r.name === "updates");
    if (!existingUpdates || existingUpdates.url !== updatesPath) {
      if (existingUpdates) {
        const deleteUrl2 = `/api/git/remote/delete/${copyrepo_path}?remote_name=updates`;
        await postEmptyJson(deleteUrl2, debugRef.current);
      }
      const addUrl2 = `/api/git/remote/add/${copyrepo_path}?remote_name=updates&remote_url=${updatesPath}`;
      const addResponse2 = await postEmptyJson(addUrl2, debugRef.current);
      if (!addResponse2.ok) {
        enqueueSnackbar(
          doI18n("pages:content:could_not_add_remote_repo", i18nRef.current) +
            "2",
          `Server error : ${JSON.parse(addResponse2?.error).reason} `,
          { variant: "error" },
        );
        return;
      }
    }
  };

  const repoBranches = async (repo_path) => {
    const branchesUrl = `/api/git/branches/${repo_path}`;
    const branchesResponse = await getJson(branchesUrl, debugRef.current);
    if (branchesResponse.ok) {
      setBranchList(branchesResponse.json.payload.branches);
    } else {
      enqueueSnackbar(
        doI18n("pages:content:could_not_fetch_branches", i18nRef.current),
        { variant: "error" },
      );
    }
  };

  const checkoutBranch = async (repo_path, branch) => {
    const branchUrl = `/api/git/branch/${branch}/${repo_path}`;
    const branchResponse = await postEmptyJson(branchUrl, debugRef.current);

    if (branchResponse.ok) {
      if (branchResponse.json.is_good) {
        enqueueSnackbar(
          doI18n(`pages:content:branch_switched`, i18nRef.current),
          { variant: "success" },
        );
      } else {
        enqueueSnackbar(
          `${doI18n("pages:content:could_not_switch_branch", i18nRef.current)}: ${JSON.parse(branchResponse?.error).reason}`,
          { variant: "error" },
        );
      }
    } else {
      enqueueSnackbar(
        `${doI18n("pages:content:could_not_switch_branch", i18nRef.current)}: ${JSON.parse(branchResponse?.error).reason}`,
        { variant: "error" },
      );
    }
  };

  const createBranch = async (repo_path, new_branch) => {
    const createBranchUrl = `/api/git/new-branch/${new_branch}/${repo_path}`;
    const createBranchResponse = await postEmptyJson(
      createBranchUrl,
      debugRef.current,
    );
    if (createBranchResponse.ok) {
      repoBranches(repoInfo).then();
      setNewBranchValue("");
    } else {
      enqueueSnackbar(
        doI18n("pages:content:could_not_make_branch", i18nRef.current),
        { variant: "error" },
      );
    }
  };

  useEffect(() => {
    if (open === true) {
      repoBranches(repoInfo).then();
    }
  }, [open]);

  useEffect(() => {
    if (branchList.length > 0) {
      setSelectedBranchIndex(branchList.findIndex((b) => b.is_head === true));
    }
  }, [branchList]);

  useEffect(() => {
    if (!remoteUrlExists) {
      remoteUrlRef.current?.focus();
      setRemoteUrlExists(true);
    }
  }, [remoteUrlExists]);

  const fetchRemotes = async () => {
    const remoteListUrl = `/api/git/remotes/${repoInfo}`;
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
        `Server error : ${remoteList.status} ${remoteList.statusText} `,
        { variant: "error" },
      );
      return;
    }
  };

  useEffect(() => {
    fetchRemotes().then();
  }, [reposModCount]);

  const handleRemoteUrlValidation = async () => {
    if (!remoteUrlValue.startsWith("https://")) {
      setRemoteUrlIsValid(false);
    } else {
      setRemoteUrlIsValid(true);
      await addRemoteRepo(repoInfo);
      await addRemoteDownloadedAndUpdate(
        remoteUrlValue.split("//")[1],
        repoInfo,
      );
      await fetchRemotes();
    }
  };

  const handleNewBranchValidation = async () => {
    if (
      !/^[a-zA-Z]+$/.test(newBranchValue) ||
      branchList.some((branch) => branch.name === newBranchValue)
    ) {
      setIsNewBranchValid(false);
    } else {
      setIsNewBranchValid(true);
      await createBranch(repoInfo, newBranchValue);
      setAddBranchAnchorEl(null);
    }
  };

  const handleListItemClick = (event, index) => {
    setSelectedBranchIndex(index);
  };

  return (
    <Box>
      <Stack spacing={2}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <TextField
            id="repo-url"
            fullWidth
            inputRef={remoteUrlRef}
            label={doI18n("pages:content:remote_repo_url", i18nRef.current)}
            value={remoteUrlValue}
            variant="outlined"
            onChange={(e) => {
              setRemoteUrlValue(e.target.value);
              setRemoteUrlIsValid(true);
            }}
            helperText={doI18n(
              "pages:content:remote_url_requirement",
              i18nRef.current,
            )}
            error={remoteUrlIsValid === false}
          />
          <Box sx={{ pb: 3, pl: 1, pt: 1.5 }}>
            <Button
              onClick={handleRemoteUrlValidation}
              variant="outlined"
              color="secondary"
              size="small"
              disabled={
                remotes.filter((p) => p.name === "origin")[0]?.url ===
                  remoteUrlValue || remoteUrlValue === ""
              }
            >
              {doI18n("pages:content:do_update", i18nRef.current)}
            </Button>
          </Box>
        </Box>
        <Typography variant="body1" fontWeight="bold">
          {doI18n("pages:content:branches", i18nRef.current)}
        </Typography>
        <List component="nav" aria-label="dcs-branch-list">
          {branchList
            .filter((branch) => !branch.name.includes("/"))
            .map((branch, n) => {
              // console.log(`/api/git/branch/${branch.name}/${repoInfo}`);
              return (
                <ListItemButton
                  selected={selectedBranchIndex === n}
                  disabled={selectedBranchIndex === n}
                  sx={{
                    "&.Mui-disabled": {
                      backgroundColor: "#F5F5F5",
                      color: "black",
                      opacity: 1,
                    },
                  }}
                  onClick={(event) => {
                    checkoutBranch(repoInfo, branch.name).then();
                    handleListItemClick(event, n);
                  }}
                >
                  <ListItemIcon>
                    {selectedBranchIndex === n && <DoneIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" fontWeight="bold">
                        {branch.name}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })}
        </List>
        <Button
          variant="outlined"
          color="secondary"
          sx={{ width: "fit-content" }}
          onClick={(event) => setAddBranchAnchorEl(event.currentTarget)}
        >
          {doI18n("pages:content:add_branch", i18nRef.current)}
        </Button>
        <Popover
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          open={addBranchOpen}
          anchorEl={addBranchAnchorEl}
          onClose={() => setAddBranchAnchorEl(null)}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-end",
            }}
          >
            <Box>
              <TextField
                id="new-branch"
                fullWidth
                label={doI18n("pages:content:new_branch", i18nRef.current)}
                value={newBranchValue}
                variant="filled"
                sx={{
                  input: {
                    backgroundColor: "white",
                  },
                }}
                onChange={(e) => {
                  setNewBranchValue(e.target.value);
                  setIsNewBranchValid(true);
                }}
                error={!newBranchIsValid}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <IconButton
                onClick={handleNewBranchValidation}
                disabled={newBranchValue === ""}
              >
                <AddCircleOutlineOutlinedIcon />
              </IconButton>
            </Box>
          </Box>
        </Popover>
      </Stack>
    </Box>
  );
}

export default SettingsTab;
