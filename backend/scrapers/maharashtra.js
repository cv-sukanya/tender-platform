const puppeteer = require("puppeteer");

async function fetchMaharashtra() {
  // const browser = await puppeteer.launch({
  //   headless: true
  // });

  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ]
  });

  const page = await browser.newPage();

  try {
    await page.goto("https://mahatenders.gov.in/nicgep/app", {   //this opens the tender listitng page
      waitUntil: "domcontentloaded",
      timeout: 0
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Detect session timeout page
    const content = await page.content();

    if (content.includes("Your session has timed out")) {
      console.log("Session expired. Reloading...");

      await page.goto("https://mahatenders.gov.in/nicgep/app", {
        waitUntil: "networkidle2",
        timeout: 0
      });

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    await page.waitForTimeout?.(5000);
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("Page Loaded");

    const pageHTML = await page.content();
    console.log("HTML Length:", pageHTML.length);

    const tables = await page.$$eval("table", tables => tables.length);
    console.log("Tables Found:", tables);

    const tenders = await page.evaluate(() => {
      const data = [];

      const rows = document.querySelectorAll("#activeTenders tr");

      rows.forEach((row) => {
        const cols = row.querySelectorAll("td");

        if (cols.length >= 4) {
          // const rawTitle = cols[0]?.innerText.trim();

          const linkElement = cols[0]?.querySelector("a");
          const title = linkElement?.innerText.trim() || null;

          // const title = rawTitle
          //   ?.replace(/^\d+\.\s*/, "") // removes "*No*. before title "
          //   ?.trim();
          // const tenderRefNo = cols[1]?.innerText.trim();
          const tenderRefNo = cols[1]?.innerText.replace(/\s+/g, " ").trim();
          const closingDate = cols[2]?.innerText.trim();
          const openingDate = cols[3]?.innerText.trim();

          let link = null;

          // Get all anchors from row
          const anchors = row.querySelectorAll("a");

          anchors.forEach((a) => {
            const href = a.href || "";
            const onclick = a.getAttribute("onclick") || "";

            const raw = href + " " + onclick;

            const spMatch = raw.match(/sp=([^"'&\s]+)/);

            if (spMatch && !link) {
              const spValue = spMatch[1];

              // Build REAL Tender Details URL
              link =
                "https://mahatenders.gov.in/nicgep/app?component=%24DirectLink_0&page=FrontEndAdvancedSearchResult&service=direct&session=T&sp=" +
                spValue;
            }
          });

          console.log({
            title,
            extractedLink: link
          });
          if (
            title &&
            tenderRefNo &&
            title !== "Tender Title" &&
            tenderRefNo !== "Reference No"
          ) {


            data.push({
              tender_ref_no: tenderRefNo,
              title,
              department: "Maharashtra Govt Tenders",
              publish_date: null,
              closing_date: closingDate,
              bid_open_date: openingDate,
              tender_link: link,
              tender_id: null,
              location: null
            });
          }
        }
      });

      console.log("Rows Parsed:", data.length);
      return data;
    });

    console.log("SCRAPED LINKS:");

    tenders.forEach((t) => {
      console.log("Title:", t.title);
      console.log("Tender Link:", t.tender_link);
    });

    for (let tender of tenders) {
      if (tender.tender_link) {
        const details = await fetchTenderDetails(
          browser,
          tender.tender_link
        );

        if (details.skip) {
          continue;
        }

        Object.assign(tender, details);

        console.log({
          title: tender.title,
          tender_id: tender.tender_id,
          location: tender.location,
          publish_date: tender.publish_date,
          bid_open_date: tender.bid_open_date
        });
      }
    }

    console.log("Fetched Tenders:", tenders.length);

    return tenders;

  } catch (err) {
    console.log("Scraper Error:", err.message);
    return [];
  } finally {
    await browser.close();
  }
}

async function fetchTenderDetails(browser, url) {
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 0
    });

    await page.waitForSelector("table", {
      timeout: 15000
    });

    const pageHeading = await page.evaluate(() => {
      return document.body.innerText || "";
    });

    // Skip Corrigendum pages
    if (pageHeading.includes("Corrigendum Details")) {
      console.log("Skipping Corrigendum Page:", url);

      await page.close();

      return {
        tender_id: null,
        location: null,
        publish_date: null,
        bid_open_date: null,
        skip: true
      };
    }

    const details = await page.evaluate(() => {

      const result = {
        tender_id: null,
        location: null,
        publish_date: null,
        bid_open_date: null,
        bid_end_date: null,
        category: null,

        organisation_chain: null,
        tender_type: null,
        tender_category: null,
        contract_type: null,
        form_of_contract: null,

        work_description: null,
        tender_value: null,
        product_category: null,
        bid_validity_days: null,
        pincode: null,

        payment_mode: null,
        no_of_covers: null,
        bid_opening_place: null,
        period_of_work_days: null,

        document_start_date: null,
        document_end_date: null,

        clarification_start_date: null,
        clarification_end_date: null
      };

      const rows = document.querySelectorAll("tr");

      const getCellText = (cell) => {
        return cell?.innerText?.trim() || null;
      };

      rows.forEach((row) => {

        const cells = row.querySelectorAll("td");

        for (let i = 0; i < cells.length; i++) {

          const label = getCellText(cells[i]);
          const value = getCellText(cells[i + 1]);

          if (!label || !value) continue;

          // Basic Details
          if (label.includes("Tender ID")) {
            result.tender_id = value;
          }

          if (label.includes("Organisation Chain")) {
            result.organisation_chain = value;
          }

          if (label.includes("Tender Type")) {
            result.tender_type = value;
          }

          if (label.includes("Tender Category")) {
            result.tender_category = value;
          }

          if (label.includes("Form Of Contract")) {
            result.form_of_contract = value;
          }

          if (label.includes("Payment Mode")) {
            result.payment_mode = value;
          }

          if (label.includes("No. of Covers")) {
            result.no_of_covers = value;
          }

          // Work Item Details
          if (label.includes("Location")) {
            result.location = value;
          }

          if (label.includes("Work Description")) {
            result.work_description = value;
          }

          if (label.includes("Tender Value")) {
            result.tender_value = value.replace(/[₹,]/g, "").trim();
          }

          if (label.includes("Product Category")) {
            result.product_category = value;
            result.category = value;
          }

          if (label.includes("Contract Type")) {
            result.contract_type = value;
          }

          if (label.includes("Bid Validity")) {
            result.bid_validity_days = value;
          }

          if (label.includes("Pincode")) {
            result.pincode = value;
          }

          if (label.includes("Period Of Work")) {
            result.period_of_work_days = value;
          }

          if (label.includes("Bid Opening Place")) {
            result.bid_opening_place = value;
          }

          // Critical Dates
          if (label.includes("Published Date")) {
            result.publish_date = value;
          }

          if (label.includes("Bid Opening Date")) {
            result.bid_open_date = value;
          }

          if (label.includes("Bid Submission End Date")) {
            result.bid_end_date = value;
          }

          if (label.includes("Document Download / Sale Start Date")) {
            result.document_start_date = value;
          }

          if (label.includes("Document Download / Sale End Date")) {
            result.document_end_date = value;
          }

          if (label.includes("Clarification Start Date")) {
            result.clarification_start_date = value;
          }

          if (label.includes("Clarification End Date")) {
            result.clarification_end_date = value;
          }
        }
      });

      return result;
    });

    await page.close();

    return details;

  } catch (err) {
    console.log("Detail Page Error:", err.message);

    await page.close();

    return {
      tender_id: null,
      location: null,
      publish_date: null,
      bid_open_date: null,
      skip: false
    };
  }
}

module.exports = fetchMaharashtra;
