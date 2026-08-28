#!/usr/bin/env python3

"""Bounded production browser regression suite for the PeakTalk landing page."""

import json
import os
from pathlib import Path

from playwright.sync_api import Page, sync_playwright


BASE_URL = os.environ.get("LANDING_BASE_URL", "http://127.0.0.1:3100")
CHROME_OVERRIDE = os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE")
LOCAL_CHROME_PATH = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")
EVIDENCE_DIR = (
    Path(__file__).resolve().parents[2]
    / ".superpowers/sdd/2026-08-28-landing-polish/screenshots"
)
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)

FOCUSABLE_SELECTOR = (
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), '
    'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
)


def check(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def settle(page: Page) -> None:
    page.wait_for_load_state("domcontentloaded")
    try:
        page.wait_for_load_state("networkidle", timeout=15_000)
    except Exception:
        pass
    page.locator("h1").wait_for(state="visible")
    page.wait_for_timeout(300)


def open_home(page: Page) -> None:
    page.goto(BASE_URL, wait_until="domcontentloaded")
    settle(page)


def reveal_page(page: Page) -> None:
    for selector in ["#pressure", "#scenarios", "#case", "#pricing", "#faq", "footer"]:
        page.locator(selector).scroll_into_view_if_needed()
        page.wait_for_timeout(200)
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(300)


def active_focus_index(page: Page) -> int:
    return page.evaluate(
        f"""() => {{
          const dialog = document.querySelector('#landing-mobile-menu');
          const controls = Array.from(dialog.querySelectorAll('{FOCUSABLE_SELECTOR}'))
            .filter((node) => node.getClientRects().length > 0);
          return controls.indexOf(document.activeElement);
        }}"""
    )


with sync_playwright() as playwright:
    launch_options = {
        "headless": True,
        "args": ["--autoplay-policy=no-user-gesture-required"],
    }
    if CHROME_OVERRIDE:
        launch_options["executable_path"] = CHROME_OVERRIDE
    elif LOCAL_CHROME_PATH.exists():
        launch_options["executable_path"] = str(LOCAL_CHROME_PATH)
    browser = playwright.chromium.launch(**launch_options)
    results: dict[str, object] = {
        "menu": {},
        "faq": {},
        "film": {},
        "responsive": {},
        "reducedMotion": {},
    }

    mobile_context = browser.new_context(
        viewport={"width": 390, "height": 844}, ignore_https_errors=True
    )
    page = mobile_context.new_page()
    open_home(page)
    page.evaluate("window.scrollTo(0, 320)")
    page.wait_for_timeout(200)
    scroll_before_open = page.evaluate("window.scrollY")
    opener = page.get_by_role("button", name="Открыть меню")
    opener.click()
    dialog = page.locator("#landing-mobile-menu")
    dialog.wait_for(state="visible")

    focus_count = dialog.locator(FOCUSABLE_SELECTOR).count()
    start_focus_index = active_focus_index(page)
    check(focus_count == 8, f"Expected 8 visible mobile-menu controls, received {focus_count}")
    check(start_focus_index >= 0, "Focus did not move inside the mobile menu on open")
    check(dialog.get_attribute("role") == "dialog", "Mobile menu does not expose dialog semantics")
    check(dialog.get_attribute("aria-modal") == "true", "Mobile menu is not announced as modal")
    check(dialog.get_attribute("aria-label") == "Навигация по странице", "Mobile menu dialog lacks its accessible label")
    locked_scroll_y = page.evaluate("window.scrollY")

    forward_indices = []
    for _ in range(focus_count):
        page.keyboard.press("Tab")
        forward_indices.append(active_focus_index(page))
        check(forward_indices[-1] >= 0, "Forward Tab escaped the mobile menu")
    check(
        forward_indices[-1] == start_focus_index,
        "Forward Tab did not wrap to the initial mobile-menu control",
    )

    backward_indices = []
    for _ in range(focus_count):
        page.keyboard.press("Shift+Tab")
        backward_indices.append(active_focus_index(page))
        check(backward_indices[-1] >= 0, "Shift+Tab escaped the mobile menu")
    check(
        backward_indices[-1] == start_focus_index,
        "Shift+Tab did not wrap to the initial mobile-menu control",
    )

    page.mouse.move(195, 420)
    page.mouse.wheel(0, 700)
    page.wait_for_timeout(250)
    scroll_while_open = page.evaluate("window.scrollY")
    check(
        scroll_while_open == locked_scroll_y,
        f"Background scrolled while menu was open: {locked_scroll_y} -> {scroll_while_open}",
    )
    page.screenshot(
        path=str(EVIDENCE_DIR / "final-review-landing-390x844-menu-open.png"),
        full_page=False,
    )

    page.evaluate(
        """() => {
          window.__menuExitSentinel = { samples: 0, violations: [] };
          const sampleExitInterval = () => {
            const dialog = document.querySelector('#landing-mobile-menu');
            if (!dialog) return;
            const locked = document.documentElement.style.overflow === 'hidden'
              && document.body.style.overflow === 'hidden'
              && document.body.style.position === 'fixed';
            const focusInside = dialog.contains(document.activeElement);
            window.__menuExitSentinel.samples += 1;
            if (!locked || !focusInside) {
              window.__menuExitSentinel.violations.push({ locked, focusInside });
            }
            window.requestAnimationFrame(sampleExitInterval);
          };
          window.requestAnimationFrame(sampleExitInterval);
        }"""
    )
    page.keyboard.press("Escape")
    dialog.wait_for(state="detached")
    exit_sentinel = page.evaluate("window.__menuExitSentinel")
    check(
        not exit_sentinel["violations"],
        f"Modal containment ended while the exiting dialog was still mounted: {exit_sentinel}",
    )
    page.wait_for_function(
        "document.activeElement?.getAttribute('aria-label') === 'Открыть меню'"
    )
    scroll_after_escape = page.evaluate("window.scrollY")
    check(page.evaluate("document.activeElement?.getAttribute('aria-label')") == "Открыть меню", "Escape did not restore focus to the menu opener")
    check(
        scroll_after_escape == scroll_before_open,
        f"Escape did not restore the prior scroll position: {scroll_before_open} -> {scroll_after_escape}",
    )

    opener.click()
    dialog.wait_for(state="visible")
    dialog.get_by_role("link", name="FAQ", exact=True).click()
    dialog.wait_for(state="detached")
    page.wait_for_function("window.location.hash === '#faq'")
    page.wait_for_function(
        """() => {
          const target = document.querySelector('#faq').getBoundingClientRect();
          return target.top < window.innerHeight && target.bottom > 0;
        }"""
    )
    anchor_scroll_y = page.evaluate("window.scrollY")
    check(anchor_scroll_y > scroll_before_open, "FAQ anchor did not move the page to the target section")
    check(
        page.evaluate("document.activeElement?.getAttribute('aria-label')") != "Открыть меню",
        "Menu-link navigation incorrectly restored focus to the opener",
    )
    page.screenshot(
        path=str(EVIDENCE_DIR / "final-review-landing-390x844-anchor.png"),
        full_page=True,
    )

    faq_button = page.get_by_role("button", name="Нужна ли регистрация?")
    faq_button.focus()
    page.keyboard.press("Enter")
    page.wait_for_function(
        "document.activeElement?.getAttribute('aria-expanded') === 'true'"
    )
    check(faq_button.get_attribute("aria-expanded") == "true", "Non-first FAQ did not open from the keyboard")
    results["menu"] = {
        "controlCount": focus_count,
        "startFocusIndex": start_focus_index,
        "forwardIndices": forward_indices,
        "backwardIndices": backward_indices,
        "scrollBeforeOpen": scroll_before_open,
        "lockedScrollY": locked_scroll_y,
        "scrollWhileOpen": scroll_while_open,
        "scrollAfterEscape": scroll_after_escape,
        "escapeRestoredOpener": True,
        "exitIntervalSamples": exit_sentinel["samples"],
        "exitIntervalViolations": exit_sentinel["violations"],
        "anchorHash": page.evaluate("window.location.hash"),
        "anchorScrollY": anchor_scroll_y,
        "anchorTargetVisible": True,
    }
    results["faq"] = {"keyboardExpanded": faq_button.get_attribute("aria-expanded")}
    mobile_context.close()

    height_budgets = {
        "1440x1000": 6200,
        "1024x900": 6600,
        "768x1024": 8300,
        "390x844": 9000,
    }
    for width, height, label in [
        (1440, 1000, "1440x1000"),
        (1024, 900, "1024x900"),
        (768, 1024, "768x1024"),
        (390, 844, "390x844"),
    ]:
        context = browser.new_context(
            viewport={"width": width, "height": height}, ignore_https_errors=True
        )
        page = context.new_page()
        console_errors: list[str] = []
        page.on(
            "console",
            lambda message: console_errors.append(message.text)
            if message.type == "error"
            else None,
        )
        open_home(page)
        reveal_page(page)
        metrics = page.evaluate(
            """() => ({
              viewportWidth: window.innerWidth,
              scrollWidth: document.documentElement.scrollWidth,
              scrollHeight: document.documentElement.scrollHeight,
            })"""
        )
        check(
            metrics["scrollWidth"] == width,
            f"Horizontal overflow at {label}: {metrics['scrollWidth']} > {width}",
        )
        check(
            metrics["scrollHeight"] <= height_budgets[label],
            f"Height budget exceeded at {label}: {metrics['scrollHeight']} > {height_budgets[label]}",
        )
        check(not console_errors, f"Console errors at {label}: {console_errors}")
        results["responsive"][label] = {
            **metrics,
            "heightBudget": height_budgets[label],
            "consoleErrors": console_errors,
        }
        page.screenshot(
            path=str(EVIDENCE_DIR / f"final-review-landing-{label}.png"),
            full_page=True,
        )
        context.close()

    film_context = browser.new_context(
        viewport={"width": 1440, "height": 1000}, ignore_https_errors=True
    )
    page = film_context.new_page()
    open_home(page)
    page.locator("[data-pressure-film]").scroll_into_view_if_needed()
    page.wait_for_selector("[data-pressure-video] source", state="attached")
    page.wait_for_function("document.querySelector('[data-pressure-video]')?.paused === false")
    playing_inside = page.evaluate("document.querySelector('[data-pressure-video]').paused === false")
    check(page.locator("[data-pressure-video] source").count() == 1, "Film mounted more than one source")
    page.evaluate(
        """() => {
          window.__landingFilmMutations = { added: 0, removed: 0 };
          new MutationObserver((mutations) => {
            for (const mutation of mutations) {
              window.__landingFilmMutations.added += mutation.addedNodes.length;
              window.__landingFilmMutations.removed += mutation.removedNodes.length;
            }
          }).observe(document.querySelector('[data-pressure-film]'), { childList: true, subtree: true });
        }"""
    )
    page.locator("#scenarios").scroll_into_view_if_needed()
    page.wait_for_function(
        """() => {
          const film = document.querySelector('[data-pressure-film]').getBoundingClientRect();
          return film.bottom < 0 && document.querySelector('[data-pressure-video]')?.paused === true;
        }"""
    )
    paused_outside = page.evaluate("document.querySelector('[data-pressure-video]').paused === true")
    check(page.locator("[data-pressure-video] source").count() == 1, "Film source unmounted outside the viewport")
    page.locator("[data-pressure-film]").scroll_into_view_if_needed()
    page.wait_for_function("document.querySelector('[data-pressure-video]')?.paused === false")
    page.evaluate("document.querySelector('[data-pressure-video]').currentTime = 10.6")
    page.wait_for_function("document.querySelector('[data-pressure-video]')?.dataset.meaningfulFrame === 'true'")
    meaningful_frame_at_threshold = page.locator("[data-pressure-video]").get_attribute("data-meaningful-frame")
    source_count_at_threshold = page.locator("[data-pressure-video] source").count()
    page.evaluate("document.querySelector('[data-pressure-video]').currentTime = 0.5")
    page.wait_for_function("document.querySelector('[data-pressure-video]')?.dataset.meaningfulFrame === 'false'")
    film_result = page.evaluate(
        """() => {
          const video = document.querySelector('[data-pressure-video]');
          return {
            playingInside: %s,
            pausedOutside: %s,
            meaningfulFrameAtThreshold: '%s',
            sourceCountAtThreshold: %s,
            pausedAfterReentry: video.paused,
            sourceCount: video.querySelectorAll('source').length,
            meaningfulFrameAfterRewind: video.dataset.meaningfulFrame,
            opacityAfterRewind: getComputedStyle(video).opacity,
            transitionDurationAfterRewind: getComputedStyle(video).transitionDuration,
            mutations: window.__landingFilmMutations,
          };
        }"""
        % (
            str(playing_inside).lower(),
            str(paused_outside).lower(),
            meaningful_frame_at_threshold,
            source_count_at_threshold,
        )
    )
    check(not film_result["pausedAfterReentry"], "Film did not resume after viewport re-entry")
    check(film_result["sourceCount"] == 1, "Film source count changed after lifecycle checks")
    check(film_result["meaningfulFrameAfterRewind"] == "false", "Film poster did not return after rewind")
    check(film_result["opacityAfterRewind"] == "0", "Low-information rewind frame remained visible")
    check(film_result["transitionDurationAfterRewind"] == "0s", "Rewind used a visible fade-out")
    check(film_result["mutations"] == {"added": 0, "removed": 0}, "Film DOM remounted after initial source mount")
    results["film"] = film_result
    film_context.close()

    zero_source_contexts = [
        (
            browser.new_context(
                viewport={"width": 390, "height": 844}, ignore_https_errors=True
            ),
            "mobile",
        ),
        (
            browser.new_context(
                viewport={"width": 1440, "height": 1000},
                reduced_motion="reduce",
                ignore_https_errors=True,
            ),
            "reducedMotion",
        ),
    ]
    for context, label in zero_source_contexts:
        page = context.new_page()
        open_home(page)
        page.locator("[data-pressure-film]").scroll_into_view_if_needed()
        page.wait_for_timeout(500)
        counts = page.evaluate(
            """() => ({
              videoCount: document.querySelectorAll('[data-pressure-video]').length,
              sourceCount: document.querySelectorAll('[data-pressure-video] source').length,
            })"""
        )
        check(counts == {"videoCount": 0, "sourceCount": 0}, f"{label} mounted film media: {counts}")
        results["reducedMotion" if label == "reducedMotion" else "mobileMedia"] = counts
        context.close()

    browser.close()

print(json.dumps(results, ensure_ascii=False, indent=2))
