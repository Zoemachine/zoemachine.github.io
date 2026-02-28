// =============================================================================
// ZOE AI Website — Google Apps Script Backend
// =============================================================================
// SETUP INSTRUCTIONS:
// 1. Create a new Google Sheet
// 2. Create 3 tabs (sheets) named exactly: "Newsletter", "Bookings", "NDA Signatures"
// 3. Go to Extensions > Apps Script
// 4. Delete any existing code and paste this entire file
// 5. Click Deploy > New Deployment
// 6. Select type: "Web app"
// 7. Set "Execute as": Me
// 8. Set "Who has access": Anyone
// 9. Click Deploy, authorize when prompted
// 10. Copy the Web App URL — paste it into script.js where it says APPS_SCRIPT_URL
// =============================================================================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var now = new Date().toISOString();

    if (action === 'newsletter') {
      var sheet = ss.getSheetByName('Newsletter');
      if (!sheet) return error('Newsletter sheet not found');

      // Add headers if empty
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'Name', 'Email']);
      }

      // Check for duplicate email
      var emails = sheet.getRange(1, 3, Math.max(sheet.getLastRow(), 1), 1).getValues();
      for (var i = 0; i < emails.length; i++) {
        if (emails[i][0] === data.email) {
          return jsonResponse({ success: false, detail: 'This email is already signed up.' });
        }
      }

      sheet.appendRow([now, data.name, data.email]);
      return jsonResponse({ success: true });

    } else if (action === 'booking') {
      var sheet = ss.getSheetByName('Bookings');
      if (!sheet) return error('Bookings sheet not found');

      // Add headers if empty
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'Name', 'Email', 'Preferred Date', 'Preferred Time', 'Status']);
      }

      var row = sheet.getLastRow() + 1;
      sheet.appendRow([now, data.name, data.email, data.preferred_date, data.preferred_time, 'pending']);
      return jsonResponse({ success: true, booking_id: row });

    } else if (action === 'nda_sign') {
      var sheet = ss.getSheetByName('NDA Signatures');
      if (!sheet) return error('NDA Signatures sheet not found');

      // Add headers if empty
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['Timestamp', 'Booking Row', 'Full Name', 'Address', 'City', 'State', 'ZIP']);
      }

      sheet.appendRow([
        now,
        data.booking_id,
        data.full_name,
        data.address_line1,
        data.address_city,
        data.address_state,
        data.address_zip
      ]);

      // Update booking status to "confirmed" in Bookings sheet
      if (data.booking_id) {
        var bookings = ss.getSheetByName('Bookings');
        if (bookings && data.booking_id <= bookings.getLastRow()) {
          bookings.getRange(data.booking_id, 6).setValue('confirmed');
        }
      }

      return jsonResponse({ success: true, message: 'NDA signed and demo booking confirmed.' });

    } else {
      return error('Unknown action: ' + action);
    }

  } catch (err) {
    return error(err.toString());
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, detail: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Required for CORS — Apps Script needs this for cross-origin requests
function doGet(e) {
  return jsonResponse({ status: 'ok', service: 'zoe-website-apps-script' });
}
