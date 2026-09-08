import { describe, expect, it } from 'vitest';
import { SmartParseService } from './smart-parse.service';

const svc = new SmartParseService();

describe('SmartParseService', () => {
  const cases: [string, Partial<ReturnType<SmartParseService['parse']>>][] = [
    ['450 groceries', { amount: 450, categoryHint: 'Food', subCategoryHint: 'Groceries', title: 'Groceries' }],
    ['₹1,200 electricity bill', { amount: 1200, categoryHint: 'Utilities' }],
    ['spent 850 on petrol', { amount: 850, categoryHint: 'Transport', subCategoryHint: 'Fuel', title: 'Petrol' }],
    ['2,500 groceries yesterday', { amount: 2500, categoryHint: 'Food', date: 'yesterday' }],
    ['Spent ₹1,200 on electricity bill', { amount: 1200, categoryHint: 'Utilities' }],
    ['Paid 850 for petrol', { amount: 850, categoryHint: 'Transport' }],
    ['rs 300 swiggy', { amount: 300, categoryHint: 'Food', subCategoryHint: 'Food Delivery' }],
    ['INR 99 netflix', { amount: 99, categoryHint: 'Entertainment' }],
    ['uber to airport 640', { amount: 640, categoryHint: 'Transport', subCategoryHint: 'Taxi' }],
    ['school fees 7500', { amount: 7500, categoryHint: 'Education' }],
    ['rent 25000', { amount: 25000, categoryHint: 'Housing' }],
    ['medicine 240', { amount: 240, categoryHint: 'Healthcare' }],
    ['amazon 1499 headphones', { amount: 1499, categoryHint: 'Shopping' }],
    ['coffee 180', { amount: 180, categoryHint: 'Food', subCategoryHint: 'Restaurants' }],
    ['450', { amount: 450, categoryHint: null, title: null }],
    ['groceries', { amount: null, categoryHint: 'Food' }],
    ['', { amount: null, categoryHint: null, title: null, date: null }],
    ['asdf qwer zxcv', { amount: null, categoryHint: null }],
    ['12.50 coffee', { amount: 12.5, categoryHint: 'Food' }],
    ['1,20,000 bonus', { amount: 120000 }],
    ['paid rs. 60 for auto', { amount: 60, categoryHint: 'Transport' }],
    ['today 500 vegetables', { amount: 500, categoryHint: 'Food', date: 'today' }],
    ['petrol', { amount: null, categoryHint: 'Transport' }],
    ['3000 flight tickets', { amount: 3000 }],
    ['bigbasket 890', { amount: 890, categoryHint: 'Food', subCategoryHint: 'Groceries' }],
    ['pharmacy bill 1250', { amount: 1250, categoryHint: 'Healthcare' }],
    ['ola 220 yesterday', { amount: 220, categoryHint: 'Transport', date: 'yesterday' }],
    ['spent 45 on tea', { amount: 45, title: 'Tea' }],
    ['₹75', { amount: 75, title: null }],
    ['dinner at cafe 1100', { amount: 1100, categoryHint: 'Food', subCategoryHint: 'Restaurants' }],
    ['recharge 239', { amount: 239, categoryHint: 'Utilities' }],
  ];

  it.each(cases)('parses "%s"', (input, expected) => {
    const result = svc.parse(input);
    for (const [key, value] of Object.entries(expected)) {
      expect(result[key as keyof typeof result]).toEqual(value);
    }
  });

  it('handles comma-grouped amounts', () => {
    expect(svc.parse('2,500 groceries').amount).toBe(2500);
    expect(svc.parse('₹1,20,000 salary').amount).toBe(120000);
  });

  it('title strips stop-words and amount', () => {
    expect(svc.parse('spent 850 on petrol').title).toBe('Petrol');
    expect(svc.parse('paid 1200 for the electricity bill').title).toBe('Electricity Bill');
  });
});
