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

type HistoryMove = Move & { board: Board };

interface SquarePoint {
  x: number;
  y: number;
}
//distance formula
function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}
function isKing(piece: PieceSymbol | null) {
  return piece == "Q" || piece == "q";
}
//Piece object - there are 24 instances of them in a checkers game
class Piece {
  constructor(
    public readonly board: Checkers,
    public position: number[],
    public readonly color: Color,
    public allowedtomove = true
  ) {
    // when jump exist, regular move is not allowed
    // since there is no jump at round 1, all pieces are allowed to move initially
  }
  //moves the piece
  move(tile: Tile) {
    // this.element.removeClass("selected");
    if (!this.board.isValidPlacetoMove(tile.position[0], tile.position[1])) return false;

    const is_king = isKing(this.board._board.grid[this.position[0]][this.position[1]]);
    //make sure piece doesn't go backwards if it's not a king
    if (this.color === "b" && !is_king) {
      if (tile.position[0] < this.position[0]) return false;
    } else if (this.color === "w" && !is_king) {
      if (tile.position[0] > this.position[0]) return false;
    }
    //remove the mark from Board.board and put it in the new spot
    this.board._board.grid[tile.position[0]][tile.position[1]] =
      this.board._board.grid[this.position[0]][this.position[1]];
    this.board._board.grid[this.position[0]][this.position[1]] = null;

    this.position = [tile.position[0], tile.position[1]];

    //if piece reaches the end of the row on opposite side crown it a king (can move all directions)
    if (!is_king && (this.position[0] == 0 || this.position[0] == 7)) {
      this.board._board.grid[this.position[0]][this.position[1]] = this.color === "w" ? "Q" : "q";
    }
    return true;
  }

  //tests if piece can jump anywhere
  canJumpAny() {
    return (
      this.canOpponentJump([this.position[0] + 2, this.position[1] + 2]) ||
      this.canOpponentJump([this.position[0] + 2, this.position[1] - 2]) ||
      this.canOpponentJump([this.position[0] - 2, this.position[1] + 2]) ||
      this.canOpponentJump([this.position[0] - 2, this.position[1] - 2])
    );
  }

  //tests if an opponent jump can be made to a specific place
  canOpponentJump(newPosition: number[]) {
    //find what the displacement is
    const dx = newPosition[1] - this.position[1];
    const dy = newPosition[0] - this.position[0];

    const is_king = isKing(this.board._board.grid[this.position[0]][this.position[1]]);
    //make sure object doesn't go backwards if not a king
    if (this.color == "b" && !is_king) {
      if (newPosition[0] < this.position[0]) return false;
    } else if (this.color == "w" && !is_king) {
      if (newPosition[0] > this.position[0]) return false;
    }
    //must be in bounds
    if (newPosition[0] > 7 || newPosition[1] > 7 || newPosition[0] < 0 || newPosition[1] < 0)
      return false;

    //middle tile where the piece to be conquered sits
    const tileToCheckx = this.position[1] + dx / 2;
    const tileToChecky = this.position[0] + dy / 2;
    if (tileToCheckx > 7 || tileToChecky > 7 || tileToCheckx < 0 || tileToChecky < 0) return false;
    //if there is a piece there and there is no piece in the space after that
    if (
      !this.board.isValidPlacetoMove(tileToChecky, tileToCheckx) &&
      this.board.isValidPlacetoMove(newPosition[0], newPosition[1])
    ) {
      //find which object instance is sitting there
      for (let pieceIndex in this.board.pieces) {
        if (
          this.board.pieces[pieceIndex].position[0] == tileToChecky &&
          this.board.pieces[pieceIndex].position[1] == tileToCheckx
        ) {
          if (this.color != this.board.pieces[pieceIndex].color) {
            //return the piece sitting there
            return this.board.pieces[pieceIndex];
          }
        }
      }
    }
    return false;
  }
}

