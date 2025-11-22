import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:3001/api/items/" + id)
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then(setItem)
      .catch(() => navigate("/"));
  }, [id, navigate]);

  
   //  Skeleton Loader Component

  const Skeleton = () => (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        paddingTop: 40,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 500,
          background: "#fff",
          padding: 24,
          borderRadius: 10,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {/* Fake back button bar */}
        <div
          style={{
            width: 80,
            height: 18,
            background: "#e3e3e3",
            borderRadius: 4,
            marginBottom: 20,
            animation: "pulse 1.4s infinite ease-in-out",
          }}
        />

        {/* Fake title */}
        <div
          style={{
            width: "60%",
            height: 22,
            background: "#e3e3e3",
            borderRadius: 4,
            marginBottom: 18,
            animation: "pulse 1.4s infinite ease-in-out",
          }}
        />

  
        <div
          style={{
            width: "80%",
            height: 16,
            background: "#e3e3e3",
            borderRadius: 4,
            marginBottom: 10,
            animation: "pulse 1.4s infinite ease-in-out",
          }}
        />

        <div
          style={{
            width: "50%",
            height: 16,
            background: "#e3e3e3",
            borderRadius: 4,
            animation: "pulse 1.4s infinite ease-in-out",
          }}
        />
      </div>
    </div>
  );

  // STILL LOADING → show skeleton

  if (!item) return <Skeleton />;

  
    //Actual Item Detail

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        paddingTop: 40,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 500,
          background: "#fff",
          padding: 24,
          borderRadius: 10,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}
      >
        {/* BACK BUTTON */}
        <Link
          to="/"
          style={{
            textDecoration: "none",
            color: "#333",
            fontSize: 16,
            display: "inline-flex",
            alignItems: "center",
            marginBottom: 16,
            fontWeight: 500,
          }}
        >
          <span style={{ fontSize: 20, marginRight: 6 }}>←</span> 
        </Link>

        <h2
          style={{
            marginBottom: 12,
            fontSize: 22,
            fontWeight: 600,
            color: "#222",
          }}
        >
          {item.name}
        </h2>

        <p style={{ fontSize: 16, marginBottom: 8 }}>
          <strong>Category:</strong> {item.category}
        </p>

        <p style={{ fontSize: 16 }}>
          <strong>Price:</strong> ${item.price}
        </p>
      </div>
    </div>
  );
}

export default ItemDetail;
