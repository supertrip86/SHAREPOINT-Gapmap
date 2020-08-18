import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import "../src/css/main.css";
import { receiveData } from "./js/requests.js";
import { settingsTemplate, addSettingsListeners, settingsOptions } from "../src/js/settings.js";
import { headerTemplate, addHeaderListeners } from "../src/js/header.js";

initGapmap();

function initGapmap() {
    // const site = _spPageContextInfo.webServerRelativeUrl;
    const settingsList = 'gapmap-settings';
    const resourceList = 'gapmap-data';
    const resourceMetadata = 'SP.Data.GapmapdataListItem';

    // const userData = `${site}/_api/web/currentuser/?$expand=groups`;
    // const settingsData = `${site}/_api/web/lists/getbytitle('${settingsList}')/items${queryOptions('settings')}`;
    // const resourceData = `${site}/_api/web/lists/getbytitle('${resourceList}')/items${queryOptions('resources')}`;

    const userData = '/api/user.json';
    const settingsData = '/api/data.json';
    const resourceData = '/api/resources.json';

    receiveData(userData).then( (user) => {
        const isAdmin = !!user.d.Groups.results.filter( (i) => (i.Title == "Tools Owners")).length;

        receiveData(settingsData).then( (settings) => {
            const data = createData(settings.d.results[0], settingsList, resourceList, resourceMetadata);

            receiveData(resourceData).then( (resources) => {
                const dialog = document.getElementById("gapmap-dialog");
                const settingsButton = document.querySelector('.navbar-collapse');

                data.resources = resources.d.results.map( (item) => {
                    let resource = item;
                    resource.Data = JSON.parse(item.Data);

                    return resource;
                });

                document.getElementById("gapmap-header").innerHTML = headerTemplate(data);
                addHeaderListeners();

                if (isAdmin) {
                    dialog.innerHTML = settingsTemplate(data);

                    window.gapmap = new Settings(data, settingsOptions(data));
                    addSettingsListeners();

                } else {
                    settingsButton.remove();

                    window.gapmap = new GapMap(data);
                }

                // setInterval( () => {
                //     UpdateFormDigest(site, _spFormDigestRefreshInterval);
                // }, 15 * 60000);

            });
        });
    });
}

function queryOptions(target) {
    const columns = {
        settings: ["Id", "regions", "countries", "languages", "evidence", "interventions", "outcomes"],
        resources: ["Id", "Attachments", "AttachmentFiles", "Title", "label", "value", "Evidence", "Language", "Date", "Data", "Study", "Author0"]
    };

    const expand = `$expand=AttachmentFiles`;
    const select = `$select=${columns[target].join()}`;

    return `?${expand}&${select}`;
}

function createData(data, settingsList, resourceList, resourceMetadata) {
    let result = {};

    result.regions = JSON.parse(data.regions);
    result.countries = JSON.parse(data.countries);
    result.languages = JSON.parse(data.languages);
    result.evidence = JSON.parse(data.evidence);
    result.interventions = JSON.parse(data.interventions);
    result.outcomes = JSON.parse(data.outcomes);
    result.storage = {
        settingsId: data.Id,
        settingsList: settingsList,
        settingsMetadata: data.__metadata.type,
        resourceList: resourceList,
        resourceMetadata: resourceMetadata
    };

    return result;
}

class GapMap {
    constructor(data) {
        this.data = data;
    }
}

class Settings extends GapMap {
    constructor(data, options) {
        super(data);
        this.selectResource = options.selectResource;
        this.addDate = options.addDate;
        this.editDate = options.editDate;
        this.sortInterventions = options.sortInterventions;
        this.sortOutcomes = options.sortOutcomes;
        this.interventionsOrder = options.interventionsOrder;
        this.outcomesOrder = options.outcomesOrder;
    }
}