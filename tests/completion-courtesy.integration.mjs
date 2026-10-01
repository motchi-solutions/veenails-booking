// Uses an isolated in-memory PostgreSQL instance; never connects to Supabase.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
test('courtesy completion transactions', async () => {
const { PGlite } = await import(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const db = new PGlite();
const read = name => readFileSync(`supabase/migrations/${name}.sql`, 'utf8');
const initial = read('20260802185732_initial_schema');
await db.exec('create schema private; create role anon; create role authenticated; create role service_role;');
for (const match of initial.matchAll(/CREATE TYPE "public"\."[^"]+" AS ENUM \([\s\S]*?\);/g)) await db.exec(match[0]);
for (const name of ['admin_users', 'availability_slots', 'booking_events', 'booking_line_items', 'booking_payments', 'bookings', 'user_credits']) {
    const start = initial.indexOf(`CREATE TABLE IF NOT EXISTS "public"."${name}"`);
    await db.exec(initial.slice(start, initial.indexOf('\n);', start) + 3));
}
await db.exec('alter table public.bookings add column is_loyalty_reward boolean not null default false;');
for (const name of ['trigger_recalculate_booking_totals', 'trigger_recalculate_booking_totals_from_booking']) {
    const start = initial.indexOf(`CREATE OR REPLACE FUNCTION "private"."${name}"`);
    await db.exec(initial.slice(start, initial.indexOf('$$;', start) + 3));
}
const loyalty = read('20260902143124_add_cancellation_outcomes_and_loyalty_cards');
const start = loyalty.indexOf('create or replace function private.recalculate_booking_totals');
await db.exec(loyalty.slice(start, loyalty.indexOf('$$;', start) + 3));
for (const match of initial.matchAll(/CREATE OR REPLACE TRIGGER "recalculate_booking_totals_[\s\S]*?;/g)) await db.exec(match[0]);
await db.exec(read('20260901153232_record_final_payments_on_completion'));
await db.exec(read('20261001152149_handle_loyalty_courtesy_invoice_checks'));
await db.exec(read('20261001160416_unify_appointment_completion_courtesy'));
const admin = randomUUID();
await db.query('insert into admin_users(user_id) values ($1)', [admin]);
async function fixture({ credit = 0, cash = 15, future = false } = {}) {
    const id = randomUUID(), slot = randomUUID(), user = randomUUID();
    await db.query("insert into availability_slots(id, starts_at, ends_at) values ($1, now() + $2::interval, now() + $2::interval + interval '2 hours')", [slot, future ? '1 day' : '-1 day']);
    await db.query("insert into bookings(id, booking_reference, user_id, slot_id, status, deposit_status, booking_fee_mode) values ($1,$2,$3,$4,'confirmed','received','included_in_price')", [id, id, user, slot]);
    await db.query("insert into booking_line_items(booking_id,item_type,label_snapshot,quantity,unit_price) values ($1,'service','Gel-X',1,120)", [id]);
    if (cash) await db.query("insert into booking_payments(booking_id,payment_type,method,amount,status,paid_at) values ($1,'deposit','etransfer',$2,'received',now())", [id,cash]);
    if (credit) await db.query("insert into booking_payments(booking_id,payment_type,method,amount,status,paid_at) values ($1,'credit','account_credit',$2,'credited',now())", [id,credit]);
    return { id, user };
}
const complete = (id, mode='free', confirmed=true, price=120, percentage=10) => db.query("select * from complete_booking_with_courtesy($1,$2,$3,$4,'cash','etransfer',$5,$6)", [id,mode,price,percentage,confirmed,admin]);
const free = await fixture({ credit: 20 });
await assert.rejects(complete(free.id,'free',false), /Confirm that/);
assert.equal((await db.query('select count(*)::int as n from booking_payments where booking_id=$1', [free.id])).rows[0].n, 2);
await complete(free.id);
const booking = (await db.query('select status, amount_due, amount_paid, final_total from bookings where id=$1', [free.id])).rows[0];
assert.equal(booking.status, 'completed');
for (const key of ['amount_due','amount_paid','final_total']) assert.equal(Number(booking[key]), 0);
assert.equal(Number((await db.query('select amount from user_credits where user_id=$1',[free.user])).rows[0].amount),20);
assert.equal((await db.query('select * from website_fee_payment_exceptions where booking_id=$1',[free.id])).rows.length,0);
assert.deepEqual((await db.query('select eligible_net_amount from website_fee_payment_details where booking_id=$1 order by eligible_net_amount',[free.id])).rows.map(x=>Number(x.eligible_net_amount)),[-15,15]);
await assert.rejects(complete(free.id),/Only a confirmed/);
const discounted = await fixture();
await complete(discounted.id,'discount',false);
assert.equal(Number((await db.query('select final_total from bookings where id=$1',[discounted.id])).rows[0].final_total),108);
assert.equal(Number((await db.query("select amount from booking_payments where booking_id=$1 and payment_type='final_payment'",[discounted.id])).rows[0].amount),93);
const overpaid = await fixture({cash:110});
await assert.rejects(complete(overpaid.id,'discount'),/below payments/);
assert.equal((await db.query("select count(*)::int as n from booking_line_items where booking_id=$1 and item_type='discount'",[overpaid.id])).rows[0].n,0);
const future = await fixture({future:true});
await assert.rejects(complete(future.id),/before it starts/);
const invalid = await fixture();
await db.query("insert into booking_payments(booking_id,payment_type,method,amount,status,paid_at) values ($1,'final_payment','other',0,'completed',now())",[invalid.id]);
assert.equal((await db.query('select * from website_fee_payment_exceptions where booking_id=$1',[invalid.id])).rows.length,1);
assert.equal((await db.query("select has_function_privilege('authenticated', 'public.complete_booking_with_courtesy(uuid,text,numeric,numeric,public.payment_method,public.payment_method,boolean,uuid)', 'execute') as allowed")).rows[0].allowed,false);
await db.close();
console.log('Passed: atomic refund confirmation, credit return, free completion, retry protection, discounts, overpayment rollback, future booking guard, exception checks, invoice sources, RPC permissions.');

});
