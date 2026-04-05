import { test, expect } from '@playwright/test'

test.describe('FightBrain Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('app loads and shows the mind map canvas', async ({ page }) => {
    await expect(page.locator('.markmap')).toBeVisible()
  })

  test('toolbar is visible with key buttons', async ({ page }) => {
    await expect(page.getByTitle(/undo/i)).toBeVisible()
    await expect(page.getByTitle(/redo/i)).toBeVisible()
    await expect(page.getByTitle(/add child/i)).toBeVisible()
  })

  test('can add a child node to root', async ({ page }) => {
    await page.locator('svg.markmap').click({ position: { x: 200, y: 300 } })
    await page.getByTitle(/add child/i).click()
    await expect(page.locator('.markmap-node')).toHaveCount(2)
  })

  test('settings dialog opens and closes', async ({ page }) => {
    await page.getByTitle(/settings/i).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByLabel(/close settings/i).click()
    await expect(page.getByRole('dialog')).not.toBeVisible()
  })

  test('search panel opens and closes', async ({ page }) => {
    await page.getByTitle(/search/i).click()
    await expect(page.getByPlaceholder(/search/i)).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByPlaceholder(/search/i)).not.toBeVisible()
  })
})
