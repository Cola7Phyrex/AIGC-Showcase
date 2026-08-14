import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${process.pid}-${Date.now()}-${Math.random()}`,
  );
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`https://portfolio.example${pathname}`, {
      headers: {
        accept: "text/html",
        "x-forwarded-host": "portfolio.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the twelve-project spatial index", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Phyrex — AIGC Works/i);
  assert.match(html, /12 PROJECTS/);
  assert.match(html, /Phyrex/);
  assert.match(html, /REALTIME DISTORTION/);
  assert.match(html, /项目名称 01/);
  assert.match(html, /核心 AIGC 工具 A/);
  assert.match(html, /https:\/\/portfolio\.example\/og\.png/);
});

test("server-renders a complete project detail page", async () => {
  const response = await render("/projects/project-01");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /项目名称 01/);
  assert.match(html, /图片 \/ 视频预览/);
  assert.match(html, /内容链接 \/ 源文件/);
  assert.match(html, /待添加网址/);
});
