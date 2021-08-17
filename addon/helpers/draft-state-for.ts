import { helper } from '@ember/component/helper';
import { draftStateFor } from '../-private/draft-state';

export default helper(<T extends object>([original]: [T]) =>
  draftStateFor(original)
);
