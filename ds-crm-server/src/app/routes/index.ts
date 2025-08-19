import express from "express";
import fs from "fs";
import {
  getErrorLogFilePath,
  getSuccessLogFilePath,
} from "../shared/errorFileLogger";
import { userRoutes } from "../module/user/user.routes";
import { authRoutes } from "../module/auth/auth.routes";
import { rolesRoutes } from "../module/roles/roles.routes";
import { permissionRoutes } from "../module/permission/permission.routes";
import { leadRoutes } from "../module/lead/lead.routes";


const router = express.Router();

const moduleRoutes = [
  {
    path: "/users",
    route: userRoutes,
  },
 
  {
    path: "/auth",
    route: authRoutes,
  },

  {
    path: "/roles",
    route: rolesRoutes,
  },

  {
    path: "/permissions",
    route: permissionRoutes,
  },

  {
    path: "/leads",
    route: leadRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

// Lightweight HTML UI for recent error logs
// Additionally, disable in production via env flag if desired

router.get("/error", (req, res) => {
  throw new Error("This is a forced error!");
});

//auth("manage_users")
router.get("/logs", async (_req, res) => {
  try {
    const file = getErrorLogFilePath();
    let content = "";
    try {
      content = await fs.promises.readFile(file, "utf-8");
    } catch {
      content = "";
    }
    const lines = content
      .trim()
      .split(/\n+/)
      .filter(Boolean)
      .slice(-500)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return { raw: l };
        }
      });
    const successFile = getSuccessLogFilePath();
    let successContent = "";
    try {
      successContent = await fs.promises.readFile(successFile, "utf-8");
    } catch {
      successContent = "";
    }
    const successLines = successContent
      .trim()
      .split(/\n+/)
      .filter(Boolean)
      .slice(-500)
      .map((l) => {
        try {
          return JSON.parse(l);
        } catch {
          return { raw: l };
        }
      });

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Logs</title>
  <style>
    :root{ --bg:#0b0f14; --panel:#111827; --text:#e5e7eb; --muted:#9ca3af; --accent:#22d3ee; }
    body{ margin:0; background:var(--bg); color:var(--text); font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
    header{ padding:16px 24px; background:var(--panel); position:sticky; top:0; z-index:10; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #1f2937; }
    h1{ font-size:18px; margin:0; }
    .badge{ background:#1f2937; color:var(--muted); padding:4px 8px; border-radius:9999px; font-size:12px; }
    main{ padding:16px; max-width:1200px; margin:0 auto; }
    .card{ background:var(--panel); border:1px solid #1f2937; border-radius:12px; padding:0; overflow:hidden; }
    .toolbar{ display:flex; gap:8px; padding:12px; border-bottom:1px solid #1f2937; align-items:center; }
    .toolbar input{ background:#0b1220; color:var(--text); border:1px solid #1f2937; padding:8px 10px; border-radius:8px; outline:none; flex:1; }
    .toolbar button{ background:var(--accent); color:#00222a; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:600; }
    table{ width:100%; border-collapse:collapse; }
    th, td{ padding:10px 12px; border-bottom:1px solid #1f2937; text-align:left; vertical-align:top; }
    th{ color:var(--muted); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.06em; }
    tr:hover{ background:#0b1220; }
    code{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size:12px; }
  </style>
  <script>
    function filterLogs(){
      const q=document.getElementById('q').value.toLowerCase();
      const rows=[...document.querySelectorAll('tbody tr')];
      rows.forEach(r=>{
        r.style.display = r.innerText.toLowerCase().includes(q)?'':'none';
      });
    }
  </script>
  </head>
  <body>
    <header>
      <h1>Logs</h1>
      <span class="badge">Errors: ${lines.length} | Success: ${
      successLines.length
    }</span>
    </header>
    <main>
      <div class="card">
        <div class="toolbar">
          <input id="q" placeholder="Filter by message, requestId, path, code..." oninput="filterLogs()" />
          <button onclick="location.reload()">Refresh</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Message</th>
                <th>Request</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              ${lines
                .map((e) => {
                  const t = e.time || e.timestamp || "";
                  const msg = e.message || e.msg || e.raw || "";
                  const req = [
                    e.method,
                    e.path,
                    e.statusCode ? `(status ${e.statusCode})` : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const err = e.errName || e.errCode || e.errMessage || "";
                  const rid = e.requestId ? ` [${e.requestId}]` : "";
                  return `<tr><td><code>${t}</code></td><td>${msg}${rid}</td><td><code>${req}</code></td><td><code>${err}</code></td></tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
      <br/>
      <div class="card">
        <div class="toolbar">
          <strong style="padding-left:12px">Recent Success Logs</strong>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Message</th>
                <th>Request</th>
              </tr>
            </thead>
            <tbody>
              ${successLines
                .map((e) => {
                  const t = e.time || e.timestamp || "";
                  const msg = e.message || e.msg || e.raw || "";
                  const req = [
                    e.method,
                    e.path,
                    e.statusCode ? `(status ${e.statusCode})` : "",
                    e.responseTime ? `(in ${e.responseTime}ms)` : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  const rid = e.requestId ? ` [${e.requestId}]` : "";
                  return `<tr><td><code>${t}</code></td><td>${msg}${rid}</td><td><code>${req}</code></td></tr>`;
                })
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </body>
  </html>`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to render logs" });
  }
});
