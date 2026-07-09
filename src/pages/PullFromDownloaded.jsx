import { useContext } from "react";
import { DialogContent, DialogContentText, Typography } from "@mui/material";
import { postEmptyJson, getJson } from "pankosmia-lib/http";
import { doI18n } from "pankosmia-lib/i18n";
import {
  debugContext,
  i18nContext,
  PanDialog,
  PanDialogActions,
} from "pankosmia-rcl";
import { enqueueSnackbar } from "notistack";

function PullFromDownloaded({
  repoPath,
  repoName,
  open,
  closeFn,
  reposModCount,
  setReposModCount,
}) {
  const { i18nRef } = useContext(i18nContext);
  const { debugRef } = useContext(debugContext);

  const deleteUpdate = async (repoPath) => {
    const deleteUpdateUrl = `/api/git/delete/${repoPath}`;
    const deleteUpdateResponse = await postEmptyJson(
      deleteUpdateUrl,
      debugRef.current,
    );
    if (!deleteUpdateResponse) {
      return false;
    }
    return true;
  };

  const mergeFromDownloaded = async () => {
    // Get downloaded from the remotes for local
    let deleteStatus;
    const remoteListUrl = `/api/git/remotes/${repoPath}`;
    const remoteList = await getJson(remoteListUrl, debugRef.current);
    if (!remoteList.ok) {
      enqueueSnackbar(
        doI18n("pages:content:could_not_list_remotes", i18nRef.current),
        { variant: "error" },
      );
      closeFn();
      return;
    }
    const downloadRemote = remoteList.json.payload.remotes.filter(
      (i) => i.name === "downloaded",
    )[0];
    if (!downloadRemote) {
      enqueueSnackbar(
        doI18n(
          "pages:content:could_not_find_downloaded_remote",
          i18nRef.current,
        ),
        { variant: "error" },
      );
      closeFn();
      return;
    }
    const downloadRepoUri = downloadRemote.url;
    const downloadRepoPath = downloadRepoUri
      .replace("file://", "")
      .split("/")
      .reverse()
      .slice(0, 3)
      .reverse()
      .join("/");

    // Copy downloaded to updated
    const updateRepoPath = `_local_/_updates_/${repoPath.split("/")[2]}`;
    const copyUrl = `/api/git/copy/${downloadRepoPath}?target_path=${updateRepoPath}`;
    const copyResponse = await postEmptyJson(copyUrl, debugRef.current);
    if (!copyResponse.ok) {
      enqueueSnackbar(
        doI18n("pages:content:could_not_copy_repo_to_updates", i18nRef.current),
        { variant: "error" },
      );
      closeFn();
      return;
    }

    // Set editable remote for updated repo which is copy of downloaded
    const addEditableUrl = `/api/git/remote/add/${updateRepoPath}?remote_name=editable&remote_url=${repoPath}`;
    const addEditableResponse = await postEmptyJson(
      addEditableUrl,
      debugRef.current,
    );
    if (!addEditableResponse.ok) {
      enqueueSnackbar(
        doI18n(
          "pages:content:could_not_add_local_remote_to_updated",
          i18nRef.current,
        ),
        { variant: "error" },
      );
      closeFn();
      return;
    }

    // Attempt pull from editable to updated
    // If fail, delete updated and croak
    const pull1Url = `/api/git/pull-repo/editable/${updateRepoPath}`;
    const pull1Response = await postEmptyJson(pull1Url, debugRef.current);
    if (!pull1Response.ok) {
      enqueueSnackbar(
        doI18n("pages:content:could_not_pull_to_update", i18nRef.current),
        { variant: "error" },
      );

      deleteStatus = await deleteUpdate(updateRepoPath);
      if (!deleteStatus) {
        enqueueSnackbar(
          doI18n("pages:content:could_not_delete_update", i18nRef.current),
          { variant: "error" },
        );
      }
      closeFn();
      return;
    }

    // Check for conflicts
    if (pull1Response["has_conflicts"]) {
      enqueueSnackbar(
        doI18n("pages:content:merge conflicts", i18nRef.current),
        { variant: "error" },
      );
      deleteStatus = await deleteUpdate(updateRepoPath);
      if (!deleteStatus) {
        enqueueSnackbar(
          doI18n("pages:content:could_not_delete_update", i18nRef.current),
          { variant: "error" },
        );
      }
      closeFn();
      return;
    }

    // Pull from updated to local
    const pull2Url = `/api/git/pull-repo/updates/${repoPath}`;
    const pull2Response = await postEmptyJson(pull2Url, debugRef.current);
    if (!pull2Response.ok) {
      enqueueSnackbar(
        doI18n("pages:content:could_not_pull_to_local", i18nRef.current),
        { variant: "error" },
      );
      closeFn();
      return;
    }

    // Delete updated regardless
    deleteStatus = await deleteUpdate(updateRepoPath);
    if (!deleteStatus) {
      enqueueSnackbar(
        doI18n("pages:content:could_not_delete_update", i18nRef.current),
        { variant: "error" },
      );
    }

    // The end!
    enqueueSnackbar(doI18n("pages:content:pulled", i18nRef.current), {
      variant: "success",
    });
    closeFn();
  };

  return (
    <PanDialog
      titleLabel={doI18n("pages:content:pull_from_downloaded", i18nRef.current)}
      isOpen={open}
      CloseFn={closeFn}
      fullWidth={false}
    >
      <DialogContent>
        <DialogContentText>
          <Typography variant="h6">{repoName}</Typography>
        </DialogContentText>
      </DialogContent>
      <PanDialogActions
        actionFn={mergeFromDownloaded}
        actionLabel={doI18n(
          "pages:core-contenthandler_version_manager:synchronisation",
          i18nRef.current,
        )}
        closeFn={closeFn}
        closeLabel={doI18n("pages:content:cancel", i18nRef.current)}
      />
    </PanDialog>
  );
}

export default PullFromDownloaded;
