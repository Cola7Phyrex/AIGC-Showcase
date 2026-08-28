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

test("server-renders the thirteen-project spatial index", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /Phyrex — AIGC Works/i);
  assert.match(html, /13(?:<!-- -->)? PROJECTS/);
  assert.match(html, /Phyrex/);
  assert.match(html, /REALTIME DISTORTION/);
  assert.match(html, /Lornveil 雨冠危机/);
  assert.match(html, /Codex \/ GPT-5\.5/);
  assert.match(html, /https:\/\/portfolio\.example\/og\.png/);
});

test("server-renders a complete project detail page", async () => {
  const response = await render("/projects/project-01");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Lornveil 雨冠危机/);
  assert.match(html, /图片 \/ 视频预览/);
  assert.match(html, /内容链接 \/ 源文件/);
  assert.match(html, /小红书作品页/);
  assert.match(html, /https:\/\/xhslink\.cn\/o\/ADemJJbkaC/);
  assert.match(html, /\/projects\/project-01\/cover01\.jpg/);
  assert.match(html, /\/projects\/project-01\/case01-5\.jpg/);
  assert.match(html, /\/projects\/project-01\/file01\.pdf/);
  assert.match(html, /洛恩维尔雨冠危机 DM 手册/);
  assert.equal((html.match(/href="\/#works"/g) ?? []).length, 2);
  assert.match(html, /WHY IT STANDS OUT/);
  assert.match(html, /href="\/projects\/project-13"/);
  assert.match(html, /href="\/projects\/project-02"/);
});

test("server-renders the confirmed video workflow names", async () => {
  const response = await render("/projects/project-10");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /AIGC 视频制作十步法/);
  assert.match(html, /JOYRIDE Mountain Road/);
  assert.match(html, /Grok Imagine Video 1\.5/);
  assert.match(html, /MiniMax Speech 2\.8/);
});

test("server-renders the Lornveil DM Agent showcase media", async () => {
  const response = await render("/projects/project-02");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Lornveil — DM Agent/);
  assert.match(html, /\/projects\/project-02\/cover02\.jpg/);
  assert.match(html, /\/projects\/project-02\/case02-3\.png/);
  assert.ok((html.match(/media-contained/g) ?? []).length >= 3);
});

test("server-renders the DND Arena showcase media and repository", async () => {
  const response = await render("/projects/project-03");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /DND Arena/);
  assert.match(html, /\/projects\/project-03\/cover03\.jpg/);
  assert.match(html, /\/projects\/project-03\/case03-6\.jpg/);
  assert.match(html, /https:\/\/github\.com\/Cola7Phyrex\/dnd-arena-playtest/);
  assert.ok((html.match(/media-pair/g) ?? []).length >= 6);
});

test("server-renders the Crazy Tide showcase media and project link", async () => {
  const response = await render("/projects/project-04");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /Crazy Tide/);
  assert.match(html, /\/projects\/project-04\/cover04\.jpg/);
  assert.match(html, /\/projects\/project-04\/case04-11\.jpg/);
  assert.match(html, /https:\/\/cola7phyrex\.github\.io\/Crazy_Tide\//);
  assert.ok((html.match(/media-pair/g) ?? []).length >= 8);
  assert.ok((html.match(/media-triplet/g) ?? []).length >= 3);
});
