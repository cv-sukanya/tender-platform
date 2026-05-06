const express = require("express");
const router = express.Router();
const db = require("../config/db");

// Get all tenders
router.get("/", (req, res) => {

  // const query = `
  //   SELECT *
  //   FROM tenders
  //   ORDER BY closing_date DESC, id DESC
  // `;

  const query = `
    SELECT *
    FROM tenders
    ORDER BY publish_date DESC
  `;

  db.query(query, (err, results) => {

    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    res.json(results);
  });
});

// Get single tender
router.get("/:id", (req, res) => {

  const { id } = req.params;

  const query = `
    SELECT *
    FROM tenders
    WHERE id = ?
  `;

  db.query(query, [id], (err, results) => {

    if (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }

    res.json(results[0]);
  });
});

module.exports = router;