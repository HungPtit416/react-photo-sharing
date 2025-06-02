import React, { useState } from "react";
import {
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";

function LoginRegister({ onLogin }) {
  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Login form state
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Registration form state
  const [regFormData, setRegFormData] = useState({
    login_name: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    location: "",
    description: "",
    occupation: "",
  });
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    // Clear errors when switching tabs
    setLoginError("");
    setRegError("");
    setRegSuccess("");
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginName.trim()) {
      setLoginError("Please enter a login name");
      return;
    }

    if (!loginPassword.trim()) {
      setLoginError("Please enter a password");
      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      const response = await fetch(
        "https://bcd210b6-338b-4b20-964a-2be4c85f4ce2-00-3k548uxwx7434.sisko.replit.dev/admin/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            login_name: loginName.trim(),
            password: loginPassword,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Store JWT token in localStorage
        localStorage.setItem("authToken", data.token);

        // Pass user data to parent component
        onLogin(data.user);
      } else {
        const errorData = await response.json();
        setLoginError(errorData.error || "Login failed");
      }
    } catch (err) {
      setLoginError("Network error. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle registration form input changes
  const handleRegInputChange = (field) => (e) => {
    setRegFormData({
      ...regFormData,
      [field]: e.target.value,
    });
    // Clear errors when user starts typing
    if (regError) setRegError("");
    if (regSuccess) setRegSuccess("");
  };

  // Handle registration
  const handleRegister = async (e) => {
    e.preventDefault();

    // Validation
    if (!regFormData.login_name.trim()) {
      setRegError("Login name is required");
      return;
    }

    if (!regFormData.password.trim()) {
      setRegError("Password is required");
      return;
    }

    if (!regFormData.first_name.trim()) {
      setRegError("First name is required");
      return;
    }

    if (!regFormData.last_name.trim()) {
      setRegError("Last name is required");
      return;
    }

    if (regFormData.password !== regFormData.confirmPassword) {
      setRegError("Passwords do not match");
      return;
    }

    setRegLoading(true);
    setRegError("");
    setRegSuccess("");

    try {
      const response = await fetch(
        "https://bcd210b6-338b-4b20-964a-2be4c85f4ce2-00-3k548uxwx7434.sisko.replit.dev/user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            login_name: regFormData.login_name.trim(),
            password: regFormData.password,
            first_name: regFormData.first_name.trim(),
            last_name: regFormData.last_name.trim(),
            location: regFormData.location.trim(),
            description: regFormData.description.trim(),
            occupation: regFormData.occupation.trim(),
          }),
        }
      );

      if (response.ok) {
        const userData = await response.json();
        setRegSuccess(
          `User ${userData.login_name} registered successfully! You can now login.`
        );

        // Clear form
        setRegFormData({
          login_name: "",
          password: "",
          confirmPassword: "",
          first_name: "",
          last_name: "",
          location: "",
          description: "",
          occupation: "",
        });
      } else {
        const errorText = await response.text();
        setRegError(errorText || "Registration failed");
      }
    } catch (err) {
      setRegError("Network error. Please try again.");
      console.error("Registration error:", err);
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="80vh"
      sx={{ py: 4 }}
    >
      <Paper elevation={3} sx={{ padding: 4, maxWidth: 500, width: "100%" }}>
        <Typography variant="h4" align="center" gutterBottom>
          Welcome
        </Typography>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          centered
          sx={{ mb: 3 }}
        >
          <Tab label="Login" />
          <Tab label="Register" />
        </Tabs>

        <Divider sx={{ mb: 3 }} />

        {/* Login Tab */}
        {activeTab === 0 && (
          <form onSubmit={handleLogin}>
            <Typography variant="h6" gutterBottom>
              Please Login
            </Typography>

            <TextField
              fullWidth
              label="Login Name"
              value={loginName}
              onChange={(e) => setLoginName(e.target.value)}
              margin="normal"
              disabled={loginLoading}
              autoFocus
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              margin="normal"
              disabled={loginLoading}
            />

            {loginError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {loginError}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={loginLoading}
            >
              {loginLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        )}

        {/* Registration Tab */}
        {activeTab === 1 && (
          <form onSubmit={handleRegister}>
            <Typography variant="h6" gutterBottom>
              Create New Account
            </Typography>

            <TextField
              fullWidth
              label="Login Name"
              value={regFormData.login_name}
              onChange={handleRegInputChange("login_name")}
              margin="normal"
              disabled={regLoading}
              required
            />

            <TextField
              fullWidth
              label="Password"
              type="password"
              value={regFormData.password}
              onChange={handleRegInputChange("password")}
              margin="normal"
              disabled={regLoading}
              required
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              value={regFormData.confirmPassword}
              onChange={handleRegInputChange("confirmPassword")}
              margin="normal"
              disabled={regLoading}
              required
            />

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="First Name"
                value={regFormData.first_name}
                onChange={handleRegInputChange("first_name")}
                margin="normal"
                disabled={regLoading}
                required
                sx={{ flex: 1 }}
              />

              <TextField
                label="Last Name"
                value={regFormData.last_name}
                onChange={handleRegInputChange("last_name")}
                margin="normal"
                disabled={regLoading}
                required
                sx={{ flex: 1 }}
              />
            </Box>

            <TextField
              fullWidth
              label="Location"
              value={regFormData.location}
              onChange={handleRegInputChange("location")}
              margin="normal"
              disabled={regLoading}
            />

            <TextField
              fullWidth
              label="Description"
              value={regFormData.description}
              onChange={handleRegInputChange("description")}
              margin="normal"
              disabled={regLoading}
              multiline
              rows={2}
            />

            <TextField
              fullWidth
              label="Occupation"
              value={regFormData.occupation}
              onChange={handleRegInputChange("occupation")}
              margin="normal"
              disabled={regLoading}
            />

            {regError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {regError}
              </Alert>
            )}

            {regSuccess && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {regSuccess}
              </Alert>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={regLoading}
            >
              {regLoading ? "Registering..." : "Register"}
            </Button>
          </form>
        )}
      </Paper>
    </Box>
  );
}

export default LoginRegister;
