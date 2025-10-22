import { useState, useContext, useEffect } from 'react';
import {
    Box,
    Tabs,
    Tab,
    Typography,
    Dialog,
    DialogActions,
    Button
} from "@mui/material";
import PropTypes from 'prop-types';
import { debugContext, i18nContext, doI18n, getJson, Header } from "pithekos-lib";
import ChangesTab from './ChangesTab';
import SettingsTab from './SettingsTab';

function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

CustomTabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

function VersionManager() {
    const { i18nRef } = useContext(i18nContext);
    const [tabValue, setTabValue] = useState(0);
    const [remoteUrlExists, setRemoteUrlExists] = useState(true);
    const [bookNames, setBookNames] = useState([]);
    const [repoPath, setRepoPath] = useState([]);
    const [open, setOpen] = useState(true);
    const [repoName, setRepoName] = useState([]);
    /* const [fullWidth, setFullWidth] = useState(true);
    const [maxWidth, setMaxWidth] = useState('lg'); */

    const handleTabsChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleClose = () => {
       setOpen(false);
        setTimeout(() => {
            window.location.href = '/clients/content';
        }, 300);
    }
    const getProjectSummaries = async () => {
        const hash = window.location.hash;
        const query = hash.includes('?') ? hash.split('?')[1] : '';
        const params = new URLSearchParams(query);
        const path = params.get('repoPath');
        setRepoPath(path);
        const summariesResponse = await getJson(`/burrito/metadata/summary/${path}`, debugContext.current);
        if (summariesResponse.ok) {
            const data = summariesResponse.json;
            const bookCode = data.book_codes;
            setBookNames(bookCode);
            const name = data.name;
            setRepoName(name);
        } else {
            console.error(" Erreur lors de la récupération des données.");
        }
    };
    useEffect(
        () => {
            getProjectSummaries();
        },
        []
    );
    return (
        <Box>
            <Box
                sx={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    zIndex: -1,
                    backgroundImage:
                        'url("/app-resources/pages/content/background_blur.png")',
                    backgroundRepeat: "no-repeat",
                }}
            />
            <Header
                titleKey="pages:content:title"
                currentId="content"
                requireNet={false}

            />
            <Dialog
                fullWidth={true}
                maxWidth="lg"
                open={open}
                onClose={handleClose}
                sx={{
                    backdropFilter:"blur(3px)"
                }}
            >
                <Box sx={{padding:1}}>
                    <Typography variant="h6" component="div" fontWeight="bold">{doI18n("pages:content:version_manager", i18nRef.current)}</Typography>
                    <Typography variant="subtitle1" component="div" fontWeight="bold"> {repoName} </Typography>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs
                            value={tabValue}
                            //variant="fullWidth"
                            onChange={handleTabsChange}
                            aria-label="version manager tabs"
                            //centered
                        >
                            <Tab label={doI18n("pages:content:changes_tab", i18nRef.current)} {...a11yProps(0)} />
                            <Tab label={doI18n("pages:content:settings_tab", i18nRef.current)} {...a11yProps(1)} />
                        </Tabs>
                    </Box>
                    <CustomTabPanel value={tabValue} index={0}>
                        <ChangesTab
                            repoPath={repoPath}
                            repoName={repoName}
                            open={tabValue === 0}
                            setTabValue={setTabValue}
                            setRemoteUrlExists={setRemoteUrlExists}
                        />
                    </CustomTabPanel>
                    <CustomTabPanel value={tabValue} index={1}>
                        <SettingsTab
                            repoInfo={repoPath}
                            open={tabValue === 1}
                            remoteUrlExists={remoteUrlExists}
                            setRemoteUrlExists={setRemoteUrlExists}
                        />
                    </CustomTabPanel>
                </Box>
                 <DialogActions>
                    <Button
                        onClick={handleClose}
                        color='primary'
                    >
                        {doI18n("pages:content:close", i18nRef.current)}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default VersionManager;