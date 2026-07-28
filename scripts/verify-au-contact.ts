import assert from "node:assert/strict";

import {
  formatAuMobileInput,
  formatAuPostcodeInput,
  isValidAuMobile,
  isValidAuPostcode,
  normalizeAuMobile,
} from "../src/features/booking/lib/au-contact";

assert.equal(formatAuMobileInput(""), "04");
assert.equal(formatAuMobileInput("0412"), "0412");
assert.equal(formatAuMobileInput("0412345678"), "0412 345 678");
assert.equal(normalizeAuMobile("0412 345 678"), "0412345678");
assert.equal(isValidAuMobile("0412 345 678"), true);
assert.equal(isValidAuMobile("041234567"), false);
assert.equal(isValidAuMobile("0312345678"), false);

assert.equal(formatAuPostcodeInput("2000"), "2000");
assert.equal(formatAuPostcodeInput("20a00"), "2000");
assert.equal(isValidAuPostcode("2000"), true);
assert.equal(isValidAuPostcode("0200"), true);
assert.equal(isValidAuPostcode("999"), false);
assert.equal(isValidAuPostcode("0001"), false);

console.log("verify-au-contact: ok");
