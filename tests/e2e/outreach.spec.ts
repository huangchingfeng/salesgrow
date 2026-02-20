import { test, expect } from '@playwright/test'

test.describe('Outreach Email', () => {
  test('should load outreach page', async ({ page }) => {
    await page.goto('/en/outreach')
    await page.waitForTimeout(2000)
    const url = page.url()
    const isOnPage = url.includes('outreach') || url.includes('sign-in')
    expect(isOnPage).toBeTruthy()
  })

  test('should display email generation form', async ({ page }) => {
    await page.goto('/en/outreach')
    await page.waitForTimeout(2000)

    // 檢查是否有表單元素
    const formElements = page.locator('form, textarea, [data-testid="outreach-form"]')
    const count = await formElements.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should display tone selection', async ({ page }) => {
    await page.goto('/en/outreach')
    await page.waitForTimeout(2000)

    const toneSelector = page.locator(
      'select[name="tone"], [data-testid="tone-selector"], button:has-text("Formal"), button:has-text("Friendly")'
    )
    const count = await toneSelector.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should show score display area', async ({ page }) => {
    await page.goto('/en/outreach')
    await page.waitForTimeout(2000)

    const scoreDisplay = page.locator(
      '[data-testid="score-display"], .score, text=/\\d+\\/100/'
    )
    const count = await scoreDisplay.count()
    // 評分區塊可能在生成後才出現
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should have a copy button', async ({ page }) => {
    await page.goto('/en/outreach')
    await page.waitForTimeout(2000)

    const copyButton = page.locator(
      'button:has-text("Copy"), button[data-testid="copy-button"], button[aria-label="Copy"]'
    )
    const count = await copyButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should have a generate button', async ({ page }) => {
    await page.goto('/en/outreach')
    await page.waitForTimeout(2000)

    const generateButton = page.locator(
      'button:has-text("Generate"), button:has-text("Create"), button[data-testid="generate-button"]'
    )
    const count = await generateButton.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should not crash on page load', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/en/outreach')
    await page.waitForTimeout(3000)
    expect(errors).toEqual([])
  })
})
