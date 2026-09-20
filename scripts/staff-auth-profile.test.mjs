import test from 'node:test';
import assert from 'node:assert/strict';
import { staffAuthProfile } from '../src/services/staffAuthProfile.ts';

const staff = [{
  id: 'staff-1',
  name: 'Lab Manager',
  email: 'manager@example.com',
  role: 'ADMIN',
  roleTitle: 'Manager',
  department: 'Administration',
  staffId: 'BKL-1',
  status: 'Active',
}];

test('only a matching active staff email receives a profile', () => {
  assert.equal(staffAuthProfile(staff, 'MANAGER@example.com')?.id, 'staff-1');
  assert.equal(staffAuthProfile(staff, 'unknown@example.com'), null);
  assert.equal(staffAuthProfile(staff, null), null);
  assert.equal(staffAuthProfile([{ ...staff[0], status: 'Suspended' }], staff[0].email), null);
});
