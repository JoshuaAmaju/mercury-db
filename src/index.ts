import Metro from "./metro";

(async function () {
  const metro = new Metro("db", 1);

  metro.model("User", {
    name: "string",
  });

  await metro.connect();
})();
