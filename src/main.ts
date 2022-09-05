import express from "express";
import fs from "fs";
import { marked } from "marked";
import path from "path";

function getConfig() {
  const cwd = process.cwd();
  const fpath = path.join(cwd, ".mark-up.cfg");

  let custom = {};
  if (fs.existsSync(fpath)) {
    custom = JSON.parse(fs.readFileSync(fpath, "utf-8"));
  }

  return {
    port: 6969,
    serve: cwd,
    msg404: marked(`
# Error : 404

Could not resolve the requested file,  
please try with another or send an issue  
to the holder of this website.
`),
    ...custom,
  };
}

const server = express();
const { port, serve, msg404 } = getConfig();

server.get("*", (req, res) => {
  let url = req.url.startsWith("/") ? req.url.substring(1) : "";
  if (url === "") url = "index";
  if (!url.endsWith(".md")) url += ".md";

  const fpath = path.join(serve, url);

  const exts = [".md", ".markdown"];
  if (!exts.includes(path.extname(fpath).toLowerCase())) {
    res.status(400).send("error: requesting file that is no markdown file.");
    return;
  }

  if (!fs.existsSync(fpath)) {
    res.status(404).send(msg404);
    return;
  }

  const content = fs.readFileSync(fpath, "utf-8");
  const parsed = marked(content);

  res.send(`
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${url}</title>

    <!-- TODO: add styles -->
  </head>
  <body>
    ${parsed}
  </body>
</html>
`);
});

server.listen(port, () => {
  console.log(`[mark-up] server is running on port ${port}.`);
});
