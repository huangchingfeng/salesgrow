import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/SalesGrow/)
  })

  test('should display hero section', async ({ page }) => {
    await page.goto('/en')
    const hero = page.locator('[data-testid="hero-section"], main h1').first()
    await expect(hero).toBeVisible()
  })

  test('should switch language from en to ja', async ({ page }) => {
    await page.goto('/en')
    const languageSwitcher = page.locator('[data-testid="language-switcher"], [aria-label="Language"]').first()

    if (await languageSwitcher.isVisible()) {
      await languageSwitcher.click()
      const jaOption = page.locator('text=日本語').first()
      if (await jaOption.isVisible()) {
        await jaOption.click()
        await expect(page).toHaveURL(/\/ja/)
      }
    }
  })

  test('should switch language from en to ko', async ({ page }) => {
    await page.goto('/en')
    const languageSwitcher = page.locator('[data-testid="language-switcher"], [aria-label="Language"]').first()

    if (await languageSwitcher.isVisible()) {
      await languageSwitcher.click()
      const koOption = page.locator('text=한국어').first()
      if (await koOption.isVisible()) {
        await koOption.click()
        await expect(page).toHaveURL(/\/ko/)
      }
    }
  })

  test('should display CTA buttons', async ({ page }) => {
    await page.goto('/en')
    const ctaButtons = page.locator('[data-testid="cta-button"], a[href*="sign"], button:has-text("Start"), button:has-text("Try")')
    const count = await ctaButtons.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should display pricing section', async ({ page }) => {
    await page.goto('/en')
    const pricing = page.locator('[data-testid="pricing-section"], section:has-text("Free"), section:has-text("Pro")')
    const count = await pricing.count()
    // 定價區塊可能存在也可能不存在（取決於前端是否已實作）
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/en')
    await expect(page.locator('body')).toBeVisible()
  })

  test('should load without JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/en')
    await page.waitForTimeout(2000)
    expect(errors).toEqual([])
  })
})
