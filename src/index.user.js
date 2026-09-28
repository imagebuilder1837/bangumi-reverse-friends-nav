// ==UserScript==
// @name         Bangumi 反向好友导航
// @namespace    https://github.com/imagebuilder1837/bangumi-reverse-friends-nav
// @version      0.1.0
// @description  在用户页个人导航中增加“反向好友”入口。
// @author       imagebuilder1837
// @match        https://bgm.tv/user/*
// @match        https://bgm.tv/anime/list/*
// @match        https://bgm.tv/book/list/*
// @match        https://bgm.tv/music/list/*
// @match        https://bgm.tv/game/list/*
// @match        https://bgm.tv/real/list/*
// @match        https://bangumi.tv/user/*
// @match        https://bangumi.tv/anime/list/*
// @match        https://bangumi.tv/book/list/*
// @match        https://bangumi.tv/music/list/*
// @match        https://bangumi.tv/game/list/*
// @match        https://bangumi.tv/real/list/*
// @match        https://chii.in/user/*
// @match        https://chii.in/anime/list/*
// @match        https://chii.in/book/list/*
// @match        https://chii.in/music/list/*
// @match        https://chii.in/game/list/*
// @match        https://chii.in/real/list/*
// @run-at       document-end
// @grant        none
// @license      MIT
// @downloadURL  https://raw.githubusercontent.com/imagebuilder1837/bangumi-reverse-friends-nav/refs/heads/main/src/index.user.js
// @updateURL    https://raw.githubusercontent.com/imagebuilder1837/bangumi-reverse-friends-nav/refs/heads/main/src/index.user.js
// ==/UserScript==

(() => {
  "use strict";

  const NAV_SELECTOR = ".navTabs";
  const FRIENDS_SELECTOR = 'a[href$="/friends"]';
  const REVERSE_FRIENDS_SELECTOR = 'a[href$="/rev_friends"]';

  function classNames(element) {
    const value =
      typeof element.getAttribute === "function"
        ? element.getAttribute("class")
        : element.className;
    return String(value ?? "")
      .split(/\s+/)
      .filter(Boolean);
  }

  function setClassNames(element, names) {
    const value = names.join(" ");
    if (typeof element.setAttribute === "function") {
      element.setAttribute("class", value);
    } else {
      element.className = value;
    }
  }

  function setFocus(element, focused) {
    const names = classNames(element).filter((name) => name !== "focus");
    if (focused) names.push("focus");
    setClassNames(element, names);
  }

  function hrefOf(element) {
    const attributeHref = element.getAttribute?.("href");
    return attributeHref ?? element.href;
  }

  function reverseHrefOf(friendsHref) {
    if (typeof friendsHref !== "string") return undefined;
    const reverseHref = friendsHref.replace(/\/friends$/, "/rev_friends");
    return reverseHref === friendsHref ? undefined : reverseHref;
  }

  function createReverseFriendsTab(pageDocument, friendsTab, reverseHref) {
    const friendsItem = friendsTab.parentElement;
    if (!friendsItem) return undefined;

    const reverseItem = pageDocument.createElement(
      friendsItem.tagName?.toLowerCase() || "li",
    );
    const itemClasses = classNames(friendsItem);
    if (itemClasses.length > 0) setClassNames(reverseItem, itemClasses);

    const reverseTab = pageDocument.createElement(
      friendsTab.tagName?.toLowerCase() || "a",
    );
    const tabClasses = classNames(friendsTab).filter(
      (name) => name !== "focus",
    );
    if (tabClasses.length > 0) setClassNames(reverseTab, tabClasses);
    reverseTab.setAttribute("href", reverseHref);
    reverseTab.textContent = "反向好友";
    reverseItem.append(reverseTab);

    return { reverseItem, reverseTab, friendsItem };
  }

  function correctFocus(friendsTab, reverseTab, pathname) {
    if (
      typeof pathname !== "string" ||
      !classNames(friendsTab).includes("focus")
    ) {
      return;
    }

    const isFriendsPage = /^\/user\/[^/]+\/friends\/?$/.test(pathname);
    const isReverseFriendsPage = /^\/user\/[^/]+\/rev_friends\/?$/.test(
      pathname,
    );

    if (isFriendsPage) {
      setFocus(friendsTab, true);
      setFocus(reverseTab, false);
    } else if (isReverseFriendsPage) {
      setFocus(friendsTab, false);
      setFocus(reverseTab, true);
    }
  }

  function ensureReverseFriendsTab(runtime = {}) {
    const pageDocument =
      runtime.document ??
      (typeof document === "undefined" ? undefined : document);
    const pageLocation =
      runtime.location ??
      (typeof location === "undefined" ? undefined : location);
    if (!pageDocument) return undefined;

    const navTabs = pageDocument.querySelector(NAV_SELECTOR);
    if (!navTabs) return undefined;

    const friendsTab = navTabs.querySelector(FRIENDS_SELECTOR);
    if (!friendsTab) return undefined;

    const existingReverseTab = navTabs.querySelector(REVERSE_FRIENDS_SELECTOR);
    if (existingReverseTab) return existingReverseTab;

    const reverseHref = reverseHrefOf(hrefOf(friendsTab));
    if (!reverseHref) return undefined;

    const created = createReverseFriendsTab(
      pageDocument,
      friendsTab,
      reverseHref,
    );
    if (!created || created.friendsItem.parentElement !== navTabs) {
      return undefined;
    }

    navTabs.insertBefore(
      created.reverseItem,
      created.friendsItem.nextElementSibling,
    );
    correctFocus(friendsTab, created.reverseTab, pageLocation?.pathname);
    return created.reverseTab;
  }

  function initialize(runtime = {}) {
    return ensureReverseFriendsTab(runtime);
  }

  const core = { ensureReverseFriendsTab, initialize };

  if (
    typeof module === "object" &&
    module.exports &&
    typeof document === "undefined"
  ) {
    module.exports = core;
    return;
  }

  initialize();
})();
