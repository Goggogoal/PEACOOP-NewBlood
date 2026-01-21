/**
 * PEA Cooperative Election Campaign Website
 * Google Apps Script - Web App API
 * 
 * วิธีใช้งาน:
 * 1. เปิด Google Sheets ที่ต้องการใช้
 * 2. ไปที่ Extensions > Apps Script
 * 3. ลบโค้ดเดิมทั้งหมด และ copy โค้ดนี้ไปวาง
 * 4. บันทึกโปรเจค (Ctrl+S)
 * 5. Deploy > New deployment > Web app
 * 6. Execute as: Me, Who has access: Anyone
 * 7. Copy Web App URL ไปใส่ใน scripts.js ของเว็บไซต์
 */

// ============================================
// Main Entry Point - Handle GET Requests
// ============================================
function doGet(e) {
    const response = handleRequest(e);
    const jsonResponse = JSON.stringify(response);

    // Check for JSONP callback
    const callback = e.parameter.callback;

    if (callback) {
        // Return JSONP format for cross-origin requests
        return ContentService.createTextOutput(callback + '(' + jsonResponse + ')')
            .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    // Return regular JSON (works with Apps Script's built-in CORS handling)
    return ContentService.createTextOutput(jsonResponse)
        .setMimeType(ContentService.MimeType.JSON);
}

function handleRequest(e) {
    try {
        const sheetName = e.parameter.sheet || 'candidates';
        const action = e.parameter.action || 'getAll';

        switch (action) {
            case 'getAll':
                return getAllData(sheetName);
            case 'getById':
                return getDataById(sheetName, e.parameter.id);
            default:
                return { error: 'Invalid action' };
        }
    } catch (error) {
        return { error: error.message };
    }
}

// ============================================
// Data Fetching Functions
// ============================================

/**
 * Get all data from a sheet
 * @param {string} sheetName - Name of the sheet
 * @returns {Array} - Array of objects
 */
function getAllData(sheetName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        return { error: `Sheet '${sheetName}' not found` };
    }

    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
        return [];
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Convert rows to objects
    const result = rows
        .filter(row => row.some(cell => cell !== '')) // Skip empty rows
        .map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                let value = row[index];

                // Handle special column types
                if (header.toLowerCase().includes('date') && value instanceof Date) {
                    value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
                }

                // Handle tags (comma-separated to array)
                if (header === 'tags' && typeof value === 'string') {
                    value = value.split(',').map(tag => tag.trim()).filter(tag => tag);
                }

                obj[header] = value;
            });
            return obj;
        });

    return result;
}

/**
 * Get single record by ID
 * @param {string} sheetName - Name of the sheet
 * @param {string} id - ID to search for
 * @returns {Object} - Single data object
 */
function getDataById(sheetName, id) {
    const allData = getAllData(sheetName);

    if (allData.error) {
        return allData;
    }

    const record = allData.find(item =>
        item.id == id || item.candidateNumber == id
    );

    return record || { error: 'Record not found' };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Test function - Run this to test your setup
 */
function testGetAllCandidates() {
    const result = getAllData('candidates');
    Logger.log(JSON.stringify(result, null, 2));
}

/**
 * Test function - Get all policies
 */
function testGetAllPolicies() {
    const result = getAllData('policies');
    Logger.log(JSON.stringify(result, null, 2));
}

/**
 * Test function - Get all articles
 */
function testGetAllArticles() {
    const result = getAllData('articles');
    Logger.log(JSON.stringify(result, null, 2));
}

/**
 * Create sample sheets with headers
 * Run this function once to create all required sheets
 */
function createSampleSheets() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Sheet configurations
    const sheets = {
        'candidates': [
            'candidateNumber', 'imageUrl', 'name', 'position', 'experience', 'projects'
        ],
        'policies': [
            'id', 'icon', 'title', 'description', 'tags'
        ],
        'articles': [
            'id', 'imageUrl', 'category', 'date', 'title', 'excerpt', 'link'
        ],
        'downloads': [
            'id', 'filename', 'fileType', 'fileSize', 'url'
        ],
        'timelines': [
            'id', 'candidateNumber', 'year', 'role', 'description'
        ]
    };

    // Create each sheet
    Object.keys(sheets).forEach(sheetName => {
        let sheet = ss.getSheetByName(sheetName);

        if (!sheet) {
            sheet = ss.insertSheet(sheetName);
        }

        // Set headers in first row
        const headers = sheets[sheetName];
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

        // Format headers
        sheet.getRange(1, 1, 1, headers.length)
            .setFontWeight('bold')
            .setBackground('#FFD700')
            .setFontColor('#1A1A2E');

        // Auto-resize columns
        headers.forEach((_, index) => {
            sheet.autoResizeColumn(index + 1);
        });
    });

    Logger.log('All sample sheets created successfully!');
}

/**
 * Add sample data to sheets
 * Run this function to populate sheets with sample data
 */
