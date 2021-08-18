import { assert } from '@ember/debug';
import Component from '@glimmer/component';
import { DraftState } from 'tracked-draft';

interface ProfileFormArgs {
  user: DraftState<{
    name: string;
    age: number;
  }>;
}

export default class ProfileForm extends Component<ProfileFormArgs> {
  updateName = ({
    target: { value },
  }: Event & { target: HTMLInputElement }): void => {
    this.args.user.name = value;
  };

  updateAge = ({
    target: { valueAsNumber },
  }: Event & { target: HTMLInputElement }): void => {
    this.args.user.age = valueAsNumber;
  };

  saveChanges = (event: Event): void => {
    event.preventDefault();
    assert('must be set on form', event.target instanceof HTMLFormElement);
    const name = event.target.elements.namedItem('name') as HTMLInputElement;
    name.value = '';
    name.focus();
    const age = event.target.elements.namedItem('age') as HTMLInputElement;
    age.value = '';
    this.args.user.finalize();
  };
}
