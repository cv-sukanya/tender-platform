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

    await page.waitForSelector("table.list_table", {
      timeout: 15000
    });

    const tenders = await page.evaluate(() => {
      const data = [];

      const rows = document.querySelectorAll("table.list_table tr");

      rows.forEach((row) => {
        const cols = row.querySelectorAll("td");

        if (cols.length === 4) {
          const title = cols[0]?.innerText.trim();
          const tenderRefNo = cols[1]?.innerText.trim();
          const closingDate = cols[2]?.innerText.trim();
          const openingDate = cols[3]?.innerText.trim();

          let link = null;

          // Get all anchors from row
          const anchors = row.querySelectorAll("a");

          anchors.forEach((a) => {
            const href = a.href || "";
            const onclick = a.getAttribute("onclick") || "";
            const raw = href + " " + onclick + " " + a.outerHTML;

            // Extract sp parameter
            const spMatch = raw.match(/sp=([^"'&\s]+)/);

            if (spMatch) {
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
              department: "CPPP",
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

        tender.tender_id = details.tender_id;
        tender.location = details.location;
        tender.publish_date = details.publish_date;
        tender.bid_open_date = details.bid_open_date;

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
        bid_open_date: null
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

          if (label === "Location") {
            result.location = value;
          }

          if (label === "Publish Date") {
            result.publish_date = value;
          }

          if (label === "Bid Opening Date") {
            result.bid_open_date = value;
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
