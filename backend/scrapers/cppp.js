const puppeteer = require("puppeteer");

async function fetchCPPP() {
  const browser = await puppeteer.launch({
    headless: true
  });

  const page = await browser.newPage();

  try {
    await page.goto("https://eprocure.gov.in/eprocure/app", {   //this opens the tender listitng page
      waitUntil: "domcontentloaded",
      timeout: 0
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Detect session timeout page
    const content = await page.content();

    if (content.includes("Your session has timed out")) {
      console.log("Session expired. Reloading...");

      await page.goto("https://eprocure.gov.in/eprocure/app", {
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
                "https://eprocure.gov.in/eprocure/app?component=%24DirectLink_0&page=FrontEndAdvancedSearchResult&service=direct&session=T&sp=" +
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
              department: null,
              source: "CPPP",
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

        for (let i = 0; i < cells.length - 1; i += 2) {

          const label = getCellText(cells[i]);
          const value = getCellText(cells[i + 1]);

          if (!label || !value) continue;

          const cleanLabel = label
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();

          // Basic Details
          if (cleanLabel.includes("tender id")) {
            result.tender_id = value;
          }

          if (cleanLabel.includes("organisation chain")) {
            result.organisation_chain = value;
          }

          if (cleanLabel.includes("tender type")) {
            result.tender_type = value;
          }

          if (cleanLabel.includes("tender category")) {
            result.tender_category = value;
          }

          if (cleanLabel.includes("form of contract")) {
            result.form_of_contract = value;
          }

          if (cleanLabel.includes("payment mode")) {
            result.payment_mode = value;
          }

          if (cleanLabel.includes("no. of covers")) {
            result.no_of_covers = value;
          }

          // Work Item Details
          if (cleanLabel === "location") {
            result.location = value;
          }

          if (cleanLabel.includes("work description")) {
            result.work_description = value;
          }

          if (cleanLabel.includes("tender value")) {
            result.tender_value = value.replace(/[₹,]/g, "").trim();
          }

          if (cleanLabel.includes("product category")) {
            result.product_category = value;
            result.category = value;
          }

          if (cleanLabel.includes("contract type")) {
            result.contract_type = value;
          }

          if (cleanLabel.includes("bid validity")) {
            result.bid_validity_days = value;
          }

          if (cleanLabel.includes("pincode")) {
            result.pincode = value;
          }

          if (cleanLabel.includes("period of work")) {
            result.period_of_work_days = value;
          }

          if (cleanLabel.includes("bid opening place")) {
            result.bid_opening_place = value;
          }

          // Critical Dates
          if (cleanLabel.includes("published date")) {
            result.publish_date = value;
          }

          if (cleanLabel.includes("bid opening date")) {
            result.bid_open_date = value;
          }

          if (cleanLabel.includes("bid submission end date")) {
            result.bid_end_date = value;
          }

          if (cleanLabel.includes("document download / sale start date")) {
            result.document_start_date = value;
          }

          if (cleanLabel.includes("document download / sale end date")) {
            result.document_end_date = value;
          }

          if (cleanLabel.includes("clarification start date")) {
            result.clarification_start_date = value;
          }

          if (cleanLabel.includes("clarification end date")) {
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

module.exports = fetchCPPP;
