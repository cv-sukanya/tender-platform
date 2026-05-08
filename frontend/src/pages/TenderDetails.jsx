import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";

function TenderDetails() {
  const { id } = useParams();

  const [tender, setTender] = useState(null);

  useEffect(() => {
    fetchTender();
  }, []);

  const fetchTender = async () => {
    try {
      // const response = await axios.get(
      //   `https://tender-platform-d2tv.onrender.com/api/tenders/${id}`,
      // );

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/tenders`,
      );

      setTender(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;

    const day = String(date.getDate()).padStart(2, "0");
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year} ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  };

  if (!tender) {
    return (
      <div style={{ padding: "40px" }}>
        <h2>Loading Tender...</h2>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px",
        background: "#f4f6f8",
        minHeight: "100vh",
      }}
    >
      <Link
        to="/"
        style={{
          textDecoration: "none",
          color: "#0d6efd",
          fontWeight: "600",
        }}
      >
        ← Back to Dashboard
      </Link>

      <div
        style={{
          marginTop: "20px",
          background: "white",
          borderRadius: "14px",
          padding: "35px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <p>
          <strong>Title</strong>
        </p>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bolder",
            color: "#b70303",
          }}
        >
          {tender.title}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            // gap: "2px",
            marginTop: "10px",
          }}
        >
          <p>
            <strong>Tender Ref No:</strong> {tender.tender_ref_no}
          </p>

          <p>
            <strong>Tender ID:</strong> {tender.tender_id}
          </p>

          {/* <p><strong>Department:</strong> {tender.department}</p> */}

          {/* <p><strong>Organisation:</strong> {tender.organisation_chain}</p> */}

          <p>
            <strong>Location:</strong> {tender.location}
          </p>

          <p>
            <strong>Product Category:</strong> {tender.product_category}
          </p>

          <p>
            <strong>Tender Type:</strong> {tender.tender_type}
          </p>

          <p>
            <strong>Contract Type:</strong> {tender.contract_type}
          </p>

          <p>
            <strong>Tender Value (₹):</strong> {tender.tender_value || "N/A"}
          </p>

          <p>
            <strong>Pincode:</strong> {tender.pincode}
          </p>

          <p>
            <strong>Publish Date:</strong> {formatDate(tender.publish_date)}
          </p>

          <p>
            <strong>Document Download / Sale Start Date:</strong>{" "}
            {formatDate(tender.document_start_date)}
          </p>
          <p>
            <strong>Document Download / Sale End Date:</strong>{" "}
            {formatDate(tender.closing_date)}
          </p>

          <p>
            <strong>Bid Open Date:</strong> {formatDate(tender.bid_open_date)}
          </p>

          <p>
            <strong>Bid Submission End Date:</strong>{" "}
            {formatDate(tender.bid_end_date)}
          </p>

          <p>
            <strong>Period Of Work(Days):</strong> {tender.period_of_work_days}
          </p>
        </div>

        <div
          style={{
            marginTop: "30px",
            background: "#f8f8f8",
            padding: "20px",
            borderRadius: "10px",
          }}
        >
          <h3>Work Description</h3>

          <p>{tender.work_description || "No description available"}</p>
        </div>

        <button
          style={{
            display: "inline-block",
            marginTop: "30px",
            background: "#0d6efd",
            color: "white",
            padding: "12px 22px",
            border: "solid",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "600",
          }}
          onClick={() => {
            window.open(tender.tender_link, "_blank", "noopener,noreferrer");
          }}
        >
          View Tender
        </button>
      </div>
    </div>
  );
}

export default TenderDetails;
