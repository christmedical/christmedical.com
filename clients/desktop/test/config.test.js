"use strict";

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  DEFAULT_PORTAL_URL,
  resolvePortalUrl,
  isAllowedNavigation,
} = require("../src/config");

describe("resolvePortalUrl", () => {
  it("defaults to the production login portal", () => {
    assert.equal(resolvePortalUrl({}), DEFAULT_PORTAL_URL);
  });

  it("prefers CHRISTMEDICAL_PORTAL_URL over PORTAL_URL", () => {
    assert.equal(
      resolvePortalUrl({
        CHRISTMEDICAL_PORTAL_URL: "http://127.0.0.1:3000/",
        PORTAL_URL: "https://example.com/",
      }),
      "http://127.0.0.1:3000/",
    );
  });

  it("accepts PORTAL_URL when the primary env is unset", () => {
    assert.equal(
      resolvePortalUrl({ PORTAL_URL: "http://localhost:5050/" }),
      "http://localhost:5050/",
    );
  });

  it("rejects unsupported schemes", () => {
    assert.throws(() => resolvePortalUrl({ PORTAL_URL: "ftp://bad.example/" }), /Invalid portal URL/);
  });
});

describe("isAllowedNavigation", () => {
  it("allows login and christmedical.com hosts", () => {
    assert.equal(isAllowedNavigation("https://login.christmedical.com/"), true);
    assert.equal(isAllowedNavigation("https://app.christmedical.com/queue"), true);
  });

  it("allows the configured portal host (local hub override)", () => {
    const portal = "http://127.0.0.1:3000/";
    assert.equal(isAllowedNavigation("http://127.0.0.1:3000/queue", portal), true);
    assert.equal(isAllowedNavigation("https://127.0.0.1:3000/", portal), false);
  });

  it("rejects off-domain URLs", () => {
    assert.equal(isAllowedNavigation("https://example.com/"), false);
    assert.equal(isAllowedNavigation("not-a-url"), false);
  });
});
