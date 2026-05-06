import React from "react";
import { Link } from "react-router-dom";

function TenderCard({ tender }) {
  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}
    >
      <h3>{tender.title}</h3>

      <p>{tender.location}</p>

      <p>{tender.department}</p>

      <Link to={`/tender/${tender.id}`}>
        View Details
      </Link>
    </div>
  );
}

export default TenderCard;