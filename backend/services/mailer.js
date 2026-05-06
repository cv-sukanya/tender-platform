const nodemailer = require("nodemailer");

async function sendEmail(tender) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.RECEIVER_EMAIL,
      subject: `New Tender Match: ${tender.title}`,
      html: `
        <div style="font-family: Arial; padding:20px; line-height:1.8; background:#f7f7f7;">

          <div style="
            max-width:800px;
            margin:auto;
            background:white;
            border-radius:10px;
            padding:30px;
            box-shadow:0 2px 10px rgba(0,0,0,0.08);
          ">

            <h2 style="color:#0d6efd; margin-bottom:20px;">
              New Tender Match Found
            </h2>

            <h3 style="margin-bottom:15px; color:#222;">
              ${tender.title || "N/A"}
            </h3>

            <table style="width:100%; border-collapse:collapse;">

              <tr>
                <td style="padding:8px;"><strong>Category</strong></td>
                <td>${tender.category || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Matched Keyword</strong></td>
                <td>${tender.matched_keyword || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Tender Ref No</strong></td>
                <td>${tender.tender_ref_no || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Tender ID</strong></td>
                <td>${tender.tender_id || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Department</strong></td>
                <td>${tender.department || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Organisation Chain</strong></td>
                <td>${tender.organisation_chain || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Tender Type</strong></td>
                <td>${tender.tender_type || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Tender Category</strong></td>
                <td>${tender.tender_category || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Form Of Contract</strong></td>
                <td>${tender.form_of_contract || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Contract Type</strong></td>
                <td>${tender.contract_type || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Location</strong></td>
                <td>${tender.location || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Pincode</strong></td>
                <td>${tender.pincode || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Tender Value</strong></td>
                <td>₹ ${tender.tender_value || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Product Category</strong></td>
                <td>${tender.product_category || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Bid Validity</strong></td>
                <td>${tender.bid_validity_days || "N/A"} Days</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Published Date</strong></td>
                <td>${tender.publish_date || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Closing Date</strong></td>
                <td>${tender.closing_date || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Bid Open Date</strong></td>
                <td>${tender.bid_open_date || "N/A"}</td>
              </tr>

              <tr>
                <td style="padding:8px;"><strong>Work Description</strong></td>
                <td>${tender.work_description || "N/A"}</td>
              </tr>

            </table>

            <div style="margin-top:30px; text-align:center;">
              <a href="${tender.tender_link}"
                style="
                  background:#0d6efd;
                  color:white;
                  padding:14px 24px;
                  text-decoration:none;
                  border-radius:8px;
                  display:inline-block;
                  font-weight:bold;
                ">
                View Tender Details
              </a>
            </div>

            <hr style="margin-top:30px;">

            <p style="font-size:12px;color:#666;text-align:center;">
              Auto-generated Tender Notification System
            </p>

          </div>
        </div>
        `
    };

    await transporter.sendMail(mailOptions);

    console.log("Email Sent:", tender.title);

  } catch (error) {
    console.log("Email Error:", error.message);
  }
}

module.exports = sendEmail;