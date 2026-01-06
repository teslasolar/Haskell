/*! K:test01:1:100:k0:t1e2 !*/
# KONOMI:HASKELL Test Plan

## 1. ROOT PAGES B[0][0][x]
```
PAGE                  TEST
/index.html           [ ] Loads, nav renders, compiler UI works
/app.html             [ ] Full orchestrator, all tools accessible
/README.md            [ ] node README.md help works
/gen.js               [ ] node gen.js help works
```

## 2. LANGUAGE LAYERS B[1][y][z]
```
PAGE                  COORD       TEST
/meta/                [1,0,0]     [ ] Content renders
/legend/              [1,0,1]     [ ] Symbols display
/primitives/          [1,1,0]     [ ] Types/operators
/types/               [1,1,1]     [ ] Type system
/expressions/         [1,2,0]     [ ] Functions/patterns
/lists/               [1,2,1]     [ ] List operations
/hof/                 [1,3,0]     [ ] Higher-order fns
/typeclasses/         [1,3,1]     [ ] Type classes
/monads/              [1,4,0]     [ ] Monad laws
/io/                  [1,4,1]     [ ] IO operations
/modules/             [1,5,0]     [ ] Module system
/advanced/            [1,5,1]     [ ] GADTs/Kinds
```

## 3. REFERENCE B[2][y][z]
```
/quickstart/          [2,0,0]     [ ] Quick examples
/invariants/          [2,0,1]     [ ] Haskell rules
/crosswalk/           [2,1,0]     [ ] KONOMI mapping
```

## 4. CORE SYSTEM B[3][y][z]
```
/core/                [3,0,0]     [ ] Core hub
/core/blocks/         [3,0,1]     [ ] KONOMI.MAP renders
/core/templates/      [3,1,0]     [ ] T.atom demo works
/core/compiler/       [3,1,1]     [ ] HASKELL.parse works
/core/chain/          [3,2,0]     [ ] CHAIN/CUBE init
```

## 5. SERVICES B[4][y][z]
```
/api/                 [4,0,0]     [ ] API spec displays
/cli/                 [4,0,1]     [ ] CLI docs display
/mcp/                 [4,1,0]     [ ] MCP tools listed
/runtime/             [4,1,1]     [ ] Runtime modes
```

## 6. ML B[5][y][z]
```
/ml/                  [5,0,0]     [ ] ML hub, demo works
/ml/README.md         -           [ ] node ml/README.md demo
```

## 7. AI B[6][y][z]
```
/ai/                  [6,0,0]     [ ] AI hub, demo works
/ai/README.md         -           [ ] node ai/README.md demo
```

## 8. SPEC B[0][0][1]
```
/spec/                [0,0,1]     [ ] Header UDT spec
```

## JS FUNCTIONALITY TESTS
```
TEST                           EXPECTED
KONOMI.get(1,0,0)              → meta block object
KONOMI.path('monads')          → monads block
CHAIN.init(); CHAIN.verify()   → {valid:true}
CUBE.init(); CUBE.count()      → 30+ cubes
CUBE.get(1,4,0).up()           → io block
RUN.call(3,1,1,'compile',src)  → AST
T.atom({as:'button',text:'X'}) → <button>X</button>
ML.linear.fit([[1,2],[2,4]])   → model with predict()
AI.astar.search(0,5,...)       → path array
H.create('test')               → header object
AUTO.scan()                    → block array
```

## LINK INTEGRITY
```
[ ] All nav links work (no 404)
[ ] All back links work
[ ] All cross-references valid
[ ] CSS loads on all pages
[ ] JS loads without errors
```

## BROWSER CONSOLE CHECKS
```
[ ] No JS errors on load
[ ] KONOMI defined
[ ] CHAIN defined (on app.html)
[ ] CUBE defined (on app.html)
[ ] RUN defined (on app.html)
```
