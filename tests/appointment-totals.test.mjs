import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const url = source => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64');
const ledger = url(readFileSync('src/features/bookings/utils/booking-ledger.ts', 'utf8'));
const { calculateAppointmentTotals } = await import(url(readFileSync('src/features/bookings/utils/appointment-totals.ts', 'utf8').replace('./booking-ledger', ledger)));
const base = {
    items: [{ id:'1', itemType:'service', label:'Gel-X', lineTotal:100 }, { id:'2', itemType:'addon', label:'Design', lineTotal:20 }, { id:'3', itemType:'discount', label:'Promotion', lineTotal:-10 }, { id:'4', itemType:'discount', label:'Loyalty', lineTotal:-11 }, { id:'5', itemType:'fee', label:'Fee', lineTotal:3 }],
    bookingFee:3, appointmentTotal:102,
    payments:[{type:'deposit',status:'received',amount:15}],
};
test('separates costs, multiple promotions, fee, and deposit without double counting', () => {
    const t = calculateAppointmentTotals(base);
    assert.equal(t.services,120); assert.equal(t.discounts,21);
    assert.equal(t.costs.length,2); assert.equal(t.promotions.length,2);
    assert.equal(t.appointmentTotal,102); assert.equal(t.amountDue,87); assert.equal(t.finalAdjustment,0);
});
test('free courtesy preserves original service prices and refunds; it is not paid revenue', () => {
    const t = calculateAppointmentTotals({...base,courtesyApplied:true,appointmentTotal:0,payments:[...base.payments,{type:'refund',status:'refunded',amount:15}]});
    assert.equal(t.services,120); assert.equal(t.courtesyAdjustment,102);
    assert.equal(t.totalApplied,0); assert.equal(t.amountDue,0); assert.equal(t.appointmentTotal,0);
});
test('manual final price is visible as an adjustment', () => {
    const t = calculateAppointmentTotals({...base,appointmentTotal:95});
    assert.equal(t.finalAdjustment,-7); assert.equal(t.amountDue,80);
});
