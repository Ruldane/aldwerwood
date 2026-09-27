import { expect, test, type Page } from "@playwright/test";

type Chronicle = { c: number; rawC: number; year: number; hour: number; chapter: number };

const state = (page: Page) => page.evaluate(() => window.__alderwood as Chronicle);

/** Scroll so the chapter coordinate equals `c` (0 = top, 7 = bottom). */
async function scrollToC(page: Page, c: number) {
  await page.evaluate((c) => {
    const secs = [...document.querySelectorAll<HTMLElement>("section[data-chapter]")];
    const max = document.documentElement.scrollHeight - innerHeight;
    const tops = secs.map((s) => s.getBoundingClientRect().top + scrollY);
    tops[0] = 0;
    tops.push(max);
    const i = Math.min(6, Math.floor(c));
    window.scrollTo({ top: tops[i] + (tops[i + 1] - tops[i]) * (c - i), behavior: "instant" });
  }, c);
  // Let the smoothed scene clock settle onto the new position.
  await expect.poll(async () => Math.abs((await state(page)).c - c), { timeout: 5000 }).toBeLessThan(0.01);
}

/** Mean luminance of the land canvas, 0..255. */
const landLuminance = (page: Page) =>
  page.evaluate(() => {
    const canvases = document.querySelectorAll("canvas");
    const sky = canvases[0];
    const land = canvases[1];
    const out = document.createElement("canvas");
    out.width = 160;
    out.height = 100;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#e4dfca";
    ctx.fillRect(0, 0, 160, 100);
    ctx.drawImage(sky, 0, 0, 160, 100);
    ctx.drawImage(land, 0, 0, 160, 100);
    const d = ctx.getImageData(0, 0, 160, 100).data;
    let sum = 0;
    for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    return sum / (d.length / 4);
  });

test.describe("The Chronicle of Alderwood", () => {
  test("opens on the 1887 title page with no console errors", async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (m) => {
      if (m.type() === "error" || m.type() === "warning") problems.push(m.text());
    });
    page.on("pageerror", (e) => problems.push(e.message));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "The Chronicle of Alderwood" })).toBeVisible();
    await expect.poll(() => state(page).then((s) => s?.year)).toBe(1887);
    expect(await page.locator("html").getAttribute("class")).toContain("timeline-live");
    await page.waitForTimeout(1000);
    expect(problems).toEqual([]);
  });

  test("scroll is time: years and hours advance and reverse continuously", async ({ page }) => {
    await page.goto("/");
    await scrollToC(page, 2.5);
    const canopy = await state(page);
    expect(canopy.year).toBeCloseTo(1924, 0);
    expect(canopy.hour).toBeGreaterThan(11);
    expect(canopy.hour).toBeLessThan(13);

    await scrollToC(page, 4.55);
    expect(Math.round((await state(page)).year)).toBe(1968);

    await scrollToC(page, 6.8);
    const night = await state(page);
    expect(night.year).toBeGreaterThanOrEqual(2026);
    expect(night.hour).toBeGreaterThan(21);

    // Scrolling back up returns the wood to its first spring.
    await scrollToC(page, 0.2);
    expect((await state(page)).year).toBe(1887);
  });

  test("the drawn world changes with time, dawn to night", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(3200); // opening ink-in
    await scrollToC(page, 1.5);
    const morning = await landLuminance(page);
    await scrollToC(page, 6.7);
    await page.waitForTimeout(300);
    const night = await landLuminance(page);
    expect(morning).toBeGreaterThan(120);
    expect(night).toBeLessThan(morning * 0.55);
  });

  test("chapter sections expose local progress to CSS", async ({ page }) => {
    await page.goto("/");
    await scrollToC(page, 3.5);
    const p = await page.locator("#years-of-silence").evaluate((el) => parseFloat(el.style.getPropertyValue("--p")));
    expect(p).toBeGreaterThan(0.45);
    expect(p).toBeLessThan(0.55);
  });

  test("year rule navigates to a chapter and marks it current", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Years of the chronicle" });
    await nav.getByRole("link", { name: /1968/ }).click();
    await expect.poll(() => state(page).then((s) => s.chapter), { timeout: 8000 }).toBe(4);
    await expect(nav.getByRole("link", { name: /1968/ })).toHaveAttribute("aria-current", "location");
    await expect(page.locator("#the-great-storm")).toBeFocused();
  });

  test("document structure: one h1, seven chapter headings, landmarks", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("section[data-chapter] h2[id$='-title']")).toHaveCount(7);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.locator("canvas").first()).toHaveAttribute("width", /\d+/);
    expect(await page.locator("[aria-hidden] canvas").count()).toBe(2);
  });

  test("keyboard: the skip link is first and bypasses the year rule", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to the chronicle" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("#top")).toBeFocused();
  });

  test("mobile chapter list closes on Escape", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /Chapters/ });
    await toggle.click();
    await expect(page.locator("#years-list")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  for (const [width, height] of [
    [390, 844],
    [768, 1024],
    [1440, 900],
    [2560, 1080],
  ]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      for (const c of [0.3, 2.4, 4.6, 6.7]) {
        await scrollToC(page, c);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `overflow at c=${c}`).toBeLessThanOrEqual(0);
      }
    });
  }

  test("mobile: the year stamp opens and closes the chapter list", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const toggle = page.getByRole("button", { name: /Chapters/ });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#years-list")).toBeHidden();
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await page.getByRole("link", { name: /The Young Grove/ }).click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect.poll(() => state(page).then((s) => s.chapter), { timeout: 8000 }).toBe(1);
  });

  test("reduced motion: no smoothing, no wipes, a still frame", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await scrollToC(page, 4.55);
    const s = await state(page);
    expect(s.c).toBeCloseTo(s.rawC, 5);
    expect(await page.locator("[data-write]").first().evaluate((el) => getComputedStyle(el).clipPath)).toBe("none");
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
    await page.waitForTimeout(800);
    const a = await page.screenshot();
    await page.waitForTimeout(700);
    const b = await page.screenshot();
    expect(a.equals(b)).toBe(true);
  });
});
