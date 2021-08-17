import { draftStateFor, finalize, DraftState } from 'draft-state';
import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';
import { tracked } from '@glimmer/tracking';
import { expectTypeOf } from 'expect-type';

module('the DraftState type', function (hooks) {
  setupTest(hooks);

  module('construction', function () {
    test('throws if the the original is not an object', function (assert) {
      /* eslint-disable @typescript-eslint/ban-ts-comment */
      // @ts-expect-error
      assert.throws(() => draftStateFor(null), 'when it is null');

      // @ts-expect-error
      assert.throws(() => draftStateFor(undefined), 'when it is undefined');

      // @ts-expect-error
      assert.throws(() => draftStateFor(123), 'when it is a number');

      // @ts-expect-error
      assert.throws(() => draftStateFor('hello'), 'when it is a string');

      // @ts-expect-error
      assert.throws(() => draftStateFor(true), 'when it is a boolean');

      assert.throws(() => draftStateFor([]), 'when it is an array');
      /* eslint-enable @typescript-eslint/ban-ts-comment */
    });

    test('succeeds with an object', function (assert) {
      const draft = draftStateFor({ a: true });
      assert.ok(draft);
      expectTypeOf(draft.a).toEqualTypeOf(true);
    });
  });

  module('forking state', function () {
    test('mutates the draft but not the original', function (assert) {
      class Original {
        @tracked data = true;
      }

      const original = new Original();
      const draft = draftStateFor(original);

      draft.data = false;

      assert.equal(original.data, true, 'original.data is unchanged');
      assert.equal(draft.data, false, 'draft.data is changed');
    });

    test('is lazy', function (assert) {
      class Original {
        @tracked refType = [1, 2, 3];
      }

      const original = new Original();
      const draft = draftStateFor(original);

      assert.strictEqual(
        draft.refType,
        original.refType,
        'so reference types are the same until explicitly forked'
      );

      draft.refType = draft.refType.concat([4, 5, 6]);

      assert.notStrictEqual(
        draft.refType,
        original.refType,
        'but diverge once explicitly set'
      );
    });
  });

  test('calling `finalize(draft)`', function (assert) {
    class Original {
      @tracked data = 123;
    }

    const original = new Original();
    const draft = draftStateFor(original);
    draft.data = 456;

    finalize(draft);
    assert.equal(original.data, 456, 'updates the original data');

    type Finalize<T extends object> = (draft: DraftState<T>) => T;
    expectTypeOf(finalize).toEqualTypeOf<Finalize<object>>();
  });
});
