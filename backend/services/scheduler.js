const cron = require("node-cron");
const checkTenders = require("./tenderChecker");

cron.schedule("*/10 * * * *", async () => {
  console.log("Running Tender Check Every 10 Min...");
  await checkTenders();
});