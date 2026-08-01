import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ApiIcon from "@mui/icons-material/Api";
import { useTranslation } from "react-i18next";

import TitleBlock from "components/TitleBlock";
import { sendDataToServer } from "utils/functions";
import ImportExportCSV from "components/ImportExportCSV";

function CodeBlock({ children }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2,
        maxWidth: "100%",
        overflowX: "auto",
        borderRadius: 1,
        bgcolor: "grey.900",
        color: "grey.100",
        fontFamily: "monospace",
        fontSize: "0.85rem",
        lineHeight: 1.6,
        whiteSpace: "pre",
      }}
    >
      <code>{children}</code>
    </Box>
  );
}

function Endpoint({
  path,
  title,
  description,
  request,
  response,
  children,
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: 2,
          md: 3,
        },
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1}
          alignItems={{
            xs: "flex-start",
            sm: "center",
          }}
        >
          <Chip
            label="GET"
            size="small"
            color="success"
            sx={{
              minWidth: 54,
              fontWeight: 700,
            }}
          />

          <Typography
            component="code"
            sx={{
              fontFamily: "monospace",
              fontWeight: 700,
              overflowWrap: "anywhere",
            }}
          >
            {path}
          </Typography>
        </Stack>

        <Box>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>

          <Typography color="text.secondary">
            {description}
          </Typography>
        </Box>

        {children}

        {request && (
          <>
            <Typography variant="subtitle2">
              {request.title}
            </Typography>

            <CodeBlock>{request.code}</CodeBlock>
          </>
        )}

        {response && (
          <>
            <Typography variant="subtitle2">
              {response.title}
            </Typography>

            <CodeBlock>{response.code}</CodeBlock>
          </>
        )}
      </Stack>
    </Paper>
  );
}

