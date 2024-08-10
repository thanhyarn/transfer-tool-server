const user = require("./userRouter");
const transfer = require("./transferRouter");
const history = require("./historyRouter");

function route(app) {
  // app.use("/crawl", data);
  // app.use("/pasternack", pasternack);
  app.use("/api/user", user);
  app.use("/api/transfer", transfer);
  app.use("/api/history", history);
}

module.exports = route;
