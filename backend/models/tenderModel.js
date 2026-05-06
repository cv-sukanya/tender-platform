const db = require("../config/db");

const insertTender = (data, callback) => {
  const query = `
    INSERT INTO tenders
    (tender_id, title, department, publish_date, closing_date, tender_link)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [
      data.tender_id,
      data.title,
      data.department,
      data.publish_date,
      data.closing_date,
      data.tender_link
    ],
    callback
  );
};

module.exports = { insertTender };