import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { tracked } from '@glimmer/tracking';
import type { TestContext as BaseContext } from 'ember-test-helpers';

class Original {
  @tracked data = 123;
}

interface Context extends BaseContext {
  original: Original;
}

module('Integration | Helper | draft-state-for', function (hooks) {
  setupRenderingTest(hooks);

  test('renders draft state correctly', async function (this: Context, assert) {
    this.original = new Original();

    await render(hbs`
      {{#let (draft-state-for this.original) as |draft|}}
        <p data-test-orig>{{this.original.data}}</p>
        <p data-test-draft>{{draft.data}}</p>
        <label>
          change the draft value:
          <input data-test {{on "change" (set draft 'data')}} />
        </label>
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
  });
});
