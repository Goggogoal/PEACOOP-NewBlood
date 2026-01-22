// ============================================
// Opinion Helper Functions
// ============================================
function addOpinion(data) {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        let opinionSheet = ss.getSheetByName('Opinion');

        // Create Opinion sheet if it doesn't exist
        if (!opinionSheet) {
            opinionSheet = ss.insertSheet('Opinion');
            opinionSheet.getRange(1, 1, 1, 5).setValues([
                ['Timestamp', 'Title', 'Tags', 'Details', 'Submitted']
            ]);
            opinionSheet.getRange(1, 1, 1, 5).setFontWeight('bold');
        }

        // Add new row
        const newRow = [
            data.timestamp || new Date().toISOString(),
            data.title || '',
            data.tags || '',
            data.details || '',
            new Date()
        ];

        opinionSheet.appendRow(newRow);

        return {
            success: true,
            message: 'Opinion added successfully'
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

function getOpinions() {
    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const opinionSheet = ss.getSheetByName('Opinion');

        if (!opinionSheet) {
            return { opinions: [] };
        }

        const lastRow = opinionSheet.getLastRow();
        if (lastRow < 2) {
            return { opinions: [] };
        }

        const data = opinionSheet.getRange(2, 1, lastRow - 1, 5).getValues();

        const opinions = data.map(row => ({
            timestamp: row[0],
            title: row[1],
            tags: row[2],
            details: row[3],
            submitted: row[4]
        }));

        return { opinions: opinions };
    } catch (error) {
        return { error: error.message, opinions: [] };
    }
}
