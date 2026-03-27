import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProtectedRoute = ({ role, children }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/session", { credentials: "include" });
        if (res.status === 404) {
          navigate("/not-found");
          return;
        }
        if (res.status === 401 || res.status === 403) {
          navigate("/unauthorized");
          return;
        }
        const data = await res.json();
        if (data.authenticated && data.user.role === role) {
          setAuthenticated(true);
        } else {
          navigate("/unauthorized");
        }
      } catch {
        navigate("/unauthorized");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [role, navigate]);

  if (loading) return <div>Loading...</div>;
  return authenticated ? children : null;
};

export default ProtectedRoute;
