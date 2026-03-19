# Playwright E2E Tests

This project uses [Playwright](https://playwright.dev/) for end-to-end testing.

## Setup

Playwright is already configured. If you need to install browsers:

```bash
# Install all browsers
playwright install

# Or install specific browsers
playwright install chromium
playwright install firefox
playwright install webkit
```

## Configuration

Copy the test environment file and configure your credentials:

```bash
cp .env.test.example .env
```

Edit `.env` with your test credentials:
```env
TEST_EMAIL=your-email@example.com
TEST_PASSWORD=your-password
```

## Running Tests

```bash
# Run all tests
bun run test:e2e

# Run tests with UI mode (great for debugging)
bun run test:e2e:ui

# Run tests in debug mode
bun run test:e2e:debug

# Run specific test file
bun run test:e2e -- e2e/despesas-receipt.spec.ts

# Run tests in headed mode (see browser)
bun run test:e2e -- --headed

# Run tests on specific browser
bun run test:e2e -- --project=chromium

# View test report
bun run test:e2e:report
```

## Test Structure

```
e2e/
├── despesas-receipt.spec.ts    # Receipt functionality tests
└── ...                         # Other test files
```

## Writing Tests

Example test structure:

```typescript
import { test, expect } from '@playwright/test'

test('should do something', async ({ page }) => {
  await page.goto('/admin/pdv/despesas')
  await expect(page.locator('h1')).toContainText('Despesas')
})
```

## Test Reports

After running tests, view the HTML report:

```bash
bun run test:e2e:report
```

Screenshots and videos of failed tests are saved to `test-results/`.

## Global Playwright Config

To reuse this configuration in other projects:

1. Copy `playwright.config.ts` to your new project
2. Install Playwright: `bun add -D @playwright/test`
3. Create `e2e/` directory and add your tests
4. Add test scripts to `package.json`:
   ```json
   {
     "test:e2e": "playwright test",
     "test:e2e:ui": "playwright test --ui",
     "test:e2e:report": "playwright show-report"
   }
   ```
