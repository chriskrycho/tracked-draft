import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, fillIn, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { tracked } from '@glimmer/tracking';
import type { TestContext as BaseContext } from 'ember-test-helpers';

class Original {
  @tracked data = 'hello';
}

interface Context extends BaseContext {
  original: Original;
}

module('Integration | Helper | draft-for', function (hooks) {
  setupRenderingTest(hooks);

  test('handles draft state correctly', async function (this: Context, assert) {
    this.original = new Original();

    await render(hbs`
      {{#let (draft-for this.original) as |draft|}}
        <p data-test-orig>{{this.original.data}}</p>
        <p data-test-draft>{{draft.data}}</p>
        <label>
          change the draft value:
          <input
            data-test-input
            {{on "input" (set draft 'data')}}
            value={{draft.data}}
          />
        </label>
        <button data-test-finalize type='button' {{on "click" draft.finalize}}>
          Finalize
        </button>
      {{/let}}
    `);

    assert
      .dom('[data-test-orig]')
      .hasText(
        this.original.data.toString(),
        'the original value is unchanged by creating a draft'
      );
    assert
      .dom('[data-test-draft')
      .hasText(
        this.original.data.toString(),
        'the initial draft value matches the original value'
      );

    const newValue = 'goodbye';
    await fillIn('[data-test-input]', newValue);
    assert
      .dom('[data-test-orig]')
      .hasText(
        this.original.data.toString(),
        'the original value is unchanged after updating the draft'
      );
    assert.dom('[data-test-draft').hasText(newValue, 'the draft value updates');

    await click('[data-test-finalize]');
    assert
      .dom('[data-test-orig')
      .hasText(
        newValue,
        'the original value updates when the draft is finalized'
      );
    assert
      .dom('[data-test-draft')
      .hasText(newValue, 'the draft value matches the new value as well');
  });
});
