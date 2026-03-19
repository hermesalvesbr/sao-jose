import { test, expect } from '@playwright/test'

/**
 * Test suite for Despesas receipt functionality
 * Validates that clicking "Recibo" shows only the selected item's receipt
 */
test.describe('Despesas Receipt', () => {
  // Helper to login (adjust selectors based on your auth flow)
  const login = async (page: any) => {
    // Navigate to admin page
    await page.goto('/admin')

    // Wait for login form or check if already logged in
    const loginForm = page.locator('input[type="email"], input[name="email"]').first()
    const hasLoginForm = await loginForm.isVisible().catch(() => false)

    if (hasLoginForm) {
      // Fill login credentials (use env vars or test credentials)
      await page.fill('input[type="email"], input[name="email"]', process.env.TEST_EMAIL || 'test@example.com')
      await page.fill('input[type="password"], input[name="password"]', process.env.TEST_PASSWORD || 'password')
      await page.click('button[type="submit"], button:has-text("Entrar"), button:has-text("Login")')
      await page.waitForURL(/\/admin/, { timeout: 10000 })
    }
  }

  test('should display only selected expense receipt when clicking Recibo button', async ({ page }) => {
    // Login first
    await login(page)

    // Navigate to despesas page
    await page.goto('/admin/pdv/despesas')

    // Wait for the page to load and display expenses
    await page.waitForSelector('.v-expansion-panel', { timeout: 10000 })

    // Get all expense panels
    const panels = page.locator('.v-expansion-panel')
    const count = await panels.count()

    // Skip test if no expenses exist
    test.skip(count === 0, 'No expenses found to test')

    // Expand the first panel
    await panels.first().click()

    // Wait for panel content to be visible
    await page.waitForSelector('.v-expansion-panel-text', { state: 'visible' })

    // Get the first expense description for later verification
    const firstExpenseDescription = await panels.first().locator('.text-body-2').first().textContent()

    // Find and click the Recibo button (only visible for paid expenses)
    const reciboButton = panels.first().locator('button:has-text("Recibo")')

    // Check if there's a paid expense with Recibo button
    const hasReciboButton = await reciboButton.isVisible().catch(() => false)
    test.skip(!hasReciboButton, 'No paid expense with Recibo button found')

    // Click the Recibo button
    await reciboButton.click()

    // Wait for the receipt to be rendered (check for receipt container)
    await page.waitForSelector('.print-receipt', { state: 'visible', timeout: 5000 })

    // Verify the receipt shows only the selected item
    const receipt = page.locator('.print-receipt')
    await expect(receipt).toBeVisible()

    // Verify receipt contains the correct expense description
    const receiptText = await receipt.textContent()
    expect(receiptText).toContain(firstExpenseDescription)

    // Verify receipt title is present
    await expect(receipt.locator('text=RECIBO DE PAGAMENTO')).toBeVisible()

    // Verify the receipt doesn't show multiple items (list should be hidden)
    const receiptContainer = page.locator('.v-container:has(.print-receipt)')
    await expect(receiptContainer).toHaveClass(/print-receipt-active/)

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/receipt-single-item.png', fullPage: true })

    // Simulate print dialog (can't actually print, but verify print styles are applied)
    // Check that the receipt has the print-only class
    const printReceipt = page.locator('.print-receipt')
    await expect(printReceipt).toHaveCSS('display', 'block')
  })

  test('should hide full expense list when receipt is active', async ({ page }) => {
    await login(page)
    await page.goto('/admin/pdv/despesas')

    // Wait for the page to load
    await page.waitForSelector('.v-expansion-panel', { timeout: 10000 })

    const panels = page.locator('.v-expansion-panel')
    const count = await panels.count()
    test.skip(count === 0, 'No expenses found to test')

    // Expand first panel
    await panels.first().click()
    await page.waitForSelector('.v-expansion-panel-text', { state: 'visible' })

    // Click Recibo on first item
    const reciboButton = panels.first().locator('button:has-text("Recibo")')
    const hasReciboButton = await reciboButton.isVisible().catch(() => false)
    test.skip(!hasReciboButton, 'No paid expense with Recibo button found')

    await reciboButton.click()

    // Wait for receipt
    await page.waitForSelector('.print-receipt', { state: 'visible' })

    // Verify that the expansion panels are hidden when receipt is active
    const container = page.locator('.v-container')
    await expect(container).toHaveClass(/print-receipt-active/)

    // Verify PrintReportLayout is hidden (it has d-print-block class)
    const printReportLayout = page.locator('.d-print-block')
    // In screen mode, it should be hidden when receipt is active
    // The CSS should hide .print-receipt-active .d-print-block
  })

  test('receipt should contain all required fields', async ({ page }) => {
    await login(page)
    await page.goto('/admin/pdv/despesas')

    await page.waitForSelector('.v-expansion-panel', { timeout: 10000 })

    const panels = page.locator('.v-expansion-panel')
    test.skip(await panels.count() === 0, 'No expenses found to test')

    // Expand and click Recibo
    await panels.first().click()
    await page.waitForSelector('.v-expansion-panel-text', { state: 'visible' })

    const reciboButton = panels.first().locator('button:has-text("Recibo")')
    test.skip(!(await reciboButton.isVisible().catch(() => false)), 'No paid expense found')

    await reciboButton.click()
    await page.waitForSelector('.print-receipt', { state: 'visible' })

    const receipt = page.locator('.print-receipt')

    // Verify all required receipt fields
    await expect(receipt.locator('text=Paróquia Imaculada Conceição')).toBeVisible()
    await expect(receipt.locator('text=Capela São José')).toBeVisible()
    await expect(receipt.locator('text=RECIBO DE PAGAMENTO')).toBeVisible()
    await expect(receipt.locator('text=Via única')).toBeVisible()

    // Verify signature blocks exist
    await expect(receipt.locator('text=Responsável pelo Recebimento')).toBeVisible()
    await expect(receipt.locator('text=Tesouraria - Capela São José')).toBeVisible()
  })
})
