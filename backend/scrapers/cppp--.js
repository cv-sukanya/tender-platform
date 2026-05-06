const puppeteer = require("puppeteer");

async function fetchCPPP() {
  const browser = await puppeteer.launch({
    headless: true
  });

  const page = await browser.newPage();

  try {
    await page.goto("https://eprocure.gov.in/eprocure/app", {
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

          // const linkElement = cols[0]?.querySelector("a");
          // const title = linkElement?.innerText.trim() || null;

          // const title = rawTitle
          //   ?.replace(/^\d+\.\s*/, "") // removes "*No*. before title "
          //   ?.trim();
          // const tenderRefNo = cols[1]?.innerText.trim();


          // Get all anchors from row
          // const anchors = row.querySelectorAll("a");

          // anchors.forEach((a) => {
          //   const href = a.href || "";
          //   const onclick = a.getAttribute("onclick") || "";

          //   const raw = href + " " + onclick;

          //   const spMatch = raw.match(/sp=([^"'&\s]+)/);

          //   if (spMatch && !link) {
          //     const spValue = spMatch[1];

          //     // Build REAL Tender Details URL
          //     link =
          //       "https://eprocure.gov.in/eprocure/app?component=%24DirectLink_0&page=FrontEndAdvancedSearchResult&service=direct&session=T&sp=" +
          //       spValue;
          //   }
          // });

          // New
          const linkElement = cols[0]?.querySelector("a");

          const title = linkElement?.innerText.trim() || null;

          const tenderRefNo = cols[1]?.innerText.replace(/\s+/g, " ").trim();
          const closingDate = cols[2]?.innerText.trim();
          const openingDate = cols[3]?.innerText.trim();

          let link = null;

          const href = linkElement?.href || "";
          const onclick = linkElement?.getAttribute("onclick") || "";

          const raw = href + " " + onclick;
          const spMatch = raw.match(/sp=([^"'&\s]+)/);

          if (spMatch) {
            link =
              "https://eprocure.gov.in/eprocure/app?component=%24DirectLink_0&page=FrontEndAdvancedSearchResult&service=direct&session=T&sp=" +
              spMatch[1];
          }

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

            const year = new Date().getFullYear();
            if (!closingDate.includes(year)) return;

            data.push({
              title,
              tender_ref_no: tenderRefNo,
              tender_link: link,
              // source: "CPPP",
              department: "CPPP",
              publish_date: null,
              // closing_date: closingDate,
              // bid_open_date: openingDate,
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

        // tender.tender_id = details.tender_id;
        // tender.location = details.location;
        // tender.publish_date = details.publish_date;
        // tender.bid_open_date = details.bid_open_date;
        // tender.bid_end_date = details.bid_end_date;
        // tender.category = details.category;

        Object.assign(tender, details);

        console.log({
          title: tender.title,
          tender_ref_no: tender.tender_ref_no,
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
        tender_ref_no: null,
        title: null,
        location: null,
        publish_date: null,
        bid_open_date: null,
        bid_end_date: null,
        category: null
      };

      const rows = document.querySelectorAll("tr");

      rows.forEach((row) => {
        const cells = row.querySelectorAll("td");

        for (let i = 0; i < cells.length; i++) {
          const label = cells[i]?.innerText?.trim();
          const value = cells[i + 1]?.innerText?.trim();

          if (!label || !value) continue;

          if (label === "Tender ID") {
            result.tender_id = value;
          }

          if (label.includes("Tender Reference Number")) {
            result.tender_ref_no = value;
          }

          if (label.includes("Work Description")) {
            result.title = value; 
          }

          if (label === "Location") {
            result.location = value;
          }

          if (label.includes("Published Date")) {
            result.publish_date = value;
          }

          if (label.includes("Bid Opening Date")) {
            result.bid_open_date = value;
          }

          if (label.includes("Bid Submission End Date")) {
            result.closing_date = value; // ✅ correct closing date
          }

          if (label.includes("Document Download / Sale End Date")) {
            result.document_end_date = value;
          }

          if (label.includes("Tender Value")) {
            result.tender_value = value.replace(/[₹,]/g, "").trim();
          }

          if (label.includes("Pincode")) {
            result.pincode = value;
          }

          if (label.includes("Product Category")) {
            result.product_category = value;
            result.category = value;
          }

          if (label.includes("Contract Type")) {
            result.contract_type = value;
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
