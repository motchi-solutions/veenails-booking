import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const compiled = ts.transpileModule(readFileSync('src/features/bookings/utils/booking-ledger.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { calculateBookingLedger, hasLoyaltyCourtesy } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));

const payments = [
    { type: 'deposit', status: 'received', amount: 15 },
    { type: 'refund', status: 'refunded', amount: 15 },
    { type: 'final_payment', status: 'completed', amount: 0 },
];

test('refunded courtesy shows waived price, no paid balance, and zero due', () => {
    const ledger = calculateBookingLedger({ appointmentTotal: 120, payments, courtesyApplied: true });
    assert.equal(ledger.courtesyAdjustment, 120);
    assert.equal(ledger.cashApplied, 15);
    assert.equal(ledger.refundsApplied, 15);
    assert.equal(ledger.totalApplied, 0);
    assert.equal(ledger.appointmentTotal, 0);
    assert.equal(ledger.amountDue, 0);
});

test('zero final payment without a courtesy does not waive the balance', () => {
    assert.equal(calculateBookingLedger({ appointmentTotal: 120, payments }).amountDue, 120);
});

test('paid appointment retains its actual payment', () => {
    const ledger = calculateBookingLedger({ appointmentTotal: 120, payments: [{ type: 'final_payment', status: 'completed', amount: 120 }] });
    assert.equal(ledger.totalApplied, 120);
    assert.equal(ledger.courtesyAdjustment, 0);
    assert.equal(ledger.amountDue, 0);
});

test('courtesy requires an admin event explicitly marking the appointment free', () => {
    const event = { event_type: 'loyalty_courtesy_applied', actor_type: 'admin', metadata: { adjustment: 'free' } };
    assert.equal(hasLoyaltyCourtesy([event]), true);
    assert.equal(hasLoyaltyCourtesy([{ ...event, actor_type: 'client' }]), false);
    assert.equal(hasLoyaltyCourtesy([{ ...event, metadata: null }]), false);
    assert.equal(hasLoyaltyCourtesy([]), false);
});
