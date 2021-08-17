import { draftStateFor, DraftState, finalize } from 'draft-tracked-state';
import { setupTest } from 'ember-qunit';
import { module, test } from 'qunit';
import { tracked } from '@glimmer/tracking';
import { expectTypeOf } from 'expect-type';

module('Unit | DraftState', function (hooks) {
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
      expectTypeOf(draft).toEqualTypeOf<DraftState<{ a: boolean }>>();
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

  module('finalizing', function () {
    module('with `draft.finalize()`', function () {
      test('in the default case', function (assert) {
        class Original {
          @tracked data = 123;
        }

        const original = new Original();
        const draft = draftStateFor(original);
        draft.data = 456;

        const result = draft.finalize();
        assert.equal(original.data, 456, 'updates the original data');
        assert.deepEqual(
          result,
          original,
          'the call returns the finalized object'
        );
        expectTypeOf(result).toEqualTypeOf(original);
      });

      test('when the original object has its own finalize method', function (assert) {
        const RETURN = 'this is not a draft state!';
        class Original {
          @tracked data = 123;

          finalize() {
            return RETURN;
          }
        }

        const original = new Original();
        const draft = draftStateFor(original);
        draft.data = 456;

        const result = draft.finalize();
        assert.equal(original.data, 123, 'the original data is not updated');
        assert.equal(result, RETURN, 'the original method returns correctly');
        expectTypeOf(result).toEqualTypeOf<ReturnType<Original['finalize']>>();
      });
    });

    module('with `finalize(draft)', function () {
      test('`in the default case', function (assert) {
        assert.expect(2);

        class Original {
          @tracked data = 123;
        }

        const original = new Original();
        const draft = draftStateFor(original);
        draft.data = 456;

        const result = finalize(draft);
        assert.equal(original.data, 456, 'updates the original data');
        assert.deepEqual(
          result,
          original,
          'the call returns the finalized object'
        );
        expectTypeOf(result).toEqualTypeOf(original);
      });

      test('`when the original object has its own finalize method', function (assert) {
        class Original {
          @tracked data = 123;

          finalize() {
            assert.notOk(true, 'should never be called');
            return 'not a draft state';
          }
        }

        const original = new Original();
        const draft = draftStateFor(original);
        draft.data = 456;

        const result = finalize(draft);
        assert.equal(original.data, 456, 'updates the original data');
        assert.deepEqual(
          result,
          original,
          'the call returns the finalized object'
        );
        expectTypeOf(result).toEqualTypeOf(original);
      });
    });
  });
});
