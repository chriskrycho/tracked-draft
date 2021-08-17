import { TrackedMap } from 'tracked-built-ins';

class DraftStateAccessError extends Error {
  readonly name = 'DraftStateAccessError';

  constructor(badKey: PropertyKey, target: unknown) {
    super(
      `Attempting to access ${badKey.toString()} on object ${JSON.stringify(
        target
      )}`
    );
  }
}

class DraftStateConstructorError extends Error {
  name = 'DraftStateConstructorError';
  constructor(badArg: unknown) {
    super(`Attempted to construct a DraftState with "${badArg}"`);
  }
}

const FORKS = new WeakMap<object, TrackedMap<PropertyKey, unknown>>();

function getFork(original: object): TrackedMap<PropertyKey, unknown> {
  const fork = FORKS.get(original);
  if (!fork) {
    throw new Error(
      'DraftState was constructed incorrectly. Please file a bug!'
    );
  }

  return fork;
}

const ORIGINAL = Symbol('original');

class _Draft<T extends object> implements ProxyHandler<T> {
  // This doesn't actually exist at runtime; it's just here to make it so that
  // the exported type is not constructible.
  private declare readonly brand: 'draft';

  [ORIGINAL]: T;

  constructor(original: T | null | undefined) {
    if (
      original == null ||
      typeof original !== 'object' ||
      Array.isArray(original)
    ) {
      throw new DraftStateConstructorError(original);
    }

    FORKS.set(original, new TrackedMap());
    this[ORIGINAL] = original;
  }

  get(_target: T, prop: PropertyKey): T[keyof T] {
    // SAFETY: the *only* thing allowed to interact with this is the `finalize`
    // function, and the `ORIGINAL` symbol is not exported.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (prop === ORIGINAL) return this[ORIGINAL] as any;

    if (!(prop in this[ORIGINAL])) {
      throw new DraftStateAccessError(prop, _target);
    }

    // SAFETY: this cast is safe because of the assertion immediately above,
    // which is invisible to TS.
    const key = prop as keyof T;

    // SAFETY: we know from construction and handling in `set` that `#original`
    // always maps to *this* `T`.
    const fork = getFork(this[ORIGINAL]) as TrackedMap<keyof T, T[keyof T]>;

    // This makes access transparent to a consumer: if the state *has* been
    // forked into the draft, the user gets that; otherwise, they just get the
    // original.
    return fork.get(key) ?? this[ORIGINAL][key];
  }

  set(_target: T, prop: PropertyKey, value: unknown): boolean {
    if (!(prop in this[ORIGINAL])) {
      throw new DraftStateAccessError(prop, _target);
    }

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
    getFork(this[ORIGINAL]).set(prop, value as T[keyof T]);
    return true;
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

export function finalize<T extends object>(draft: DraftState<T>): T {
  const original = draft[ORIGINAL];

  // SAFETY: we know from construction and handling in `set` that `#original`
  // always maps to *this* `T`.
  const fork = getFork(original) as TrackedMap<keyof T, T[keyof T]>;

  for (const [key, value] of fork.entries()) {
    original[key] = value;
  }

  return original;
}
