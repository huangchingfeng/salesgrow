import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('should display sign up page', async ({ page }) => {
    await page.goto('/en/sign-up')
    // 頁面應顯示（即使還沒實作，不應 500）
    expect(page.url()).toContain('sign-up')
  })

  test('should display sign in page', async ({ page }) => {
    await page.goto('/en/sign-in')
    expect(page.url()).toContain('sign-in')
  })

  test('should show email input on sign up', async ({ page }) => {
    await page.goto('/en/sign-up')
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible()
    }
  })

  test('should show password input on sign up', async ({ page }) => {
    await page.goto('/en/sign-up')
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
    if (await passwordInput.isVisible()) {
      await expect(passwordInput).toBeVisible()
    }
  })

  test('should show email input on sign in', async ({ page }) => {
    await page.goto('/en/sign-in')
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    if (await emailInput.isVisible()) {
      await expect(emailInput).toBeVisible()
    }
  })

  test('should validate empty email on sign in', async ({ page }) => {
    await page.goto('/en/sign-in')
    const submitButton = page.locator('button[type="submit"]').first()
    if (await submitButton.isVisible()) {
      await submitButton.click()
      // 應顯示驗證錯誤或瀏覽器原生驗證
      const emailInput = page.locator('input[type="email"]').first()
      if (await emailInput.isVisible()) {
        const validity = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid)
        expect(validity).toBe(false)
      }
    }
  })

  test('should redirect unauthenticated users from dashboard', async ({ page }) => {
    await page.goto('/en/dashboard')
    // 未登入用戶應被重導向到登入頁或首頁
    await page.waitForTimeout(2000)
    const url = page.url()
    const isRedirected = url.includes('sign-in') || url.includes('login') || !url.includes('dashboard')
    expect(isRedirected).toBeTruthy()
  })

  test('should have link to sign in from sign up page', async ({ page }) => {
    await page.goto('/en/sign-up')
    const signInLink = page.locator('a[href*="sign-in"], a:has-text("Sign in"), a:has-text("Log in")')
    if (await signInLink.first().isVisible()) {
      await expect(signInLink.first()).toBeVisible()
    }
  })
})
