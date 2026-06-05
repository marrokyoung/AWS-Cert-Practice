import assert from "node:assert/strict";
import test from "node:test";

import {
  activeCert,
  activeRouteSegment,
  hrefForCertSwitch,
  hrefForGlobalRoute,
} from "../src/components/shell/navigation";

test("activeCert reads cert-scoped routes", () => {
  assert.equal(activeCert("/SAA-C03/practice"), "SAA-C03");
  assert.equal(activeCert("/CLF-C02/review"), "CLF-C02");
  assert.equal(activeCert("/review"), null);
});

test("activeRouteSegment reads cert-scoped and global tabs", () => {
  assert.equal(activeRouteSegment("/SAA-C03/practice"), "practice");
  assert.equal(activeRouteSegment("/CLF-C02/progress"), "progress");
  assert.equal(activeRouteSegment("/review"), "review");
  assert.equal(activeRouteSegment("/"), null);
});

test("hrefForCertSwitch preserves the current tab when switching certs", () => {
  assert.equal(
    hrefForCertSwitch("/SAA-C03/practice", "CLF-C02"),
    "/CLF-C02/practice",
  );
  assert.equal(
    hrefForCertSwitch("/SAA-C03/review", "CLF-C02"),
    "/CLF-C02/review",
  );
  assert.equal(
    hrefForCertSwitch("/progress", "SAA-C03"),
    "/SAA-C03/progress",
  );
});

test("hrefForCertSwitch falls back to learn outside app tabs", () => {
  assert.equal(hrefForCertSwitch("/", "CLF-C02"), "/CLF-C02/learn");
});

test("hrefForGlobalRoute scopes review and progress when a cert is active", () => {
  assert.equal(hrefForGlobalRoute("SAA-C03", "review"), "/SAA-C03/review");
  assert.equal(hrefForGlobalRoute("SAA-C03", "progress"), "/SAA-C03/progress");
});

test("hrefForGlobalRoute falls back to top-level paths when no cert is active", () => {
  assert.equal(hrefForGlobalRoute(null, "review"), "/review");
  assert.equal(hrefForGlobalRoute(null, "progress"), "/progress");
});
