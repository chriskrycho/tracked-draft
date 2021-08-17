import { helper } from '@ember/component/helper';
import { assert } from '@ember/debug';

export function set([target, key]: [
  Record<PropertyKey, unknown>,
  PropertyKey
]) {
  return (event: Event): void => {
    assert('must use input element', event.target instanceof HTMLInputElement);
    target[key] = target.value;
  };
}

export default helper(set);
