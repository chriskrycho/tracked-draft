import { warn } from '@ember/debug';
import { TrackedMap } from 'tracked-built-ins';

function hasFinalize<T extends object>(
  t: T
): t is T & { finalize(...args: unknown[]): unknown } {
  return (
    'finalize' in t &&
    typeof (t as { finalize: unknown }).finalize === 'function'
  );
}

const FINALIZE = Symbol('finalize');

class _Draft<T extends object> implements ProxyHandler<T> {
  // This doesn't actually exist at runtime; it's just here to make it so that
  // the exported type is not constructible.
  private declare readonly brand: 'draft';

  #original: T;
  #draft = new TrackedMap<keyof T, T[keyof T]>();

  constructor(original: T | null | undefined) {
    if (
      original == null ||
      typeof original !== 'object' ||
      Array.isArray(original)
    ) {
      throw new Error(`Attempted to construct a DraftState with "${original}"`);
    }

    if (hasFinalize(original)) {
      warn(
        'You are creating a DraftState for an object which already has a `finalize` method!\n\t' +
          'You will not be able to use the built-in `DraftState.finalize()` method.\n\t' +
          'To finalize, `import { finalize } from "draft-state"` and call `finalize(draft)` instead.',
        { id: 'draft-state::overriding-finalize' }
      );
    }

    this.#original = original;
  }

  get(target: T, prop: PropertyKey, receiver: _Draft<T>): T[keyof T] {
    if (!(prop in this.#original)) {
      return prop === 'finalize' || prop === FINALIZE
        ? this[FINALIZE].bind(this)
        : Reflect.get(target, prop, receiver);
    }

    // SAFETY: this cast is safe because of the assertion immediately above,
    // which is invisible to TS.
    const key = prop as keyof T;

    // This makes access transparent to a consumer: if the state *has* been
    // forked into the draft, the user gets that; otherwise, they just get the
    // original.
    return this.#draft.get(key) ?? this.#original[key];
  }

  set(_target: T, prop: PropertyKey, value: unknown): boolean {
    if (!(prop in this.#original)) {
      warn(
        `Attempting to access ${prop.toString()} on object ${JSON.stringify(
          _target
        )}`,
        { id: 'draft-state::bad-set' }
      );
    }

    // SAFETY: this cast is safe because of the assertion immediately above,
    // which is invisible to TS.
    const key = prop as keyof T;

    // SAFETY: this may appear wildly unsafe, since we cannot guarantee what the
    // type of `prop` and `value` are here, and have to perform the cast for
    // `value` to make this check: we do not have any way to check at runtime
    // that the type is the same as the type allowed by the type signature of
    // the base type. (Any attempt to do runtime type-checking will be too
    // narrow for cases where the original type allows, for example, `[prop]:
    // string | number`, because it will only accept whatever is *currently set*
    // in the original.)
    //
    // However, the Proxy appears identical to the types of the original, so the
    // type checker catches this at the call site: the only way a user could
    // provide an invalid value *in TypeScript* is if they have their strictness
    // settings dialed down to allow `any` or not to check for `null` or
    // `undefined`, etc., or by explicitly making an unsafe cast themselves. (In
    // JavaScript callers, anything goes, of course.) Any *actual* unsafety is
    // therefore opt-in by the caller.
    this.#draft.set(key, value as T[keyof T]);
    return true;
  }

  finalize(): T {
    return this[FINALIZE]();
  }

  [FINALIZE](): T {
    for (const [key, value] of this.#draft.entries()) {
      this.#original[key] = value;
    }

    return this.#original;
  }
}

export type DraftState<T extends object> = T & _Draft<T>;

export function draftStateFor<T extends object>(original: T): DraftState<T> {
  const handler = new _Draft(original);
  const proxy = new Proxy(original, handler);

  // SAFETY: we control construction of this proxy, and the proxy is simply a
  // trap for gets and sets; the object behaves exactly like the original except
  // for its lazy reads and writes to a fork of the original storage. This just
  // "brands" it so that it can *only* be constructed here.
  return proxy as unknown as DraftState<T>;
}

/**
  Given a draft state, persist its changes into the original object.

  @param draft The DraftState to finalize back into the original object.
  @returns The original object, finalized.
 */
export function finalize<T extends object>(draft: DraftState<T>): T {
  return draft[FINALIZE]();
}
