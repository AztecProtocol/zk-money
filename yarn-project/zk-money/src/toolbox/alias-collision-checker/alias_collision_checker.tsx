import { useState } from 'react';
import { AztecSdk } from '@aztec/sdk';

interface AliasCollision {
  alias: string; // The alias (case sensitive)
  index: number; // The index of the alias in the data tree
  platform: string; // AC = Aztec connect, OLD = zk.money pre connect
}

export async function aliasCollider(sdk: AztecSdk, alias: string) {
  const isLetter = (char: string) => {
    return char.toLowerCase() !== char.toUpperCase();
  };

  /// Generate alternative version of alias with different casing
  const inner = async (alias: string, index: number, collisions: { [key: string]: number }) => {
    if (index === alias.length) {
      const isRegistered = await sdk.isAliasRegistered(alias, false);
      if (isRegistered) {
        collisions[alias] = await sdk.getAccountIndex(alias);
      }
      return;
    }
    await inner(alias, index + 1, collisions);

    // Numbers cannot be upper and lower case, so no need to check those.
    if (isLetter(alias.charAt(index))) {
      const temp = alias.substring(0, index) + alias.charAt(index).toUpperCase() + alias.substring(index + 1);
      await inner(temp, index + 1, collisions);
    }
  };

  const collisions: { [key: string]: number } = {};
  await inner(alias.toLowerCase(), 0, collisions);

  // Create a sorted array of the collisions (sorted by the index of the alias)
  const entities: AliasCollision[] = [];
  for (const alias in collisions) {
    entities.push({ alias, index: collisions[alias], platform: collisions[alias] >= 147624 ? 'AC' : 'OLD' });
  }
  entities.sort((a, b) => a.index - b.index);
  return entities;
}

export function AliasCollisionChecker({ sdk }: { sdk: AztecSdk }) {
  const [alias, setAlias] = useState('');
  const [collisions, setCollisions] = useState<AliasCollision[]>([]);
  const [synching, setSynching] = useState(true);

  sdk.awaitSynchronised().then(() => setSynching(false));

  const handleClick = async () => {
    aliasCollider(sdk, alias).then(setCollisions);
  };

  return (
    <div>
      <h1>Alias Collision Checker {synching && 'is synching'}</h1>
      <input placeholder="alias" value={alias} onChange={e => setAlias(e.target.value)} />
      <button onClick={handleClick} disabled={synching}>
        Check for collisions
      </button>
      <h2>Matching aliases:</h2>
      {collisions.map(c => (
        <p>{JSON.stringify(c, null, 2)}</p>
      ))}
    </div>
  );
}
