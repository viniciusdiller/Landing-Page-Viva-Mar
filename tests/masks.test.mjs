import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { maskCPF, maskCEP, maskPhone, maskCpfOrEmail } from '../src/lib/masks.ts';

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

    test('does not truncate numeric emails with more than 11 digits', () => {
      assert.equal(maskCpfOrEmail('123456789012'), '123456789012');
      assert.equal(maskCpfOrEmail('123456789012@x.com'), '123456789012@x.com');
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

  describe('maskPhone', () => {
    test('formats phone with DDD', () => {
      assert.equal(maskPhone('22992027273'), '(22) 99202-7273');
    });
  });
});

