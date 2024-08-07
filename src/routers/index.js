const user = require("./userRouter");

function route(app) {
  // app.use("/crawl", data);
  // app.use("/pasternack", pasternack);
  app.use("/api/user", user);
  
}

module.exports = route;
