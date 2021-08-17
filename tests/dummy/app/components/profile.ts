import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

class UserInfo {
  @tracked name;
  @tracked age;

  constructor({ name, age }: { name: string; age: number }) {
    this.name = name;
    this.age = age;
  }
}

export default class Profile extends Component {
  @tracked userInfo = new UserInfo({ name: 'Chris', age: 34 });
}
