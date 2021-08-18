import { helper } from '@ember/component/helper';
import { draftFor } from '../-private/draft';

function draftForHelper<T extends object>([original]: [T]) {
  return draftFor(original);
}

export default helper(draftForHelper);
