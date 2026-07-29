import React, { useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import KeyIcon from "@mui/icons-material/Key";
import { sendDataToServer } from "utils/functions";
import { useTranslation } from "react-i18next";

function saveTokens(access, refresh, remember) {
  const ACCESS_KEY = "access_token";
  const REFRESH_KEY = "refresh_token";

  if (remember) {
    if (access) {
      localStorage.setItem(ACCESS_KEY, access);
    }

    if (refresh) {
      localStorage.setItem(REFRESH_KEY, refresh);
    }

    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(ACCESS_KEY);
      sessionStorage.removeItem(REFRESH_KEY);
    }

    return;
  }

  if (typeof sessionStorage !== "undefined") {
    if (access) {
      sessionStorage.setItem(ACCESS_KEY, access);
    }

    if (refresh) {
      sessionStorage.setItem(REFRESH_KEY, refresh);
    }
  }

  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }
}

export default function LoginForm({
  onSuccess,
  onSwitch,
}) {
  const isDemoHost =
    typeof window !== "undefined" &&
    window.location.hostname ===
      "demo.muraenarf.com";

  const [login, setLogin] = useState(
    isDemoHost ? "admin" : ""
  );

  const [password, setPassword] = useState(
    isDemoHost ? "admin" : ""
  );

  const [showPw, setShowPw] = useState(
    isDemoHost
  );

  const [remember, setRemember] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [err, setErr] = useState("");

  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    setErr("");

    if (!login || !password) {
      setErr(t("login.req_login_pass"));
      return;
    }

    setLoading(true);

    sendDataToServer({
      op: "authLogin",
      login,
      password,
      remember,
    })
      .then((r) => {
        if (r && r.status === "OK") {
          saveTokens(
            r.access_token,
            r.refresh_token,
            remember
          );

          if (onSuccess) {
            onSuccess(r.user);
          }

          return;
        }

        setErr(
          r?.status || t("login.failed")
        );
      })
      .catch((e) => {
        setErr(
          e?.message || t("network.error")
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        width: 380,
        maxWidth: "100%",
        borderRadius: 3,
      }}
    >
      <Stack
        component="form"
        onSubmit={handleSubmit}
        spacing={2}
      >
        <Typography
          variant="h6"
          align="center"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 1,
          }}
        >
          <KeyIcon />
          {t("login.login")}
        </Typography>

        {err ? (
          <Alert severity="error">
            {err}
          </Alert>
        ) : null}

        <TextField
          label={t("login.login2")}
          value={login}
          size="small"
          autoFocus={!isDemoHost}
          autoComplete="username"
          onChange={(e) =>
            setLogin(e.target.value)
          }
          fullWidth
        />

        <TextField
          label={t("login.password")}
          type={showPw ? "text" : "password"}
          value={password}
          size="small"
          autoComplete="current-password"
          onChange={(e) =>
            setPassword(e.target.value)
          }
          fullWidth
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() =>
                    setShowPw((v) => !v)
                  }
                  edge="end"
                  aria-label="toggle password visibility"
                >
                  {showPw ? (
                    <VisibilityOff />
                  ) : (
                    <Visibility />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={remember}
              onChange={(e) =>
                setRemember(
                  e.target.checked
                )
              }
            />
          }
          label={t("login.remember")}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          fullWidth
        >
          {loading
            ? t("login.entering")
            : t("login.enter")}
        </Button>
      </Stack>
    </Paper>
  );
}