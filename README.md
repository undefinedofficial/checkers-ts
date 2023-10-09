# checkers-ts

checkers game validation

get valid moves

```
  const moves = checkers.moves(square);
  /**
    [
        {
            from: 'a1';
            to: 'b2';
            flag: 'r';
            color: 'w';
            piece: 'p';
        },
        ...
    ]
   */
```

move

```
  const move = checkers.move(fromSquare, toSquare);
  /**
        null - invalid move
    or
        {
            from: 'a1';
            to: 'b2';
            flag: 'r';
            color: 'w';
            piece: 'p';
        },
   */
```
