import { helper } from '@ember/component/helper';
import { assert } from '@ember/debug';

export function set([obj, key]: [Record<PropertyKey, unknown>, string]) {
  return (event: Event): void => {
    assert('must use input element', event.target instanceof HTMLInputElement);
    obj[key] = event.target.value;
  };
}

export default helper(set);
