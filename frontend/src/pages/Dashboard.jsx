import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Dashboard() {
  const [tenders, setTenders] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchTenders();
  }, []);

  const fetchTenders = async () => {
    try {
      // const response = await axios.get("https://tender-platform-d2tv.onrender.com/api/tenders");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/tenders`,
      );

      setTenders(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const filteredTenders = tenders.filter((tender) => {
    return (
      tender.title?.toLowerCase().includes(search.toLowerCase()) ||
      tender.location?.toLowerCase().includes(search.toLowerCase()) ||
      tender.department?.toLowerCase().includes(search.toLowerCase())
    );
  });

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

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Tender Dashboard</h1>

        <input
          type="text"
          placeholder="Search tenders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-box"
        />
      </div>

      <div className="table-wrapper">
        <table className="tender-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Published Date</th>
              <th>Bid Open Date</th>
              {/* <th>Bid Submission End Date</th> */}
              <th>Title & Tender ID</th>
              <th>Source</th>
              {/* <th>Organisation Chain</th> */}
              <th>Tender Value</th>
            </tr>
          </thead>

          <tbody>
            {filteredTenders.map((tender, index) => (
              <tr key={tender.id}>
                <td>{index + 1}</td>

                <td>{formatDate(tender.publish_date)}</td>

                <td>{formatDate(tender.bid_open_date)}</td>

                {/* <td>
                  {formatDate(tender.closing_date)}
                </td> */}

                <td>
                  <Link
                    to={`/tender/${tender.id}`}
                    className="tender-title-link"
                    target="_blank"
                  >
                    {tender.title}
                  </Link>

                  <div className="tender-id">[{tender.tender_id || "N/A"}]</div>
                </td>

                <td>{tender.source || tender.department || "N/A"}</td>

                {/* <td>
                  {tender.organisation_chain || tender.department || "N/A"}
                </td> */}

                <td>₹ {tender.tender_value || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default Dashboard;
