const db = require("../config/db");

const fetchCPPP = require("../scrapers/cppp");
const fetchMaharashtra = require("../scrapers/maharashtra");

const sendEmail = require("./mailer");
const keywords = require("../config/keywords");

function matchKeyword(text) {
    const lowerText = text.toLowerCase();

    for (const category in keywords) {
        for (const keyword of keywords[category]) {

            const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, "i");

            if (regex.test(lowerText)) {
                return {
                    matched: true,
                    category,
                    keyword
                };
            }
        }
    }

    return { matched: false };
}

function formatDate(dateStr) {
    if (!dateStr) return null;

    const months = {
        Jan: "01",
        Feb: "02",
        Mar: "03",
        Apr: "04",
        May: "05",
        Jun: "06",
        Jul: "07",
        Aug: "08",
        Sep: "09",
        Oct: "10",
        Nov: "11",
        Dec: "12"
    };

    const match = dateStr.match(
        /(\d{1,2})-([A-Za-z]{3})-(\d{4})\s+(\d{1,2}:\d{2})\s+(AM|PM)/
    );

    if (!match) return null;

    const [, day, month, year, time, ampm] = match;

    let [hours, minutes] = time.split(":");

    hours = parseInt(hours);

    if (ampm === "PM" && hours < 12) {
        hours += 12;
    }

    if (ampm === "AM" && hours === 12) {
        hours = 0;
    }

    return `${year}-${months[month]}-${day.padStart(2, "0")} ${String(hours).padStart(2, "0")}:${minutes}:00`;
}

async function checkTenders() {
    try {

        // Run all scrapers simultaneously
        const [
            cpppTenders,
            maharashtraTenders
        ] = await Promise.all([
            fetchCPPP(),
            fetchMaharashtra()
        ]);

        const tenders = [
            ...cpppTenders,
            ...maharashtraTenders
        ];

        console.log("TOTAL SCRAPED:", tenders.length);

        for (let tender of tenders) {

            const searchableText = `
                ${tender.title || ""}
                ${tender.department || ""}
                ${tender.location || ""}
                ${tender.tender_ref_no || ""}
                ${tender.work_description || ""}
            `;

            const keywordResult = matchKeyword(searchableText);

            console.log("Tender:", tender.title);
            console.log("Keyword Result:", keywordResult);

            // if (!keywordResult.matched) continue;

            tender.category = keywordResult.category;
            tender.matched_keyword = keywordResult.keyword;

            // Format dates
            tender.publish_date = formatDate(tender.publish_date);
            tender.closing_date = formatDate(tender.closing_date);
            tender.bid_open_date = formatDate(tender.bid_open_date);
            tender.bid_end_date = formatDate(tender.bid_end_date);

            if (tender.tender_value) {
                tender.tender_value = String(tender.tender_value)
                    .replace(/[₹,]/g, "")
                    .trim();
            }

            // Validation
            if (!tender.tender_ref_no) {
                console.log("Skipping invalid tender");
                continue;
            }

            const checkQuery =
                "SELECT id FROM tenders WHERE tender_ref_no = ? LIMIT 1";

            db.query(checkQuery, [tender.tender_ref_no], (err, result) => {

                if (err) {
                    console.log("DB Check Error:", err);
                    return;
                }

                if (result.length === 0) {

                    const insertQuery = `
                        INSERT INTO tenders
                        (
                            tender_ref_no,
                            tender_id,
                            title,
                            work_description,
                            department,
                            organisation_chain,
                            tender_type,
                            tender_category,
                            contract_type,
                            form_of_contract,
                            category,
                            source,
                            location,
                            pincode,
                            tender_value,
                            product_category,
                            bid_validity_days,
                            period_of_work_days,
                            no_of_covers,
                            payment_mode,
                            bid_opening_place,
                            document_start_date,
                            document_end_date,
                            clarification_start_date,
                            clarification_end_date,
                            publish_date,
                            closing_date,
                            bid_open_date,
                            bid_end_date,
                            tender_link
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;

                    console.log("INSERT VALUES:");
                    console.log([
                        tender.tender_ref_no,
                        tender.tender_id,
                        tender.title,
                        tender.work_description,
                        tender.department,
                        tender.organisation_chain,
                        tender.tender_type,
                        tender.tender_category,
                        tender.contract_type,
                        tender.form_of_contract,
                        tender.category,
                        tender.source,
                        tender.location,
                        tender.pincode,
                        tender.tender_value,
                        tender.product_category,
                        tender.bid_validity_days,
                        tender.publish_date,
                        tender.closing_date,
                        tender.bid_open_date,
                        tender.bid_end_date,
                        tender.tender_link
                    ]);

                    console.log("READY TO INSERT:", tender.tender_ref_no);

                    db.query(
                        insertQuery,
                        [
                            tender.tender_ref_no || null,
                            tender.tender_id || null,
                            tender.title || null,
                            tender.work_description || null,
                            tender.department || null,
                            tender.organisation_chain || null,
                            tender.tender_type || null,
                            tender.tender_category || null,
                            tender.contract_type || null,
                            tender.form_of_contract || null,
                            tender.category || null,
                            tender.source || "CPPP",
                            tender.location || null,
                            tender.pincode || null,
                            tender.tender_value || null,
                            tender.product_category || null,
                            tender.bid_validity_days || null,
                            tender.period_of_work_days || null,
                            tender.no_of_covers || null,
                            tender.payment_mode || null,
                            tender.bid_opening_place || null,
                            tender.document_start_date || null,
                            tender.document_end_date || null,
                            tender.clarification_start_date || null,
                            tender.clarification_end_date || null,
                            tender.publish_date || null,
                            tender.closing_date || null,
                            tender.bid_open_date || null,
                            tender.bid_end_date || null,
                            tender.tender_link || null
                        ],
                        async (insertErr) => {

                            // if (insertErr) {
                            //     console.log("FULL INSERT ERROR:", insertErr.sqlMessage);
                            //     return;
                            // }

                            if (insertErr) {
                                console.log("========== INSERT ERROR ==========");
                                console.log(insertErr);
                                console.log("SQL Message:", insertErr.sqlMessage);
                                console.log("SQL State:", insertErr.sqlState);
                                console.log("SQL Code:", insertErr.code);
                                console.log("==================================");
                                return;
                            }

                            console.log("Inserted:", tender.title);

                            await sendEmail(tender);
                        }
                    );
                }
            });
        }

        // Cleanup old tenders
        db.query(`
            DELETE FROM tenders
            WHERE closing_date < DATE_SUB(NOW(), INTERVAL 1 DAY)
        `);

    } catch (error) {
        console.log("Tender Checker Error:", error);
    }
}

module.exports = checkTenders;