export default function ApiPage() {
  const { t } = useTranslation();

  const [apiKey, setApiKey] = useState("");
  const [authEnabled, setAuthEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const apiBase = `${window.location.origin}/api/v2`;

  useEffect(() => {
    let active = true;

    const loadAPIInfo = async () => {
      setLoading(true);
      setLoadError(false);

      try {
        const response = await sendDataToServer({
          op: "getAPIInfo",
        });

        if (!active) {
          return;
        }

        if (!response) {
          throw new Error("No response");
        }

        if (
          response.status &&
          response.status !== "OK"
        ) {
          throw new Error(response.status);
        }

        const loadedAPIKey =
          typeof response.api_key === "string"
            ? response.api_key.trim()
            : "";

        setApiKey(loadedAPIKey);
        setAuthEnabled(
          Boolean(response.enabled) &&
            loadedAPIKey !== ""
        );
      } catch (error) {
        console.error(
          "Failed to load API information:",
          error
        );

        if (active) {
          setApiKey("");
          setAuthEnabled(false);
          setLoadError(true);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAPIInfo();

    return () => {
      active = false;
    };
  }, []);

  const curlAuthHeader = useMemo(() => {
    if (!authEnabled || !apiKey) {
      return "";
    }

    return (
      ` \\\n` +
      `  -H "Authorization: Bearer ${apiKey}"`
    );
  }, [apiKey, authEnabled]);

  const makeCurl = useCallback(
    (path = "") => {
      return (
        `curl "${apiBase}${path}"` +
        curlAuthHeader
      );
    },
    [apiBase, curlAuthHeader]
  );

  return (
    <Container
      maxWidth="lg"
      sx={{
        pb: 4,
      }}
    >
      <TitleBlock
        t3={<ImportExportCSV />}
      >
        <ApiIcon />
        {t("api.title")}
      </TitleBlock>

      <Stack spacing={4}>
        <Typography color="text.secondary">
          {t("api.description")}
        </Typography>

        <Alert severity="info">
          {t("api.get_only")}
        </Alert>

        <Paper
          variant="outlined"
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h5">
              {t("api.base_url")}
            </Typography>

            <CodeBlock>{apiBase}</CodeBlock>

            <Typography color="text.secondary">
              {t("api.base_url_description")}
            </Typography>
          </Stack>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h5">
              {t("api.authentication.title")}
            </Typography>

            {loading ? (
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
              >
                <CircularProgress size={22} />

                <Typography color="text.secondary">
                  {t("api.authentication.loading")}
                </Typography>
              </Stack>
            ) : loadError ? (
              <Alert severity="error">
                {t(
                  "api.authentication.load_failed"
                )}
              </Alert>
            ) : authEnabled ? (
              <>
                <Alert severity="success">
                  {t("api.authentication.enabled")}
                </Alert>

                <Typography color="text.secondary">
                  {t(
                    "api.authentication.description"
                  )}
                </Typography>

                <Typography variant="subtitle2">
                  {t(
                    "api.authentication.current_key"
                  )}
                </Typography>

                <CodeBlock>{apiKey}</CodeBlock>

                <Typography variant="subtitle2">
                  {t("api.authentication.bearer")}
                </Typography>

                <CodeBlock>
                  {`Authorization: Bearer ${apiKey}`}
                </CodeBlock>

                <Typography variant="subtitle2">
                  {t("api.authentication.header")}
                </Typography>

                <CodeBlock>
                  {`X-API-Key: ${apiKey}`}
                </CodeBlock>

                <Alert severity="warning">
                  {t(
                    "api.authentication.security"
                  )}
                </Alert>
              </>
            ) : (
              <Alert severity="warning">
                {t("api.authentication.disabled")}
              </Alert>
            )}
          </Stack>
        </Paper>

        <Box>
          <Typography variant="h5" gutterBottom>
            {t("api.endpoints")}
          </Typography>

          <Typography color="text.secondary">
            {t("api.endpoints_description")}
          </Typography>
        </Box>

        <Stack spacing={3}>
          <Endpoint
            path="/api/v2"
            title={t("api.methods.index.title")}
            description={t(
              "api.methods.index.description"
            )}
            request={{
              title: t("api.request_example"),
              code: makeCurl(),
            }}
            response={{
              title: t("api.response_example"),
              code: `{
  "name": "MuraenaBase Billing API",
  "version": "v2",
  "methods": [
    {
      "method": "GET",
      "path": "/api/v2/list",
      "description": "Returns all Address database records"
    }
  ]
}`,
            }}
          />

          <Endpoint
            path="/api/v2/list"
            title={t("api.methods.list.title")}
            description={t(
              "api.methods.list.description"
            )}
            request={{
              title: t("api.request_example"),
              code: makeCurl("/list"),
            }}
            response={{
              title: t("api.response_example"),
              code: `{
  "count": 1,
  "items": [
    {
      "ID": 1,
      "addr": "0001",
      "location": "Building 1",
      "descr": "Main entrance",
      "map": "1:2:3:4:5:6:7:8",
      "billing": "1001:1002:1003:1004:1005:1006:1007:1008"
    }
  ]
}`,
            }}
          />

          <Endpoint
            path="/api/v2/list/{id}"
            title={t("api.methods.address.title")}
            description={t(
              "api.methods.address.description"
            )}
            request={{
              title: t("api.request_example"),
              code: makeCurl("/list/1"),
            }}
            response={{
              title: t("api.response_example"),
              code: `{
  "ID": 1,
  "addr": "0001",
  "location": "Building 1",
  "descr": "Main entrance",
  "map": "1:2:3:4:5:6:7:8",
  "billing": "1001:1002:1003:1004:1005:1006:1007:1008"
}`,
            }}
          />

          <Endpoint
            path="/api/v2/state/{billing_id}"
            title={t(
              "api.methods.get_state.title"
            )}
            description={t(
              "api.methods.get_state.description"
            )}
            request={{
              title: t("api.request_example"),
              code: makeCurl("/state/1001"),
            }}
            response={{
              title: t("api.response_example"),
              code: `{
  "address": {
    "ID": 1,
    "addr": "0001"
  },
  "billing_id": 1001,
  "output": 1,
  "state": 1,
  "command": 0,
  "command_hex": "00",
  "command_binary": "00000000",
  "mask": 128,
  "mask_binary": "10000000"
}`,
            }}
          >
            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1}
              alignItems={{
                xs: "flex-start",
                sm: "center",
              }}
            >
              <Chip
                label={`0 — ${t(
                  "api.states.disabled"
                )}`}
                color="error"
                size="small"
              />

              <Chip
                label={`1 — ${t(
                  "api.states.enabled"
                )}`}
                size="small"
                color="success"
              />

              <Chip
                label={`2 — ${t(
                  "api.states.warning"
                )}`}
                size="small"
                color="warning"
              />
            </Stack>
          </Endpoint>

          <Endpoint
            path="/api/v2/state/{billing_id}/{state}"
            title={t(
              "api.methods.set_state.title"
            )}
            description={t(
              "api.methods.set_state.description"
            )}
            request={{
              title: t("api.request_example"),
              code: makeCurl("/state/1001/1"),
            }}
            response={{
              title: t("api.response_example"),
              code: `{
  "address": {
    "ID": 1,
    "addr": "0001"
  },
  "billing_id": 1001,
  "output": 1,
  "state": 1,
  "command": 0,
  "command_hex": "00",
  "command_binary": "00000000",
  "mask": 128,
  "mask_binary": "10000000",
  "response": "OK"
}`,
            }}
          />

          <Endpoint
            path="/api/v2/tx"
            title={t("api.methods.tx.title")}
            description={t(
              "api.methods.tx.description"
            )}
            request={{
              title: t("api.request_example"),
              code: makeCurl("/tx"),
            }}
            response={{
              title: t("api.response_example"),
              code: `{
  "enabled": true,
  "state": "ON",
  "response": "TX ON"
}`,
            }}
          />

          <Endpoint
            path="/api/v2/tx/on"
            title={t("api.methods.tx_on.title")}
            description={t(
              "api.methods.tx_on.description"
            )}
            request={{
              title: t("api.request_example"),
              code: makeCurl("/tx/on"),
            }}
            response={{
              title: t("api.response_example"),
              code: `{
  "enabled": true,
  "state": "ON",
  "response": "OK"
}`,
            }}
          />

          <Endpoint
            path="/api/v2/tx/off"
            title={t("api.methods.tx_off.title")}
            description={t(
              "api.methods.tx_off.description"
            )}
            request={{
              title: t("api.request_example"),
              code: makeCurl("/tx/off"),
            }}
            response={{
              title: t("api.response_example"),
              code: `{
  "enabled": false,
  "state": "OFF",
  "response": "OK"
}`,
            }}
          />
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            p: {
              xs: 2,
              md: 3,
            },
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h5">
              {t("api.errors.title")}
            </Typography>

            <Typography color="text.secondary">
              {t("api.errors.description")}
            </Typography>

            <CodeBlock>
              {`{
  "error": "Invalid or missing API key"
}`}
            </CodeBlock>

            <Divider />

            <Stack spacing={1}>
              <Typography>
                <strong>400</strong>
                {" — "}
                {t("api.errors.bad_request")}
              </Typography>

              <Typography>
                <strong>401</strong>
                {" — "}
                {t("api.errors.unauthorized")}
              </Typography>

              <Typography>
                <strong>404</strong>
                {" — "}
                {t("api.errors.not_found")}
              </Typography>

              <Typography>
                <strong>405</strong>
                {" — "}
                {t(
                  "api.errors.method_not_allowed"
                )}
              </Typography>

              <Typography>
                <strong>500</strong>
                {" — "}
                {t("api.errors.internal")}
              </Typography>

              <Typography>
                <strong>502</strong>
                {" — "}
                {t("api.errors.gateway")}
              </Typography>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}