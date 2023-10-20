export type PieceSymbol = "p" | "q" | "P" | "Q";
export type Color = "w" | "b";

type Flag = "r" | "j" | "rp" | "jp";

export interface Move {
  from: string;
  to: string;
  flag: Flag;
  color: Color;
  piece: PieceSymbol;
}

interface SquarePoint {
  x: number;
  y: number;
}
export function Checkers(initboard?: (PieceSymbol | null)[][], color: Color = "w") {
  //distance formula
  const dist = (x1: number, y1: number, x2: number, y2: number) =>
    Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

  // isKing - checks if the piece is a king
  const isKing = (piece: PieceSymbol | null) => piece == "Q" || piece == "q";

  // Board object
  function Board(board?: (PieceSymbol | null)[][]) {
    const grid: (PieceSymbol | null)[][] = board
      ? Array.from(board.values())
      : [
          [null, "p", null, "p", null, "p", null, "p"],
          ["p", null, "p", null, "p", null, "p", null],
          [null, "p", null, "p", null, "p", null, "p"],
          [null, null, null, null, null, null, null, null],
          [null, null, null, null, null, null, null, null],
          ["P", null, "P", null, "P", null, "P", null],
          [null, "P", null, "P", null, "P", null, "P"],
          ["P", null, "P", null, "P", null, "P", null],
        ];

    const clone = () => Board(grid.map((row) => row.map((square) => square)));
    return {
      grid,
      clone,
    };
  }

  type HistoryMove = Move & { board: ReturnType<typeof Board> };

  //Piece object - there are 24 instances of them in a checkers game
  function Piece(position: number[], color: Color, allowedtomove = true) {
    //moves the piece
    function move(tile: ReturnType<typeof Tile>) {
      if (!isValidPlacetoMove(tile.position[0], tile.position[1])) return false;

      const is_king = isKing(_board.grid[position[0]][position[1]]);
      //make sure piece doesn't go backwards if it's not a king
      if (color === "b" && !is_king) {
        if (tile.position[0] < position[0]) return false;
      } else if (color === "w" && !is_king) {
        if (tile.position[0] > position[0]) return false;
      }
      //remove the mark from Board.board and put it in the new spot
      _board.grid[tile.position[0]][tile.position[1]] = _board.grid[position[0]][position[1]];
      _board.grid[position[0]][position[1]] = null;

      position[0] = tile.position[0];
      position[1] = tile.position[1];

      //if piece reaches the end of the row on opposite side crown it a king (can move all directions)
      if (!is_king && (position[0] == 0 || position[0] == 7)) {
        _board.grid[position[0]][position[1]] = color === "w" ? "Q" : "q";
      }
      return true;
    }

    //tests if piece can jump anywhere
    function canJumpAny() {
      return (
        canOpponentJump([position[0] + 2, position[1] + 2]) ||
        canOpponentJump([position[0] + 2, position[1] - 2]) ||
        canOpponentJump([position[0] - 2, position[1] + 2]) ||
        canOpponentJump([position[0] - 2, position[1] - 2])
      );
    }

    //tests if an opponent jump can be made to a specific place
    function canOpponentJump(newPosition: number[]) {
      //find what the displacement is
      const dx = newPosition[1] - position[1];
      const dy = newPosition[0] - position[0];

      const is_king = isKing(_board.grid[position[0]][position[1]]);
      //make sure object doesn't go backwards if not a king
      if (color == "b" && !is_king) {
        if (newPosition[0] < position[0]) return false;
      } else if (color == "w" && !is_king) {
        if (newPosition[0] > position[0]) return false;
      }
      //must be in bounds
      if (newPosition[0] > 7 || newPosition[1] > 7 || newPosition[0] < 0 || newPosition[1] < 0)
        return false;

      //middle tile where the piece to be conquered sits
      const tileToCheckx = position[1] + dx / 2;
      const tileToChecky = position[0] + dy / 2;
      if (tileToCheckx > 7 || tileToChecky > 7 || tileToCheckx < 0 || tileToChecky < 0)
        return false;
      //if there is a piece there and there is no piece in the space after that
      if (
        !isValidPlacetoMove(tileToChecky, tileToCheckx) &&
        isValidPlacetoMove(newPosition[0], newPosition[1])
      ) {
        //find which object instance is sitting there
        for (let pieceIndex in _pieces) {
          if (
            _pieces[pieceIndex].position[0] == tileToChecky &&
            _pieces[pieceIndex].position[1] == tileToCheckx
          ) {
            if (color != _pieces[pieceIndex].color) {
              //return the piece sitting there
              return _pieces[pieceIndex];
            }
          }
        }
      }
      return false;
    }

    function getAllowedToMove() {
      return allowedtomove;
    }
    function setAllowedToMove(value: boolean) {
      allowedtomove = value;
    }
    return {
      position,
      color,
      move,
      canJumpAny,
      canOpponentJump,
      getAllowedToMove,
      setAllowedToMove,
    };
  }

  function Tile(position: number[]) {
    /*
     * if tile is in range from the piece
     * regular move -> r
     * jump move -> j
     * promote move -> p
     */
    function inRange(piece: ReturnType<typeof Piece>): Flag | null {
      if (piece.position[0] == position[0] && piece.position[1] == position[1]) return null;

      for (let k of _pieces)
        if (k.position[0] == position[0] && k.position[1] == position[1]) return null;

      const is_king = isKing(_board.grid[piece.position[0]][piece.position[1]]);
      if (!is_king && piece.color == "b" && position[0] < piece.position[0]) return null;
      if (!is_king && piece.color == "w" && position[0] > piece.position[0]) return null;

      let flag: Flag | null = null;

      if (dist(position[0], position[1], piece.position[0], piece.position[1]) == Math.sqrt(2)) {
        //regular move
        flag = "r";
      } else if (
        dist(position[0], position[1], piece.position[0], piece.position[1]) ==
        2 * Math.sqrt(2)
      ) {
        //jump move
        flag = "j";
      }
      if ((piece.color == "w" && position[0] == 0) || (piece.color == "b" && position[0] == 7)) {
        flag += "c";
      }
      return flag as any;
    }

    return {
      position,
      inRange,
    };
  }

  const _pieces: ReturnType<typeof Piece>[] = [];
  const _tiles: ReturnType<typeof Tile>[] = [];
  let _playerTurn: Color = color;
  let _jumpexist: boolean = false;
  let _continuousjump: boolean = false;
  let _lastJump = 0;
  let _board = Board(initboard);
  const _history: HistoryMove[] = [];
  let _whiteScore: number = 0;
  let _blackScore: number = 0;

  initalize();
  //initialize the 8x8 board
  function initalize() {
    let countPieces = 0;
    let countTiles = 0;
    for (let row = 0; row < 8; row++) {
      //row is the index
      for (let column = 0; column < 8; column++) {
        //column is the index
        //whole set of if statements control where the tiles and pieces should be placed on the board
        if (row % 2 == 1) {
          if (column % 2 == 0) {
            _tiles[countTiles] = Tile([row, column]);
            countTiles++;
          }
        } else {
          if (column % 2 == 1) {
            _tiles[countTiles] = Tile([row, column]);
            countTiles++;
          }
        }

        if (_board.grid[row][column] != null) {
          _pieces[countPieces] = Piece(
            [row, column],
            _board.grid[row][column] == "P" || _board.grid[row][column] == "Q" ? "w" : "b"
          );
          countPieces++;
        }
      }
    }
    checkIfJumpExist();
    // console.log(this.boardgrid, this.pieces, this.tiles);
  }

  //check if the location has an object
  function isValidPlacetoMove(row: number, column: number) {
    if (row < 0 || row > 7 || column < 0 || column > 7) return false;
    if (_board.grid[row][column] == null) return true;

    return false;
  }
  //change the active player - also changes div.turn's CSS
  function changePlayerTurn(color?: Color) {
    _playerTurn = color ? color : _playerTurn == "w" ? "b" : "w";
    checkIfJumpExist();
  }
  function checkIfJumpExist() {
    _jumpexist = false;
    _continuousjump = false;
    for (let k of _pieces) {
      k.setAllowedToMove(false);
      // if jump exist, only set those "jump" pieces "allowed to move"
      if (k.position.length != 0 && k.color == _playerTurn && k.canJumpAny()) {
        _jumpexist = true;
        k.setAllowedToMove(true);
      }
    }
    // if jump doesn't exist, all pieces are allowed to move
    if (!_jumpexist) {
      for (let k of _pieces) k.setAllowedToMove(true);
    }
  }
  // Possibly helpful for communication with back-end.
  function toString() {
    let ret = "";
    for (let i = 0; i < 8; i++) {
      //row is the index
      for (let j = 0; j < 8; j++) {
        let found = false;
        for (let k of _pieces) {
          if (k.position[0] == i && k.position[1] == j) {
            if (isKing(_board.grid[i][j])) ret += _board.grid[i][j];
            else ret += _board.grid[i][j];
            found = true;
            break;
          }
        }
        if (!found) ret += "-";
      }
    }
    return ret;
  }

  function moves(fromSquare?: string): Move[] {
    const pieces: ReturnType<typeof Piece>[] = [];
    let moves: Move[] = [];
    if (fromSquare) {
      const from = stringToPoint(fromSquare);
      const piece = _pieces.find((t) => t.position[0] === from.y && t.position[1] === from.x);
      if (!piece) return [];
      pieces.push(piece);
    } else {
      pieces.push(..._pieces.filter((t) => t.color == _playerTurn));
    }
    for (const piece of pieces) {
      for (let t of _tiles) {
        const inRange = t.inRange(piece);
        if (!inRange) continue;

        if (inRange[0] == "r" && !_jumpexist) {
          moves.push({
            from: pointToString({ x: piece.position[1], y: piece.position[0] }),
            to: pointToString({ x: t.position[1], y: t.position[0] }),
            flag: inRange,
            color: piece.color,
            piece: _board.grid[piece.position[0]][piece.position[1]]!,
          });
        } else if (inRange[0] == "j") {
          if (piece.canOpponentJump(t.position)) {
            moves = moves.filter((m) => m.flag[0] == "j");
            moves.push({
              from: pointToString({ x: piece.position[1], y: piece.position[0] }),
              to: pointToString({ x: t.position[1], y: t.position[0] }),
              flag: inRange,
              color: piece.color,
              piece: _board.grid[piece.position[0]][piece.position[1]]!,
            });
          }
        }
      }
    }
    return moves;
  }
  function move(fromSquare: string, toSquare: string): Move | null {
    const from = stringToPoint(fromSquare);
    const to = stringToPoint(toSquare);

    const piece = _pieces.find((t) => t.position[0] === from.y && t.position[1] === from.x);
    const tile = _tiles.find((t) => t.position[0] === to.y && t.position[1] === to.x);

    if (!piece || !tile) return null;

    //check if the tile is in range from the object
    const inRange = tile.inRange(piece);
    if (inRange) {
      const board = _board.clone();
      //if the move needed is jump, then move it but also check if another move can be made (double and triple jumps)
      if (inRange[0] == "j") {
        if (isOpponentJump(tile, piece)) {
          if (!piece.move(tile)) return null;

          if (piece.canJumpAny()) {
            // exist continuous jump, you are not allowed to de-select this piece or select other pieces
            _continuousjump = true;
          } else {
            changePlayerTurn();
          }
          _lastJump = 0;
        }
        //if it's regular then move it if no jumping is available
      } else if (inRange[0] == "r" && !_jumpexist) {
        if (!piece.canJumpAny()) {
          if (!piece.move(tile)) return null;
          changePlayerTurn();
          _lastJump++;
        } else {
          return null;
        }
      }
      const move: HistoryMove = {
        from: fromSquare,
        to: toSquare,
        flag: inRange,
        color: piece.color,
        piece: _board.grid[piece.position[0]][piece.position[1]]!,
        board,
      };
      _history.push(move);
      return move;
    }
    return null;
  }

  function isOpponentJump(tile: ReturnType<typeof Tile>, piece: ReturnType<typeof Piece>) {
    const pieceToRemove = piece.canOpponentJump(tile.position);
    //if there is a piece to be removed, remove it
    if (pieceToRemove) {
      _board.grid[pieceToRemove.position[0]][pieceToRemove.position[1]] = null;
      _pieces.splice(_pieces.indexOf(pieceToRemove), 1);

      if (piece.color == "w") _whiteScore++;
      else _blackScore++;
      return true;
    }
    return false;
  }

  function stringToPoint(square: string) {
    return {
      x: square.charCodeAt(0) - 97,
      y: 8 - parseInt(square[1]),
    };
  }

  function pointToString(point: SquarePoint) {
    return String.fromCharCode(97 + point.x) + (8 - point.y);
  }

  function board() {
    return _board.clone().grid;
  }
  function turn() {
    return _playerTurn;
  }
  function undo() {
    const move = _history.pop();
    if (move) {
      _board = move.board.clone();
      initalize();
      changePlayerTurn(move.color);
      _whiteScore = 12 - _pieces.filter((t) => t.color == "w").length;
      _blackScore = 12 - _pieces.filter((t) => t.color == "b").length;
    }
    return move;
  }

  function history() {
    return _history;
  }

  /**
   * Custom rule for draw, if there are more than 10 move without jump
   */
  function isDraw() {
    return _lastJump > 10;
  }
  /*
   * Checks if the game is over
   */
  // TODO: check game over if moves are empty
  function isGameOver() {
    return moves().length === 0;
  }

  function clone() {
    return Checkers(board(), _playerTurn);
  }

  return {
    board,
    turn,
    undo,
    history,
    isDraw,
    isGameOver,
    clone,
    moves,
    move,
    toString,
  };
}
