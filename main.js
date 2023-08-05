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
var totalFlags; // ! win condition.
var flagCount;

var gGame = {
  isOn: false,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
  lives: 3,
  safeClickRemain: 3,
  revealedMines: 0,
}; // * probably should have been used more.

var flagEnabled = false;
var isFirstClick; // * declare.
var timer;
var isHintActivated = false;
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
  if (timer !== null) clearInterval(timer);
  onInit();
}

// initializing //

function onInit() {
  gGame.isOn = true;
  isFirstClick = true;
  emojiReload(false, false); // * false/true as we want to set the right emoji //
  gBoard = buildBoard(gLevel.SIZE); // * build board as soon as the page loads without mines //
  renderBoard(gBoard);
  renderClock();
  gGame.shownCount = 0;
  gGame.markedCount = 0;
  gGame.revealedMines = 0;
  gGame.lives = 3;
  gGame.safeClickRemain = 3;
  var elSafe = document.querySelector('.safe-click span'); // ? ask vicky! there has to be efficient way.
  elSafe.innerText = gGame.safeClickRemain;
  updateLives();

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
  totalFlags = gLevel.MINES;
  renderFlags();
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
          gBoard[i][j].isMine = true; // * Setting the isMine according to the result in getMinesLocation().
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
      const cell = board[i][j]; // ! dom //
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
  return className; // ? ask vicky! is that ok to do ?
}

// make cell clicked function //

function onCellClicked(elTile, i, j) {
  const tile = gBoard[i][j];

  if (!flagEnabled && tile.isFlagged) return;

  if (!gGame.isOn || tile.type === SHOW) return;

  if (isFirstClick) {
    gBoard = placeMines(gLevel.SIZE, gLevel.MINES, { i, j });
    isFirstClick = false;
  }

  if (flagEnabled) {
    if (tile.isFlagged) {
      // * If the tile is already flagged, unflag it.
      elTile.innerText = '';
      tile.isFlagged = false;
      totalFlags++;
      if (tile.isMine) gGame.markedCount--;
    } else if (totalFlags > 0) {
      // ! If the tile is not flagged and we have flags left, flag the tile.
      elTile.innerText = FLAG_ICON;
      tile.isFlagged = true;
      totalFlags--;
      if (tile.isMine) gGame.markedCount++;
    }
    renderFlags();
    checkWin();
    return;
  }

  if (tile.isMine) {
    if (isHintActivated) {
      useHint({ i, j });
    } else {
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
    }
    return; // ? ask vicky! there has to be efficient way.
  }

  if (isHintActivated) {
    // * hint condition.
    useHint({ i, j });
  } else {
    tile.type = SHOW;
    gGame.shownCount++; // * Increment shownCount
    elTile.classList.add('clicked');
    // console.log(`Shown count: ${gGame.shownCount}`);

    if (tile.minesAroundCount > 0) {
      elTile.innerText = tile.minesAroundCount;
      elTile.classList.add(`n${tile.minesAroundCount}`);
    } else {
      expandShown(tile.location);
    }
  }

  checkWin();
  if (!gGame.isOn) return; // ? ask vicky! why do we have to return ?
}

// expand all empty tiles/cells //

function expandShown(location) {
  var negs = getNegs(gBoard, location.i, location.j); // * set the nums.
  for (var k = 0; k < negs.length; k++) {
    var cell = gBoard[negs[k].i][negs[k].j];
    if (cell.isFlagged) continue;
    if (!cell.isMine && cell.type === HIDE) {
      cell.type = SHOW;
      if (!cell.wasShown) {
        gGame.shownCount++;
        cell.wasShown = true;
        // console.log(`Shown count: ${gGame.shownCount}`);
      }
      if (cell.minesAroundCount === 0) {
        expandShown(cell.location);
      }
    }
  }
  renderBoard(gBoard);
  checkWin(); // * checks again if the player won
}

// find negs //

function getNegs(board, rowIdx, colIdx) {
  // * counting.
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

// ! notice - rendering the info divs - this is not a function.

for (var i = 0; i < 3; i++) {
  const infoDiv = document.querySelector('.info-div');
  const newDIV = document.createElement('div');
  infoDiv.append(newDIV);
  newDIV.classList.add(`d${i}`);
}

// check if the user won //

function checkWin() {
  if (
    gGame.shownCount === gLevel.SIZE * gLevel.SIZE - gLevel.MINES &&
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

// hints //

function onHint(bulb) {
  if (bulb.classList.contains('used-hint')) return;

  bulb.classList.add('used-hint');

  if (bulb.classList.contains('bulb1')) bulb.src = 'img/turnonbulb.png'; // ! dom //
  if (bulb.classList.contains('bulb2')) bulb.src = 'img/turnonbulb.png'; // ! dom //
  if (bulb.classList.contains('bulb3')) bulb.src = 'img/turnonbulb.png'; // ! dom //
  isHintActivated = true;
} // ? ask vicky! there has to be efficient way.

function useHint(location) {
  if (!isHintActivated) return;

  const negs = getNegs(gBoard, location.i, location.j);
  negs.push(location);

  const originalStates = negs.map((neg) => ({
    // * this is some powerful stuff.
    cell: gBoard[neg.i][neg.j],
    type: gBoard[neg.i][neg.j].type,
  }));

  originalStates.forEach((state) => {
    state.cell.type = SHOW;
  });

  renderBoard(gBoard);

  setTimeout(() => {
    hideHintCells(originalStates); // * Restore states //
  }, 1000);

  isHintActivated = false;
}

function hideHintCells(originalStates) {
  originalStates.forEach((state) => {
    state.cell.type = state.type;
  });
  renderBoard(gBoard); // * a new rendering //
}

// safe click //

function safeClick(elSafe) {
  // ? ask vicky! i think that three functions is a lot.
  if (gGame.safeClickRemain > 0) {
    gGame.safeClickRemain--;
    var remain = elSafe.querySelector('span');
    remain.innerText = gGame.safeClickRemain;
    var safeCell = findRandomSafeCell();
    flashSafeCell(safeCell);
  }
}

function findRandomSafeCell() {
  var safeCells = [];
  for (var i = 0; i < gBoard.length; i++) {
    for (var j = 0; j < gBoard[0].length; j++) {
      if (gBoard[i][j].type !== SHOW && !gBoard[i][j].isMine) {
        safeCells.push({ i, j });
      }
    }
  }
  const randomIndex = Math.floor(Math.random() * safeCells.length); // ! safeCells is an arr so you have to use length!!
  const randomCell = safeCells[randomIndex];
  return randomCell;
}

function flashSafeCell(safeCell) {
  const elCell = document.querySelector(`.cell${safeCell.i}-${safeCell.j}`);
  elCell.style.backgroundColor = '#2e8dd6';
  elCell.style.transition = '300ms';
  setTimeout(function () {
    elCell.style.backgroundColor = ''; // ! vanished.
  }, 4000);
}

// dark mode //

function darkMode() {
  const icon = document.getElementById('mode-icon');
  const livesTxt = document.querySelector('.lives-txt');
  const htmlBody = document.body;

  htmlBody.classList.toggle('dark-mode');
  if (htmlBody.classList.contains('dark-mode')) {
    livesTxt.style.color = 'white';
    icon.innerText = '🌝';
  } else {
    livesTxt.style.color = '#22382f';
    icon.innerText = '🌚'; // * replace icons.
  }
}
