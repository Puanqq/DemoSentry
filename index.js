const express = require("express");
const app = express();
const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");
const ExpressPino = require("express-pino-logger");
const { Logger: logger } = require("@transzero/utils");
const http = require("http");

const DSN =
  "https://846bf578c7c34cd5b33cd6fa03ba351b@o1211816.ingest.sentry.io/6352160";

app.use(ExpressPino({ logger }));

Sentry.init({
  dsn: DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Express({ app }),
  ],
  // for finer control
  tracesSampleRate: 1.0,
});

const transaction = Sentry.startTransaction({
  op: "transaction",
  name: "Test Transaction",
});

Sentry.configureScope((scope) => {
  scope.setSpan(transaction);
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// All controllers should live here
// check resource has function is not defined
app.get("/api/not-df", (req, res) => {
  foo();
  res.end("Hello world!");
});

// check resource response code is 500
app.get("/api/i-s-err", (req, res) => {
  throw new Error("This is error: Internal server error (500)");
});

let request;
app.get("/api/http-get", (req, res) => {
  request = http.get("http://sentry.io", (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  });
  abc();
  return res.send(request);
});

app.use(Sentry.Handlers.errorHandler());

app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

app.listen(1337);
