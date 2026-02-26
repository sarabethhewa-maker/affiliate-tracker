/**
 * BLL Affiliate Tracking Snippet
 * Paste into WordPress (header or via Code Snippets) or load via GTM.
 * Captures ?ref= or ?affiliate= and sends to WooCommerce checkout as _bll_affiliate_ref.
 */
(function () {
  "use strict";

  var COOKIE_NAME = "bll_ref";
  var STORAGE_KEY = "bll_ref";
  var DAYS = 30;
  var MAX_AGE = DAYS * 24 * 60 * 60;

  function getParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name) || params.get(name.toLowerCase()) || "";
  }

  function setCookie(value) {
    if (!value) return;
    document.cookie =
      COOKIE_NAME +
      "=" +
      encodeURIComponent(value) +
      "; path=/; max-age=" +
      MAX_AGE +
      "; SameSite=Lax";
  }

  function setStorage(value) {
    if (!value) return;
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (e) {}
  }

  function getRef() {
    var ref = getParam("ref") || getParam("affiliate");
    if (ref && ref.trim()) return ref.trim();
    try {
      return (
        document.cookie
          .split(";")
          .map(function (c) {
            var parts = c.trim().split("=");
            return parts[0] === COOKIE_NAME ? decodeURIComponent(parts.slice(1).join("=").trim()) : "";
          })
          .filter(Boolean)[0] || ""
      );
    } catch (e) {
      return "";
    }
  }

  function getFromStorage() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  // On page load: capture ref from URL and persist
  var refFromUrl = getParam("ref") || getParam("affiliate");
  if (refFromUrl && refFromUrl.trim()) {
    var val = refFromUrl.trim();
    setCookie(val);
    setStorage(val);
  }

  // Ensure checkout has hidden field and value (WooCommerce)
  function injectCheckoutField() {
    var ref = getRef() || getFromStorage();
    if (!ref) return;

    var form =
      document.querySelector("form.checkout") ||
      document.querySelector("#order_review")?.closest("form") ||
      document.querySelector('form[name="checkout"]');
    if (!form) return;

    var existing = form.querySelector('input[name="_bll_affiliate_ref"]');
    if (existing) {
      existing.value = ref;
      return;
    }

    var input = document.createElement("input");
    input.type = "hidden";
    input.name = "_bll_affiliate_ref";
    input.id = "_bll_affiliate_ref";
    input.value = ref;
    form.appendChild(input);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectCheckoutField);
  } else {
    injectCheckoutField();
  }

  // Re-inject when checkout updates (WooCommerce AJAX)
  if (typeof jQuery !== "undefined") {
    jQuery(function ($) {
      $(document.body).on("updated_checkout updated_cart_totals", injectCheckoutField);
    });
  }
})();
