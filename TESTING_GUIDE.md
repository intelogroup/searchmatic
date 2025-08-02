# Searchmatic Login Testing Guide

## Quick Start

To test the login functionality of the Searchmatic MVP:

### Prerequisites
1. Ensure the app is running: `npm run dev` (should be on localhost:5173)
2. Install Playwright if not already done: `npx playwright install`

### Run Login Tests

```bash
# Run comprehensive login tests (recommended)
npm run test:login

# Run only on Chrome (faster for development)
npm run test:login:chrome

# Run with visible browser (see tests in action)
npm run test:login:headed

# Run with Playwright UI (interactive)
npx playwright test login-comprehensive.spec.ts --ui
```

### Test Results

- **Screenshots**: Automatically saved to `test-results/screenshots/`
- **Videos**: Saved for failed tests in `test-results/`
- **HTML Report**: Run `npx playwright show-report` to view detailed results

## What Gets Tested

### ✅ Core Functionality
- Landing page → Login page navigation
- Form accessibility and keyboard navigation  
- Login with credentials: `jayveedz19@gmail.com` / `Jimkali90#`
- Successful redirect to dashboard
- Dashboard content verification

### ✅ User Experience
- Sign up / Sign in toggle
- Password visibility toggle
- Form validation (empty fields, invalid email)
- Error handling with wrong credentials
- Back navigation to landing page

### ✅ Cross-Browser & Mobile
- Chrome, Firefox, Safari compatibility
- Mobile viewport testing (375x667)
- Touch interaction compatibility
- Responsive form layout

## Test Credentials

The tests use these credentials (make sure they exist in your Supabase auth):
- **Email**: jayveedz19@gmail.com
- **Password**: Jimkali90#

## Expected Results

When all tests pass, you should see:
```
✅ Landing page loaded and verified successfully
✅ Successfully navigated to login page
✅ Accessibility and keyboard navigation verified
✅ Form validation works
✅ LOGIN SUCCESSFUL - Redirected to dashboard
✅ Mobile compatibility verified
```

## Troubleshooting

### Tests Fail with "Invalid login credentials"
- Verify the test user exists in Supabase Auth
- Check that Supabase configuration is correct in `.env.local`

### Tests Timeout
- Ensure the dev server is running on localhost:5173
- Increase timeout with: `--timeout=90000`

### Browser Issues
- Run `npx playwright install` to update browsers
- Test on single browser first: `npm run test:login:chrome`

## Custom Test Credentials

To use different credentials, edit `/tests/login-comprehensive.spec.ts`:

```typescript
const TEST_EMAIL = 'your-test-email@example.com';
const TEST_PASSWORD = 'your-test-password';
```

## Continuous Integration

For CI environments, add to your workflow:

```yaml
- name: Install Playwright
  run: npx playwright install

- name: Run Login Tests
  run: npm run test:login
```

---

**Need help?** Check the full test report in `LOGIN_TEST_REPORT.md`