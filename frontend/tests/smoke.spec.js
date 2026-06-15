const { test, expect } = require('@playwright/test')

const routes = [
  { path: '/', heading: 'FarmFlow', signal: 'Plan du jour' },
  { path: '/cockpit', heading: 'Cockpit exploitation', signal: 'Decisions recommandees' },
  { path: '/parcelles', heading: 'Parcelles GPS', signal: 'Mode terrain' },
  { path: '/caisse', heading: 'Caisse directe', signal: 'Panier' },
  { path: '/commandes', heading: 'Commandes clients & reservations', signal: 'Panier reservation' },
]

test.describe('FarmFlow smoke routes', () => {
  for (const route of routes) {
    test(`${route.path} renders a working screen`, async ({ page }) => {
      await page.goto(route.path)
      await expect(page.getByRole('heading', { name: route.heading, exact: true })).toBeVisible()
      await expect(page.getByText(route.signal).first()).toBeVisible()
    })
  }
})

test('home exposes workspace and field mode entry points', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('home-workspace')).toBeVisible()
  await expect(page.getByTestId('home-field-mode')).toBeVisible()
})

test('parcelles exposes the field mode workflow', async ({ page }) => {
  await page.goto('/parcelles')
  const fieldMode = page.getByTestId('field-mode')
  await expect(fieldMode).toBeVisible()
  await fieldMode.getByRole('button', { name: 'Planifier' }).click()
  await expect(page.getByText('Operation, date, responsable et materiel.')).toBeVisible()
})
