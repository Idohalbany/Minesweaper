'use strict';

// global //

var gBoard;
var minesLocation;
var gLevel = { SIZE: 4, MINES: 3 };
const WIN = '😎';
const LOSE = '🥺';
const NORMAL = '🙂';
const FLAG_ICON = '🚩';
const SHOW = 'SHOW';
const HIDE = 'HIDE';
var totalFlags = gLevel.MINES;
var flagCount;

var gGame = {
  isOn: false,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
  lives: 3,
  revealedMines: 0,
};

var flagEnabled = false; // ? do we need it ? yes!!
var isFirstClick;
var timer;
var minesLocation = []; // ! hold the bombs

// game level //

function levelBtns(elBtn) {
  const btnClass = elBtn.classList;
  if (btnClass.contains('begginer')) {
    gLevel.SIZE = 4;
    gLevel.MINES = 3;
  } else if (btnClass.contains('medium')) {
    gLevel.SIZE = 8;
    gLevel.MINES = 14;
  } else {
    gLevel.SIZE = 12;
    gLevel.MINES = 32;
  }
  // console.log(gLevel.SIZE, gLevel.MINES);
  onInit();
}

// initializing //

function onInit() {
  gGame.isOn = true;
  isFirstClick = true;
  emojiReload(false, false); // * false/true as we want to set the right emoji //
  gBoard = buildBoard(gLevel.SIZE); // * build board as soon as the page loads without mines
  renderBoard(gBoard);
  renderClock();
  renderFlags();
  gGame.shownCount = 0;
  gGame.markedCount = 0;

  const flag = document.querySelector('.d0');
  flag.addEventListener('click', function () {
    flagEnabled = !flagEnabled;
    if (flagEnabled) {
      flag.classList.add('clicked');
      // console.log(flag);
    } else {
      flag.classList.remove('clicked');
    }
  });
}

// creating the game board //

function buildBoard(boardSize) {
  var board = [];
  for (var i = 0; i < boardSize; i++) {
    board[i] = [];
    for (var j = 0; j < boardSize; j++) {
      // todo: cell object
      const cell = {
        type: 'HIDE',
        minesAroundCount: 0,
        isMine: false,
        isFlagged: false,
        wasShown: false,
        location: { i, j },
      };
      board[i][j] = cell;
    }
  }
  // console.log(board);
  return board;
}

// place mines //

function placeMines(boardSize, minesNumber, firstClick) {
  if (isFirstClick) {
    do {
      minesLocation = getMinesLocation(boardSize, minesNumber);
    } while (
      minesLocation.some(
        (loc) => loc.i === firstClick.i && loc.j === firstClick.j
      )
    );
    isFirstClick = false;
  }

  for (var i = 0; i < boardSize; i++) {
    for (var j = 0; j < boardSize; j++) {
      for (var k = 0; k < minesLocation.length; k++) {
        // Check if the places are the same.
        if (minesLocation[k].i === i && minesLocation[k].j === j) {
          gBoard[i][j].isMine = true; // Set the isMine according to the result in getMinesLocation().
          break;
        }
      }
    }
  }

  // ! Set mines around count //

  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard.length; j++) {
      gBoard[i][j].minesAroundCount = setMinesNegsCount(gBoard, i, j);
    }
  }
  return gBoard;
}

// render board //

function renderBoard(board) {
  var strHTML = '';
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>\n';
    for (var j = 0; j < board.length; j++) {
      const cell = board[i][j];
      var className = getCellClass(cell);
      var innerText = '';
      if (cell.isFlagged) {
        innerText = FLAG_ICON;
      } else if (cell.type === SHOW) {
        if (cell.isMine) {
          innerText += '💣';
        } else if (cell.minesAroundCount > 0) {
          innerText = cell.minesAroundCount;
        }
      }
      strHTML += `\t<td class="${className} cell${i}-${j}" onclick="onCellClicked(this, ${i}, ${j})" oncontextmenu="onRightClick(event, ${i}, ${j}, this)";>${innerText}</td>\n`;
    }
    strHTML += '</tr>\n';
  }
  const elBoard = document.querySelector('.board');
  elBoard.innerHTML = strHTML;
}

