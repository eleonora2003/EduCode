import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// JWT token pattern: three base64url-encoded parts separated by dots
const TOKEN_PATTERN = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;

function isValidToken(token) {
  if (typeof token !== "string" || token.length === 0) {
    return false;
  }
  // Check if token matches JWT format
  if (!TOKEN_PATTERN.test(token)) {
    return false;
  }
  // Additional length check to prevent excessively long values
  if (token.length > 8192) {
    return false;
  }
  return true;
}

export default function OAuthSuccess() {
  const { setToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token && isValidToken(token)) {
      localStorage.setItem("token", token);
      setToken(token);
      navigate("/");
    }
  }, [setToken, navigate]);

  return <div>Signing you in...</div>;
}