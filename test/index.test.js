const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { ensureReverseFriendsTab } = require("../src/index.user.js");

test("metadata covers each supported host and path family", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "src", "index.user.js"),
    "utf8",
  );

  for (const host of ["bgm.tv", "bangumi.tv", "chii.in"]) {
    for (const pathPattern of [
      "/user/*",
      "/anime/list/*",
      "/book/list/*",
      "/music/list/*",
      "/game/list/*",
      "/real/list/*",
    ]) {
      assert.ok(
        source.includes(`// @match        https://${host}${pathPattern}`),
        `${host}${pathPattern} should be matched`,
      );
    }
  }
  assert.doesNotMatch(source, /\/\/ @match.*\/\*\/list\/\*/);
});

class Element {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName.toLowerCase();
    this.ownerDocument = ownerDocument;
    this.attributes = new Map();
    this.children = [];
    this.parentElement = null;
  }

  get className() {
    return this.getAttribute("class") ?? "";
  }

  set className(value) {
    this.setAttribute("class", value);
  }

  get nextElementSibling() {
    const siblings = this.parentElement?.children ?? [];
    const index = siblings.indexOf(this);
    return index === -1 ? null : siblings[index + 1] ?? null;
  }

  get textContent() {
    return this.children
      .map((child) =>
        typeof child === "string" ? child : child.textContent,
      )
      .join("");
  }

  set textContent(value) {
    this.children = [String(value)];
  }

  append(...nodes) {
    for (const node of nodes) {
      if (node?.parentElement) {
        const index = node.parentElement.children.indexOf(node);
        if (index !== -1) node.parentElement.children.splice(index, 1);
      }
      this.children.push(node);
      if (typeof node !== "string") {
        node.parentElement = this;
        node.ownerDocument ??= this.ownerDocument;
      }
    }
  }

  appendChild(node) {
    this.append(node);
    return node;
  }

  insertBefore(node, reference) {
    if (node?.parentElement) {
      const index = node.parentElement.children.indexOf(node);
      if (index !== -1) node.parentElement.children.splice(index, 1);
    }
    const index = reference ? this.children.indexOf(reference) : -1;
    this.children.splice(index === -1 ? this.children.length : index, 0, node);
    node.parentElement = this;
    node.ownerDocument ??= this.ownerDocument;
    return node;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  querySelector(selector) {
    return (
      [this, ...descendants(this)].find((node) => matches(node, selector)) ?? null
    );
  }

  querySelectorAll(selector) {
    return [this, ...descendants(this)].filter((node) => matches(node, selector));
  }
}

class Document {
  constructor() {
    this.children = [];
  }

  createElement(tagName) {
    return new Element(tagName, this);
  }

  querySelector(selector) {
    return (
      this.children
        .flatMap((child) => [child, ...descendants(child)])
        .find((node) => matches(node, selector)) ?? null
    );
  }
}

function descendants(node) {
  return node.children
    .filter((child) => typeof child !== "string")
    .flatMap((child) => [child, ...descendants(child)]);
}

function matches(node, selector) {
  if (selector === ".navTabs") {
    return (
      node.tagName === "ul" &&
      node.className.split(/\s+/).includes("navTabs")
    );
  }
  const match = /^a\[href\$="([^"]+)"\]$/.exec(selector);
  return Boolean(
    match &&
      node.tagName === "a" &&
      node.getAttribute("href")?.endsWith(match[1]),
  );
}

function createPage({ pathname, withNav = true, withFriends = true, withReverse = false }) {
  const document = new Document();
  const page = { document, location: { pathname } };
  if (!withNav) return page;

  const nav = document.createElement("ul");
  nav.className = "navTabs";
  document.children.push(nav);

  const before = document.createElement("li");
  const friendItem = document.createElement("li");
  const after = document.createElement("li");
  const beforeTab = document.createElement("a");
  const friendsTab = document.createElement("a");
  const afterTab = document.createElement("a");
  beforeTab.setAttribute("href", "/user/foo");
  beforeTab.textContent = "时光机";
  friendsTab.setAttribute("href", "/user/source/friends");
  friendsTab.className = "focus native";
  friendsTab.textContent = "好友";
  const count = document.createElement("span");
  count.setAttribute("data-bangumi-friends-count", "");
  count.textContent = "（123 名）";
  friendsTab.append(count);
  afterTab.setAttribute("href", "/user/foo/wiki");
  afterTab.textContent = "维基";
  before.append(beforeTab);
  friendItem.append(friendsTab);
  after.append(afterTab);
  nav.append(before, friendItem, after);

  if (withFriends) page.friendsTab = friendsTab;
  if (withReverse) {
    const reverseItem = document.createElement("li");
    const reverseTab = document.createElement("a");
    reverseTab.setAttribute("href", "/user/official/rev_friends");
    reverseTab.className = "official";
    reverseTab.textContent = "官方反向好友";
    reverseItem.append(reverseTab);
    nav.insertBefore(reverseItem, after);
    page.reverseTab = reverseTab;
  }
  page.nav = nav;
  page.friendItem = friendItem;
  page.beforeTab = beforeTab;
  page.afterTab = afterTab;
  return page;
}

function classes(element) {
  return element.className.split(/\s+/).filter(Boolean);
}

function hasClass(element, className) {
  return classes(element).includes(className);
}

