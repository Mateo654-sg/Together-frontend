/**
 * Tests de la navegación inferior (bottom nav).
 *
 * Objetivo: la barra inferior debe contener únicamente "Inicio", de forma
 * consistente en iOS y Android, y NUNCA debe incluir "Actividad".
 *
 * Utiliza lógica pura (navigation-config) por lo que no requiere transformar JSX.
 * Se ejecuta con Node estándar:
 *   node --test src/shared/__tests__/navigation.test.mjs
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BOTTOM_NAV_ITEMS, NAV_ITEMS } from '../navigation-config.ts';

test('la navegación inferior contiene únicamente "Inicio"', () => {
  assert.equal(BOTTOM_NAV_ITEMS.length, 1);
  assert.equal(BOTTOM_NAV_ITEMS[0].label, 'Inicio');
  assert.equal(BOTTOM_NAV_ITEMS[0].path, '/dashboard');
});

test('la navegación inferior NO incluye "Actividad"', () => {
  const labels = BOTTOM_NAV_ITEMS.map((item) => item.label);
  assert.ok(!labels.includes('Actividad'), 'Actividad no debe estar en la barra inferior');
  assert.ok(!BOTTOM_NAV_ITEMS.some((item) => item.path === '/activity'));
});

test('la configuración del bottom nav no depende de la plataforma (no hay branching iOS/Android)', () => {
  // La misma lista se usa en todos los casos; no existe una lista "iOS" aparte.
  assert.equal(BOTTOM_NAV_ITEMS.every((i) => i.label === 'Inicio'), true);
  assert.ok(!Object.prototype.hasOwnProperty.call(BOTTOM_NAV_ITEMS, 'ios'));
});

test('"Actividad" sigue existiendo como ruta interna en la navegación completa (no se rompe la ruta)', () => {
  const activity = NAV_ITEMS.find((item) => item.path === '/activity');
  assert.ok(activity, 'la ruta /activity debe seguir en la navegación completa');
  assert.equal(activity.label, 'Actividad');
});

test('no queda espacio fantasma: el número de items es exactamente 1', () => {
  assert.equal(BOTTOM_NAV_ITEMS.length, 1);
});
