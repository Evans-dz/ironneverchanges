/* ============================================================
   IRON NEVER CHANGES — the catalog, single source of truth.

   Loaded raw by the browser (window.INC_CATALOG) and required by
   api/checkout.js on the server. Prices live HERE and nowhere else:
   the checkout endpoint reads them from this file so a tampered
   cart in somebody's browser can't set its own price.

   Prices are in whole dollars, concept placeholders until the drop
   date is set. Changing one here changes it everywhere.
   ============================================================ */
(function (root) {
  'use strict';

  var SIZES = ['S', 'M', 'L', 'XL', '2X', '3X'];

  /* Cart limits. Both sides read these: the + button stops here, and the
     checkout endpoint rejects anything past them. One number, two enforcers,
     so the UI can never offer a cart the server will refuse. */
  var MAX_QTY = 10;
  var MAX_LINES = 24;

  var CATALOG = {
    'INC-001': { name: 'THE FLAGSHIP', price: 42 },
    'INC-002': { name: 'I DIDN’T FEEL LIKE IT EITHER', price: 38 },
    'INC-003': { name: 'ROCK BOTTOM HAS A SQUAT RACK', price: 38 },
    'INC-004': { name: '45 MINUTES THAT BELONG TO ME', price: 38 },
    'INC-005': { name: 'THE BAR DOESN’T KNOW YOU’RE TIRED', price: 40 },
    'INC-006': { name: 'THE SPINE TEE', price: 42 },
    'INC-007': { name: 'THE HOUSE SHIRT', price: 34 },
    'INC-008': { name: 'BUILT BACK', price: 40 },
    'INC-009': { name: 'THE WALL', price: 42 },
    'INC-010': { name: 'SMALL EFFORTS, REPEATED', price: 38 },
    'INC-011': { name: 'HOME', price: 42 },
    'INC-012': { name: 'CLOCK OUT. LOAD UP.', price: 38 },
    'INC-013': { name: 'THE PARKING LOT', price: 38 },
    'INC-014': { name: 'PROOF OF WORK', price: 40 },
    'INC-015': { name: 'SAME BAR. DIFFERENT DAY.', price: 40 },
    'INC-016': { name: 'EVERY REP IS A VOTE', price: 38 },
    'INC-017': { name: 'OPEN 24 HOURS', price: 40 },
    'INC-018': { name: 'NOBODY IS GOING TO LIFT IT FOR YOU', price: 38 },
    'INC-019': { name: 'IT FIXES ENOUGH', price: 34 },
    'INC-020': { name: 'STRONGER THAN THE YEAR', price: 38 },
    'INC-021': { name: 'THE SPOTTER', price: 34 },
    'INC-022': { name: 'SHOWED UP ANYWAY', price: 38 },
    'INC-023': { name: 'THE WEIGHT NEVER LIES', price: 38 },
    'INC-024': { name: 'COME BACK TOMORROW', price: 38 }
  };

  var api = { SIZES: SIZES, CATALOG: CATALOG, MAX_QTY: MAX_QTY, MAX_LINES: MAX_LINES };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.INC_CATALOG = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
