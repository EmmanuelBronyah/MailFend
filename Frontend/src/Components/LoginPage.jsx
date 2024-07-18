import React, { useState } from "react";
import { TextField, Button, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff, Mail, Close } from "@mui/icons-material"; // Import the Close icon
import logo from "../images/logo.png";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../tokens";

const LoginPage = ({ handleClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (e) => {
    e.preventDefault();
  };

  const getFakeUsername = (email_address) => {
    email_address = email.split("@");
    const username = email_address[0];
    return username;
  };

  const createUser = async (e) => {
    const username = getFakeUsername(email);

    try {
      const res = await api.post("api/create-user/", {
        username,
        email,
        password,
      });

      if (res.status === 201 && res.data.exists === true) {
        console.log("This user already has a registered account.");
      }
    } catch (error) {
      console.log(
        `ERROR FROM CREATE USER FUNCTION -> ${JSON.stringify(
          error.response.data
        )}`
      );
    }
  };

  const setTokens = async (e) => {
    const username = getFakeUsername(email);

    try {
      const res = await api.post("api/token/", { username, password });
      localStorage.setItem(ACCESS_TOKEN, res.data.access);
      localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
    } catch (error) {
      console.log(`ERROR FROM SET TOKENS FUNCTION -> ${error}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("api/login/", { email, password });
      if (res.status === 200) {
        await createUser();

        await setTokens();

        console.log("Login successful.");

        navigate("/home");
      }
    } catch (error) {
      const status_code = error.response.status;
      const error_code = error.response.data.error_code;

      if (status_code === 400 && error_code === "002")
        console.log("Invalid username or password.");
      if (status_code === 500) {
        console.log("The connection with the server failed.");
      }
      if (status_code === 503) {
        console.log(
          "Unable to establish a stable internet connection. Please check your network connection and try again."
        );
      }
    }
  };

  return (
    <div className="  modal-container login-form bg-white p-8 rounded-md shadow-lg ">
      <div className="flex text-red-600 justify-end">
        <IconButton onClick={handleClose}>
          <Close />
        </IconButton>
      </div>
      <form
        className="flex flex-col border items-center justify-center w-full"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col py-2 px-4 items-center justify-center w-full">
          <h1 className="text-black text-center flex text-xl items-center">
            MailFend
            <img className="h-10" src={logo} alt="MailFend Logo" />
          </h1>
          <TextField
            label="Gmail Address"
            variant="outlined"
            margin="normal"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Mail />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Password"
            variant="outlined"
            margin="normal"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            type={showPassword ? "text" : "password"}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Login
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
