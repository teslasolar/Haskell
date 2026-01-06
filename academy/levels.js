/*! K:acad01:1:89:k0:l1v2 !*/
/**
 * KONOMI Academy - Level Definitions
 * Progressive Haskell challenges to unlock site features
 */
const LEVELS = {
  // Level 0: Basics - Must complete to access site
  basics: {
    id: 0,
    name: 'Basics',
    desc: 'Core syntax to unlock navigation',
    unlocks: ['nav'],
    challenges: [
      {
        id: 'hello',
        prompt: 'Print "Hello, Haskell!" using putStrLn',
        hint: 'putStrLn "..."',
        check: (src) => /putStrLn\s*"Hello,?\s*Haskell!?"/.test(src),
        xp: 10
      },
      {
        id: 'add',
        prompt: 'Define: add x y = x + y',
        hint: 'Function with two parameters',
        check: (src) => /add\s+\w+\s+\w+\s*=\s*\w+\s*\+\s*\w+/.test(src),
        xp: 15
      },
      {
        id: 'double',
        prompt: 'Define: double x = x * 2',
        hint: 'Multiply by 2',
        check: (src) => /double\s+\w+\s*=\s*\w+\s*\*\s*2/.test(src),
        xp: 15
      }
    ]
  },

  // Level 1: Types - Unlocks type reference
  types: {
    id: 1,
    name: 'Types',
    desc: 'Type signatures and declarations',
    requires: ['basics'],
    unlocks: ['types', 'primitives'],
    challenges: [
      {
        id: 'sig',
        prompt: 'Add type signature: square :: Int -> Int',
        hint: ':: declares type',
        check: (src) => /square\s*::\s*Int\s*->\s*Int/.test(src),
        xp: 20
      },
      {
        id: 'bool',
        prompt: 'Define: isEven n = n `mod` 2 == 0',
        hint: 'Returns Bool',
        check: (src) => /isEven\s+\w+\s*=.*mod.*==\s*0/.test(src),
        xp: 20
      },
      {
        id: 'tuple',
        prompt: 'Define: swap (a,b) = (b,a)',
        hint: 'Pattern match tuple',
        check: (src) => /swap\s*\(\s*\w+\s*,\s*\w+\s*\)\s*=\s*\(\s*\w+\s*,\s*\w+\s*\)/.test(src),
        xp: 25
      }
    ]
  },

  // Level 2: Lists - Unlocks list operations
  lists: {
    id: 2,
    name: 'Lists',
    desc: 'List comprehensions and operations',
    requires: ['types'],
    unlocks: ['lists', 'expressions'],
    challenges: [
      {
        id: 'range',
        prompt: 'Create list [1..10]',
        hint: 'Range syntax',
        check: (src) => /\[1\.\.10\]/.test(src),
        xp: 15
      },
      {
        id: 'comp',
        prompt: 'List comprehension: [x*2 | x <- [1..5]]',
        hint: 'Generator with transform',
        check: (src) => /\[\s*\w+\s*\*\s*2\s*\|\s*\w+\s*<-/.test(src),
        xp: 25
      },
      {
        id: 'head',
        prompt: 'Get first element: head [1,2,3]',
        hint: 'head function',
        check: (src) => /head\s*\[/.test(src),
        xp: 15
      },
      {
        id: 'cons',
        prompt: 'Prepend with cons: 0 : [1,2,3]',
        hint: ': operator',
        check: (src) => /\d+\s*:\s*\[/.test(src),
        xp: 20
      }
    ]
  },

  // Level 3: HOF - Unlocks higher-order functions
  hof: {
    id: 3,
    name: 'Higher-Order',
    desc: 'Map, filter, fold',
    requires: ['lists'],
    unlocks: ['hof'],
    challenges: [
      {
        id: 'map',
        prompt: 'Double all: map (*2) [1,2,3]',
        hint: 'map applies function',
        check: (src) => /map\s*\(\s*\*\s*2\s*\)/.test(src),
        xp: 25
      },
      {
        id: 'filter',
        prompt: 'Keep evens: filter even [1..10]',
        hint: 'filter keeps matches',
        check: (src) => /filter\s+even/.test(src),
        xp: 25
      },
      {
        id: 'fold',
        prompt: 'Sum list: foldr (+) 0 [1,2,3]',
        hint: 'foldr reduces right',
        check: (src) => /foldr\s*\(\s*\+\s*\)\s*0/.test(src),
        xp: 30
      },
      {
        id: 'compose',
        prompt: 'Compose: ((*2) . (+1)) 3',
        hint: '. composes functions',
        check: (src) => /\.\s*\(\s*\+\s*1\s*\)/.test(src) || /\(\s*\*\s*2\s*\)\s*\./.test(src),
        xp: 35
      }
    ]
  },

  // Level 4: Typeclasses
  typeclasses: {
    id: 4,
    name: 'Typeclasses',
    desc: 'Eq, Ord, Show, Functor',
    requires: ['hof'],
    unlocks: ['typeclasses'],
    challenges: [
      {
        id: 'eq',
        prompt: 'Compare: 5 == 5',
        hint: 'Eq typeclass',
        check: (src) => /\d+\s*==\s*\d+/.test(src),
        xp: 15
      },
      {
        id: 'show',
        prompt: 'Convert to string: show 42',
        hint: 'Show typeclass',
        check: (src) => /show\s+\d+/.test(src),
        xp: 20
      },
      {
        id: 'fmap',
        prompt: 'Functor: fmap (+1) (Just 5)',
        hint: 'fmap over Maybe',
        check: (src) => /fmap\s*\(\s*\+\s*1\s*\)\s*\(\s*Just/.test(src),
        xp: 35
      }
    ]
  },

  // Level 5: Monads - Unlocks advanced
  monads: {
    id: 5,
    name: 'Monads',
    desc: 'Maybe, IO, do-notation',
    requires: ['typeclasses'],
    unlocks: ['monads', 'io', 'advanced'],
    challenges: [
      {
        id: 'maybe',
        prompt: 'Safe division: safeDiv x 0 = Nothing; safeDiv x y = Just (x `div` y)',
        hint: 'Pattern match on 0',
        check: (src) => /Nothing/.test(src) && /Just/.test(src),
        xp: 40
      },
      {
        id: 'bind',
        prompt: 'Chain: Just 5 >>= \\x -> Just (x+1)',
        hint: '>>= is bind',
        check: (src) => />>=/s.test(src),
        xp: 45
      },
      {
        id: 'do',
        prompt: 'Do block: do { x <- Just 5; return (x*2) }',
        hint: 'do notation',
        check: (src) => /do\s*\{/.test(src) && /<-/.test(src),
        xp: 50
      }
    ]
  },

  // Level 6: Master - Unlocks everything
  master: {
    id: 6,
    name: 'Master',
    desc: 'Full site access',
    requires: ['monads'],
    unlocks: ['all', 'compiler', 'ml', 'ai'],
    challenges: [
      {
        id: 'monadT',
        prompt: 'Define a simple Reader: newtype Reader r a = Reader { runReader :: r -> a }',
        hint: 'newtype wrapper',
        check: (src) => /newtype\s+Reader/.test(src) && /runReader/.test(src),
        xp: 75
      },
      {
        id: 'applicative',
        prompt: 'Apply: pure (+) <*> Just 2 <*> Just 3',
        hint: '<*> applies in context',
        check: (src) => /<\*>/.test(src) && /pure/.test(src),
        xp: 60
      }
    ]
  }
};

// Calculate totals
Object.values(LEVELS).forEach(level => {
  level.totalXP = level.challenges.reduce((s, c) => s + c.xp, 0);
});

if (typeof module !== 'undefined') module.exports = LEVELS;
