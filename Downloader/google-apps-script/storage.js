// GAS script to store a code received from a telegram user and return it by rest api request

const SECRET_KEY = '';
const USER_NAME = '';

function test() {
    const response1 = doPost({ postData: { contents: '{"message": { "text": "", "chat": { "id": 0 } } }' } });
    console.log(response1);

    const response2 = doGet({ parameter: { secretKey: SECRET_KEY, action: 'getCode', code: '1234' } });
    console.log(response2.getContent());
}

function logToSheet(data) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Log');
    sheet.appendRow([new Date(), data]);
}

function doGet(e) {
    if (e.parameter.secretKey !== SECRET_KEY) {
        logToSheet('Invalid secret key');
        return ContentService.createTextOutput('Invalid secret key');
    }

    const prop = PropertiesService.getScriptProperties();
    const code = prop.getProperty('code');
    prop.deleteProperty('code');

    logToSheet(`Code returned: ${code}`);
    return ContentService.createTextOutput(code);
}

function doPost(e) {
    logToSheet(JSON.stringify(e));
    try {
        if (e.parameter.secretKey !== SECRET_KEY) {
            logToSheet('Invalid secret key');
            return ContentService.createTextOutput('Invalid secret key');
        }

        const payload = JSON.parse(e.postData.contents);
        const from = payload.message.from.username;
        if (from !== USER_NAME) {
            logToSheet('Invalid user');
            return ContentService.createTextOutput('Invalid user');
        }

        const code = payload.message.text;
        const prop = PropertiesService.getScriptProperties();
        prop.setProperty('code', code);

        logToSheet(`Code stored: ${code}`);
    } catch (ex) {
        logToSheet(JSON.stringify(ex));
    }
}