// get unique class //

function getCellClass(cell) {
  // todo: dont forget to make this function !!
  var className = '';
  if (cell.type === SHOW) {
    className = 'clicked';
    if (cell.isMine) {
      className += ' mine';
    } else if (cell.minesAroundCount > 0) {
      className += ` n${cell.minesAroundCount}`;
    }
  }
  return className;
}

// make cell clicked function //

function onCellClicked(elTile, i, j) {
  const tile = gBoard[i][j];
  if (!gGame.isOn || tile.type === SHOW) return;

  if (isFirstClick) {
    gBoard = placeMines(gLevel.SIZE, gLevel.MINES, { i, j });
    isFirstClick = false;
  }

  if (flagEnabled) {
    if (!tile.isFlagged && totalFlags > 0) {
      elTile.innerText = FLAG_ICON;
      tile.isFlagged = true;
      totalFlags--;
      if (tile.isMine) gGame.markedCount++;
    } else if (tile.isFlagged) {
      elTile.innerText = '';
      tile.isFlagged = false;
      totalFlags++;
      if (tile.isMine) gGame.markedCount--;
    }
    renderFlags();
    checkWin();
    return;
  }

  if (tile.isMine) {
    tile.type = SHOW;
    elTile.classList.add('mine');
    gGame.lives--;
    gGame.revealedMines++;
    updateLives();
    if (gGame.lives === 0) {
      gameOver();
      return;
    } else {
      renderBoard(gBoard);
    }
    return;
  }

  tile.type = SHOW;
  gGame.shownCount++; // * Increment shownCount

  // console.log(`Shown count: ${gGame.shownCount}`);

  elTile.classList.add('clicked');

  if (tile.minesAroundCount > 0) {
    elTile.innerText = tile.minesAroundCount;
    elTile.classList.add(`n${tile.minesAroundCount}`);
  } else {
    expandShown(tile.location);
  }

  checkWin();
  if (!gGame.isOn) return;
}

// expand all empty tiles //

function expandShown(location) {
  var negs = getNegs(gBoard, location.i, location.j);
  for (var k = 0; k < negs.length; k++) {
    var cell = gBoard[negs[k].i][negs[k].j];
    if (!cell.isMine && cell.type === HIDE) {
      cell.type = SHOW;
      if (!cell.wasShown) {
        gGame.shownCount++;
        cell.wasShown = true;
        console.log(`Shown count: ${gGame.shownCount}`);
      }
      if (cell.minesAroundCount === 0) {
        expandShown(cell.location);
      }
    }
  }
  renderBoard(gBoard);
  checkWin();
}

// find negs //

function getNegs(board, rowIdx, colIdx) {
  var negs = [];
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i > board.length - 1) continue;
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j > board[0].length - 1) continue;
      if (i === rowIdx && j === colIdx) continue;
      var location = { i, j };
      negs.push(location);
    }
  }
  return negs; // ! return that.
}

// mines location //

function getMinesLocation(boardSize, minesNumber) {
  const boardCopy = [];
  const positions = [];
  for (var i = 0; i < boardSize; i++) {
    boardCopy[i] = [];
    for (var j = 0; j < boardSize; j++) {
      boardCopy[i][j] = 0;
    }
  }

  // ! making sure theres unique loacatin for the mines //

  while (positions.length < minesNumber) {
    const i = getRandomInt(0, boardSize - 1);
    const j = getRandomInt(0, boardSize - 1);

    if (boardCopy[i][j] === 0) {
      // * comparing two array's so we could get unique places
      boardCopy[i][j] = 1;
      positions.push({ i, j });
    }
  }
  return positions;
}

// render clock //

