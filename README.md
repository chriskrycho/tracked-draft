tracked-draft
==============================================================================

A basic draft state helper which neatly solves a common problem in Ember and Glimmer apps: wanting to create a "fork" of a given set of tracked root state which you want to allow to diverge from the original, with the ability to sync it back on demand. The primary scenario in which this is useful is form fields, where you want to allow a user to edit state but don't necessarily wanted it reflected reactively throughout the rest of the app, but where you also want a straightforward way to push the changes into the original store trivially.

For example (see the dummy app for a live example!):

- A parent `Profile` component:

    ```js
    import Component from '@glimmer/component';
    import { tracked} from '@glimmer/tracking';

    class UserInfo {
      @tracked name;
      @tracked age;

      constructor({ name, age }) {
        this.name = name;
        this.age = age;
      }
    }

    export default class Profile extends Component {
      @tracked userInfo = new UserInfo({ name: "Chris", age: 34 });
    }
    ```

    ```hbs
    <CurrentProfile @user={{this.userInfo}}>
    <ProfileForm @user={{draft-state-for this.userInfo}} />
    ```

- The `CurrentProfile` component:

    ```hbs
    <p>Your name: {{@user.name}}</p>
    <p>Your age: {{@user.age}}</p>
    ```

- The `ProfileForm` component:

    ```hbs
    <div>
      <form {{on 'submit' this.saveChanges}}>
        <label>
          name:
          <input name="name" type="text" {{on 'input' this.updateName}} />
        </label>
        <label>
          age:
          <input name="age" type="number" {{on 'input' this.updateAge}} />
        </label>
        <button type="submit">
          Save changes
        </button>
      </form>
      <p>Updated name: {{@user.name}}</p>
      <p>Updated age: {{@user.age}}</p>
    </div>
    ```

    ```ts
    import Component from '@glimmer/component';

    export default class ProfileForm extends Component {
      updateName = ({ target: { value } }) => {
        this.args.user.name = value;
      }

      updateAge = ({ target: { valueAsNumber } }) => {
        this.args.user.age = valueAsNumber;
      }

      saveChanges = (event) => {
        event.preventDefault();
        this.args.user.finalize();
      }
    }
    ```


Compatibility
------------------------------------------------------------------------------

* Ember.js v3.20 or above
* Ember CLI v2.13 or above
* Node.js v12 or above


Installation
------------------------------------------------------------------------------

```
ember install tracked-draft
```


Usage
------------------------------------------------------------------------------

[Longer description of how to use the addon in apps.]


Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