function addSampleData() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Sample Candidates
    const candidatesSheet = ss.getSheetByName('candidates');
    if (candidatesSheet && candidatesSheet.getLastRow() < 2) {
        candidatesSheet.getRange(2, 1, 2, 6).setValues([
            [9, 'https://via.placeholder.com/300x400/FFD700/1A1A2E?text=เบอร์+9', 'นายวสิษฐ์พล แสงทอง', 'ผู้สมัครกรรมการสหกรณ์ กฟภ.', 15, 10],
            [10, 'https://via.placeholder.com/300x400/E53935/FFFFFF?text=เบอร์+10', 'นายวุฒิชัย กำจรกิตติคุณ', 'ผู้สมัครกรรมการสหกรณ์ กฟภ.', 12, 8]
        ]);
    }

    // Sample Policies
    const policiesSheet = ss.getSheetByName('policies');
    if (policiesSheet && policiesSheet.getLastRow() < 2) {
        policiesSheet.getRange(2, 1, 4, 5).setValues([
            [1, 'fa-mobile-alt', 'เช็คยอดกู้ออนไลน์', 'ตรวจสอบยอดเงินกู้และสถานะได้ทุกที่ ทุกเวลา ผ่านระบบออนไลน์ที่ใช้งานง่าย', '24/7, Real-time'],
            [2, 'fa-calendar-check', 'Smart Queue', 'ระบบจองคิวอัจฉริยะ ลดเวลารอคอย เลือกวันเวลาที่สะดวกได้ล่วงหน้า', 'จองออนไลน์, แจ้งเตือน'],
            [3, 'fa-shield-alt', 'โปร่งใส 100%', 'ทุกขั้นตอนชัดเจน ตรวจสอบได้ เปิดเผยข้อมูลการดำเนินงานต่อสมาชิก', 'ตรวจสอบได้, รายงานประจำ'],
            [4, 'fa-file-signature', 'ลดเอกสารกู้', 'ลดขั้นตอนเอกสารที่ซับซ้อน ใช้ระบบดิจิทัลแทน อนุมัติเร็วขึ้น', 'Paperless, อนุมัติเร็ว']
        ]);
    }

    // Sample Articles
    const articlesSheet = ss.getSheetByName('articles');
    if (articlesSheet && articlesSheet.getLastRow() < 2) {
        articlesSheet.getRange(2, 1, 3, 7).setValues([
            [1, 'https://via.placeholder.com/400x250/FFD700/1A1A2E?text=บทความ+1', 'ข่าวสาร', new Date(), 'เปิดตัวนโยบาย Smart Queue ลดเวลารอคิว', 'นโยบายใหม่ที่จะช่วยลดเวลารอคิวของสมาชิกสหกรณ์...', '#'],
            [2, 'https://via.placeholder.com/400x250/E53935/FFFFFF?text=บทความ+2', 'กิจกรรม', new Date(), 'พบปะสมาชิกสหกรณ์ประจำเดือน', 'กิจกรรมพบปะและรับฟังความคิดเห็นจากสมาชิก...', '#'],
            [3, 'https://via.placeholder.com/400x250/1A1A2E/FFD700?text=บทความ+3', 'นโยบาย', new Date(), 'แผนพัฒนาระบบ IT สหกรณ์', 'แผนการพัฒนาระบบเทคโนโลยีสารสนเทศเพื่อสมาชิก...', '#']
        ]);
    }

    // Sample Downloads
    const downloadsSheet = ss.getSheetByName('downloads');
    if (downloadsSheet && downloadsSheet.getLastRow() < 2) {
        downloadsSheet.getRange(2, 1, 3, 5).setValues([
            [1, 'นโยบายผู้สมัครเบอร์ 9 และ 10', 'PDF', '2.5 MB', '#'],
            [2, 'ประวัติผู้สมัครฉบับเต็ม', 'PDF', '1.8 MB', '#'],
            [3, 'โปสเตอร์หาเสียง', 'PNG', '5.2 MB', '#']
        ]);
    }

    // Sample Timelines
    const timelinesSheet = ss.getSheetByName('timelines');
    if (timelinesSheet && timelinesSheet.getLastRow() < 2) {
        timelinesSheet.getRange(2, 1, 6, 5).setValues([
            [1, 9, '2563-ปัจจุบัน', 'กรรมการสหกรณ์ กฟภ.', 'ดูแลด้านเทคโนโลยีและนวัตกรรม'],
            [2, 9, '2558-2563', 'หัวหน้าแผนกบริการลูกค้า', 'พัฒนาระบบบริการออนไลน์'],
            [3, 9, '2553-2558', 'พนักงาน กฟภ.', 'เริ่มต้นการทำงานที่ กฟภ.'],
            [4, 10, '2562-ปัจจุบัน', 'ที่ปรึกษาสหกรณ์', 'ให้คำปรึกษาด้านการเงินและการลงทุน'],
            [5, 10, '2557-2562', 'ผู้จัดการฝ่ายการเงิน', 'บริหารงานด้านการเงินและบัญชี'],
            [6, 10, '2552-2557', 'พนักงาน กฟภ.', 'เริ่มต้นการทำงานที่ กฟภ.']
        ]);
    }

    Logger.log('Sample data added successfully!');
}