test("creates the reverse friends tab immediately after the native friends tab", () => {
  const page = createPage({ pathname: "/user/foo" });

  const reverseTab = ensureReverseFriendsTab(page);

  assert.equal(reverseTab.getAttribute("href"), "/user/source/rev_friends");
  assert.equal(reverseTab.textContent, "反向好友");
  assert.deepEqual(page.nav.children.map((item) => item.children[0]?.textContent), [
    "时光机",
    "好友（123 名）",
    "反向好友",
    "维基",
  ]);
  assert.equal(reverseTab.parentElement, page.nav.children[2]);
  assert.equal(hasClass(reverseTab, "focus"), false);
  assert.equal(page.friendsTab.children.length, 2);
  assert.equal(page.friendsTab.children[1].getAttribute("data-bangumi-friends-count"), "");
});

test("uses the friends href as the source of the reverse href", () => {
  const page = createPage({ pathname: "/user/current/timeline" });

  const reverseTab = ensureReverseFriendsTab(page);

  assert.equal(reverseTab.getAttribute("href"), "/user/source/rev_friends");
});

test("does not change focus on ordinary user and collection pages", () => {
  const paths = [
    "/user/foo",
    "/user/foo/timeline",
    "/user/foo/blog",
    "/anime/list/foo/collect",
    "/book/list/foo/collect",
    "/music/list/foo/collect",
    "/game/list/foo/collect",
    "/real/list/foo/collect",
  ];

  for (const pathname of paths) {
    const page = createPage({ pathname });
    const beforeClasses = page.friendsTab.className;

    ensureReverseFriendsTab(page);

    assert.equal(page.friendsTab.className, beforeClasses, pathname);
    assert.equal(hasClass(page.reverseTab ?? page.nav.children[2].children[0], "focus"), false, pathname);
  }
});

test("leaves focus alone when the native friends tab is not highlighted", () => {
  const page = createPage({ pathname: "/user/foo/rev_friends" });
  page.friendsTab.className = "native";
  page.afterTab.className = "focus other";

  const reverseTab = ensureReverseFriendsTab(page);

  assert.equal(hasClass(reverseTab, "focus"), false);
  assert.equal(page.friendsTab.className, "native");
  assert.equal(page.afterTab.className, "focus other");
  assert.equal(reverseTab.getAttribute("href"), "/user/source/rev_friends");
});

test("does not create a highlight when no tab is highlighted", () => {
  const page = createPage({ pathname: "/user/foo/rev_friends" });
  page.friendsTab.className = "native";

  const reverseTab = ensureReverseFriendsTab(page);

  assert.equal(hasClass(page.friendsTab, "focus"), false);
  assert.equal(hasClass(reverseTab, "focus"), false);
});

test("sets focus on the native friends tab on the friends page", () => {
  const page = createPage({ pathname: "/user/foo/friends/" });

  const reverseTab = ensureReverseFriendsTab(page);

  assert.equal(hasClass(page.friendsTab, "focus"), true);
  assert.equal(hasClass(reverseTab, "focus"), false);
  assert.equal(hasClass(page.friendsTab, "native"), true);
});

test("sets focus on the reverse friends tab on the reverse friends page", () => {
  const page = createPage({ pathname: "/user/foo/rev_friends/" });

  const reverseTab = ensureReverseFriendsTab(page);

  assert.equal(hasClass(page.friendsTab, "focus"), false);
  assert.equal(hasClass(reverseTab, "focus"), true);
  assert.equal(hasClass(reverseTab, "native"), true);
});

test("keeps another highlighted tab while correcting the reverse friends tab", () => {
  const page = createPage({ pathname: "/user/foo/rev_friends" });
  page.afterTab.className = "focus other";

  const reverseTab = ensureReverseFriendsTab(page);

  assert.equal(hasClass(page.friendsTab, "focus"), false);
  assert.equal(hasClass(reverseTab, "focus"), true);
  assert.equal(page.afterTab.className, "focus other");
});

test("is idempotent when run repeatedly", () => {
  const page = createPage({ pathname: "/user/foo" });

  const first = ensureReverseFriendsTab(page);
  const second = ensureReverseFriendsTab(page);

  assert.equal(second, first);
  assert.equal(page.nav.querySelectorAll('a[href$="/rev_friends"]').length, 1);
});

test("leaves an existing official reverse friends tab untouched", () => {
  const page = createPage({ pathname: "/user/foo/rev_friends", withReverse: true });
  const originalOrder = [...page.nav.children];
  const originalClass = page.reverseTab.className;
  const originalText = page.reverseTab.textContent;
  const originalHref = page.reverseTab.getAttribute("href");

  const result = ensureReverseFriendsTab(page);

  assert.equal(result, page.reverseTab);
  assert.deepEqual(page.nav.children, originalOrder);
  assert.equal(page.reverseTab.className, originalClass);
  assert.equal(page.reverseTab.textContent, originalText);
  assert.equal(page.reverseTab.getAttribute("href"), originalHref);
  assert.equal(hasClass(page.friendsTab, "focus"), true);
});

test("silently exits without a nav or native friends link", () => {
  assert.equal(ensureReverseFriendsTab(createPage({ pathname: "/user/foo", withNav: false })), undefined);

  const page = createPage({ pathname: "/user/foo" });
  page.friendsTab.parentElement.children.length = 0;
  assert.equal(ensureReverseFriendsTab(page), undefined);
});
