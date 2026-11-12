import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  maskCPF,
  maskCEP,
  maskPhone,
  maskCpfOrEmail,
  maskReservationCode,
  formatDisplayReservationCode,
} from '../src/lib/masks.ts';

describe('lib/masks', () => {
  describe('maskCpfOrEmail', () => {
    test('formats digits progressively as CPF', () => {
      assert.equal(maskCpfOrEmail('1234'), '123.4');
      assert.equal(maskCpfOrEmail('12345678901'), '123.456.789-01');
    });

    test('keeps a regular email untouched', () => {
      assert.equal(maskCpfOrEmail('joao@email.com'), 'joao@email.com');
    });

    test('undoes the CPF mask when an email starts with digits', () => {
      assert.equal(maskCpfOrEmail('123.4a'), '1234a');
      assert.equal(maskCpfOrEmail('123.456.789-01a'), '12345678901a');
      assert.equal(maskCpfOrEmail('1234a@x.com'), '1234a@x.com');
    });

    test('caps pure numeric input at 11 digits with CPF mask and unmasks when @ or letter is typed', () => {
      assert.equal(maskCpfOrEmail('123456789012345'), '123.456.789-01');
      assert.equal(maskCpfOrEmail('123.456.789-01@x.com'), '12345678901@x.com');
    });

    test('handles empty input and deletions', () => {
      assert.equal(maskCpfOrEmail(''), '');
      assert.equal(maskCpfOrEmail('123.'), '123');
    });
  });

  describe('maskCPF', () => {
    test('formats valid 11 digits CPF', () => {
      assert.equal(maskCPF('12345678901'), '123.456.789-01');
    });

    test('strips non-digits and slices up to 11 digits', () => {
      assert.equal(maskCPF('123.456.789-0199'), '123.456.789-01');
    });
  });

  describe('maskReservationCode', () => {
    test('formats raw digits automatically with VIVA- prefix', () => {
      assert.equal(maskReservationCode('13151'), 'VIVA-13151');
      assert.equal(maskReservationCode('42'), 'VIVA-42');
    });

    test('normalizes viva prefix variants to VIVA-<digits>', () => {
      assert.equal(maskReservationCode('viva13151'), 'VIVA-13151');
      assert.equal(maskReservationCode('viva-13151'), 'VIVA-13151');
      assert.equal(maskReservationCode('VIVA-13151'), 'VIVA-13151');
    });

    test('preserves user typing prefix letters without trapping', () => {
      assert.equal(maskReservationCode('V'), 'V');
      assert.equal(maskReservationCode('VI'), 'VI');
      assert.equal(maskReservationCode('VIV'), 'VIV');
      assert.equal(maskReservationCode('VIVA'), 'VIVA');
      assert.equal(maskReservationCode('VIVA-'), 'VIVA-');
    });

    test('preserves legacy payment codes for backwards compatibility', () => {
      assert.equal(maskReservationCode('mp_987654321'), 'mp_987654321');
      assert.equal(maskReservationCode('manual_1710000000'), 'manual_1710000000');
    });

    test('handles empty input gracefully', () => {
      assert.equal(maskReservationCode(''), '');
    });
  });

  describe('formatDisplayReservationCode', () => {
    test('uses displayCode when present', () => {
      assert.equal(formatDisplayReservationCode('VIVA-13151', 'mp_999', 13151), 'VIVA-13151');
    });

    test('falls back to VIVA-<id> when id is numeric', () => {
      assert.equal(formatDisplayReservationCode(null, 'mp_999', 13151), 'VIVA-13151');
    });
  });
});