class Tile {
  constructor(public readonly board: Checkers, public readonly position: number[]) {}
  /*
   * if tile is in range from the piece
   * regular move -> r
   * jump move -> j
   * promote move -> p
   */
  inRange(piece: Piece): Flag | null {
    if (piece.position[0] == this.position[0] && piece.position[1] == this.position[1]) return null;

    for (let k of this.board.pieces)
      if (k.position[0] == this.position[0] && k.position[1] == this.position[1]) return null;

    const is_king = isKing(this.board._board.grid[piece.position[0]][piece.position[1]]);
    if (!is_king && piece.color == "b" && this.position[0] < piece.position[0]) return null;
    if (!is_king && piece.color == "w" && this.position[0] > piece.position[0]) return null;

    let flag: Flag | null = null;

    if (
      dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == Math.sqrt(2)
    ) {
      //regular move
      flag = "r";
    } else if (
      dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) ==
      2 * Math.sqrt(2)
    ) {
      //jump move
      flag = "j";
    }
    if (
      (piece.color == "w" && this.position[0] == 0) ||
      (piece.color == "b" && this.position[0] == 7)
    ) {
      flag += "c";
    }
    return flag as any;
  }
}

class Board {
  public grid: (PieceSymbol | null)[][];
  constructor(board?: (PieceSymbol | null)[][]) {
    this.grid = board
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
  }

  clone() {
    return new Board(this.grid.map((row) => row.map((square) => square)));
  }
}

//Board object - controls logistics of game
export class Checkers {
  pieces: Piece[];
  private tiles: Tile[];
  private playerTurn: Color;
  private jumpexist: boolean;
  private continuousjump: boolean;
  public _board: Board;
  private _history: HistoryMove[];
  private _whiteScore: number;
  private _blackScore: number;

  constructor(board?: (PieceSymbol | null)[][], color: Color = "w") {
    this.pieces = [];
    this.tiles = [];

    this._board = new Board(board);

    this.playerTurn = color;
    this.jumpexist = false;
    this.continuousjump = false;
    this._whiteScore = 0;
    this._blackScore = 0;
    this._history = [];
    this.initalize();
  }
  //initialize the 8x8 board
  private initalize() {
    let countPieces = 0;
    let countTiles = 0;
    for (let row = 0; row < 8; row++) {
      //row is the index
      for (let column = 0; column < 8; column++) {
        //column is the index
        //whole set of if statements control where the tiles and pieces should be placed on the board
        if (row % 2 == 1) {
          if (column % 2 == 0) {
            this.tiles[countTiles] = new Tile(this, [row, column]);
            countTiles++;
          }
        } else {
          if (column % 2 == 1) {
            this.tiles[countTiles] = new Tile(this, [row, column]);
            countTiles++;
          }
        }

        if (this._board.grid[row][column] != null) {
          this.pieces[countPieces] = new Piece(
            this,
            [row, column],
            this._board.grid[row][column] == "P" || this._board.grid[row][column] == "Q" ? "w" : "b"
          );
          countPieces++;
        }
      }
    }
    this.checkIfJumpExist();
    // console.log(this.boardgrid, this.pieces, this.tiles);
  }

  //check if the location has an object
  public isValidPlacetoMove(row: number, column: number) {
    if (row < 0 || row > 7 || column < 0 || column > 7) return false;
    if (this._board.grid[row][column] == null) return true;

    return false;
  }
  //change the active player - also changes div.turn's CSS
  private changePlayerTurn(color?: Color) {
    this.playerTurn = color ? color : this.playerTurn == "w" ? "b" : "w";
    this.checkIfJumpExist();
  }
  private checkIfJumpExist() {
    this.jumpexist = false;
    this.continuousjump = false;
    for (let k of this.pieces) {
      k.allowedtomove = false;
      // if jump exist, only set those "jump" pieces "allowed to move"
      if (k.position.length != 0 && k.color == this.playerTurn && k.canJumpAny()) {
        this.jumpexist = true;
        k.allowedtomove = true;
      }
    }
    // if jump doesn't exist, all pieces are allowed to move
    if (!this.jumpexist) {
      for (let k of this.pieces) k.allowedtomove = true;
    }
  }
  // Possibly helpful for communication with back-end.
  public toString() {
    let ret = "";
    for (let i = 0; i < 8; i++) {
      //row is the index
      for (let j = 0; j < 8; j++) {
        let found = false;
        for (let k of this.pieces) {
          if (k.position[0] == i && k.position[1] == j) {
            if (isKing(this._board.grid[i][j])) ret += this._board.grid[i][j];
            else ret += this._board.grid[i][j];
            found = true;
            break;
          }
        }
        if (!found) ret += "-";
      }
    }
    return ret;
  }