function renderClock() {
  // ? find put if this is necessary - gGame.isOn = true;
  var seconds = gGame.secsPassed;
  var minutes = 0;
  const timeDiv = document.querySelector('.d2');
  timeDiv.innerText = '00:00';
  timer = setInterval(() => {
    if (seconds >= 60) {
      minutes++;
      seconds = '0';
    }
    if (seconds < 10) {
      seconds = '0' + seconds;
    }
    if (minutes >= 10) {
      timeDiv.innerText = `${minutes}:${seconds}`;
    } else {
      timeDiv.innerText = `0${minutes}:${seconds}`;
    }
    seconds++;
    // console.log(seconds);
  }, 1000); // ! oh yeah
}

// reveal Mines //

function revealMines() {
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard.length; j++) {
      const cell = gBoard[i][j];

      if (cell.isMine) {
        cell.type = SHOW;
        const elCell = document.querySelector(`.cell${i}-${j}`);
        elCell.innerHTML = '💣';
        elCell.classList.add('mine');
      }
    }
  }
  renderBoard(gBoard);
}

// render emogis //

function emojiReload(win, lose) {
  const emogiDiv = document.querySelector('.d1');
  emogiDiv.addEventListener('click', function () {
    location.reload();
  });
  if (win) {
    clearInterval(timer);
    return (emogiDiv.innerText = WIN);
  } else if (lose) {
    clearInterval(timer);
    return (emogiDiv.innerText = LOSE);
  } else {
    return (emogiDiv.innerText = NORMAL);
  }
}

// render flags //

function renderFlags() {
  const flag = document.querySelector('.d0');
  flagCount = totalFlags;
  flag.innerText = FLAG_ICON + totalFlags;
}

// render the info divs //

for (var i = 0; i < 3; i++) {
  const infoDiv = document.querySelector('.info-div');
  const newDIV = document.createElement('div');
  infoDiv.append(newDIV);
  newDIV.classList.add(`d${i}`);
}

// check if the user won //

function checkWin() {
  // console.log('Checking win...');
  // console.log('gGame.shownCount:', gGame.shownCount);
  // console.log(
  //   'Expected shown count:',
  //   gLevel.SIZE * gLevel.SIZE - gLevel.MINES
  // );
  // console.log('gGame.markedCount:', gGame.markedCount);
  // console.log('Expected marked count:', (gLevel.MINES - gGame.revealedMines));

  if (
    gGame.shownCount === gLevel.SIZE * gLevel.SIZE - gLevel.MINES ||
    gGame.markedCount === gLevel.MINES - gGame.revealedMines
  ) {
    gGame.isOn = false;
    emojiReload(true, false);
    clearInterval(timer);
  }
}

// game over //

function gameOver() {
  if (gGame.lives === 0) {
    gGame.isOn = false;
    emojiReload(false, true);
    revealMines();
    clearInterval(timer);
  } else {
    renderBoard(gBoard);
  }
}

// get the mines around //

function setMinesNegsCount(board, rowIdx, colIdx) {
  var count = 0;
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= board.length) continue;
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (i === rowIdx && j === colIdx) continue;
      if (j < 0 || j >= board[0].length) continue;
      var currCell = board[i][j];
      if (currCell.isMine) count++;
    }
  }
  return count;
}

// get random number //

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}

// update the lives //

function updateLives() {
  // console.log('Updating lives' + gGame.lives);
  const livesNum = document.querySelector('.lives-num');
  livesNum.innerText = gGame.lives;
}

// right click flags //

function onRightClick(event, i, j, elTile) {
  event.preventDefault();
  var cell = gBoard[i][j];

  if (cell.type === SHOW) return;

  if (cell.isFlagged) {
    elTile.innerText = '';
    cell.isFlagged = false;
    totalFlags++;
    if (cell.isMine) gGame.markedCount--;
  } else if (totalFlags > 0) {
    elTile.innerText = FLAG_ICON;
    cell.isFlagged = true;
    totalFlags--;
    if (cell.isMine) gGame.markedCount++;
  }

  renderFlags();
  checkWin();
}
