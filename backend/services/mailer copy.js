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
      subject: `New Tender Added: ${tender.title}`,
      html: `
        <h2>New Tender Alert</h2>

        <p><strong>Title:</strong> ${tender.title}</p>
        <p><strong>Tender Ref No:</strong> ${tender.tender_ref_no}</p>
        <p><strong>Tender ID:</strong> ${tender.tender_id || "N/A"}</p>
        <p><strong>Department:</strong> ${tender.department}</p>
        <p><strong>Location:</strong> ${tender.location || "N/A"}</p>
        <p><strong>Category:</strong> ${tender.category}</p>
        <p><strong>Matched Keyword:</strong> ${tender.matched_keyword}</p>
        

        <p>
          <a href="${tender.tender_link}">
            View Tender Details
          </a>
        </p>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log("Email Sent:", tender.title);

  } catch (error) {
    console.log("Email Error:", error.message);
  }
}

module.exports = sendEmail;