  public moves(fromSquare?: string): Move[] {
    const pieces: Piece[] = [];
    let moves: Move[] = [];
    if (fromSquare) {
      const from = this.stringToPoint(fromSquare);
      const piece = this.pieces.find((t) => t.position[0] === from.y && t.position[1] === from.x);
      if (!piece) return [];
      pieces.push(piece);
    } else {
      pieces.push(...this.pieces.filter((t) => t.color == this.playerTurn));
    }
    for (const piece of pieces) {
      for (let t of this.tiles) {
        const inRange = t.inRange(piece);
        if (!inRange) continue;

        if (inRange[0] == "r" && !this.jumpexist) {
          moves.push({
            from: this.pointToString({ x: piece.position[1], y: piece.position[0] }),
            to: this.pointToString({ x: t.position[1], y: t.position[0] }),
            flag: inRange,
            color: piece.color,
            piece: this._board.grid[piece.position[0]][piece.position[1]]!,
          });
        } else if (inRange[0] == "j") {
          if (piece.canOpponentJump(t.position)) {
            moves = moves.filter((m) => m.flag[0] == "j");
            moves.push({
              from: this.pointToString({ x: piece.position[1], y: piece.position[0] }),
              to: this.pointToString({ x: t.position[1], y: t.position[0] }),
              flag: inRange,
              color: piece.color,
              piece: this._board.grid[piece.position[0]][piece.position[1]]!,
            });
          }
        }
      }
    }
    return moves;
  }
  public move(fromSquare: string, toSquare: string): Move | null {
    const from = this.stringToPoint(fromSquare);
    const to = this.stringToPoint(toSquare);

    const piece = this.pieces.find((t) => t.position[0] === from.y && t.position[1] === from.x);
    const tile = this.tiles.find((t) => t.position[0] === to.y && t.position[1] === to.x);

    if (!piece || !tile) return null;

    //check if the tile is in range from the object
    const inRange = tile.inRange(piece);
    if (inRange) {
      const board = this._board.clone();
      //if the move needed is jump, then move it but also check if another move can be made (double and triple jumps)
      if (inRange[0] == "j") {
        if (this.isOpponentJump(tile, piece)) {
          if (!piece.move(tile)) return null;

          if (piece.canJumpAny()) {
            // exist continuous jump, you are not allowed to de-select this piece or select other pieces
            this.continuousjump = true;
          } else {
            this.changePlayerTurn();
          }
        }
        //if it's regular then move it if no jumping is available
      } else if (inRange[0] == "r" && !this.jumpexist) {
        if (!piece.canJumpAny()) {
          if (!piece.move(tile)) return null;
          this.changePlayerTurn();
        } else {
          return null;
        }
      }
      const move: HistoryMove = {
        from: fromSquare,
        to: toSquare,
        flag: inRange,
        color: piece.color,
        piece: this._board.grid[piece.position[0]][piece.position[1]]!,
        board,
      };
      this._history.push(move);
      return move;
    }
    return null;
  }

  private isOpponentJump(tile: Tile, piece: Piece) {
    const pieceToRemove = piece.canOpponentJump(tile.position);
    //if there is a piece to be removed, remove it
    if (pieceToRemove) {
      this._board.grid[pieceToRemove.position[0]][pieceToRemove.position[1]] = null;
      this.pieces.splice(this.pieces.indexOf(pieceToRemove), 1);

      if (piece.color == "w") this._whiteScore++;
      else this._blackScore++;
      return true;
    }
    return false;
  }

  private stringToPoint(square: string) {
    return {
      x: square.charCodeAt(0) - 97,
      y: 8 - parseInt(square[1]),
    };
  }

  private pointToString(point: SquarePoint) {
    return String.fromCharCode(97 + point.x) + (8 - point.y);
  }

  public board() {
    return this._board.clone().grid;
  }
  public turn() {
    return this.playerTurn;
  }
  public undo() {
    const move = this._history.pop();
    if (move) {
      // this.boardgrid = this.stringToBoard(move.board);
      this._board = move.board.clone();
      this.initalize();
      this.changePlayerTurn(move.color);
      this._whiteScore = 12 - this.pieces.filter((t) => t.color == "w").length;
      this._blackScore = 12 - this.pieces.filter((t) => t.color == "b").length;
    }
    return move;
  }

  public history() {
    return this._history;
  }

  /*
   * Checks if the game is over
   */
  // TODO: check game over if moves are empty
  public isGameOver() {
    return this.moves().length === 0;
  }

  clone() {
    return new Checkers(this.board(), this.playerTurn);
  }
}
