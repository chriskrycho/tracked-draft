import Component from '@glimmer/component';
import { DraftState } from 'draft-tracked-state';

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

  saveChanges = (event: SubmitEvent): void => {
    event.preventDefault();
    this.args.user.finalize();
  };
}
