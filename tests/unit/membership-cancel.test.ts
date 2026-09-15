import { describe, expect, it } from 'vite-plus/test';
import { getMembershipCancelParams } from '../../ui/util/memberships';

describe('getMembershipCancelParams', () => {
  it('sends an explicit false revert value when canceling', () => {
    expect(getMembershipCancelParams(4297)).toEqual({
      membership_id: 4297,
      revert: false,
    });
  });

  it('preserves the true revert value when restoring', () => {
    expect(getMembershipCancelParams(4297, true)).toEqual({
      membership_id: 4297,
      revert: true,
    });
  });
});
